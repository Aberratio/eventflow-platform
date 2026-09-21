import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── SectionHeading ───────────────────────────────────
   Heading block for content sections with a left accent bar.
   Used on homepage, dashboard sections, and list pages.
   ─────────────────────────────────────────────────────── */

interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  /** Color of the accent bar */
  accent?: 'primary' | 'warning' | 'success';
  /** Right-side slot (e.g. "View all" button) */
  action?: React.ReactNode;
  /** Additional content inline with title (e.g. Badge) */
  badge?: React.ReactNode;
}

const barColorMap = {
  primary: 'bg-primary',
  warning: 'bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.3)]',
  success: 'bg-success',
} as const;

const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ title, subtitle, accent = 'primary', action, badge, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-6 flex items-center justify-between', className)} {...props}>
      <div className="flex items-center gap-3">
        <div className={cn('h-8 w-1 shrink-0 rounded-full', barColorMap[accent])} />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold leading-tight md:text-2xl">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  ),
);
SectionHeading.displayName = 'SectionHeading';

export { SectionHeading };
