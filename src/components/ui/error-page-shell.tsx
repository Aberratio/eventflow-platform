import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── ErrorPageShell ───────────────────────────────────
   Full-screen centered layout for error pages (404, 403,
   500, 503). Provides a subtle gradient tinted by the
   error's semantic color.
   ─────────────────────────────────────────────────────── */

interface ErrorPageShellProps {
  /** Semantic tint applied to the bottom gradient */
  tint?: 'muted' | 'destructive' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const tintGradients = {
  muted: 'to-muted',
  destructive: 'to-destructive/5',
  warning: 'to-warning/5',
  info: 'to-info/5',
} as const;

const ErrorPageShell = ({ tint = 'muted', children, className }: ErrorPageShellProps) => (
  <div
    className={cn(
      'flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background p-4',
      tintGradients[tint],
      className,
    )}
  >
    <div className="mx-auto max-w-md space-y-8 text-center">{children}</div>
  </div>
);
ErrorPageShell.displayName = 'ErrorPageShell';

export { ErrorPageShell };
