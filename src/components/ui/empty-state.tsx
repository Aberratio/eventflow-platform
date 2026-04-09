import * as React from 'react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

/* ─── EmptyState ───────────────────────────────────────
   Centered empty state block with icon, title, subtitle
   and optional CTA. Used inside pages when there's no data.
   ─────────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

const EmptyState = ({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) => (
  <div className={cn('mx-auto max-w-md space-y-6 text-center', className)}>
    <div
      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
      style={{
        background:
          'linear-gradient(to bottom right, hsl(var(--primary) / 0.1), hsl(var(--warning) / 0.1))',
      }}
    >
      {icon}
    </div>
    <h1 className="text-2xl font-bold">{title}</h1>
    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    {actionLabel && actionHref && (
      <Button asChild size="lg">
        <Link to={actionHref}>{actionLabel}</Link>
      </Button>
    )}
  </div>
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
