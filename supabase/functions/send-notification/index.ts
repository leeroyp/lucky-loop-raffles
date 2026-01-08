import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "entry_confirmation" | "raffle_result" | "winner_notification";
  userId?: string;
  raffleId: string;
  email?: string;
  userName?: string;
  entryCount?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, userId, raffleId, email, userName, entryCount }: NotificationRequest = await req.json();

    // Fetch raffle details
    const { data: raffle, error: raffleError } = await supabase
      .from("raffles")
      .select("*")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      throw new Error("Raffle not found");
    }

    let subject = "";
    let htmlContent = "";

    if (type === "entry_confirmation") {
      subject = `Entry Confirmed: ${raffle.title}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">🎟️ Entry Confirmed!</h1>
          <p>Hi ${userName || "there"},</p>
          <p>Your entry into <strong>${raffle.title}</strong> has been confirmed!</p>
          <p>You now have <strong>${entryCount || 1} ${(entryCount || 1) === 1 ? "entry" : "entries"}</strong> in this raffle.</p>
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Good luck! 🍀</p>
          </div>
          <p style="color: #666; font-size: 14px;">The winner will be drawn using our provably fair system once the raffle ends.</p>
        </div>
      `;
    } else if (type === "winner_notification") {
      subject = `🎉 Congratulations! You won: ${raffle.title}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #eab308;">🏆 You're a Winner!</h1>
          <p>Hi ${userName || "there"},</p>
          <p>Amazing news! You've won the <strong>${raffle.title}</strong> raffle!</p>
          <div style="background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">🎉 CONGRATULATIONS! 🎉</p>
          </div>
          <p>We'll be in touch shortly with details on how to claim your prize.</p>
          <p style="color: #666; font-size: 14px;">This draw was verified using our provably fair system. You can verify the results on the raffle page.</p>
        </div>
      `;
    } else if (type === "raffle_result") {
      // Notify non-winners about raffle closing
      subject = `Raffle Results: ${raffle.title}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">📋 Raffle Results</h1>
          <p>Hi ${userName || "there"},</p>
          <p>The <strong>${raffle.title}</strong> raffle has ended and a winner has been drawn.</p>
          <p>Unfortunately, you weren't selected this time, but don't worry – there are more raffles coming!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <p style="color: #374151; margin: 0;">Better luck next time! 🍀</p>
          </div>
          <p style="color: #666; font-size: 14px;">Check out our latest raffles for more chances to win.</p>
        </div>
      `;
    }

    if (!email) {
      // Fetch user email from profile
      if (!userId) {
        throw new Error("Either email or userId is required");
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found");
      }

      const emailResponse = await resend.emails.send({
        from: "LuckyLoop <onboarding@resend.dev>",
        to: [profile.email],
        subject,
        html: htmlContent.replace(userName || "there", profile.full_name || "there"),
      });

      console.log("Email sent to:", profile.email, emailResponse);
    } else {
      const emailResponse = await resend.emails.send({
        from: "LuckyLoop <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      });

      console.log("Email sent to:", email, emailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
