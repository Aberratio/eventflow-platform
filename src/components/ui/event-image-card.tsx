import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── EventImageCard ───────────────────────────────────────
   Karta wydarzenia z obrazem w tle. Używana w sekcjach
   "Kończą się zapisy" (mode=closing) i "Ostatnio zakończone"
   (mode=finished). Kolor akcentu dostosowuje się do trybu.
   ──────────────────────────────────────────────────────── */

interface EventImageCardProps {
  href: string;
  imageSrc: string;
  imageAlt?: string;
  title: string;
  /** Wariant: closing = orange, finished = emerald */
  mode: 'closing' | 'finished';
  /** Etykieta na obrazku (np. "Kończy się za 2 dni") */
  imageLabel?: string;
  /** Slot na metadane pod tytułem (np. EventMeta) */
  meta?: React.ReactNode;
  /** Dodatkowe info (cena, miejsca) — widoczne tylko w mode=closing */
  footer?: React.ReactNode;
  buttonLabel?: string;
  className?: string;
}

const EventImageCard = React.forwardRef<HTMLAnchorElement, EventImageCardProps>(
  (
    {
      href,
      imageSrc,
      imageAlt = '',
      title,
      mode,
      imageLabel,
      meta,
      footer,
      buttonLabel,
      className,
    },
    ref,
  ) => {
    const isClosing = mode === 'closing';
    const borderHover = isClosing ? 'hover:border-orange-500/40' : 'hover:border-emerald-500/40';
    const btnBorder = isClosing
      ? 'border-orange-500/60 group-hover:bg-orange-500/10'
      : 'border-emerald-500/60 group-hover:bg-emerald-500/10';
    const defaultLabel = isClosing ? 'Zapisz się' : 'Zobacz wyniki';

    return (
      <Link
        ref={ref}
        to={href}
        className={cn(
          'group overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] transition hover:bg-white/[0.04]',
          borderHover,
          className,
        )}
      >
        <div className="relative h-44 overflow-hidden bg-black">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-cover opacity-[0.62] transition duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'var(--overlay-card-fade-light)' }}
          />
          {imageLabel && (
            <span className="absolute left-3 top-3 rounded bg-black/75 px-2.5 py-1.5 text-[10px] font-extrabold uppercase leading-tight text-orange-400">
              {imageLabel}
            </span>
          )}
        </div>

        <div className="p-4 pt-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-white">
            {title}
          </h3>

          {meta && <div className="mt-2">{meta}</div>}

          {footer && <div className="mt-3">{footer}</div>}

          <div
            className={cn(
              'mt-3 flex h-9 items-center justify-center rounded-md border text-sm font-bold text-white transition',
              btnBorder,
            )}
          >
            {buttonLabel ?? defaultLabel}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    );
  },
);
EventImageCard.displayName = 'EventImageCard';

export { EventImageCard };
export type { EventImageCardProps };
