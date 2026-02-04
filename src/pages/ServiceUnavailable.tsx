import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedStopwatch } from "@/components/errors";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const ServiceUnavailable = () => {
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Symulowany countdown
  useEffect(() => {
    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-info/5 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        
        {/* Znak STOP z animacją */}
        <div className="relative">
          <div className="text-6xl animate-pulse">
            🛑
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground text-xs font-bold px-3 py-1 rounded-full animate-blink">
            PRZERWA
          </div>
        </div>

        {/* Stoper w trybie pauzy */}
        <div className={cn(
          "transition-all duration-700",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <AnimatedStopwatch status="paused" />
        </div>

        {/* Butelka wody - nawadnianie */}
        <div className="relative h-24 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <span className="text-5xl animate-water-drink">🍶</span>
            <span className="text-4xl animate-float">💧</span>
            <span className="text-3xl animate-float" style={{ animationDelay: "0.5s" }}>💧</span>
          </div>
        </div>

        {/* Główna treść */}
        <div className={cn(
          "space-y-4 transition-all duration-700 delay-200",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <h1 className="text-7xl md:text-8xl font-bold text-info">
            503
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            PRZERWA TECHNICZNA
          </p>
          
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              Zawody chwilowo wstrzymane
            </p>
            <p className="text-sm text-muted-foreground/70">
              Uzupełniamy płyny... wróć za chwilę! 🏃‍♂️💦
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Wznowienie za:
            </p>
            <div className="font-mono text-3xl font-bold text-primary">
              00:{countdown.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Przyciski */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 justify-center pt-4 transition-all duration-700 delay-300",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <Button 
            onClick={() => window.location.reload()} 
            size="lg" 
            className="gap-2"
          >
            <span>🔄</span>
            <span>Odśwież stronę</span>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/">
              <span>🏠</span>
              <span>Strona główna</span>
            </Link>
          </Button>
        </div>

        {/* Zabawny cytat */}
        <p className="text-xs text-muted-foreground/50 italic pt-4">
          "Nawet serwery potrzebują przerwy na wodę... Wrócimy szybciej niż Usain Bolt!" 🏆
        </p>
      </div>
    </div>
  );
};

export default ServiceUnavailable;
