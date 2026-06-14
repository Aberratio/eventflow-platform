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
import { Event, Registration, User } from '@/types';
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
  Pencil,
  Phone,
  Route,
  Share2,
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
  const startDate = event.registrationEmbed?.startDate;
  return Boolean(startDate && new Date(startDate) > new Date());
};

const formatRegistrationStart = (event: Event): string | null => {
  const startDate = event.registrationEmbed?.startDate;
  if (!startDate) return null;
  return format(new Date(startDate), 'd MMMM yyyy', { locale: pl });
};

const formatDeadline = (event: Event): string => {
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
  hasAnyLimit,
  closedReason,
  previewMode,
}: {
  event: Event;
  isRegistrationOpen: boolean;
  remainingSpots: number | null;
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
    isRegistrationOpen && hasAnyLimit && remainingSpots !== null && remainingSpots <= 12;

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

          {paymentState.paid && (
            <Button
              variant="outline"
              className="h-11 w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
              onClick={onShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Udostępnij
            </Button>
          )}
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
  hasAnyLimit: boolean;
}) => {
  const state = getRegistrationCardState({
    event,
    isRegistrationOpen,
    remainingSpots,
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
          <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
            <Users className="h-6 w-6 shrink-0 text-foreground/70" />
            <div>
              <p className="text-foreground/58 text-sm">Miejsca</p>
              <p className={`font-semibold leading-tight ${placeToneClass}`}>{state.placesLabel}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${statusToneClass}`}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-current shadow-[0_0_18px_currentColor]" />
            <div>
              <p className="font-semibold leading-tight">{state.statusLabel}</p>
              <p className="text-foreground/58 mt-1 text-sm">{state.statusDescription}</p>
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

      {event.organizerContact && (
        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle className="text-base">Kontakt z organizatorem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{event.organizerName}</p>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
