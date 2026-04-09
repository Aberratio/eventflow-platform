import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedStopwatch, GlitchText, SparkEffect } from '@/components/errors';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const ServerError = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-destructive/5 p-4">
      <div className="mx-auto max-w-md space-y-8 text-center">
        {/* Zepsuty stoper z iskrami */}
        <div className="relative">
          <AnimatedStopwatch status="error" className="relative z-10" />
          <SparkEffect intensity="high" />
        </div>

        {/* Glitchujący numer błędu */}
        <div
          className={cn('transition-all duration-700', showContent ? 'opacity-100' : 'opacity-0')}
        >
          <GlitchText className="text-7xl text-destructive md:text-8xl" intensity="high">
            500
          </GlitchText>
        </div>

        {/* Technik biegnący na ratunek */}
        <div className="relative flex h-20 items-center justify-center">
          <div className="flex animate-bounce items-center gap-2 text-4xl">
            <span>🔧</span>
            <span className="animate-runner">🏃</span>
          </div>
          <div className="absolute -bottom-2 animate-pulse text-xs text-muted-foreground">
            technik już biegnie...
          </div>
        </div>

        {/* Główna treść */}
        <div
          className={cn(
            'space-y-4 transition-all delay-200 duration-700',
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <p className="text-2xl font-bold text-foreground md:text-3xl">AWARIA SYSTEMU!</p>

          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">Nasz stoper się zaciął...</p>
            <p className="text-sm text-muted-foreground/70">
              Houston, mamy problem z pomiarem czasu! 🚀
            </p>
          </div>

          {/* Symulowany log błędu */}
          <div className="overflow-hidden rounded-lg border border-border bg-card p-3 text-left font-mono text-xs">
            <div className="animate-pulse text-destructive">ERROR: SYSTEM_MALFUNCTION</div>
            <div className="text-muted-foreground">at TimingSystem.measure()</div>
            <div className="text-muted-foreground">at StopWatch.start()</div>
            <div className="text-muted-foreground/50">... ktoś potknął się o kabel 🔌</div>
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
        <p className="pt-4 text-xs italic text-muted-foreground/50">
          "Nawet najlepszy stoper czasem potrzebuje resetu..." ⏱️
        </p>
      </div>
    </div>
  );
};

export default ServerError;
