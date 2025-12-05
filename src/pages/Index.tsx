import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { 
  Ticket, 
  Shield, 
  Trophy, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Provably Fair",
    description: "Every draw uses cryptographic hashing you can verify independently.",
  },
  {
    icon: Trophy,
    title: "Premium Prizes",
    description: "Win amazing prizes from luxury items to cash rewards.",
  },
  {
    icon: Ticket,
    title: "Subscription Entries",
    description: "Subscribe once, get entries every month automatically.",
  },
  {
    icon: Sparkles,
    title: "No Purchase Necessary",
    description: "Free entry option available for every raffle - we're 100% legal.",
  },
];

const tiers = [
  { name: "Bronze", entries: 3, price: 5, color: "bronze" },
  { name: "Silver", entries: 5, price: 10, color: "silver" },
  { name: "Gold", entries: 10, price: 20, color: "gold", featured: true },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="container relative z-10 px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">The Future of Fair Raffles</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Win Big with{" "}
              <span className="text-gradient-gold">LuckyLoop</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Subscribe to enter monthly raffles with provably fair draws. 
              Every winner is selected transparently on the blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/raffles">
                <Button variant="hero" size="xl" className="gap-2">
                  <Ticket className="w-5 h-5" />
                  Browse Raffles
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="xl" className="gap-2">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Cards Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative h-32"
          >
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, i === 2 ? 0 : i === 1 ? -5 : 5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className={`w-20 h-28 rounded-xl bg-gradient-card border border-border/50 shadow-card flex items-center justify-center ${
                    i === 2 ? "z-10 scale-110" : "opacity-60"
                  }`}
                >
                  <Ticket className={`w-8 h-8 ${i === 2 ? "text-primary" : "text-muted-foreground"}`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-gradient-gold">LuckyLoop</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've built the most transparent and fair raffle platform in the world.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Pricing Preview */}
      <section className="py-24 relative bg-gradient-to-b from-background via-secondary/5 to-background">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient-gold">Pricing</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your lucky streak. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  tier.featured
                    ? "bg-gradient-card border-primary/50 shadow-gold scale-105"
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-gold text-background text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className={`text-xl font-bold mb-1 ${
                    tier.color === "gold" ? "text-gold" : 
                    tier.color === "silver" ? "text-silver" : "text-bronze"
                  }`}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-4xl font-black">${tier.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
                    <Ticket className="w-4 h-4 text-primary" />
                    <span>{tier.entries} entries per month</span>
                  </div>
                  <Link to="/pricing">
                    <Button 
                      variant={tier.featured ? "gold" : "outline"} 
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get <span className="text-gradient-gold">Lucky</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of winners and start entering raffles today.
              Your next big win is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Free entries available
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Ticket className="w-4 h-4 text-background" />
              </div>
              <span className="font-bold text-gradient-gold">LuckyLoop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LuckyLoop. All rights reserved. Play responsibly.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
