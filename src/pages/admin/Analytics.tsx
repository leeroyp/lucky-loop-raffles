import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Ticket,
  Users,
  Trophy,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyData {
  date: string;
  entries: number;
  users: number;
}

interface RaffleStats {
  name: string;
  entries: number;
  status: string;
}

interface SourceDistribution {
  name: string;
  value: number;
}

export default function Analytics() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  
  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalRaffles, setTotalRaffles] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  
  // Chart data
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [raffleStats, setRaffleStats] = useState<RaffleStats[]>([]);
  const [sourceDistribution, setSourceDistribution] = useState<SourceDistribution[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; total: number }[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const startDate = subDays(new Date(), dateRange);
    
    try {
      // Fetch total stats
      const [
        { count: usersCount },
        { count: entriesCount },
        { count: rafflesCount },
        { data: entriesData },
        { data: usersData },
        { data: rafflesData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("entries").select("*", { count: "exact", head: true }),
        supabase.from("raffles").select("*", { count: "exact", head: true }),
        supabase.from("entries").select("created_at, source, raffle_id"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("raffles").select("id, title, status"),
      ]);

      setTotalUsers(usersCount || 0);
      setTotalEntries(entriesCount || 0);
      setTotalRaffles(rafflesCount || 0);

      // Calculate conversion rate (users with entries / total users)
      if (usersData && entriesData) {
        const usersWithEntries = new Set(entriesData.map((e: any) => e.user_id)).size;
        setConversionRate(usersCount ? Math.round((usersWithEntries / usersCount) * 100) : 0);
      }

      // Process daily entries data
      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      const dailyEntries: Record<string, number> = {};
      const dailyNewUsers: Record<string, number> = {};

      days.forEach((day) => {
        const key = format(day, "MMM d");
        dailyEntries[key] = 0;
        dailyNewUsers[key] = 0;
      });

      entriesData?.forEach((entry: any) => {
        const day = format(new Date(entry.created_at), "MMM d");
        if (dailyEntries[day] !== undefined) {
          dailyEntries[day]++;
        }
      });

      usersData?.forEach((user: any) => {
        const day = format(new Date(user.created_at), "MMM d");
        if (dailyNewUsers[day] !== undefined) {
          dailyNewUsers[day]++;
        }
      });

      setDailyData(
        days.map((day) => {
          const key = format(day, "MMM d");
          return {
            date: key,
            entries: dailyEntries[key] || 0,
            users: dailyNewUsers[key] || 0,
          };
        })
      );

      // User growth (cumulative)
      let cumulative = 0;
      const growth = days.map((day) => {
        const key = format(day, "MMM d");
        cumulative += dailyNewUsers[key] || 0;
        return { date: key, total: cumulative };
      });
      // Adjust to show actual total at the end
      if (growth.length > 0 && usersCount) {
        const diff = usersCount - cumulative;
        growth.forEach((g) => (g.total += diff));
      }
      setUserGrowth(growth);

      // Raffle stats
      if (rafflesData && entriesData) {
        const raffleCounts: Record<string, number> = {};
        entriesData.forEach((entry: any) => {
          raffleCounts[entry.raffle_id] = (raffleCounts[entry.raffle_id] || 0) + 1;
        });

        const stats = rafflesData.map((raffle: any) => ({
          name: raffle.title.length > 20 ? raffle.title.substring(0, 20) + "..." : raffle.title,
          entries: raffleCounts[raffle.id] || 0,
          status: raffle.status,
        }));
        setRaffleStats(stats.sort((a: RaffleStats, b: RaffleStats) => b.entries - a.entries).slice(0, 10));
      }

      // Source distribution
      if (entriesData) {
        const sources: Record<string, number> = {};
        entriesData.forEach((entry: any) => {
          sources[entry.source] = (sources[entry.source] || 0) + 1;
        });

        setSourceDistribution(
          Object.entries(sources).map(([name, value]) => ({
            name: name === "NPN" ? "No Purchase" : name === "SUBSCRIPTION" ? "Subscription" : name,
            value,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalUsers,
        totalEntries,
        totalRaffles,
        conversionRate: `${conversionRate}%`,
      },
      dailyData,
      raffleStats,
      sourceDistribution,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--accent))", "hsl(var(--success))"];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-24">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary", change: "+12%" },
    { label: "Total Entries", value: totalEntries, icon: Ticket, color: "text-gold", change: "+8%" },
    { label: "Active Raffles", value: totalRaffles, icon: Trophy, color: "text-accent", change: "0" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-success", change: "+3%" },
  ];

  return (
    <Layout>
      <div className="min-h-screen py-24">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track engagement and growth metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dateRange === days
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={exportData} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-card border border-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-success font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Entries Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-semibold mb-4">Daily Entries</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="entries"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorEntries)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-semibold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--gold))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Raffle Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-semibold mb-4">Top Raffles by Entries</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={raffleStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="entries" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Entry Sources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="font-semibold mb-4">Entry Sources</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Engagement Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h3 className="font-semibold mb-4">New Users vs Entries</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="users" name="New Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="entries" name="Entries" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
