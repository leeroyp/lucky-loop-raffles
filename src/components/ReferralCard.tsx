import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Users, Copy, Check, Gift, Loader2 } from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  entriesEarned: number;
}

export function ReferralCard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, entriesEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchReferralData();
    }
  }, [user?.id]);

  const fetchReferralData = async () => {
    if (!user?.id) return;
    
    try {
      // Get referral code from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();
      
      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      }

      // Get referral stats
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("id, entries_credited")
        .eq("referrer_id", user.id);

      if (!error && referrals) {
        const credited = referrals.filter(r => r.entries_credited);
        setStats({
          totalReferrals: referrals.length,
          entriesEarned: credited.length * 2, // 2 entries per referral
        });
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = referralCode 
    ? `${window.location.origin}/auth?mode=signup&ref=${referralCode}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it with friends to earn bonus entries.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Invite Friends, Earn Entries</h3>
          <p className="text-sm text-muted-foreground">Get 2 bonus entries for each friend who signs up</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-background/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Referrals</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
        </div>
        <div className="p-3 rounded-xl bg-background/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Entries Earned</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.entriesEarned}</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Your referral link</label>
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="bg-background/50 text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}