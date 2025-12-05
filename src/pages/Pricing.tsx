import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { 
  Ticket, 
  Check, 
  Star, 
  Crown, 
  Sparkles,
  ArrowRight,
  Shield
} from "lucide-react";

const tiers = [
  {
    name: "Bronze",
    price: 5,
    entries: 3,
    color: "bronze",
    gradient: "bg-gradient-bronze",
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
    price: 10,
    entries: 5,
    color: "silver",
    gradient: "bg-gradient-silver",
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
    price: 20,
    entries: 10,
    color: "gold",
    gradient: "bg-gradient-gold-tier",
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
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen py-24">
        {/* Header */}
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Simple Pricing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Choose Your <span className="text-gradient-gold">Lucky Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Subscribe once, get entries every month. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  tier.featured
                    ? "bg-gradient-card border-primary/50 shadow-gold scale-105 z-10"
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-gold text-background text-sm font-bold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                )}

                {/* Tier Icon */}
                <div className={`w-16 h-16 rounded-2xl ${tier.gradient} flex items-center justify-center mb-6 ${
                  tier.featured ? "shadow-gold" : ""
                }`}>
                  <tier.icon className="w-8 h-8 text-background" />
                </div>

                {/* Tier Name */}
                <h3 className={`text-2xl font-bold mb-2 ${
                  tier.color === "gold" ? "text-gold" : 
                  tier.color === "silver" ? "text-silver" : "text-bronze"
                }`}>
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Entries */}
                <div className="flex items-center gap-2 text-muted-foreground mb-6 pb-6 border-b border-border/50">
                  <Ticket className="w-5 h-5 text-primary" />
                  <span className="font-medium">{tier.entries} entries per month</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link to={user ? "/account" : "/auth?mode=signup"}>
                  <Button 
                    variant={tier.featured ? "gold" : "outline"} 
                    className="w-full gap-2"
                    size="lg"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
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
                  className="p-6 rounded-xl bg-card border border-border/50"
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
