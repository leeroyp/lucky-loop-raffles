import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Zap, Hash, Calculator, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface DrawAnimationProps {
  entries: string[];
  winnerName: string;
  onComplete?: () => void;
  autoPlay?: boolean;
  totalEntries?: number;
  seed?: string;
  seedHash?: string;
  drawHash?: string;
}

export function DrawAnimation({ 
  entries, 
  winnerName, 
  onComplete,
  autoPlay = false,
  totalEntries = 0,
  seed,
  seedHash,
  drawHash
}: DrawAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "step1" | "step2" | "step3" | "step4" | "reveal">("idle");
  const [displayedName, setDisplayedName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number>(0);

  // Create a pool of display names (mix of entries and placeholder names)
  const displayNames = entries.length > 0 ? entries : [
    "Player_1234", "LuckyWinner", "RaffleKing", "StarPlayer", 
    "GoldenTicket", "WinnerCircle", "TopEntry", "DrawMaster",
    "PrizeHunter", "RaffleStar", "LuckyDraw", "BigWinner"
  ];

  // Calculate winner index from draw hash
  const calculateWinnerIndex = () => {
    if (!drawHash || totalEntries === 0) return 0;
    // Take first 12 chars of hash to avoid overflow
    const hashPortion = drawHash.substring(0, 12);
    const hashInt = parseInt(hashPortion, 16);
    return hashInt % totalEntries;
  };

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      });
    }, 250);
  }, []);

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentStep(1);
    setPhase("step1");

    // Step 1: Show seed reveal (1.5s)
    setTimeout(() => {
      setCurrentStep(2);
      setPhase("step2");
      
      // Step 2: Show hash calculation (1.5s)
      setTimeout(() => {
        setCurrentStep(3);
        setPhase("step3");
        
        // Step 3: Calculate winner index (1.5s)
        setTimeout(() => {
          setCurrentStep(4);
          setPhase("step4");
          
          // Step 4: Animate through entries
          let speed = 50;
          let iterations = 0;
          const maxFastIterations = 25;
          const maxSlowIterations = 15;

          const animate = () => {
            iterations++;
            setCurrentIndex(prev => (prev + 1) % displayNames.length);
            setDisplayedName(displayNames[Math.floor(Math.random() * displayNames.length)]);

            if (iterations < maxFastIterations) {
              intervalRef.current = setTimeout(animate, speed);
            } else if (iterations < maxFastIterations + maxSlowIterations) {
              speed = speed + (iterations - maxFastIterations) * 20;
              intervalRef.current = setTimeout(animate, speed);
            } else {
              // Reveal phase
              setPhase("reveal");
              setDisplayedName(winnerName);
              triggerConfetti();
              
              setTimeout(() => {
                setIsAnimating(false);
                onComplete?.();
              }, 3000);
            }
          };

          animate();
        }, 1500);
      }, 1500);
    }, 1500);
  }, [isAnimating, displayNames, winnerName, onComplete, triggerConfetti]);

  useEffect(() => {
    if (autoPlay && phase === "idle") {
      const timer = setTimeout(startAnimation, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, phase, startAnimation]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  const winnerIndex = calculateWinnerIndex();

  const steps = [
    {
      icon: Hash,
      title: "Reveal Secret Seed",
      description: "The pre-committed seed is revealed",
      value: seed ? `${seed.substring(0, 16)}...` : "generating..."
    },
    {
      icon: Calculator,
      title: "Generate Draw Hash",
      description: "SHA256(seed + entries + timestamp)",
      value: drawHash ? `${drawHash.substring(0, 16)}...` : "calculating..."
    },
    {
      icon: Users,
      title: "Calculate Winner Index",
      description: `hash mod ${totalEntries} entries`,
      value: `Entry #${winnerIndex + 1}`
    },
    {
      icon: Trophy,
      title: "Select Winner",
      description: "Finding the winning entry...",
      value: winnerName
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border border-primary/30 p-6 md:p-8">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Animated background particles */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/40"
                initial={{ 
                  x: "50%", 
                  y: "50%", 
                  scale: 0,
                  opacity: 0 
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={isAnimating && phase === "step4" ? { 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            } : {}}
            transition={{ duration: 0.5, repeat: isAnimating && phase === "step4" ? Infinity : 0 }}
          >
            {phase === "reveal" ? (
              <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
            ) : (
              <Zap className={`w-12 h-12 mx-auto mb-2 ${isAnimating ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </motion.div>
          <h3 className="text-xl font-bold">
            {phase === "idle" && "Provably Fair Draw"}
            {phase === "step1" && "Step 1: Revealing Seed..."}
            {phase === "step2" && "Step 2: Generating Hash..."}
            {phase === "step3" && "Step 3: Calculating Index..."}
            {phase === "step4" && "Step 4: Selecting Winner..."}
            {phase === "reveal" && "🎉 Winner Selected! 🎉"}
          </h3>
          {phase === "idle" && (
            <p className="text-sm text-muted-foreground mt-1">
              Watch how the winner is randomly and fairly selected
            </p>
          )}
        </div>

        {/* Algorithm Steps Display */}
        {isAnimating && phase !== "step4" && phase !== "reveal" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-3"
          >
            {steps.slice(0, 3).map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === index + 1;
              const isComplete = currentStep > index + 1;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: currentStep >= index + 1 ? 1 : 0.3,
                    x: 0
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive 
                      ? "bg-primary/10 border-primary/50" 
                      : isComplete 
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? "bg-primary/20" 
                        : isComplete 
                          ? "bg-green-500/20"
                          : "bg-muted"
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${isActive ? "text-primary" : ""}`}>
                          {step.title}
                        </p>
                        {(isActive || isComplete) && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xs font-mono bg-background/80 px-2 py-1 rounded border border-border truncate max-w-[120px]"
                          >
                            {step.value}
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      className="mt-3 h-1 rounded-full bg-muted overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.4, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Name display slot machine style - only during step4 and reveal */}
        {(phase === "step4" || phase === "reveal") && (
          <div className="relative h-24 mb-6 overflow-hidden rounded-xl bg-background/80 backdrop-blur border border-border">
            {/* Gradient overlays for slot machine effect */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayedName + phase}
                  initial={{ y: -50, opacity: 0, scale: 0.8 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1, 
                    scale: phase === "reveal" ? 1.1 : 1 
                  }}
                  exit={{ y: 50, opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: phase === "step4" ? 0.05 : 0.3,
                    ease: "easeOut"
                  }}
                  className={`text-2xl md:text-3xl font-black text-center px-4 ${
                    phase === "reveal" 
                      ? "bg-gradient-to-r from-yellow-400 via-primary to-yellow-400 bg-clip-text text-transparent" 
                      : "text-foreground"
                  }`}
                >
                  {displayedName || "???"}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sparkle effects during reveal */}
            {phase === "reveal" && (
              <>
                <motion.div
                  className="absolute top-2 left-4"
                  animate={{ scale: [0, 1, 0], rotate: [0, 180] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <motion.div
                  className="absolute bottom-2 right-4"
                  animate={{ scale: [0, 1, 0], rotate: [0, -180] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <motion.div
                  className="absolute top-2 right-8"
                  animate={{ scale: [0, 1, 0], rotate: [0, 180] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </>
            )}
          </div>
        )}

        {/* Start button */}
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button 
              size="lg" 
              onClick={startAnimation}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Zap className="w-5 h-5" />
              Watch the Draw
            </Button>
            
            {/* Algorithm preview */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border text-left">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                How it works
              </p>
              <ol className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Pre-committed seed hash is revealed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>SHA256 generates verifiable draw hash</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Winner index = hash mod total entries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>Entry at calculated index wins!</span>
                </li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* Winner celebration */}
        {phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-2"
          >
            <p className="text-muted-foreground">
              Congratulations to our lucky winner!
            </p>
            <p className="text-xs text-muted-foreground">
              Entry #{winnerIndex + 1} of {totalEntries} was selected
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
