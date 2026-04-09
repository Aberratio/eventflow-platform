import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedStopwatch, RunnerAnimation } from '@/components/errors';
import { ErrorPageShell } from '@/components/ui/error-page-shell';
import { cn } from '@/lib/utils';

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
    <ErrorPageShell tint="muted">
        {/* Czerwona flaga z animacją */}
        <div className="relative">
          <div className="animate-bounce text-6xl">🚩</div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
            FALSTART!
          </div>
        </div>

        {/* Animowany stoper z DNF */}
        <div
          className={cn(
            'transform transition-all duration-700',
            showRunner ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <AnimatedStopwatch status="dnf" />
        </div>

        {/* Animowany biegacz */}
        <div className="relative flex h-32 items-center justify-center">
          <div
            className={cn(
              'transform transition-all duration-1000',
              showRunner ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
            )}
          >
            <RunnerAnimation variant="confused" />
          </div>

          {/* Ślady stóp prowadzące donikąd */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 opacity-30">
            <span className="rotate-45 text-2xl">👟</span>
            <span className="rotate-45 text-xl opacity-60">👟</span>
            <span className="rotate-45 text-lg opacity-30">👟</span>
          </div>
        </div>

        {/* Linia mety */}
        <div className="relative">
          <div className="mx-auto h-2 w-64 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            ← linia mety →
          </div>
        </div>

        {/* Główna treść */}
        <div
          className={cn(
            'space-y-4 transition-all duration-700',
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <h1 className="animate-pulse text-7xl font-bold text-destructive md:text-8xl">404</h1>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground md:text-3xl">FALSTART!</p>
            <p className="text-lg text-muted-foreground">
              Wybiegłeś poza trasę... ta strona nie istnieje!
            </p>
            <p className="font-mono text-sm text-muted-foreground/70">
              DNF - Did Not Find (nie znaleziono)
            </p>
          </div>
        </div>

        {/* Przycisk powrotu */}
        <div
          className={cn(
            'pt-4 transition-all delay-300 duration-700',
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <span>🏠</span>
              <span>Wróć na start</span>
            </Link>
          </Button>
        </div>

        {/* Zabawny cytat */}
        <p className="pt-4 text-xs italic text-muted-foreground/50">
          "Nawet Usain Bolt czasem źle skręci..." 🏃‍♂️
        </p>
    </ErrorPageShell>
  );
};

export default NotFound;
