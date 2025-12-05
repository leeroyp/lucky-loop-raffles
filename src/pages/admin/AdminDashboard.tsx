import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Ticket,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2
} from "lucide-react";

interface Stats {
  totalRaffles: number;
  liveRaffles: number;
  totalEntries: number;
  totalUsers: number;
}

interface RecentRaffle {
  id: string;
  title: string;
  status: "DRAFT" | "LIVE" | "CLOSED";
  end_at: string;
  entry_count: number;
}

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRaffles: 0,
    liveRaffles: 0,
    totalEntries: 0,
    totalUsers: 0,
  });
  const [recentRaffles, setRecentRaffles] = useState<RecentRaffle[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    // Fetch raffle counts
    const { count: totalRaffles } = await supabase
      .from("raffles")
      .select("*", { count: "exact", head: true });

    const { count: liveRaffles } = await supabase
      .from("raffles")
      .select("*", { count: "exact", head: true })
      .eq("status", "LIVE");

    const { count: totalEntries } = await supabase
      .from("entries")
      .select("*", { count: "exact", head: true });

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setStats({
      totalRaffles: totalRaffles || 0,
      liveRaffles: liveRaffles || 0,
      totalEntries: totalEntries || 0,
      totalUsers: totalUsers || 0,
    });

    // Fetch recent raffles
    const { data: rafflesData } = await supabase
      .from("raffles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (rafflesData) {
      const rafflesWithCounts = await Promise.all(
        rafflesData.map(async (raffle) => {
          const { count } = await supabase
            .from("entries")
            .select("*", { count: "exact", head: true })
            .eq("raffle_id", raffle.id);

          return {
            id: raffle.id,
            title: raffle.title,
            status: raffle.status as "DRAFT" | "LIVE" | "CLOSED",
            end_at: raffle.end_at,
            entry_count: count || 0,
          };
        })
      );
      setRecentRaffles(rafflesWithCounts);
    }

    setLoadingStats(false);
  };

  if (isLoading || loadingStats) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    { label: "Total Raffles", value: stats.totalRaffles, icon: Ticket, color: "text-primary" },
    { label: "Live Raffles", value: stats.liveRaffles, icon: Clock, color: "text-success" },
    { label: "Total Entries", value: stats.totalEntries, icon: Users, color: "text-accent" },
    { label: "Total Users", value: stats.totalUsers, icon: Trophy, color: "text-gold" },
  ];

  return (
    <Layout>
      <div className="min-h-screen py-24">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage raffles and view analytics</p>
            </div>
            <Link to="/admin/raffles/new">
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                New Raffle
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-muted-foreground text-sm">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Raffles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-card border border-border/50 overflow-hidden"
          >
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Raffles</h2>
              <Link to="/admin/raffles">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {recentRaffles.length === 0 ? (
              <div className="p-12 text-center">
                <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No raffles yet</p>
                <Link to="/admin/raffles/new">
                  <Button variant="outline" className="mt-4">
                    Create your first raffle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentRaffles.map((raffle) => (
                  <Link
                    key={raffle.id}
                    to={`/admin/raffles/${raffle.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{raffle.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {raffle.entry_count} entries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          raffle.status === "LIVE"
                            ? "bg-success/20 text-success"
                            : raffle.status === "CLOSED"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {raffle.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
