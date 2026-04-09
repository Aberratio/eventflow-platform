import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── PageSection ──────────────────────────────────────
   Wraps a content block with consistent vertical padding
   and optional muted background.
   ─────────────────────────────────────────────────────── */

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Add muted background */
  muted?: boolean;
  /** Use compact padding */
  compact?: boolean;
}

const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ muted = false, compact = false, className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        compact ? 'py-6 md:py-8' : 'py-10 md:py-14',
        muted && 'bg-muted/40',
        className,
      )}
      {...props}
    >
      <div className="container mx-auto px-4">{children}</div>
    </section>
  ),
);
PageSection.displayName = 'PageSection';

export { PageSection };
