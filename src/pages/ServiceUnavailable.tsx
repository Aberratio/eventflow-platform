import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedStopwatch } from '@/components/errors';
import { ErrorPageShell } from '@/components/ui/error-page-shell';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

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
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdown]);

  return (
    <ErrorPageShell tint="info">
      {/* STOP sign with animation */}
      <div className="relative">
        <div className="animate-pulse text-6xl">🛑</div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-blink rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-foreground">
          PRZERWA
        </div>
      </div>

      {/* Stoper w trybie pauzy */}
      <div
        className={cn(
          'transition-all duration-700',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <AnimatedStopwatch status="paused" />
      </div>

      {/* Butelka wody - nawadnianie */}
      <div className="relative flex h-24 items-center justify-center">
        <div className="flex items-center gap-4">
          <span className="animate-water-drink text-5xl">🍶</span>
          <span className="animate-float text-4xl">💧</span>
          <span className="animate-float text-3xl" style={{ animationDelay: '0.5s' }}>
            💧
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'space-y-4 transition-all delay-200 duration-700',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <h1 className="text-7xl font-bold text-info md:text-8xl">503</h1>

        <p className="text-2xl font-bold text-foreground md:text-3xl">PRZERWA TECHNICZNA</p>

        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">Zawody chwilowo wstrzymane</p>
          <p className="text-sm text-muted-foreground/70">
            Uzupełniamy płyny... wróć za chwilę! 🏃‍♂️💦
          </p>
        </div>

        {/* Countdown */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm text-muted-foreground">Wznowienie za:</p>
          <div className="font-mono text-3xl font-bold text-primary">
            00:{countdown.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Przyciski */}
      <div
        className={cn(
          'flex flex-col justify-center gap-3 pt-4 transition-all delay-300 duration-700 sm:flex-row',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <Button onClick={() => window.location.reload()} size="lg" className="gap-2">
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
      <p className="pt-4 text-xs italic text-muted-foreground/50">
        "Nawet serwery potrzebują przerwy na wodę... Wrócimy szybciej niż Usain Bolt!" 🏆
      </p>
    </ErrorPageShell>
  );
};

export default ServiceUnavailable;
