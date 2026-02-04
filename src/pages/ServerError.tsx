import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedStopwatch, GlitchText, SparkEffect } from "@/components/errors";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const ServerError = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        
        {/* Zepsuty stoper z iskrami */}
        <div className="relative">
          <AnimatedStopwatch status="error" className="relative z-10" />
          <SparkEffect intensity="high" />
        </div>

        {/* Glitchujący numer błędu */}
        <div className={cn(
          "transition-all duration-700",
          showContent ? "opacity-100" : "opacity-0"
        )}>
          <GlitchText 
            className="text-7xl md:text-8xl text-destructive" 
            intensity="high"
          >
            500
          </GlitchText>
        </div>

        {/* Technik biegnący na ratunek */}
        <div className="relative h-20 flex items-center justify-center">
          <div className="flex items-center gap-2 text-4xl animate-bounce">
            <span>🔧</span>
            <span className="animate-runner">🏃</span>
          </div>
          <div className="absolute -bottom-2 text-xs text-muted-foreground animate-pulse">
            technik już biegnie...
          </div>
        </div>

        {/* Główna treść */}
        <div className={cn(
          "space-y-4 transition-all duration-700 delay-200",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            AWARIA SYSTEMU!
          </p>
          
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              Nasz stoper się zaciął... 
            </p>
            <p className="text-sm text-muted-foreground/70">
              Houston, mamy problem z pomiarem czasu! 🚀
            </p>
          </div>

          {/* Symulowany log błędu */}
          <div className="bg-card border border-border rounded-lg p-3 font-mono text-xs text-left overflow-hidden">
            <div className="text-destructive animate-pulse">ERROR: SYSTEM_MALFUNCTION</div>
            <div className="text-muted-foreground">at TimingSystem.measure()</div>
            <div className="text-muted-foreground">at StopWatch.start()</div>
            <div className="text-muted-foreground/50">... ktoś potknął się o kabel 🔌</div>
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
            <span>Spróbuj ponownie</span>
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
          "Nawet najlepszy stoper czasem potrzebuje resetu..." ⏱️
        </p>
      </div>
    </div>
  );
};

export default ServerError;
