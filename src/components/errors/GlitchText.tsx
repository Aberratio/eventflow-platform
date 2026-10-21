import { cn } from '@/lib/utils';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlitchText = ({ children, className, intensity = 'medium' }: GlitchTextProps) => {
  return (
    <div className={cn('relative inline-block', className)}>
      {/* Main text */}
      <span className={cn('relative z-10 font-bold', intensity === 'high' && 'animate-glitch')}>
        {children}
      </span>

      {/* Warstwa glitch - czerwona */}
      <span
        className={cn(
          'absolute inset-0 font-bold text-destructive opacity-70',
          intensity === 'low' && 'animate-glitch',
          intensity === 'medium' && 'animate-glitch',
          intensity === 'high' && 'animate-glitch',
        )}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
          transform: 'translate(-2px, 0)',
        }}
        aria-hidden="true"
      >
        {children}
      </span>

      {/* Glitch layer - dark (brand colour, offset) */}
      <span
        className={cn('absolute inset-0 animate-glitch-skew font-bold text-foreground opacity-40')}
        style={{
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
          transform: 'translate(2px, 0)',
        }}
        aria-hidden="true"
      >
        {children}
      </span>
    </div>
  );
};
