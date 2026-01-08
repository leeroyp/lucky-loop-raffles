import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { EntryHistory } from "@/components/EntryHistory";
import { 
  User, 
  Ticket, 
  Crown, 
  Calendar, 
  ArrowRight,
  LogOut,
  Shield,
  History
} from "lucide-react";
import { format } from "date-fns";

const tierColors = {
  BRONZE: "text-amber-700",
  SILVER: "text-slate-500",
  GOLD: "text-yellow-600",
};

const tierGradients = {
  BRONZE: "bg-gradient-to-r from-amber-700 to-orange-600",
  SILVER: "bg-gradient-to-r from-slate-400 to-gray-500",
  GOLD: "bg-gradient-to-r from-yellow-500 to-amber-400",
};

export default function Account() {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  if (isLoading || !profile) {
    return (
      <Layout>
        <div className="min-h-screen py-24">
          <div className="container px-4 max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="My Account" description="Manage your LuckyLoop account, view entries, and subscription status." />
      <div className="min-h-screen py-24">
        <div className="container px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-violet-500 flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.full_name || "Welcome"}
                </h1>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              {isAdmin && (
                <Link to="/admin" className="ml-auto">
                  <Button variant="outline" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Entries Remaining */}
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Entries Remaining</span>
                </div>
                <p className="text-4xl font-black text-primary">
                  {profile.entries_remaining}
                </p>
              </div>

              {/* Subscription Tier */}
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Subscription</span>
                </div>
                {profile.subscription_tier ? (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${tierGradients[profile.subscription_tier]} flex items-center justify-center`}>
                      <Crown className="w-4 h-4 text-background" />
                    </div>
                    <p className={`text-2xl font-bold ${tierColors[profile.subscription_tier]}`}>
                      {profile.subscription_tier}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">
                    No subscription
                  </p>
                )}
              </div>
            </div>

            {/* Upgrade CTA */}
            {!profile.subscription_tier && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 mb-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Get More Entries</h3>
                    <p className="text-muted-foreground">
                      Subscribe to receive entries every month
                    </p>
                  </div>
                  <Link to="/pricing">
                    <Button variant="gold" className="gap-2">
                      View Plans
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Account Info */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 mb-8">
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Email</span>
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently joined'}
                  </span>
                </div>
              </div>
            </div>

            {/* Entry History */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Entry History</h3>
              </div>
              <EntryHistory userId={user?.id || ""} />
            </div>

            {/* Sign Out */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
