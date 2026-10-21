import { cn } from '@/lib/utils';

interface RunnerAnimationProps {
  className?: string;
  variant?: 'running' | 'stopped' | 'confused';
}

export const RunnerAnimation = ({ className, variant = 'running' }: RunnerAnimationProps) => {
  return (
    <div className={cn('relative', className)}>
      {/* Biegacz SVG */}
      <svg
        viewBox="0 0 100 100"
        className={cn('h-24 w-24 md:h-32 md:w-32', variant === 'running' && 'animate-runner')}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle cx="50" cy="20" r="10" className="fill-primary" />

        {/* Body */}
        <line
          x1="50"
          y1="30"
          x2="50"
          y2="55"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Arms */}
        <g className={variant === 'running' ? 'animate-runner-legs' : ''}>
          <line
            x1="50"
            y1="35"
            x2="35"
            y2="50"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="35"
            x2="65"
            y2="45"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Nogi */}
        <g
          className={variant === 'running' ? 'animate-runner-legs' : ''}
          style={{ transformOrigin: '50px 55px' }}
        >
          <line
            x1="50"
            y1="55"
            x2="35"
            y2="80"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="55"
            x2="65"
            y2="75"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Stopy */}
        <ellipse cx="35" cy="82" rx="5" ry="3" className="fill-primary" />
        <ellipse cx="65" cy="77" rx="5" ry="3" className="fill-primary" />
      </svg>

      {/* Chmurka kurzu */}
      {variant === 'running' && (
        <div className="absolute -right-4 bottom-4 animate-pulse text-2xl opacity-60">💨</div>
      )}

      {/* Question mark for the confused runner */}
      {variant === 'confused' && (
        <div className="absolute -right-2 -top-2 animate-bounce text-2xl">❓</div>
      )}

      {/* Stop sign for the stopped runner */}
      {variant === 'stopped' && (
        <div className="absolute -right-2 -top-2 animate-pulse text-2xl">🛑</div>
      )}
    </div>
  );
};
