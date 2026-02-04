import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const Forbidden = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-warning/5 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        
        {/* Barierka VIP z animacją */}
        <div className="relative">
          <div className="flex items-center justify-center gap-2">
            <div className="h-12 w-2 bg-warning rounded animate-tape-wave" />
            <div className="bg-warning/20 border-2 border-warning border-dashed px-6 py-3 rounded animate-pulse">
              <span className="text-warning font-bold text-lg tracking-wider">
                🎫 STREFA VIP 🎫
              </span>
            </div>
            <div className="h-12 w-2 bg-warning rounded animate-tape-wave" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Ochroniarz kręcący głową */}
        <div className="relative h-32 flex items-center justify-center">
          <div className="text-7xl animate-shake-head">
            🧑‍✈️
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0s" }}>👎</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>👎</span>
          </div>
        </div>

        {/* Migająca akredytacja */}
        <div className={cn(
          "transition-all duration-700",
          showContent ? "opacity-100" : "opacity-0"
        )}>
          <div className="inline-block bg-card border-2 border-destructive/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">AKREDYTACJA</div>
                <div className="font-bold text-destructive">BRAK</div>
                <div className="text-xs text-muted-foreground/70">ID: ???</div>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>
        </div>

        {/* Główna treść */}
        <div className={cn(
          "space-y-4 transition-all duration-700 delay-200",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <h1 className="text-7xl md:text-8xl font-bold text-warning">
            403
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            BRAK AKREDYTACJI!
          </p>
          
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              Hej, tu strefa VIP! Gdzie Twoja przepustka?
            </p>
            <p className="text-sm text-muted-foreground/70">
              Ochroniarz mówi NIE - brak uprawnień 🚫
            </p>
          </div>
        </div>

        {/* Przyciski */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 justify-center pt-4 transition-all duration-700 delay-300",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <Button asChild size="lg" className="gap-2">
            <Link to="/logowanie">
              <span>🔑</span>
              <span>Zaloguj się</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/">
              <span>🏠</span>
              <span>Strona główna</span>
            </Link>
          </Button>
        </div>

        {/* Info o rejestracji */}
        <div className={cn(
          "bg-card border border-border rounded-lg p-4 transition-all duration-700 delay-400",
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze konta?{" "}
            <Link to="/rejestracja" className="text-primary hover:underline font-medium">
              Zarejestruj się
            </Link>
            {" "}i dołącz do zawodników!
          </p>
        </div>

        {/* Zabawny cytat */}
        <p className="text-xs text-muted-foreground/50 italic pt-4">
          "Ta strona jest tylko dla zwycięzców... ale Ty też możesz nim zostać!" 🏅
        </p>
      </div>
    </div>
  );
};

export default Forbidden;
