import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Eyebrow ──────────────────────────────────────────
   Small pill label placed above a heading to categorize
   or add context (e.g. "Informacje", "Platforma sportowa").
   ─────────────────────────────────────────────────────── */

interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  /** Accent color */
  accent?: 'primary' | 'warning' | 'success';
}

const accentStyles = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
} as const;

const Eyebrow = React.forwardRef<HTMLDivElement, EyebrowProps>(
  ({ icon, accent = 'primary', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
        accentStyles[accent],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </div>
  ),
);
Eyebrow.displayName = 'Eyebrow';

export { Eyebrow };
