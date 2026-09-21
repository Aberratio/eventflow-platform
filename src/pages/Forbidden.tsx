import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ErrorPageShell } from '@/components/ui/error-page-shell';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const Forbidden = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorPageShell tint="warning">
      {/* Barierka VIP z animacją */}
      <div className="relative">
        <div className="flex items-center justify-center gap-2">
          <div className="h-12 w-2 animate-tape-wave rounded bg-warning" />
          <div className="animate-pulse rounded border-2 border-dashed border-warning bg-warning/20 px-6 py-3">
            <span className="text-lg font-bold tracking-wider text-warning">🎫 STREFA VIP 🎫</span>
          </div>
          <div
            className="h-12 w-2 animate-tape-wave rounded bg-warning"
            style={{ animationDelay: '0.5s' }}
          />
        </div>
      </div>

      {/* Ochroniarz kręcący głową */}
      <div className="relative flex h-32 items-center justify-center">
        <div className="animate-shake-head text-7xl">🧑‍✈️</div>
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          <span className="animate-bounce text-2xl" style={{ animationDelay: '0s' }}>
            👎
          </span>
          <span className="animate-bounce text-2xl" style={{ animationDelay: '0.1s' }}>
            👎
          </span>
        </div>
      </div>

      {/* Migająca akredytacja */}
      <div className={cn('transition-all duration-700', showContent ? 'opacity-100' : 'opacity-0')}>
        <div className="inline-block animate-pulse rounded-lg border-2 border-destructive/50 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-12 items-center justify-center rounded bg-muted">
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
      <div
        className={cn(
          'space-y-4 transition-all delay-200 duration-700',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <h1 className="text-7xl font-bold text-warning md:text-8xl">403</h1>

        <p className="text-2xl font-bold text-foreground md:text-3xl">BRAK AKREDYTACJI!</p>

        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Hej, tu strefa VIP! Gdzie Twoja przepustka?
          </p>
          <p className="text-sm text-muted-foreground/70">
            Ochroniarz mówi NIE - brak uprawnień 🚫
          </p>
        </div>
      </div>

      {/* Przyciski */}
      <div
        className={cn(
          'flex flex-col justify-center gap-3 pt-4 transition-all delay-300 duration-700 sm:flex-row',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
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
      <div
        className={cn(
          'delay-400 rounded-lg border border-border bg-card p-4 transition-all duration-700',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <p className="text-sm text-muted-foreground">
          Nie masz jeszcze konta?{' '}
          <Link to="/rejestracja" className="font-medium text-primary hover:underline">
            Zarejestruj się
          </Link>{' '}
          i dołącz do zawodników!
        </p>
      </div>

      {/* Zabawny cytat */}
      <p className="pt-4 text-xs italic text-muted-foreground/50">
        "Ta strona jest tylko dla zwycięzców... ale Ty też możesz nim zostać!" 🏅
      </p>
    </ErrorPageShell>
  );
};

export default Forbidden;
