import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Event, Registration, User, EventMerchandise } from '@/types';
import { Result } from '@/types/result';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Hourglass,
  Info,
  Lock,
  Mail,
  Medal,
  Pencil,
  Phone,
  Route,
  Share2,
  ShoppingBag,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { getEditUrl } from '@/components/event-details';
import { isExternalRegistrationEvent } from './ExternalRegistrationFrame';
import { getCurrentPrice } from '@/api';
import { formatMoney } from '@/lib/discountValue';
import { toast } from '@/hooks/use-toast';

interface EventSidebarProps {
  event: Event;
  user: User | null;
  userRegistration: Registration | null;
  isRegistrationOpen: boolean;
  closedReason: string | null;
  onRegister: () => void;
  onShare: () => void;
  previewMode?: boolean;
  hideRegistrationCard?: boolean;
  isPast?: boolean;
  eventResults?: Result[];
  onGoToResults?: () => void;
}

type PaymentState = {
  paid: boolean;
  label: string;
  description: string;
  summary: string;
  tone: 'paid' | 'waiting';
};

type RegistrationCardState = {
  tone: 'open' | 'soon' | 'urgent' | 'closed';
  title: string;
  headerIcon: typeof CalendarDays;
  accentClass: string;
  iconClass: string;
  statusLabel: string;
  statusDescription: string;
  placesLabel: string;
  deadlineLabel: string;
  hint: string;
  buttonLabel: string;
  buttonDisabled: boolean;
  priceMuted: boolean;
};

const generateTransferTitle = (event: Event, registration: Registration): string => {
  const template =
    event.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}';

  return template
    .replace('{eventName}', event.name)
    .replace('{participantName}', registration.userName)
    .replace('{distanceName}', registration.distanceName)
    .replace('{birthDate}', '');
};

const getPaymentState = (event: Event, registration: Registration): PaymentState => {
  const isBankTransfer = event.paymentConfig?.type === 'organizer_bank';
  const startFeePaid =
    registration.paymentDetails?.startFeePaid ||
    (!isBankTransfer && registration.status !== 'cancelled' && registration.status !== 'removed');

  if (startFeePaid) {
    return {
      paid: true,
      label: 'Opłacone',
      description: isBankTransfer ? 'Przelew zatwierdzony' : 'Płatność online',
      summary: 'Dziękujemy! Twoje zgłoszenie zostało przyjęte.',
      tone: 'paid',
    };
  }

  return {
    paid: false,
    label: isBankTransfer ? 'Czekamy na przelew' : 'Czekamy na płatność',
    description: isBankTransfer ? 'Przelew bankowy' : 'Płatność online',
    summary: isBankTransfer
      ? 'Czekamy na Twój przelew.'
      : 'Dokończ płatność, aby potwierdzić start.',
    tone: 'waiting',
  };
};

const copyToClipboard = (value: string) => {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
};

const hasFutureRegistrationStart = (event: Event): boolean => {
  const startDate = event.registrationOpenDate || event.registrationEmbed?.startDate;
  return Boolean(startDate && new Date(startDate) > new Date());
};

const formatRegistrationStart = (event: Event): string | null => {
  const startDate = event.registrationOpenDate || event.registrationEmbed?.startDate;
  if (!startDate) return null;
  return format(new Date(startDate), 'd MMMM yyyy', { locale: pl });
};

const formatDeadline = (event: Event): string => {
  if (event.registrationUntilEventStart) {
    return `Zapisy do dnia startu (${format(new Date(event.date), 'd MMMM', { locale: pl })})`;
  }
  const deadline = new Date(event.registrationDeadline);
  const now = new Date();
  const sameDay = deadline.toDateString() === now.toDateString();

  if (sameDay) {
    return 'Zapisy do dziś, 23:59';
  }

  return `Zapisy do ${format(deadline, 'd MMMM yyyy', { locale: pl })}`;
};

const getRegistrationCardState = ({
  event,
  isRegistrationOpen,
  remainingSpots,
  totalSpots,
  hasAnyLimit,
  closedReason,
  previewMode,
}: {
  event: Event;
  isRegistrationOpen: boolean;
  remainingSpots: number | null;
  totalSpots: number;
  hasAnyLimit: boolean;
  closedReason: string | null;
  previewMode: boolean;
}): RegistrationCardState => {
  const registrationStartsAt = formatRegistrationStart(event);
  const isSoon =
    !previewMode &&
    !isRegistrationOpen &&
    (event.registrationStatus === 'none' || hasFutureRegistrationStart(event));
  const isFull = hasAnyLimit && (remainingSpots ?? 0) <= 0;
  const isUrgent =
    isRegistrationOpen &&
    hasAnyLimit &&
    remainingSpots !== null &&
    totalSpots > 0 &&
    remainingSpots <= totalSpots * 0.2;

  if (isSoon) {
    return {
      tone: 'soon',
      title: 'Zapisy wkrótce',
      headerIcon: Clock,
      accentClass: 'from-primary/90',
      iconClass: 'border-primary/35 bg-primary/15 text-primary',
      statusLabel: 'Start zapisów',
      statusDescription: registrationStartsAt || 'Wkrótce',
      placesLabel: hasAnyLimit
        ? remainingSpots !== null
          ? `Zostało ${Math.max(remainingSpots, 0)} miejsc`
          : 'Limit miejsc'
        : 'Brak limitu',
      deadlineLabel: formatDeadline(event),
      hint: 'Wróć tutaj, gdy zapisy się rozpoczną',
      buttonLabel: 'Zapisy jeszcze nieaktywne',
      buttonDisabled: true,
      priceMuted: false,
    };
  }

  if (!isRegistrationOpen) {
    return {
      tone: 'closed',
      title: 'Zapisy zamknięte',
      headerIcon: XCircle,
      accentClass: 'from-white/55',
      iconClass: 'border-white/20 bg-white/10 text-foreground/70',
      statusLabel: 'Zapisy zamknięte',
      statusDescription: 'Nie ma już możliwości zapisu',
      placesLabel: isFull ? 'Brak dostępnych miejsc' : 'Niedostępne',
      deadlineLabel: closedReason || 'Termin zapisów minął',
      hint: '',
      buttonLabel: 'Brak możliwości zapisu',
      buttonDisabled: true,
      priceMuted: true,
    };
  }

  if (isUrgent) {
    return {
      tone: 'urgent',
      title: previewMode ? 'Test zapisów' : 'Zapisz się',
      headerIcon: Hourglass,
      accentClass: 'from-amber-400/95',
      iconClass: 'border-amber-400/30 bg-amber-400/12 text-amber-300',
      statusLabel: 'Kończą się zapisy',
      statusDescription: 'Liczba miejsc ograniczona',
      placesLabel: `Zostało ${Math.max(remainingSpots ?? 0, 0)} miejsc`,
      deadlineLabel: previewMode ? 'Tryb testowy formularza' : formatDeadline(event),
      hint: previewMode
        ? 'Symulator nie utworzy prawdziwego zapisu ani płatności.'
        : 'Nie zwlekaj, liczba miejsc jest ograniczona',
      buttonLabel: previewMode ? 'Przetestuj formularz' : 'Rozpocznij zapis',
      buttonDisabled: false,
      priceMuted: false,
    };
  }

  return {
    tone: 'open',
    title: previewMode ? 'Test zapisów' : 'Zapisz się',
    headerIcon: CalendarDays,
    accentClass: 'from-emerald-400/90',
    iconClass: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-300',
    statusLabel: 'Zapisy otwarte',
    statusDescription: 'Możesz się zapisać',
    placesLabel: hasAnyLimit
      ? remainingSpots !== null
        ? `Zostało ${Math.max(remainingSpots, 0)} miejsc`
        : 'Limit miejsc'
      : 'Brak limitu',
    deadlineLabel: previewMode ? 'Tryb testowy formularza' : formatDeadline(event),
    hint: previewMode
      ? 'Symulator nie utworzy prawdziwego zapisu ani płatności.'
      : 'W następnym kroku wybierzesz kategorię i pakiet',
    buttonLabel: previewMode ? 'Przetestuj formularz' : 'Rozpocznij zapis',
    buttonDisabled: false,
    priceMuted: false,
  };
};

const RegistrationStatusCard = ({
  event,
  registration,
  onShare,
}: {
  event: Event;
  registration: Registration;
  onShare: () => void;
}) => {
  const paymentState = getPaymentState(event, registration);
  const isWaiting = paymentState.tone === 'waiting';
  const isBankTransfer = event.paymentConfig?.type === 'organizer_bank';
  const paymentAmount = registration.paymentDetails?.startFeeAmount ?? registration.pricePaid ?? 0;
  const transferTitle = generateTransferTitle(event, registration);
  const dueDate = format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl });
  const accentClass = paymentState.paid ? 'from-emerald-400/85' : 'from-amber-400/90';
  const statusClass = paymentState.paid
    ? 'border-emerald-400/20 bg-emerald-400/12 text-emerald-300'
    : 'border-amber-400/25 bg-amber-400/12 text-amber-300';
  const Icon = paymentState.paid ? CheckCircle2 : Clock;

  return (
    <Card className="sticky top-20 overflow-hidden border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className={`h-px bg-gradient-to-r ${accentClass} to-transparent`} />
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
              paymentState.paid
                ? 'border-emerald-400 text-emerald-300'
                : 'border-amber-400 text-amber-300'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight">Jesteś zapisany!</h2>
            <p className="text-foreground/62 mt-2 text-sm">{paymentState.summary}</p>
          </div>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 py-4">
            <Route className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-foreground/58 text-xs">Twój dystans</p>
              <p className="font-semibold leading-tight">{registration.distanceName}</p>
              {registration.bibNumber && (
                <p className="text-foreground/58 mt-1 text-xs">
                  Numer startowy: <span className="text-foreground">{registration.bibNumber}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 py-4">
            <CreditCard className="mt-1 h-5 w-5 text-primary" />
            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-foreground/58 text-xs">Status płatności</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {paymentState.label}
                  </span>
                  <span className="text-foreground/52 text-xs">{paymentState.description}</span>
                </div>
              </div>

              {isWaiting && (
                <dl className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-foreground/58">Kwota:</dt>
                    <dd className="font-semibold">{formatMoney(paymentAmount)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-foreground/58">Termin płatności:</dt>
                    <dd className="text-right font-semibold">{dueDate}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {isWaiting && isBankTransfer && event.paymentConfig && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Przypomnij dane do przelewu
                  <Info className="ml-auto h-4 w-4 text-foreground/45" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dane do przelewu</DialogTitle>
                  <DialogDescription>
                    Użyj dokładnie tych danych, żeby organizator mógł szybko potwierdzić wpłatę.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <TransferDetail
                    label="Numer konta"
                    value={event.paymentConfig.bankAccountNumber || ''}
                  />
                  <TransferDetail
                    label="Odbiorca"
                    value={event.paymentConfig.bankAccountHolder || ''}
                  />
                  <TransferDetail label="Tytuł przelewu" value={transferTitle} />
                  <TransferDetail label="Kwota" value={formatMoney(paymentAmount)} />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <ShareRegistrationDialog event={event} registration={registration} onCopyLink={onShare} />
        </div>
      </CardContent>
    </Card>
  );
};

const TransferDetail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value || 'Brak danych'}</p>
    </div>
    {value && (
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => copyToClipboard(value)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    )}
  </div>
);

const ShareRegistrationDialog = ({
  event,
  registration,
  onCopyLink,
}: {
  event: Event;
  registration: Registration;
  onCopyLink: () => void;
}) => {
  const url = window.location.href;
  const text = `Startuję w ${event.name} – dystans ${registration.distanceName}! Dołącz do mnie!`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const handleCopy = () => {
    void navigator.clipboard.writeText(url);
    toast({ title: 'Link skopiowany', description: 'Link do wydarzenia skopiowany do schowka.' });
    onCopyLink();
  };

  const shareOptions = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      className: 'bg-[#1877F2]/10 border-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/20',
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      className: 'bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10',
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
      className: 'bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Udostępnij swój start
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Udostępnij swój start</DialogTitle>
          <DialogDescription>
            Pochwal się znajomym, że startujesz w {event.name}!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {shareOptions.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${opt.className}`}
              >
                {opt.icon}
                {opt.label}
              </a>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-10 w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
            onClick={handleCopy}
          >
            <Copy className="mr-2 h-4 w-4" />
            Kopiuj link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RegistrationCtaCard = ({
  event,
  isRegistrationOpen,
  closedReason,
  onRegister,
  onShare,
  previewMode,
  hasExternalRegistration,
  lowestOnlinePrice,
  remainingSpots,
  totalSpots,
  hasAnyLimit,
}: {
  event: Event;
  isRegistrationOpen: boolean;
  closedReason: string | null;
  onRegister: () => void;
  onShare: () => void;
  previewMode: boolean;
  hasExternalRegistration: boolean;
  lowestOnlinePrice: number;
  remainingSpots: number | null;
  totalSpots: number;
  hasAnyLimit: boolean;
}) => {
  const state = getRegistrationCardState({
    event,
    isRegistrationOpen,
    remainingSpots,
    totalSpots,
    hasAnyLimit,
    closedReason,
    previewMode,
  });
  const HeaderIcon = state.headerIcon;
  const statusToneClass =
    state.tone === 'open'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      : state.tone === 'urgent'
        ? 'border-amber-400/25 bg-amber-400/10 text-amber-300'
        : state.tone === 'soon'
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-white/12 bg-white/[0.045] text-foreground/62';
  const placeToneClass =
    state.tone === 'urgent'
      ? 'text-amber-300'
      : state.tone === 'closed'
        ? 'text-foreground/85'
        : 'text-foreground';

  return (
    <Card className="sticky top-20 overflow-hidden border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className={`h-px bg-gradient-to-r ${state.accentClass} to-transparent`} />
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border shadow-[0_18px_42px_rgba(0,0,0,0.22)] ${state.iconClass}`}
            >
              <HeaderIcon className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold leading-tight">{state.title}</h2>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`text-2xl font-bold leading-tight ${
                state.priceMuted ? 'text-foreground/45' : 'text-primary'
              }`}
            >
              {formatMoney(lowestOnlinePrice)}
            </p>
            <p className="text-foreground/58 mt-1 text-sm">
              {event.distances.length === 1 ? 'Cena udziału' : 'Cena od'}
            </p>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] sm:grid-cols-2">
          <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
            <div className="min-w-0">
              <p className="text-foreground/58 flex items-center gap-2 text-sm leading-tight">
                <Users className="h-5 w-5 shrink-0 text-foreground/70" />
                <span>Miejsca</span>
              </p>
              <p className={`mt-1 pl-7 font-semibold leading-tight ${placeToneClass}`}>
                {state.placesLabel}
              </p>
            </div>
          </div>
          <div className={`flex items-center p-4 ${statusToneClass}`}>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold leading-tight">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-current shadow-[0_0_18px_currentColor]" />
                <span>{state.statusLabel}</span>
              </p>
              <p className="text-foreground/58 mt-1 pl-4 text-xs leading-snug">
                {state.statusDescription}
              </p>
            </div>
          </div>
        </div>

        {hasExternalRegistration && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
            <p className="text-sm font-medium">Zapisy w zewnętrznym formularzu</p>
            <p className="text-foreground/62 mt-1 text-xs">
              Formularz jest osadzony w sekcji zapisów na tej stronie.
            </p>
          </div>
        )}

        <Button
          onClick={onRegister}
          className="h-12 w-full rounded-lg shadow-[0_14px_40px_rgba(38,116,217,0.32)] disabled:border-white/10 disabled:bg-white/[0.08] disabled:text-foreground/50 disabled:shadow-none"
          size="lg"
          disabled={state.buttonDisabled}
        >
          {state.buttonLabel}
          {state.buttonDisabled ? (
            <Lock className="ml-auto h-4 w-4" />
          ) : (
            <ChevronRight className="ml-1 h-4 w-4" />
          )}
        </Button>

        <div className="space-y-3">
          <div className="text-foreground/62 flex items-center gap-4 text-sm">
            <span className="h-px flex-1 bg-white/10" />
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {state.deadlineLabel}
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          {state.hint && (
            <p className="text-foreground/48 flex items-center justify-center gap-2 text-center text-sm">
              <ChevronRight className="h-3.5 w-3.5" />
              {state.hint}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          className="h-11 w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
          onClick={onShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Udostępnij
        </Button>
      </CardContent>
    </Card>
  );
};

const MEDAL_COLORS = [
  'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]',
  'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.5)]',
  'text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]',
];

const ResultsSidebarCard = ({
  results,
  onGoToResults,
}: {
  results: Result[];
  onGoToResults?: () => void;
}) => {
  const finished = results.filter((r) => r.status === 'finished');
  if (finished.length === 0) return null;

  const distances = Array.from(new Set(finished.map((r) => r.distanceName)));
  const categories = Array.from(new Set(finished.map((r) => r.category))).filter(Boolean);
  const manyDistancesOrCategories = distances.length > 2 || categories.length > 4;

  const rows: { result: Result; label: string; medalIdx: number }[] = [];

  if (manyDistancesOrCategories) {
    distances.forEach((dist) => {
      const winner = [...finished]
        .filter((r) => r.distanceName === dist)
        .sort((a, b) => a.position - b.position)[0];
      if (winner) rows.push({ result: winner, label: dist, medalIdx: 0 });
    });
  } else if (categories.length > 0) {
    categories.forEach((cat) => {
      const top3 = [...finished]
        .filter((r) => r.category === cat)
        .sort((a, b) => a.categoryPosition - b.categoryPosition)
        .slice(0, 3);
      top3.forEach((r, i) => rows.push({ result: r, label: cat, medalIdx: i }));
    });
  } else {
    [...finished]
      .sort((a, b) => a.position - b.position)
      .slice(0, 3)
      .forEach((r, i) => rows.push({ result: r, label: r.distanceName ?? '', medalIdx: i }));
  }

  if (rows.length === 0) return null;

  return (
    <Card className="overflow-hidden border-yellow-400/20 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="h-px bg-gradient-to-r from-yellow-400/80 to-transparent" />
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/15 shadow-[0_0_16px_rgba(250,204,21,0.18)]">
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <h2 className="text-base font-semibold">Wyniki zawodów</h2>
          </div>
          {onGoToResults && (
            <button
              type="button"
              onClick={onGoToResults}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Pełne wyniki
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {rows.map(({ result: r, label, medalIdx }, idx) => {
            const showLabel =
              idx === 0 || rows[idx - 1].label !== label;
            return (
              <div key={r.id}>
                {showLabel && (
                  <p className="mb-1 mt-2 first:mt-0 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                    {label}
                  </p>
                )}
                <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <Medal className={`h-3.5 w-3.5 shrink-0 ${MEDAL_COLORS[medalIdx]}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.userName}</span>
                  <span className="shrink-0 font-mono text-sm font-bold text-primary">{r.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const EventGadgetsCard = ({ gadgets }: { gadgets: EventMerchandise[] }) => {
  const available = gadgets.filter((g) => g.available);
  if (available.length === 0) return null;

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.035]">
      <CardHeader className="p-4 pb-3 sm:p-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-4 w-4 shrink-0 text-primary" />
          Gadżety do kupienia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0 sm:p-5 sm:pt-0">
        {available.map((g) => (
          <div
            key={g.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5"
          >
            {g.imageUrl ? (
              <img
                src={g.imageUrl}
                alt={g.name}
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                <ShoppingBag className="h-4 w-4 text-foreground/30" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{g.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-primary">
                  {g.price.toFixed(2)} PLN
                </span>
                {g.originalPrice != null && g.originalPrice > g.price && (
                  <span className="text-xs text-foreground/40 line-through">
                    {g.originalPrice.toFixed(2)} PLN
                  </span>
                )}
                {g.sizes && g.sizes.length > 0 && (
                  <span className="text-xs text-foreground/50">
                    Rozmiary: {g.sizes.join(', ')}
                  </span>
                )}
              </div>
              {g.colors && g.colors.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {g.colors.map((c) => (
                    <span
                      key={c.id}
                      title={c.name}
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <p className="pt-1 text-center text-xs text-foreground/45">
          Gadżety można zamówić podczas rejestracji
        </p>
      </CardContent>
    </Card>
  );
};

export const EventSidebar = ({
  event,
  user,
  userRegistration,
  isRegistrationOpen,
  closedReason,
  onRegister,
  onShare,
  previewMode = false,
  hideRegistrationCard = false,
  isPast,
  eventResults,
  onGoToResults,
}: EventSidebarProps) => {
  const hasExternalRegistration = isExternalRegistrationEvent(event);
  const lowestOnlinePrice = Math.min(
    ...event.distances.map((distance) => getCurrentPrice(distance).price),
  );

  const totalSpots = event.distances.reduce((acc, d) => acc + (d.limit ?? 0), 0);
  const totalRegistered = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
  const hasAnyLimit = event.distances.some((d) => d.limit != null);
  const remainingSpots = hasAnyLimit ? totalSpots - totalRegistered : null;

  const canEdit =
    !previewMode &&
    (user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      user?.role === 'moderator' ||
      (user?.role === 'organizer' && event.organizerId === user?.id));

  return (
    <div className="space-y-6">
      {!hideRegistrationCard &&
        (userRegistration ? (
          <RegistrationStatusCard event={event} registration={userRegistration} onShare={onShare} />
        ) : isPast && eventResults && eventResults.length > 0 ? (
          <ResultsSidebarCard results={eventResults} onGoToResults={onGoToResults} />
        ) : (
          <RegistrationCtaCard
            event={event}
            isRegistrationOpen={isRegistrationOpen}
            closedReason={closedReason}
            onRegister={onRegister}
            onShare={onShare}
            previewMode={previewMode}
            hasExternalRegistration={hasExternalRegistration}
            lowestOnlinePrice={lowestOnlinePrice}
            remainingSpots={remainingSpots}
            totalSpots={totalSpots}
            hasAnyLimit={hasAnyLimit}
          />
        ))}

      {canEdit && (
        <Card className="border-white/10 bg-white/[0.035]">
          <CardContent className="p-4">
            <Button
              variant="secondary"
              className="h-11 w-full border border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"
              asChild
            >
              <Link to={getEditUrl(event, user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj wydarzenie
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div id="event-start-list-sidebar-slot" className="space-y-5" />

      {event.merchandise && event.merchandise.length > 0 && (
        <EventGadgetsCard gadgets={event.merchandise} />
      )}

      {(event.organizerInfo?.contacts?.length || event.organizerContact) && (
        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle className="text-base">Kontakt z organizatorem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{event.organizerName}</p>
            {event.organizerInfo?.contacts && event.organizerInfo.contacts.length > 0 ? (
              <div className="space-y-2">
                {event.organizerInfo.contacts.map((contact, idx) => (
                  <div key={idx} className="space-y-1">
                    {contact.name && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                        {contact.name}
                      </p>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : event.organizerContact ? (
              <div className="space-y-2">
                <a
                  href={`mailto:${event.organizerContact.email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Napisz do organizatora
                </a>
                {event.organizerContact.phone && (
                  <a
                    href={`tel:${event.organizerContact.phone}`}
                    className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {event.organizerContact.phone}
                  </a>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
