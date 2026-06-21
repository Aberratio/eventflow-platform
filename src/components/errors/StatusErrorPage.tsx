import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  Home,
  LogIn,
  Mail,
  RefreshCw,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorAction = {
  label: string;
  description: string;
  icon: 'refresh' | 'back' | 'mail' | 'login';
  href?: string;
  to?: string;
  onClick?: () => void;
};

type StatusErrorPageProps = {
  code: string;
  title: string;
  description: ReactNode;
  primaryLabel?: string;
  primaryIcon?: 'refresh' | 'back' | 'login';
  onPrimaryClick?: () => void;
  primaryTo?: string;
  details?: ReactNode;
  actions?: ErrorAction[];
};

const iconMap = {
  refresh: RotateCcw,
  back: Undo2,
  mail: Mail,
  login: LogIn,
} as const;

const defaultActions = (): ErrorAction[] => [
  {
    label: 'Odśwież stronę',
    description: 'Czasem wystarczy spróbować ponownie.',
    icon: 'refresh',
    onClick: () => window.location.reload(),
  },
  {
    label: 'Wróć do poprzedniego miejsca',
    description: 'Najbezpieczniej wrócić do ostatniego działającego widoku.',
    icon: 'back',
    onClick: () => window.history.back(),
  },
  {
    label: 'Skontaktuj się z nami',
    description: 'Napisz, jeśli problem będzie się powtarzał.',
    icon: 'mail',
    href: 'mailto:kontakt@zmierzymyczas.pl',
  },
];

const renderAction = (action: ErrorAction) => {
  const Icon = iconMap[action.icon];
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-white">{action.label}</span>
        <span className="block text-xs text-white/40">{action.description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
    </>
  );
  const className =
    'flex w-full items-center gap-4 py-3.5 text-left transition-colors hover:text-primary';

  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {content}
      </Link>
    );
  }

  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  );
};

export const StatusErrorPage = ({
  code,
  title,
  description,
  primaryLabel = 'Spróbuj ponownie',
  primaryIcon = 'refresh',
  onPrimaryClick = () => window.location.reload(),
  primaryTo,
  details,
  actions = defaultActions(),
}: StatusErrorPageProps) => {
  const PrimaryIcon = primaryIcon === 'login' ? LogIn : primaryIcon === 'back' ? Undo2 : RefreshCw;
  const primaryButton = (
    <Button
      onClick={primaryTo ? undefined : onPrimaryClick}
      variant="primary"
      size="lg"
      className="gap-2 px-8"
    >
      <PrimaryIcon className="h-4 w-4" />
      {primaryLabel}
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#080a0d] px-4 py-10 text-white">
      <Link to="/" className="mb-12 inline-flex items-center gap-2">
        <span className="text-primary">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <line x1="12" y1="2" x2="12" y2="4" />
          </svg>
        </span>
        <span className="text-lg font-bold tracking-tight">
          Zmierzmy<span className="text-primary">Czas</span>
        </span>
      </Link>

      <div className="relative mb-8 w-full max-w-xs">
        <img
          src="/assets/errors/500-hero.png"
          alt={`Błąd ${code}`}
          className="w-full select-none"
          draggable={false}
        />
        <div className="absolute -right-2 top-3 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-sm font-semibold text-white/80 backdrop-blur">
          {code}
        </div>
      </div>

      <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight text-white md:text-5xl">
        {title}
      </h1>

      <p className="mb-8 max-w-sm text-center text-base leading-relaxed text-white/50">
        {description}
      </p>

      {details && (
        <div className="border-white/8 mb-8 w-full max-w-md rounded-xl border bg-white/[0.03] px-4 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-white/40">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Szczegóły błędu
          </div>
          <div className="break-all font-mono text-xs text-destructive">{details}</div>
        </div>
      )}

      <div className="mb-14 flex flex-col gap-3 sm:flex-row">
        {primaryTo ? (
          <Button asChild variant="primary" size="lg" className="gap-2 px-8">
            <Link to={primaryTo}>
              <PrimaryIcon className="h-4 w-4" />
              {primaryLabel}
            </Link>
          </Button>
        ) : (
          primaryButton
        )}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="gap-2 border-white/15 bg-white/5 px-8 text-white hover:bg-white/10"
        >
          <Link to="/">
            <Home className="h-4 w-4" />
            Przejdź do strony głównej
          </Link>
        </Button>
      </div>

      <div className="border-white/8 w-full max-w-2xl overflow-hidden rounded-2xl border bg-white/[0.03]">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex items-end justify-center px-8 pt-8 md:w-56 md:shrink-0 md:px-6 md:py-0 md:pt-6">
            <img
              src="/assets/errors/500-support.png"
              alt="Ilustracja wsparcia"
              className="w-40 select-none md:w-full"
              draggable={false}
            />
          </div>

          <div className="flex-1 px-6 py-8">
            <h2 className="mb-5 text-lg font-semibold text-white">Co możesz zrobić?</h2>
            <ul className="divide-white/6 divide-y">
              {actions.map((action) => (
                <li key={action.label}>{renderAction(action)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mb-3 mt-10 text-sm text-white/30">
        Jeśli problem będzie się powtarzał, skontaktuj się z nami.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
        <a
          href="mailto:kontakt@zmierzymyczas.pl"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-white/70"
        >
          <Mail className="h-3.5 w-3.5" />
          kontakt@zmierzymyczas.pl
        </a>
        <a
          href="tel:+48123456789"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-white/70"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
          </svg>
          +48 123 456 789
        </a>
      </div>
    </div>
  );
};
