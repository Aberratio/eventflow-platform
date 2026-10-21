import * as React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── EventTable ────────────────────────────────────────────
   Kontener tabeli wydarzeń — ramka + podział wierszy.
   The header is optional — pass it as `header`.
   ──────────────────────────────────────────────────────── */

interface EventTableProps {
  /** Optional header row (any ReactNode) */
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const EventTable = React.forwardRef<HTMLDivElement, EventTableProps>(
  ({ header, children, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]',
        className,
      )}
    >
      {header && <div className="hidden border-b border-white/[0.08] md:block">{header}</div>}
      <div className="divide-y divide-white/[0.08]">{children}</div>
    </div>
  ),
);
EventTable.displayName = 'EventTable';

/* ─── EventTableRow ─────────────────────────────────────── */

interface EventTableRowProps {
  href: string;
  /** Date tile */
  dateTile: { day: string; month: string };
  title: string;
  /** Extra columns — each a `<div className="hidden md:block">` or `md:flex` */
  children?: React.ReactNode;
  /** Shortened mobile description */
  mobileMeta?: React.ReactNode;
  className?: string;
}

const EventTableRow = React.forwardRef<HTMLAnchorElement, EventTableRowProps>(
  ({ href, dateTile, title, children, mobileMeta, className }, ref) => (
    <Link
      ref={ref}
      to={href}
      className={cn(
        'group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] md:gap-4',
        className,
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded border border-white/10"
        style={{ backgroundColor: 'var(--page-bg-surface)' }}
      >
        <span className="text-base font-bold leading-none text-white">{dateTile.day}</span>
        <span className="mt-0.5 text-[9px] font-bold uppercase text-white/55">
          {dateTile.month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-bold text-white">{title}</div>
        {mobileMeta && <div className="mt-1 text-xs text-white/55 md:hidden">{mobileMeta}</div>}
      </div>

      {children}

      <ChevronRight className="h-4 w-4 shrink-0 text-white/55 transition group-hover:translate-x-0.5 group-hover:text-white/65" />
    </Link>
  ),
);
EventTableRow.displayName = 'EventTableRow';

export { EventTable, EventTableRow };
export type { EventTableProps, EventTableRowProps };
