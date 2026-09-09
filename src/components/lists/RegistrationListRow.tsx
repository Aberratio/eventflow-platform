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
} from 'lucide-react';
import { endOfDay, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface RegistrationListRowProps {
  registration: Registration;
  event: Event;
  virtualSubmission?: VirtualResultSubmission;
  onSubmitResult?: () => void;
  /** E1.5: „poproś o zwrot" — omitted when the caller doesn't want the action offered here. */
  onRequestRefund?: () => void;
}

export const RegistrationListRow = ({
  registration,
  event,
  virtualSubmission,
  onSubmitResult,
  onRequestRefund,
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
        {registration.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
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
      {/* E3.6 (issue 12 §4): "odprawiono Cię o 7:42" — the Odprawa fact Biuro
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

  // E1.11: kod startowy QR — widoczny obok numeru startowego/dystansu, dokładnie
  // tam, gdzie spec 11 pkt 5 każe pokazywać "Mój start". QR koduje sam token jako
  // czysty tekst (bez URL-a/danych osobowych), zgodnie z rozstrzygnięciem — click
  // to reveal zamiast renderować od razu w liście, żeby nie pokazywać cudzego
  // sekretu przez ramię na współdzielonym ekranie.
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
