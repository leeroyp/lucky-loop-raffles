import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side SHA-256 implementation
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "ADMIN")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { raffleId } = await req.json();

    if (!raffleId) {
      return new Response(
        JSON.stringify({ error: "Missing raffleId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch raffle data
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from("raffles")
      .select("*")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      return new Response(
        JSON.stringify({ error: "Raffle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate raffle status
    if (raffle.status !== "LIVE") {
      return new Response(
        JSON.stringify({ error: "Raffle must be LIVE to draw a winner" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all entries
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("entries")
      .select("id, user_id, created_at")
      .eq("raffle_id", raffleId)
      .order("created_at", { ascending: true });

    if (entriesError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch entries" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No entries to draw from" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum entries requirement
    if (raffle.min_entries && entries.length < raffle.min_entries) {
      // Extend by 1 day
      const newEndAt = new Date(raffle.end_at);
      newEndAt.setDate(newEndAt.getDate() + 1);

      const { error: updateError } = await supabaseAdmin
        .from("raffles")
        .update({ end_at: newEndAt.toISOString() })
        .eq("id", raffleId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to extend raffle" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          extended: true,
          message: `Minimum ${raffle.min_entries} entries not met (${entries.length} current). Extended by 1 day.`,
          newEndAt: newEndAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== PROVABLY FAIR WINNER SELECTION =====
    // Generate draw hash using seed + entry count + server timestamp
    const timestamp = Date.now().toString();
    const drawInput = `${raffle.seed}:${entries.length}:${timestamp}`;
    const drawHash = await sha256(drawInput);

    // Convert first 16 characters of hash to number and select winner
    const hashInt = BigInt("0x" + drawHash.slice(0, 16));
    const winnerIndex = Number(hashInt % BigInt(entries.length));
    const winnerEntry = entries[winnerIndex];

    // Update raffle atomically
    const { error: updateError } = await supabaseAdmin
      .from("raffles")
      .update({
        status: "CLOSED",
        draw_hash: drawHash,
        winner_id: winnerEntry.user_id,
      })
      .eq("id", raffleId)
      .eq("status", "LIVE"); // Optimistic lock to prevent race conditions

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update raffle" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the draw event for audit
    await supabaseAdmin.from("event_logs").insert({
      type: "WINNER_DRAW",
      payload: {
        raffle_id: raffleId,
        winner_id: winnerEntry.user_id,
        draw_hash: drawHash,
        entry_count: entries.length,
        winner_index: winnerIndex,
        admin_id: userId,
        timestamp,
      },
    });

    // Fetch winner profile for response
    const { data: winnerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", winnerEntry.user_id)
      .single();

    // Send winner notification (don't fail if this fails)
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: "winner",
          userId: winnerEntry.user_id,
          raffleId: raffleId,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send winner notification:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        drawHash,
        winnerId: winnerEntry.user_id,
        winnerEmail: winnerProfile?.email,
        winnerName: winnerProfile?.full_name,
        entryCount: entries.length,
        winnerIndex,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Draw winner error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
