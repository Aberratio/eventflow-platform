import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Spark {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
}

interface SparkEffectProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

const sparkEmojis = ["⚡", "✨", "💥", "🔥", "⭐"];

export const SparkEffect = ({ className, intensity = "medium" }: SparkEffectProps) => {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const sparkCount = intensity === "low" ? 3 : intensity === "medium" ? 5 : 8;

  useEffect(() => {
    const generateSparks = () => {
      const newSparks: Spark[] = [];
      for (let i = 0; i < sparkCount; i++) {
        newSparks.push({
          id: Date.now() + i,
          x: Math.random() * 80 + 10, // 10-90%
          y: Math.random() * 40 + 30, // 30-70%
          emoji: sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)],
          delay: Math.random() * 0.5
        });
      }
      setSparks(newSparks);
    };

    generateSparks();
    const interval = setInterval(generateSparks, 800);
    
    return () => clearInterval(interval);
  }, [sparkCount]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="absolute text-lg animate-spark"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            animationDelay: `${spark.delay}s`
          }}
        >
          {spark.emoji}
        </span>
      ))}
    </div>
  );
};
