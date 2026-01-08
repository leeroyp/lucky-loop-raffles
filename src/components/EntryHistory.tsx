import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Trophy, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface EntryWithRaffle {
  id: string;
  source: string;
  created_at: string;
  raffle: {
    id: string;
    title: string;
    status: string;
    image_url: string | null;
    winner_id: string | null;
  };
}

interface EntryHistoryProps {
  userId: string;
}

export function EntryHistory({ userId }: EntryHistoryProps) {
  const [entries, setEntries] = useState<EntryWithRaffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [userId]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(`
        id,
        source,
        created_at,
        raffle:raffles (
          id,
          title,
          status,
          image_url,
          winner_id
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      // Transform the data to match our interface
      const transformedData = data.map((entry: any) => ({
        id: entry.id,
        source: entry.source,
        created_at: entry.created_at,
        raffle: entry.raffle,
      }));
      setEntries(transformedData);
    }
    setLoading(false);
  };

  // Group entries by raffle
  const groupedEntries = entries.reduce((acc, entry) => {
    const raffleId = entry.raffle?.id;
    if (!raffleId) return acc;
    
    if (!acc[raffleId]) {
      acc[raffleId] = {
        raffle: entry.raffle,
        entries: [],
        totalEntries: 0,
      };
    }
    acc[raffleId].entries.push(entry);
    acc[raffleId].totalEntries++;
    return acc;
  }, {} as Record<string, { raffle: EntryWithRaffle["raffle"]; entries: EntryWithRaffle[]; totalEntries: number }>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No entries yet</p>
        <Link to="/raffles" className="text-primary hover:underline text-sm">
          Browse active raffles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(groupedEntries).map((group, index) => {
        const isWinner = group.raffle?.winner_id === userId;
        const isClosed = group.raffle?.status === "CLOSED";

        return (
          <motion.div
            key={group.raffle?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/raffles/${group.raffle?.id}`}
              className={`block p-4 rounded-xl border transition-all hover:shadow-md ${
                isWinner
                  ? "bg-gradient-to-r from-gold/10 to-amber-500/10 border-gold/30"
                  : "bg-card border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {group.raffle?.image_url ? (
                    <img
                      src={group.raffle.image_url}
                      alt={group.raffle.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{group.raffle?.title}</h4>
                    {isWinner && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium">
                        <Trophy className="w-3 h-3" />
                        Winner!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3 h-3" />
                      {group.totalEntries} {group.totalEntries === 1 ? "entry" : "entries"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        group.raffle?.status === "LIVE"
                          ? "bg-success/20 text-success"
                          : group.raffle?.status === "CLOSED"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {group.raffle?.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last entry: {format(new Date(group.entries[0].created_at), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Arrow */}
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
