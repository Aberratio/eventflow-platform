import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── GradientDivider ──────────────────────────────────
   Thin horizontal bar with the brand accent gradient.
   Used at the top of highlighted cards and sections.
   ─────────────────────────────────────────────────────── */

interface GradientDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Height in pixels (default 4 = h-1) */
  size?: 'sm' | 'md';
}

const GradientDivider = React.forwardRef<HTMLDivElement, GradientDividerProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(size === 'sm' ? 'h-0.5' : 'h-1', className)}
      style={{ background: 'var(--gradient-accent-bar)' }}
      {...props}
    />
  ),
);
GradientDivider.displayName = 'GradientDivider';

export { GradientDivider };
