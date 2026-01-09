import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface DrawAnimationProps {
  entries: string[];
  winnerName: string;
  onComplete?: () => void;
  autoPlay?: boolean;
}

export function DrawAnimation({ 
  entries, 
  winnerName, 
  onComplete,
  autoPlay = false 
}: DrawAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "fast" | "slowing" | "reveal">("idle");
  const [displayedName, setDisplayedName] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number>(0);

  // Create a pool of display names (mix of entries and placeholder names)
  const displayNames = entries.length > 0 ? entries : [
    "Player_1234", "LuckyWinner", "RaffleKing", "StarPlayer", 
    "GoldenTicket", "WinnerCircle", "TopEntry", "DrawMaster",
    "PrizeHunter", "RaffleStar", "LuckyDraw", "BigWinner"
  ];

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
    setPhase("fast");
    animationRef.current = 0;

    // Fast phase - rapid cycling
    let speed = 50;
    let iterations = 0;
    const maxFastIterations = 30;
    const maxSlowIterations = 20;

    const animate = () => {
      iterations++;
      setCurrentIndex(prev => (prev + 1) % displayNames.length);
      setDisplayedName(displayNames[Math.floor(Math.random() * displayNames.length)]);

      if (iterations < maxFastIterations) {
        // Fast phase
        intervalRef.current = setTimeout(animate, speed);
      } else if (iterations < maxFastIterations + maxSlowIterations) {
        // Slowing phase
        setPhase("slowing");
        speed = speed + (iterations - maxFastIterations) * 15;
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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border border-primary/30 p-8">
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
            animate={isAnimating ? { 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            } : {}}
            transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}
          >
            {phase === "reveal" ? (
              <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
            ) : (
              <Zap className={`w-12 h-12 mx-auto mb-2 ${isAnimating ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </motion.div>
          <h3 className="text-xl font-bold">
            {phase === "idle" && "Ready to Draw"}
            {phase === "fast" && "Drawing..."}
            {phase === "slowing" && "Almost there..."}
            {phase === "reveal" && "🎉 Winner! 🎉"}
          </h3>
        </div>

        {/* Name display slot machine style */}
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
                  duration: phase === "fast" ? 0.05 : phase === "slowing" ? 0.15 : 0.3,
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

        {/* Progress indicator */}
        {isAnimating && phase !== "reveal" && (
          <div className="mb-6">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: "0%" }}
                animate={{ 
                  width: phase === "fast" ? "60%" : "95%"
                }}
                transition={{ 
                  duration: phase === "fast" ? 1.5 : 2,
                  ease: "easeOut"
                }}
              />
            </div>
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
          </motion.div>
        )}

        {/* Winner celebration */}
        {phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-muted-foreground">
              Congratulations to our lucky winner!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
