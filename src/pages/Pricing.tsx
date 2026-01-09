import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  Check, 
  Star, 
  Crown, 
  Sparkles,
  ArrowRight,
  Shield,
  Loader2
} from "lucide-react";
import { useEffect } from "react";

type TierKey = "BRONZE" | "SILVER" | "GOLD";

const tiers: {
  name: string;
  key: TierKey;
  price: number;
  entries: number;
  colorClass: string;
  gradientClass: string;
  icon: typeof Ticket;
  featured?: boolean;
  features: string[];
}[] = [
  {
    name: "Bronze",
    key: "BRONZE",
    price: 5,
    entries: 3,
    colorClass: "text-amber-700",
    gradientClass: "bg-gradient-to-r from-amber-700 to-orange-600",
    icon: Ticket,
    features: [
      "3 raffle entries per month",
      "Access to all live raffles",
      "Entry tracking dashboard",
      "Email notifications",
    ],
  },
  {
    name: "Silver",
    key: "SILVER",
    price: 10,
    entries: 5,
    colorClass: "text-slate-500",
    gradientClass: "bg-gradient-to-r from-slate-400 to-gray-500",
    icon: Shield,
    features: [
      "5 raffle entries per month",
      "Access to all live raffles",
      "Entry tracking dashboard",
      "Email notifications",
      "Priority support",
    ],
  },
  {
    name: "Gold",
    key: "GOLD",
    price: 20,
    entries: 10,
    colorClass: "text-yellow-600",
    gradientClass: "bg-gradient-to-r from-yellow-500 to-amber-400",
    icon: Crown,
    featured: true,
    features: [
      "10 raffle entries per month",
      "Access to all live raffles",
      "Entry tracking dashboard",
      "Email notifications",
      "Priority support",
      "Early access to new raffles",
      "Exclusive Gold-only raffles",
    ],
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);

  useEffect(() => {
    if (searchParams.get("checkout") === "canceled") {
      toast({
        title: "Checkout canceled",
        description: "Your subscription was not completed.",
      });
    }
  }, [searchParams, toast]);

  const handleSubscribe = async (tier: TierKey) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe.",
      });
      return;
    }

    setLoadingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const currentTier = profile?.subscription_tier;

  return (
    <Layout>
      <SEO 
        title="Pricing" 
        description="Choose a LuckyLoop subscription plan. Get monthly raffle entries with Bronze, Silver, or Gold tiers. Cancel anytime."
      />
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        {/* Header */}
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Simple Pricing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Choose Your <span className="text-gradient">Lucky Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Subscribe once, get entries every month. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            {tiers.map((tier, index) => {
              const isCurrentPlan = currentTier === tier.key;
              const isLoading = loadingTier === tier.key;

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                    tier.featured
                      ? "bg-card border-primary shadow-lg scale-105 z-10"
                      : "bg-card border-border hover:border-primary/30 hover:shadow-md"
                  } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                >
                  {tier.featured && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Your Plan
                    </div>
                  )}

                  {/* Tier Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${tier.gradientClass} flex items-center justify-center mb-6 shadow-md`}>
                    <tier.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Tier Name */}
                  <h3 className={`text-2xl font-bold mb-2 ${tier.colorClass}`}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-black">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  {/* Entries */}
                  <div className="flex items-center gap-2 text-muted-foreground mb-6 pb-6 border-b border-border">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span className="font-medium">{tier.entries} entries per month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {!user ? (
                    <Link to="/auth?mode=signup">
                      <Button 
                        variant={tier.featured ? "default" : "outline"} 
                        className="w-full gap-2"
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : isCurrentPlan ? (
                    <Link to="/account">
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        size="lg"
                      >
                        Manage Subscription
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant={tier.featured ? "default" : "outline"} 
                      className="w-full gap-2"
                      size="lg"
                      onClick={() => handleSubscribe(tier.key)}
                      disabled={isLoading || !!loadingTier}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Do unused entries roll over?",
                  a: "No, entries reset at the start of each billing cycle. Use them or lose them!",
                },
                {
                  q: "Can I cancel my subscription?",
                  a: "Yes, you can cancel anytime. You'll keep access until the end of your billing period.",
                },
                {
                  q: "Is there a free entry option?",
                  a: "Yes! Every raffle has a No Purchase Necessary (NPN) option for one free entry per user.",
                },
                {
                  q: "How do I know the draws are fair?",
                  a: "We use cryptographic hashing for provably fair draws. You can verify every winner independently.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="p-6 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-muted-foreground text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
