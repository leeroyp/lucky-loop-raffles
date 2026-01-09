import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  Ticket,
  Clock,
  Users,
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Shield,
  AlertCircle,
  Gift,
  Sparkles
} from "lucide-react";
import { format, isPast } from "date-fns";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: "DRAFT" | "LIVE" | "CLOSED";
  end_at: string;
  seed: string;
  seed_hash: string;
  draw_hash: string | null;
  winner_id: string | null;
}

interface WinnerProfile {
  full_name: string | null;
  email: string;
}

export default function RaffleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [userEntries, setUserEntries] = useState(0);
  const [hasNpnEntry, setHasNpnEntry] = useState(false);
  const [winner, setWinner] = useState<WinnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRaffleData();
    }
  }, [id, user]);

  const fetchRaffleData = async () => {
    if (!id) return;

    // Fetch raffle
    const { data: raffleData, error } = await supabase
      .from("raffles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !raffleData) {
      console.error("Error fetching raffle:", error);
      setIsLoading(false);
      return;
    }

    setRaffle(raffleData as Raffle);

    // Fetch entry count using the public function
    const { data: countData } = await supabase
      .rpc("get_raffle_entry_count", { raffle_uuid: id });

    setEntryCount(countData || 0);

    // Fetch user's entries if logged in
    if (user) {
      const { data: userEntriesData } = await supabase
        .from("entries")
        .select("*")
        .eq("raffle_id", id)
        .eq("user_id", user.id);

      const entries = userEntriesData || [];
      setUserEntries(entries.length);
      setHasNpnEntry(entries.some((e) => e.source === "NPN"));
    }

    // Fetch winner profile if raffle is closed
    if (raffleData.winner_id) {
      const { data: winnerData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", raffleData.winner_id)
        .single();

      if (winnerData) {
        setWinner(winnerData);
      }
    }

    setIsLoading(false);
  };

  const sendNotification = async (type: string, entryCount?: number) => {
    if (!user || !profile || !raffle) return;
    
    try {
      await supabase.functions.invoke("send-notification", {
        body: {
          type,
          userId: user.id,
          raffleId: raffle.id,
          email: profile.email,
          userName: profile.full_name || profile.email.split("@")[0],
          entryCount,
        },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const handleEnterRaffle = async () => {
    if (!user || !profile || !raffle) return;

    if (profile.entries_remaining <= 0) {
      toast({
        title: "No entries remaining",
        description: "Subscribe to get more entries or use the free NPN option.",
        variant: "destructive",
      });
      return;
    }

    setIsEntering(true);

    try {
      // Create entry
      const { error: entryError } = await supabase
        .from("entries")
        .insert({
          raffle_id: raffle.id,
          user_id: user.id,
          source: "SUBSCRIPTION",
        });

      if (entryError) throw entryError;

      // Decrement entries_remaining
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ entries_remaining: profile.entries_remaining - 1 })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      await fetchRaffleData();

      // Send entry confirmation email
      await sendNotification("entry_confirmation", userEntries + 1);

      toast({
        title: "Entry submitted!",
        description: "Good luck! You've been entered into this raffle.",
      });
    } catch (error: any) {
      toast({
        title: "Error entering raffle",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEntering(false);
    }
  };

  const handleNpnEntry = async () => {
    if (!user || !raffle) return;

    if (hasNpnEntry) {
      toast({
        title: "Already entered",
        description: "You've already used your free NPN entry for this raffle.",
        variant: "destructive",
      });
      return;
    }

    setIsEntering(true);

    try {
      const { error } = await supabase
        .from("entries")
        .insert({
          raffle_id: raffle.id,
          user_id: user.id,
          source: "NPN",
        });

      if (error) throw error;

      await fetchRaffleData();

      // Send entry confirmation email
      await sendNotification("entry_confirmation", userEntries + 1);

      toast({
        title: "Free entry submitted!",
        description: "Your NPN entry has been recorded. Good luck!",
      });
    } catch (error: any) {
      toast({
        title: "Error submitting NPN entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEntering(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!raffle) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Raffle not found</h2>
            <Link to="/raffles">
              <Button variant="outline">Back to Raffles</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isLive = raffle.status === "LIVE";
  const isClosed = raffle.status === "CLOSED";
  const hasEnded = isPast(new Date(raffle.end_at));

  return (
    <Layout>
      <SEO 
        title={raffle.title} 
        description={raffle.description || `Enter the ${raffle.title} raffle for a chance to win!`}
      />
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container px-4 max-w-4xl">
          {/* Back Link */}
          <Link
            to="/raffles"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Raffles
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg">
                {raffle.image_url ? (
                  <img
                    src={raffle.image_url}
                    alt={raffle.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <Gift className="w-24 h-24 text-primary/30" />
                  </div>
                )}

                {/* Status Badge */}
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold ${
                    isLive
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isLive ? "LIVE" : "CLOSED"}
                </div>
              </div>
            </motion.div>

            {/* Details Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl md:text-4xl font-black mb-4">
                {raffle.title}
              </h1>

              {raffle.description && (
                <p className="text-muted-foreground mb-6">{raffle.description}</p>
              )}

              {/* Prominent Countdown Timer */}
              {isLive && !hasEnded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 mb-6"
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                      Draw ends in
                    </p>
                    <CountdownTimer 
                      endDate={new Date(raffle.end_at)} 
                      showIcon={false}
                      className="text-3xl md:text-4xl font-black justify-center"
                    />
                  </div>
                </motion.div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Total Entries</span>
                  </div>
                  <p className="text-2xl font-bold">{entryCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {isLive ? "Draw Date" : "Ended"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {format(new Date(raffle.end_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Your Entries */}
              {user && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      <span className="font-medium">Your Entries</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {userEntries}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isLive && !hasEnded && (
                <div className="space-y-3">
                  {user ? (
                    <>
                      {(profile?.entries_remaining || 0) > 0 ? (
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          onClick={handleEnterRaffle}
                          disabled={isEntering}
                        >
                          {isEntering ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ticket className="w-5 h-5" />
                          )}
                          Enter Raffle ({profile?.entries_remaining || 0} entries left)
                        </Button>
                      ) : !profile?.subscription_tier ? (
                        <Link to="/pricing" className="block">
                          <Button className="w-full gap-2" size="lg" variant="gold">
                            <Sparkles className="w-5 h-5" />
                            Subscribe for More Entries
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          disabled
                        >
                          <Ticket className="w-5 h-5" />
                          No Entries Remaining
                        </Button>
                      )}

                      {!hasNpnEntry && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={handleNpnEntry}
                          disabled={isEntering}
                        >
                          <Gift className="w-4 h-4" />
                          Free Entry (No Purchase Necessary)
                        </Button>
                      )}

                      {hasNpnEntry && (
                        <p className="text-sm text-center text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          You've used your free NPN entry
                        </p>
                      )}
                    </>
                  ) : (
                    <Link to="/auth?mode=signup">
                      <Button className="w-full gap-2" size="lg">
                        Sign Up to Enter
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Winner Section (if closed) */}
              {isClosed && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-accent/10 border border-accent/30 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-accent font-medium">Winner</p>
                      <p className="text-xl font-bold text-foreground">
                        {winner.full_name || winner.email.split("@")[0]}
                      </p>
                    </div>
                  </div>

                  {raffle.winner_id === user?.id && (
                    <div className="flex items-center gap-2 text-accent text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Congratulations, you won!</span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Fairness Verification Section */}
          {isClosed && raffle.draw_hash && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Provably Fair Verification</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seed Hash (Published Before Draw)</p>
                  <code className="block p-3 rounded-lg bg-muted text-xs break-all font-mono">
                    {raffle.seed_hash}
                  </code>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revealed Seed</p>
                  <code className="block p-3 rounded-lg bg-muted text-xs break-all font-mono">
                    {raffle.seed}
                  </code>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Draw Hash</p>
                  <code className="block p-3 rounded-lg bg-muted text-xs break-all font-mono">
                    {raffle.draw_hash}
                  </code>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How to verify:</strong>
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Verify that SHA256(seed) = seed_hash</li>
                    <li>Draw hash = SHA256(seed + ":" + entries_count + ":" + timestamp)</li>
                    <li>Winner index = parseInt(draw_hash, 16) % entries_count</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
