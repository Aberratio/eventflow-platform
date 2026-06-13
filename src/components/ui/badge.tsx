import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/60',
  {
    variants: {
      variant: {
        default: 'border border-primary/40 bg-primary text-primary-foreground',
        secondary:
          'border border-[color:var(--glass-border)] bg-[var(--glass-bg-hover)] text-muted-foreground',
        destructive:
          'border border-destructive/30 bg-destructive/15 text-destructive',
        outline: 'border border-[color:var(--glass-border-strong)] text-muted-foreground',
        muted: 'border border-border/60 bg-[var(--glass-bg)] text-muted-foreground',
        accent: 'border border-primary/25 bg-primary/10 text-[hsl(var(--primary-glow))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
