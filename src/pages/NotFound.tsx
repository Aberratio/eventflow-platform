import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedStopwatch, RunnerAnimation } from "@/components/errors";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();
  const [showRunner, setShowRunner] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 404 tracking — will be replaced by analytics integration
    
    // Sekwencja animacji
    const runnerTimer = setTimeout(() => setShowRunner(true), 300);
    const contentTimer = setTimeout(() => setShowContent(true), 600);
    
    return () => {
      clearTimeout(runnerTimer);
      clearTimeout(contentTimer);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        
        {/* Czerwona flaga z animacją */}
        <div className="relative">
          <div className="text-6xl animate-bounce">
            🚩
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            FALSTART!
          </div>
        </div>

        {/* Animowany stoper z DNF */}
        <div className={cn(
          "transition-all duration-700 transform",
          showRunner ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <AnimatedStopwatch status="dnf" />
        </div>

        {/* Animowany biegacz */}
        <div className="relative h-32 flex items-center justify-center">
          <div className={cn(
            "transition-all duration-1000 transform",
            showRunner ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          )}>
            <RunnerAnimation variant="confused" />
          </div>
          
          {/* Ślady stóp prowadzące donikąd */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 opacity-30">
            <span className="text-2xl rotate-45">👟</span>
            <span className="text-xl rotate-45 opacity-60">👟</span>
            <span className="text-lg rotate-45 opacity-30">👟</span>
          </div>
        </div>

        {/* Linia mety */}
        <div className="relative">
          <div className="h-2 w-64 mx-auto bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            ← linia mety →
          </div>
        </div>

        {/* Główna treść */}
        <div className={cn(
          "space-y-4 transition-all duration-700",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <h1 className="text-7xl md:text-8xl font-bold text-destructive animate-pulse">
            404
          </h1>
          
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              FALSTART!
            </p>
            <p className="text-muted-foreground text-lg">
              Wybiegłeś poza trasę... ta strona nie istnieje!
            </p>
            <p className="text-sm text-muted-foreground/70 font-mono">
              DNF - Did Not Find (nie znaleziono)
            </p>
          </div>
        </div>

        {/* Przycisk powrotu */}
        <div className={cn(
          "pt-4 transition-all duration-700 delay-300",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <span>🏠</span>
              <span>Wróć na start</span>
            </Link>
          </Button>
        </div>

        {/* Zabawny cytat */}
        <p className="text-xs text-muted-foreground/50 italic pt-4">
          "Nawet Usain Bolt czasem źle skręci..." 🏃‍♂️
        </p>
      </div>
    </div>
  );
};

export default NotFound;
