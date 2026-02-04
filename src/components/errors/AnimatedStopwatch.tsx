import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedStopwatchProps {
  status: "dnf" | "error" | "paused" | "running";
  className?: string;
}

export const AnimatedStopwatch = ({ status, className }: AnimatedStopwatchProps) => {
  const [digits, setDigits] = useState(["8", "8", ":", "8", "8", ".", "8", "8", "8"]);
  
  useEffect(() => {
    if (status === "error") {
      const interval = setInterval(() => {
        setDigits(prev => prev.map(() => 
          Math.random() > 0.3 ? String(Math.floor(Math.random() * 10)) : "8"
        ));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getDisplayText = () => {
    if (status === "dnf") return "DNF";
    if (status === "error") return "ERR";
    if (status === "paused") return "---";
    return "RUN";
  };

  const getTimeDisplay = () => {
    if (status === "dnf") return "--:--.---";
    if (status === "paused") return "--:--.---";
    if (status === "error") {
      return digits.join("");
    }
    return "00:00.000";
  };

  return (
    <div 
      className={cn(
        "relative bg-card border-2 border-border rounded-xl p-6 shadow-lg",
        status === "error" && "animate-stopwatch-pulse",
        className
      )}
    >
      {/* Stoper header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="text-3xl">⏱️</div>
        <span 
          className={cn(
            "text-sm font-mono font-bold tracking-wider px-2 py-1 rounded",
            status === "dnf" && "bg-destructive/20 text-destructive",
            status === "error" && "bg-destructive/20 text-destructive animate-blink",
            status === "paused" && "bg-muted text-muted-foreground",
            status === "running" && "bg-primary/20 text-primary"
          )}
        >
          {getDisplayText()}
        </span>
      </div>

      {/* Czas */}
      <div 
        className={cn(
          "font-mono text-4xl md:text-5xl font-bold text-center tracking-wider",
          status === "error" && "animate-glitch text-destructive",
          status === "dnf" && "text-muted-foreground"
        )}
      >
        {getTimeDisplay()}
      </div>

      {/* Dekoracje dla błędu */}
      {status === "error" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 text-lg">
          <span className="animate-spark" style={{ animationDelay: "0s" }}>⚡</span>
          <span className="animate-spark" style={{ animationDelay: "0.2s" }}>💥</span>
          <span className="animate-spark" style={{ animationDelay: "0.4s" }}>⚡</span>
        </div>
      )}

      {/* Cień świecący dla błędu */}
      {status === "error" && (
        <div className="absolute inset-0 rounded-xl bg-destructive/5 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
