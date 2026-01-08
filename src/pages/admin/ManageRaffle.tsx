import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Ticket,
  Users,
  Clock,
  Trophy,
  Play,
  Sparkles,
  AlertCircle,
  Shield,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

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

interface Entry {
  id: string;
  user_id: string;
  source: "SUBSCRIPTION" | "NPN";
  created_at: string;
  user_email?: string;
}

// Simple hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ManageRaffle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [winner, setWinner] = useState<{ email: string; full_name: string | null } | null>(null);
  const [loadingRaffle, setLoadingRaffle] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRaffleData();
    }
  }, [id]);

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
      setLoadingRaffle(false);
      return;
    }

    setRaffle(raffleData as Raffle);

    // Fetch entries with user emails
    const { data: entriesData } = await supabase
      .from("entries")
      .select("*")
      .eq("raffle_id", id)
      .order("created_at", { ascending: false });

    if (entriesData) {
      // Fetch user emails
      const userIds = [...new Set(entriesData.map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

      setEntries(
        entriesData.map((entry) => ({
          ...entry,
          source: entry.source as "SUBSCRIPTION" | "NPN",
          user_email: emailMap.get(entry.user_id) || "Unknown",
        }))
      );
    }

    // Fetch winner if exists
    if (raffleData.winner_id) {
      const { data: winnerData } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", raffleData.winner_id)
        .single();

      if (winnerData) {
        setWinner(winnerData);
      }
    }

    setLoadingRaffle(false);
  };

  const handleSetLive = async () => {
    if (!raffle) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("raffles")
        .update({ status: "LIVE" })
        .eq("id", raffle.id);

      if (error) throw error;

      toast({
        title: "Raffle is now LIVE!",
        description: "Users can now enter this raffle.",
      });

      fetchRaffleData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrawWinner = async () => {
    if (!raffle || entries.length === 0) return;

    setActionLoading(true);
    try {
      // Generate draw hash
      const timestamp = Date.now().toString();
      const drawInput = `${raffle.seed}:${entries.length}:${timestamp}`;
      const drawHash = await sha256(drawInput);

      // Convert hash to number and select winner
      const hashInt = BigInt("0x" + drawHash.slice(0, 16));
      const winnerIndex = Number(hashInt % BigInt(entries.length));
      const winnerEntry = entries[winnerIndex];

      // Update raffle
      const { error } = await supabase
        .from("raffles")
        .update({
          status: "CLOSED",
          draw_hash: drawHash,
          winner_id: winnerEntry.user_id,
        })
        .eq("id", raffle.id);

      if (error) throw error;

      toast({
        title: "Winner drawn!",
        description: "The raffle has been closed and winner selected.",
      });

      fetchRaffleData();
    } catch (error: any) {
      toast({
        title: "Error drawing winner",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingRaffle) {
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
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isDraft = raffle.status === "DRAFT";
  const isLive = raffle.status === "LIVE";
  const isClosed = raffle.status === "CLOSED";

  return (
    <Layout>
      <div className="min-h-screen py-24">
        <div className="container px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                {raffle.image_url ? (
                  <img
                    src={raffle.image_url}
                    alt={raffle.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{raffle.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isLive
                          ? "bg-success/20 text-success"
                          : isClosed
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {raffle.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Ends {format(new Date(raffle.end_at), "PPp")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isDraft && (
                  <Button
                    onClick={handleSetLive}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Set Live
                  </Button>
                )}
                {isLive && entries.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={actionLoading}
                        className="gap-2 bg-accent hover:bg-accent/90"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4" />
                        )}
                        Draw Winner
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Confirm Winner Draw
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            You are about to draw a winner for <strong>"{raffle.title}"</strong>.
                          </p>
                          <p>
                            This action will:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            <li>Close the raffle permanently</li>
                            <li>Select a winner from {entries.length} entries</li>
                            <li>Reveal the cryptographic seed</li>
                          </ul>
                          <p className="font-medium text-foreground mt-3">
                            This action cannot be undone.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDrawWinner}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Draw Winner
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Total Entries</span>
                </div>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm">Subscription Entries</span>
                </div>
                <p className="text-2xl font-bold">
                  {entries.filter((e) => e.source === "SUBSCRIPTION").length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">NPN Entries</span>
                </div>
                <p className="text-2xl font-bold">
                  {entries.filter((e) => e.source === "NPN").length}
                </p>
              </div>
            </div>

            {/* Winner Section */}
            {isClosed && winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-success/5 border border-success/20 mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-success flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-success font-medium">Winner</p>
                    <p className="text-xl font-bold text-foreground">
                      {winner.full_name || winner.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{winner.email}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fairness Info */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Provably Fair Data</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Seed Hash</p>
                  <code className="block p-2 rounded bg-muted text-xs break-all">
                    {raffle.seed_hash}
                  </code>
                </div>
                {isClosed && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revealed Seed</p>
                      <code className="block p-2 rounded bg-muted text-xs break-all">
                        {raffle.seed}
                      </code>
                    </div>
                    {raffle.draw_hash && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Draw Hash</p>
                        <code className="block p-2 rounded bg-muted text-xs break-all">
                          {raffle.draw_hash}
                        </code>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Entries List */}
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold">Entries ({entries.length})</h3>
              </div>
              {entries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No entries yet
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 ${
                        index !== entries.length - 1 ? "border-b border-border/50" : ""
                      } ${entry.user_id === raffle.winner_id ? "bg-success/10" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{entry.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "PPp")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            entry.source === "NPN"
                              ? "bg-accent/20 text-accent"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {entry.source}
                        </span>
                        {entry.user_id === raffle.winner_id && (
                          <Trophy className="w-4 h-4 text-success" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
