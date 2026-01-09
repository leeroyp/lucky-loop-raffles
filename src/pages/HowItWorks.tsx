import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DrawAnimation } from "@/components/DrawAnimation";
import {
  Shield,
  Hash,
  Lock,
  Unlock,
  Calculator,
  Users,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Play,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  Zap
} from "lucide-react";

// SHA-256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function HowItWorks() {
  // Interactive demo state
  const [demoSeed, setDemoSeed] = useState("my_secret_seed_123");
  const [demoSeedHash, setDemoSeedHash] = useState("");
  const [demoEntryCount, setDemoEntryCount] = useState(100);
  const [demoDrawHash, setDemoDrawHash] = useState("");
  const [demoWinnerIndex, setDemoWinnerIndex] = useState<number | null>(null);
  const [showSeed, setShowSeed] = useState(false);
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Verification tool state
  const [verifySeed, setVerifySeed] = useState("");
  const [verifySeedHash, setVerifySeedHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<"match" | "mismatch" | null>(null);
  
  // Full demo animation
  const [showFullDemo, setShowFullDemo] = useState(false);

  const runStep1 = async () => {
    setIsCalculating(true);
    setStep(1);
    const hash = await sha256(demoSeed);
    setDemoSeedHash(hash);
    setIsCalculating(false);
  };

  const runStep2 = async () => {
    setIsCalculating(true);
    setStep(2);
    setShowSeed(true);
    await new Promise(r => setTimeout(r, 500));
    setIsCalculating(false);
  };

  const runStep3 = async () => {
    setIsCalculating(true);
    setStep(3);
    const timestamp = Date.now();
    const drawInput = `${demoSeed}:${demoEntryCount}:${timestamp}`;
    const hash = await sha256(drawInput);
    setDemoDrawHash(hash);
    setIsCalculating(false);
  };

  const runStep4 = () => {
    setStep(4);
    if (demoDrawHash) {
      const hashPortion = demoDrawHash.substring(0, 12);
      const hashInt = parseInt(hashPortion, 16);
      const winnerIdx = hashInt % demoEntryCount;
      setDemoWinnerIndex(winnerIdx);
    }
  };

  const resetDemo = () => {
    setStep(0);
    setDemoSeedHash("");
    setDemoDrawHash("");
    setDemoWinnerIndex(null);
    setShowSeed(false);
  };

  const verifyHash = async () => {
    if (!verifySeed || !verifySeedHash) return;
    const computed = await sha256(verifySeed);
    setVerifyResult(computed === verifySeedHash ? "match" : "mismatch");
  };

  const steps = [
    {
      icon: Lock,
      title: "Seed Commitment",
      description: "Before any entries, we generate a secret random seed and publish its SHA-256 hash. This commits us to the seed without revealing it."
    },
    {
      icon: Unlock,
      title: "Seed Reveal",
      description: "After entries close, we reveal the original seed. Anyone can verify that SHA-256(seed) matches the published hash."
    },
    {
      icon: Hash,
      title: "Draw Hash Generation",
      description: "We combine the seed with entry count and timestamp, then hash it to generate the draw hash."
    },
    {
      icon: Calculator,
      title: "Winner Calculation",
      description: "The winner index is calculated as: draw_hash (as number) modulo total_entries. This is deterministic and verifiable."
    }
  ];

  const faqs = [
    {
      question: "Why can't you manipulate the results?",
      answer: "The seed hash is published before any entries are made. Changing the seed after would produce a different hash, which anyone can detect. The algorithm is deterministic, so the same inputs always produce the same winner."
    },
    {
      question: "How do I verify a draw myself?",
      answer: "Use our verification tool below, or any SHA-256 calculator. Compute SHA-256(seed) and compare it to the published seed_hash. Then compute SHA-256(seed:entries:timestamp) to get the draw_hash, and take draw_hash mod entries to find the winner index."
    },
    {
      question: "What if someone enters at the last second?",
      answer: "The entry count is locked at draw time. Late entries that arrive after the cutoff are not included in that draw."
    },
    {
      question: "Is this truly random?",
      answer: "The seed is generated using cryptographically secure random number generation. The SHA-256 hash function ensures the output is uniformly distributed, giving every entry an equal chance."
    }
  ];

  return (
    <Layout>
      <SEO 
        title="How It Works - Provably Fair System" 
        description="Learn how our provably fair raffle system works. Transparent, verifiable, and impossible to manipulate."
      />
      
      <div className="min-h-screen py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container px-4 max-w-5xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Provably Fair</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              How Our Draws Work
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our raffle system uses cryptographic commitments and SHA-256 hashing to ensure 
              every draw is completely transparent, verifiable, and impossible to manipulate.
            </p>
          </motion.div>

          {/* The 4 Steps Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-8 text-center">The Process</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {steps.map((s, index) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                    {index < 3 && (
                      <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground/30 z-10" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
              <p className="text-muted-foreground">
                Try it yourself! Walk through each step to see how a winner is selected.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border">
              {/* Demo Controls */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">Secret Seed</label>
                  <div className="relative">
                    <Input
                      type={showSeed || step === 0 ? "text" : "password"}
                      value={demoSeed}
                      onChange={(e) => setDemoSeed(e.target.value)}
                      placeholder="Enter a secret seed..."
                      disabled={step > 0}
                      className="pr-10"
                    />
                    <button
                      onClick={() => setShowSeed(!showSeed)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Entries</label>
                  <Input
                    type="number"
                    value={demoEntryCount}
                    onChange={(e) => setDemoEntryCount(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10000}
                    disabled={step > 0}
                  />
                </div>
              </div>

              {/* Step Progress */}
              <div className="space-y-4 mb-8">
                {/* Step 1 */}
                <div className={`p-4 rounded-xl border transition-all ${step >= 1 ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {step >= 1 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Step 1: Commit Seed Hash</p>
                        <p className="text-sm text-muted-foreground">SHA256(seed) → published before entries</p>
                      </div>
                    </div>
                    {step === 0 && (
                      <Button size="sm" onClick={runStep1} disabled={isCalculating}>
                        {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Generate"}
                      </Button>
                    )}
                  </div>
                  {step >= 1 && demoSeedHash && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-3 rounded-lg bg-background font-mono text-xs break-all"
                    >
                      <span className="text-muted-foreground">seed_hash: </span>
                      {demoSeedHash}
                    </motion.div>
                  )}
                </div>

                {/* Step 2 */}
                <div className={`p-4 rounded-xl border transition-all ${step >= 2 ? "bg-green-500/10 border-green-500/30" : step === 1 ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border opacity-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {step >= 2 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Unlock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Step 2: Reveal Seed</p>
                        <p className="text-sm text-muted-foreground">After entries close, reveal the original seed</p>
                      </div>
                    </div>
                    {step === 1 && (
                      <Button size="sm" onClick={runStep2} disabled={isCalculating}>
                        Reveal
                      </Button>
                    )}
                  </div>
                  {step >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-3 rounded-lg bg-background font-mono text-xs"
                    >
                      <span className="text-muted-foreground">seed: </span>
                      {demoSeed}
                    </motion.div>
                  )}
                </div>

                {/* Step 3 */}
                <div className={`p-4 rounded-xl border transition-all ${step >= 3 ? "bg-green-500/10 border-green-500/30" : step === 2 ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border opacity-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {step >= 3 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Hash className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Step 3: Generate Draw Hash</p>
                        <p className="text-sm text-muted-foreground">SHA256(seed + ":" + entries + ":" + timestamp)</p>
                      </div>
                    </div>
                    {step === 2 && (
                      <Button size="sm" onClick={runStep3} disabled={isCalculating}>
                        {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Calculate"}
                      </Button>
                    )}
                  </div>
                  {step >= 3 && demoDrawHash && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-3 rounded-lg bg-background font-mono text-xs break-all"
                    >
                      <span className="text-muted-foreground">draw_hash: </span>
                      {demoDrawHash}
                    </motion.div>
                  )}
                </div>

                {/* Step 4 */}
                <div className={`p-4 rounded-xl border transition-all ${step >= 4 ? "bg-green-500/10 border-green-500/30" : step === 3 ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border opacity-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {step >= 4 ? (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Calculator className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Step 4: Calculate Winner</p>
                        <p className="text-sm text-muted-foreground">winner_index = parseInt(draw_hash, 16) % {demoEntryCount}</p>
                      </div>
                    </div>
                    {step === 3 && (
                      <Button size="sm" onClick={runStep4}>
                        Calculate
                      </Button>
                    )}
                  </div>
                  {step >= 4 && demoWinnerIndex !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-primary/20 text-center"
                    >
                      <Sparkles className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-lg font-bold">
                        Entry #{demoWinnerIndex + 1} wins!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (Index {demoWinnerIndex} of {demoEntryCount} entries)
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Reset Button */}
              {step > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={resetDemo} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reset Demo
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Full Animation Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See It In Action</h2>
              <p className="text-muted-foreground">
                Watch the full animated draw experience
              </p>
            </div>

            {!showFullDemo ? (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => setShowFullDemo(true)}
                  className="gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo Draw
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto space-y-4"
              >
                <DrawAnimation
                  entries={[
                    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank",
                    "Grace", "Henry", "Ivy", "Jack", "Kate", "Leo"
                  ]}
                  winnerName="Lucky Winner"
                  autoPlay={true}
                  totalEntries={1247}
                  seed="demo_seed_provably_fair_2024"
                  seedHash="7a8b9c0d1e2f3456789abcdef0123456789abcdef0123456789abcdef012345"
                  drawHash="3f4e5d6c7b8a90123456789abcdef0123456789abcdef0123456789abcdef01"
                />
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowFullDemo(false)}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Replay
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Verification Tool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Verify a Draw</h2>
              <p className="text-muted-foreground">
                Use this tool to verify that a revealed seed matches its published hash
              </p>
            </div>

            <div className="max-w-xl mx-auto p-6 rounded-2xl bg-card border border-border">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Revealed Seed</label>
                  <Input
                    value={verifySeed}
                    onChange={(e) => {
                      setVerifySeed(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Enter the revealed seed..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Published Seed Hash</label>
                  <Input
                    value={verifySeedHash}
                    onChange={(e) => {
                      setVerifySeedHash(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Enter the published seed hash..."
                  />
                </div>
                <Button onClick={verifyHash} className="w-full gap-2">
                  <Shield className="w-4 h-4" />
                  Verify Hash
                </Button>

                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl ${
                      verifyResult === "match"
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {verifyResult === "match" ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="font-bold text-green-500">Match!</p>
                            <p className="text-sm text-muted-foreground">
                              The seed hash is valid. This draw was fair.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 text-red-500" />
                          <div>
                            <p className="font-bold text-red-500">Mismatch!</p>
                            <p className="text-sm text-muted-foreground">
                              The hashes don't match. Check your inputs.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="flex gap-3">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
              <Trophy className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready to Enter?</h2>
              <p className="text-muted-foreground mb-6">
                Now that you know our draws are fair, why not try your luck?
              </p>
              <Button size="lg" asChild>
                <a href="/raffles" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  View Live Raffles
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
