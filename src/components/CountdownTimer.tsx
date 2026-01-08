import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endDate: Date;
  className?: string;
  showIcon?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ endDate, className = "", showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endDate.getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span>Ending soon</span>
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  // Always show seconds for a dynamic feel
  if (days > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span className="font-mono tabular-nums">
          {days}d {hours}h {minutes}m {seconds}s
        </span>
      </div>
    );
  }

  if (hours > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span className="font-mono tabular-nums">
          {hours}h {minutes}m {seconds}s
        </span>
      </div>
    );
  }

  // Under an hour - show urgency styling
  return (
    <div className={`flex items-center gap-2 text-destructive ${className}`}>
      {showIcon && <Clock className="w-4 h-4 animate-pulse" />}
      <span className="font-mono tabular-nums font-medium">
        {minutes}m {seconds}s
      </span>
    </div>
  );
}
