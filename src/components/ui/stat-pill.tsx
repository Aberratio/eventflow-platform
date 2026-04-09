import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── StatPill ─────────────────────────────────────────
   Small inline pill showing an icon + label, used inside
   hero banners for quick stats.
   ─────────────────────────────────────────────────────── */

interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
}

const StatPill = React.forwardRef<HTMLDivElement, StatPillProps>(
  ({ icon, label, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 text-sm',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="text-muted-foreground">{label}</span>
    </div>
  ),
);
StatPill.displayName = 'StatPill';

export { StatPill };
