import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── InfoBanner ───────────────────────────────────────
   Subtle inline banner for contextual hints, tips,
   or non-critical messages inside forms/sections.
   ─────────────────────────────────────────────────────── */

interface InfoBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  variant?: 'muted' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  muted: 'bg-muted/50 text-muted-foreground',
  primary: 'bg-primary/5 text-muted-foreground border border-primary/20',
  success: 'bg-success/5 text-muted-foreground border border-success/20',
  warning: 'bg-warning/5 text-muted-foreground border border-warning/20',
} as const;

const InfoBanner = React.forwardRef<HTMLDivElement, InfoBannerProps>(
  ({ icon, variant = 'muted', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-lg p-3 text-sm',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {icon}
      <div>{children}</div>
    </div>
  ),
);
InfoBanner.displayName = 'InfoBanner';

export { InfoBanner };
