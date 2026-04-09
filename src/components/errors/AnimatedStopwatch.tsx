import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AnimatedStopwatchProps {
  status: 'dnf' | 'error' | 'paused' | 'running';
  className?: string;
}

export const AnimatedStopwatch = ({ status, className }: AnimatedStopwatchProps) => {
  const [digits, setDigits] = useState(['8', '8', ':', '8', '8', '.', '8', '8', '8']);

  useEffect(() => {
    if (status === 'error') {
      const interval = setInterval(() => {
        setDigits((prev) =>
          prev.map(() => (Math.random() > 0.3 ? String(Math.floor(Math.random() * 10)) : '8')),
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getDisplayText = () => {
    if (status === 'dnf') return 'DNF';
    if (status === 'error') return 'ERR';
    if (status === 'paused') return '---';
    return 'RUN';
  };

  const getTimeDisplay = () => {
    if (status === 'dnf') return '--:--.---';
    if (status === 'paused') return '--:--.---';
    if (status === 'error') {
      return digits.join('');
    }
    return '00:00.000';
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-border bg-card p-6 shadow-lg',
        status === 'error' && 'animate-stopwatch-pulse',
        className,
      )}
    >
      {/* Stoper header */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="text-3xl">⏱️</div>
        <span
          className={cn(
            'rounded px-2 py-1 font-mono text-sm font-bold tracking-wider',
            status === 'dnf' && 'bg-destructive/20 text-destructive',
            status === 'error' && 'animate-blink bg-destructive/20 text-destructive',
            status === 'paused' && 'bg-muted text-muted-foreground',
            status === 'running' && 'bg-primary/20 text-primary',
          )}
        >
          {getDisplayText()}
        </span>
      </div>

      {/* Czas */}
      <div
        className={cn(
          'text-center font-mono text-4xl font-bold tracking-wider md:text-5xl',
          status === 'error' && 'animate-glitch text-destructive',
          status === 'dnf' && 'text-muted-foreground',
        )}
      >
        {getTimeDisplay()}
      </div>

      {/* Dekoracje dla błędu */}
      {status === 'error' && (
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1 text-lg">
          <span className="animate-spark" style={{ animationDelay: '0s' }}>
            ⚡
          </span>
          <span className="animate-spark" style={{ animationDelay: '0.2s' }}>
            💥
          </span>
          <span className="animate-spark" style={{ animationDelay: '0.4s' }}>
            ⚡
          </span>
        </div>
      )}

      {/* Cień świecący dla błędu */}
      {status === 'error' && (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-destructive/5" />
      )}
    </div>
  );
};
