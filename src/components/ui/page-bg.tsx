import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── PageBg ────────────────────────────────────────────────
   Ciemne tło strony z opcjonalnymi nakładkami gradientowymi.
   Używaj jako wrappera dla pełnoekranowych stron (np. strona
   główna, strona wydarzeń). Fixowane nakładki tworzą głębię
   bez zwiększania rozmiaru DOM.
   ──────────────────────────────────────────────────────── */

interface PageBgProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nakładka z niebieskimi radial gradientami w rogach */
  glows?: boolean;
  /** Nakładka przyciemniająca dół strony */
  fade?: boolean;
}

const PageBg = React.forwardRef<HTMLDivElement, PageBgProps>(
  ({ glows = true, fade = true, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('min-h-screen text-white', className)}
      style={{ backgroundColor: 'var(--page-bg)' }}
      {...props}
    >
      {glows && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'var(--overlay-gradient-blue)' }}
        />
      )}
      {fade && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'var(--overlay-gradient-fade)' }}
        />
      )}
      {children}
    </div>
  ),
);
PageBg.displayName = 'PageBg';

/* ─── PageContent ───────────────────────────────────────────
   Kontener treści wewnątrz PageBg — centruje i limituje
   szerokość. Używa `relative` żeby był nad nakładkami.
   ──────────────────────────────────────────────────────── */

interface PageContentProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  maxWidth?: string;
}

const PageContent = React.forwardRef<HTMLElement, PageContentProps>(
  ({ as: Tag = 'main', maxWidth = '1200px', className, children, style, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn('relative mx-auto w-full px-4 pb-10 sm:px-6 lg:px-8', className)}
      style={{ maxWidth, ...style }}
      {...props}
    >
      {children}
    </Tag>
  ),
);
PageContent.displayName = 'PageContent';

export { PageBg, PageContent };
export type { PageBgProps, PageContentProps };
