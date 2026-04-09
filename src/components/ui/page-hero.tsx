import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── PageHero ──────────────────────────────────────────
   Full-width hero banner used at the top of list/detail pages.
   Provides gradient background, optional radial glow, and
   consistent vertical rhythm.
   ─────────────────────────────────────────────────────── */

interface PageHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use alternative (warm) gradient direction */
  variant?: 'default' | 'warm';
  /** Render the radial glow overlay */
  glow?: boolean;
  /** Remove bottom border */
  borderless?: boolean;
}

const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  ({ className, variant = 'default', glow = false, borderless = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        !borderless && 'border-b border-border/50',
        className,
      )}
      style={{
        background:
          variant === 'warm'
            ? 'var(--gradient-page-hero-alt)'
            : 'var(--gradient-page-hero)',
      }}
      {...props}
    >
      {glow && (
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-radial-glow)' }}
        />
      )}
      <div className="container relative py-[var(--page-hero-py)] md:py-[var(--page-hero-py-md)]">
        {children}
      </div>
    </div>
  ),
);
PageHero.displayName = 'PageHero';

/* ─── PageHeroTitle ────────────────────────────────────
   Icon + title + optional subtitle block inside PageHero.
   ─────────────────────────────────────────────────────── */

interface PageHeroTitleProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  /** Accent color for the icon wrapper */
  accent?: 'primary' | 'warning' | 'success' | 'info';
}

const accentMap = {
  primary: 'border-primary/20 bg-primary/15 text-primary',
  warning: 'border-warning/20 bg-warning/15 text-warning',
  success: 'border-success/20 bg-success/15 text-success',
  info: 'border-info/20 bg-info/15 text-info',
} as const;

const PageHeroTitle = ({
  icon,
  title,
  subtitle,
  children,
  className,
  accent = 'primary',
}: PageHeroTitleProps) => (
  <div className={cn('mb-2 flex items-center gap-3', className)}>
    {icon && (
      <div className={cn('rounded-xl border p-2.5', accentMap[accent])}>
        {icon}
      </div>
    )}
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </div>
  </div>
);
PageHeroTitle.displayName = 'PageHeroTitle';

export { PageHero, PageHeroTitle };
