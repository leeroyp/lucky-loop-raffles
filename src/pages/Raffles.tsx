import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RaffleCardSkeleton } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { 
  Ticket, 
  Clock, 
  Users, 
  Trophy,
  Sparkles,
  Calendar,
  LogIn,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: "DRAFT" | "LIVE" | "CLOSED";
  end_at: string;
  winner_id: string | null;
  created_at: string;
}

interface RaffleWithEntries extends Raffle {
  entry_count: number;
}

export default function Raffles() {
  const { user } = useAuth();
  const [raffles, setRaffles] = useState<RaffleWithEntries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "LIVE" | "CLOSED">("all");

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    // Use public_raffles view which hides seeds until draw is complete
    const { data: rafflesData, error } = await supabase
      .from("public_raffles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching raffles:", error);
      setIsLoading(false);
      return;
    }

    // Fetch entry counts for each raffle
    const rafflesWithCounts = await Promise.all(
      (rafflesData || []).map(async (raffle) => {
        const { count } = await supabase
          .from("entries")
          .select("*", { count: "exact", head: true })
          .eq("raffle_id", raffle.id);
        
        return {
          ...raffle,
          entry_count: count || 0,
        } as RaffleWithEntries;
      })
    );

    setRaffles(rafflesWithCounts);
    setIsLoading(false);
  };

  const filteredRaffles = raffles.filter((raffle) => 
    filter === "all" ? true : raffle.status === filter
  );

  const liveCount = raffles.filter((r) => r.status === "LIVE").length;
  const closedCount = raffles.filter((r) => r.status === "CLOSED").length;

  return (
    <Layout>
      <SEO 
        title="Browse Raffles" 
        description="Enter live raffles for a chance to win amazing prizes. All draws are provably fair and transparent."
      />
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Active Raffles</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Browse <span className="text-gradient">Raffles</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter for a chance to win amazing prizes. All draws are provably fair.
            </p>
          </motion.div>

          {/* Sign In/Sign Up CTA for unauthenticated users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-12"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-6 md:p-8">
                <div className="absolute inset-0 bg-grid-white/5" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      Ready to Enter? <span className="text-primary">Join Now!</span>
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Sign up or log in to enter live raffles and get a chance to win amazing prizes.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild size="lg" variant="outline" className="gap-2">
                      <Link to="/auth?tab=login">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild size="lg" className="gap-2">
                      <Link to="/auth?tab=signup">
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="gap-2"
            >
              <Ticket className="w-4 h-4" />
              All ({raffles.length})
            </Button>
            <Button
              variant={filter === "LIVE" ? "default" : "outline"}
              onClick={() => setFilter("LIVE")}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Live ({liveCount})
            </Button>
            <Button
              variant={filter === "CLOSED" ? "default" : "outline"}
              onClick={() => setFilter("CLOSED")}
              className="gap-2"
            >
              <Trophy className="w-4 h-4" />
              Closed ({closedCount})
            </Button>
          </motion.div>

          {/* Raffles Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RaffleCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredRaffles.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No raffles found"
              description={filter === "all" 
                ? "Check back soon for new raffles!" 
                : `No ${filter.toLowerCase()} raffles at the moment.`}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRaffles.map((raffle, index) => (
                <motion.div
                  key={raffle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/raffles/${raffle.id}`}>
                    <div className="group rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg overflow-hidden transition-all duration-300">
                      {/* Image */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {raffle.image_url ? (
                          <img
                            src={raffle.image_url}
                            alt={raffle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                            <Ticket className="w-12 h-12 text-primary/30" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                          raffle.status === "LIVE"
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {raffle.status === "LIVE" ? "LIVE" : "CLOSED"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {raffle.title}
                        </h3>
                        {raffle.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {raffle.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{raffle.entry_count} entries</span>
                          </div>
                          {raffle.status === "LIVE" ? (
                            <CountdownTimer 
                              endDate={new Date(raffle.end_at)} 
                              className="text-muted-foreground"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Ended {format(new Date(raffle.end_at), "MMM d")}
                              </span>
                            </div>
                          )}
                        </div>

                        {raffle.status === "CLOSED" && raffle.winner_id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-yellow-600">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-medium">Winner Selected</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
