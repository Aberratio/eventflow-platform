import * as React from 'react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';

/* ─── AuthPageShell ────────────────────────────────────
   Shared wrapper for auth pages (login, register,
   forgot password, reset password). Provides gradient
   background, centered layout, icon + heading block.
   ─────────────────────────────────────────────────────── */

interface AuthPageShellProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Max width class (default max-w-lg) */
  maxWidth?: string;
  /** Override icon wrapper accent */
  accent?: 'primary' | 'success' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

const accentMap = {
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  destructive: 'bg-destructive/10',
} as const;

const AuthPageShell = ({
  icon,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  accent = 'primary',
  children,
  className,
}: AuthPageShellProps) => (
  <Layout>
    <div
      className="bg-gradient-to-b to-background"
      style={{
        backgroundImage:
          accent === 'destructive'
            ? 'linear-gradient(to bottom, hsl(var(--destructive) / 0.05), hsl(var(--background)))'
            : 'linear-gradient(to bottom, hsl(var(--primary) / 0.1), hsl(var(--background)))',
      }}
    >
      <div className="container py-12 md:py-20">
        <div className={cn('mx-auto', maxWidth, className)}>
          <div className="mb-8 text-center">
            <div
              className={cn(
                'mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl',
                accentMap[accent],
              )}
            >
              {icon}
            </div>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  </Layout>
);
AuthPageShell.displayName = 'AuthPageShell';

export { AuthPageShell };
