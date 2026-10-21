import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Registration, Event, VirtualResultSubmission } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import {
  Ticket,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  QrCode,
  CheckCircle2,
  CreditCard,
  History,
  LogOut,
  Shuffle,
} from 'lucide-react';
import { endOfDay, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';
import { canRetryPayment } from '@/lib/unpaidRegistration';
import { canChangeDistance } from '@/lib/distanceChange';
import { evaluateSelfService, selfServiceDeniedMessage } from '@/lib/selfService';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface RegistrationListRowProps {
  registration: Registration;
  event: Event;
  virtualSubmission?: VirtualResultSubmission;
  onSubmitResult?: () => void;
  /** „poproś o zwrot" — omitted when the caller doesn't want the action offered here. */
  onRequestRefund?: () => void;
  /** „ponów płatność" for an expired Zapis — omitted when the caller doesn't offer it. */
  onRetryPayment?: () => void;
  /** „Zrezygnuj” — offered only while the self-service window is open; omitted = never offered. */
  onCancel?: () => void;
  /** „Historia zapisu” — omitted = not offered. */
  onShowHistory?: () => void;
  /** „Zmień dystans” — offered only while the self-service window is open; omitted = never offered. */
  onChangeDistance?: () => void;
}

export const RegistrationListRow = ({
  registration,
  event,
  virtualSubmission,
  onSubmitResult,
  onRequestRefund,
  onRetryPayment,
  onCancel,
  onShowHistory,
  onChangeDistance,
}: RegistrationListRowProps) => {
  const [showStartCode, setShowStartCode] = useState(false);
  const now = new Date();
  const isVirtual = event.isVirtual;
  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const windowStart = startDate ? startOfDay(startDate) : null;
  const windowEnd = endDate ? endOfDay(endDate) : null;
  const windowNotStarted = windowStart && isBefore(now, windowStart);
  const windowActive =
    windowStart && windowEnd && !isBefore(now, windowStart) && !isAfter(now, windowEnd);
  const windowEnded = windowEnd && isAfter(now, windowEnd);

  const subtitle =
    isVirtual && event.startDate && event.endDate
      ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMMM yyyy', { locale: pl })} • ${event.city}`
      : `${format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • ${event.city}`;

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      {isVirtual && (
        <Badge variant="secondary" className="text-xs">
          <Globe className="mr-1 h-3 w-3" />
          Wirtualny
        </Badge>
      )}
      <Badge
        variant={registration.status === 'confirmed' ? 'default' : 'secondary'}
        className="text-xs"
      >
        {registration.status === 'confirmed'
          ? 'Potwierdzony'
          : registration.status === 'expired'
            ? 'Wygasł'
            : registration.status === 'cancelled' || registration.status === 'removed'
              ? 'Anulowany'
              : 'Oczekuje'}
      </Badge>
      {registration.refund && (
        <Badge variant="outline" className="text-xs">
          {registration.refund.status === 'refunded'
            ? 'Zwrot zrealizowany'
            : registration.refund.status === 'approved'
              ? 'Zwrot: do zwrotu'
              : 'Zwrot: oczekuje na zatwierdzenie'}
        </Badge>
      )}
      {/* "Odprawiono Cię o 7:42" — the Odprawa fact Biuro
          Zawodów reports back via return-sync, shown in the Zawodnik's own
          registration history right next to the other status badges; absent
          while un-checked-in, so no empty/placeholder badge appears for the
          common not-yet case. */}
      {registration.checkedInAt && (
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs text-primary">
          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
          Odprawiono o {format(new Date(registration.checkedInAt), 'HH:mm', { locale: pl })}
        </Badge>
      )}
    </div>
  );

  const canRequestRefund =
    registration.status === 'confirmed' && !registration.refund && Boolean(onRequestRefund);

  const refundButton = canRequestRefund && (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRequestRefund?.();
      }}
      className="h-7 text-xs"
    >
      <RotateCcw className="mr-1 h-3 w-3" />
      Poproś o zwrot
    </Button>
  );

  const retryButton = onRetryPayment &&
    canRetryPayment(registration, new Date(), {
      isBankTransfer: event.paymentConfig?.type === 'organizer_bank',
    }) && (
      <Button
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRetryPayment();
        }}
        className="h-7 text-xs"
      >
        <CreditCard className="mr-1 h-3 w-3" />
        Ponów płatność
      </Button>
    );

  const selfService =
    onCancel || onChangeDistance ? evaluateSelfService(event, registration, now) : null;
  const changeDistanceButton = selfService?.allowed &&
    onChangeDistance &&
    canChangeDistance(registration) && (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChangeDistance();
        }}
        className="h-7 text-xs"
      >
        <Shuffle className="mr-1 h-3 w-3" />
        Zmień dystans
      </Button>
    );
  const cancelButton = selfService?.allowed && onCancel && (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }}
      className="h-7 text-xs"
    >
      <LogOut className="mr-1 h-3 w-3" />
      Zrezygnuj
    </Button>
  );
  const cancelUnavailable =
    onCancel && selfService && !selfService.allowed
      ? selfServiceDeniedMessage(
          selfService.reason,
          selfService.deadline
            ? format(selfService.deadline, 'd MMMM yyyy, HH:mm', { locale: pl })
            : null,
        )
      : null;

  const historyButton = onShowHistory && (
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onShowHistory();
      }}
      className="h-7 text-xs"
    >
      <History className="mr-1 h-3 w-3" />
      Historia zapisu
    </Button>
  );

  const submitButton = (label: string, variant: 'default' | 'outline' = 'default') => (
    <Button
      size="sm"
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmitResult?.();
      }}
      className="h-7 text-xs"
    >
      <Send className="mr-1 h-3 w-3" />
      {label}
    </Button>
  );

  const renderSubmissionStatus = () => {
    if (!virtualSubmission) return null;

    switch (virtualSubmission.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-warning text-xs text-warning">
            <Clock className="mr-1 h-3 w-3" />
            Oczekuje: {virtualSubmission.submittedTime}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-primary text-xs text-primary">
            <CheckCircle className="mr-1 h-3 w-3" />
            Zatwierdzony: {virtualSubmission.submittedTime}
          </Badge>
        );
      case 'rejected':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="mr-1 h-3 w-3" />
                  Odrzucony
                </Badge>
              </TooltipTrigger>
              {virtualSubmission.rejectionReason && (
                <TooltipContent>
                  <p>Powód: {virtualSubmission.rejectionReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
    }
  };

  const renderVirtualStatus = () => {
    if (!isVirtual) return null;

    if (windowNotStarted && startDate) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Okno startowe od {format(startDate, 'd MMM', { locale: pl })}
        </span>
      );
    }

    if (windowActive && endDate) {
      if (!virtualSubmission) return submitButton('Wprowadź wynik');
      if (virtualSubmission.status === 'rejected') {
        return (
          <div className="flex items-center gap-2">
            {renderSubmissionStatus()}
            {submitButton('Zgłoś ponownie', 'outline')}
          </div>
        );
      }
      return renderSubmissionStatus();
    }

    if (windowEnded) {
      return (
        <div className="flex items-center gap-2">
          {renderSubmissionStatus()}
          {!virtualSubmission && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Okno startowe zamknięte
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  // QR start code — shown next to the bib number / Dystans, exactly where "Mój start" is
  // displayed. The QR encodes the bare token as plain text (no URL, no personal data).
  // Click to reveal instead of rendering it in the list right away, so nobody's secret
  // can be read over the shoulder on a shared screen.
  const startCodeTrigger = registration.qrCode && (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowStartCode((open) => !open);
      }}
      className="h-7 text-xs"
    >
      <QrCode className="mr-1 h-3.5 w-3.5" />
      Kod startowy
    </Button>
  );

  const startCodeReveal = registration.qrCode && showStartCode && (
    <div
      className="flex w-full basis-full flex-col items-center gap-2 rounded-md border bg-popover p-4 text-popover-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      <QRCodeSVG value={registration.qrCode} size={140} level="M" includeMargin />
      <span className="break-all text-center font-mono text-xs text-muted-foreground">
        {registration.qrCode}
      </span>
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline" className="text-xs">
        {registration.distanceName}
      </Badge>
      {registration.bibNumber && (
        <span className="flex items-center gap-1">
          <Ticket className="h-3.5 w-3.5" />
          <span className="font-mono font-medium text-foreground">#{registration.bibNumber}</span>
        </span>
      )}
      {renderVirtualStatus()}
      {startCodeTrigger}
      {refundButton}
      {retryButton}
      {changeDistanceButton}
      {cancelButton}
      {historyButton}
      {cancelUnavailable && (
        <span className="basis-full text-xs text-muted-foreground">{cancelUnavailable}</span>
      )}
      {startCodeReveal}
    </div>
  );

  return (
    <ListRow
      icon={<DisciplineIcon discipline={event.discipline} />}
      title={event.name}
      subtitle={subtitle}
      badge={badges}
      meta={meta}
      href={`/events/${event.slug}`}
    />
  );
};
