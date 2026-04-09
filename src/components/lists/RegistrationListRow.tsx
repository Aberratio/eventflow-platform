import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Registration, Event, VirtualResultSubmission } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Ticket, Globe, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface RegistrationListRowProps {
  registration: Registration;
  event: Event;
  virtualSubmission?: VirtualResultSubmission;
  onSubmitResult?: () => void;
}

export const RegistrationListRow = ({
  registration,
  event,
  virtualSubmission,
  onSubmitResult,
}: RegistrationListRowProps) => {
  const now = new Date();
  const isVirtual = event.isVirtual;

  // Virtual event window status
  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const windowNotStarted = startDate && isBefore(now, startDate);
  const windowActive = startDate && endDate && isAfter(now, startDate) && isBefore(now, endDate);
  const windowEnded = endDate && isAfter(now, endDate);

  // Format subtitle based on virtual or regular event
  const subtitle =
    isVirtual && event.startDate && event.endDate
      ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMMM yyyy', { locale: pl })} • ${event.city}`
      : `${format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • ${event.city}`;

  // Build badges
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
    </div>
  );

  // Build virtual submission status or action
  const renderVirtualStatus = () => {
    if (!isVirtual) return null;

    // Window hasn't started yet
    if (windowNotStarted && startDate) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Okno startowe od {format(startDate, 'd MMM', { locale: pl })}
        </span>
      );
    }

    // Window is active
    if (windowActive && endDate) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Okno otwarte do {format(endDate, 'd MMM', { locale: pl })}
        </span>
      );
    }

    // Window ended - check submission status
    if (windowEnded) {
      if (!virtualSubmission) {
        // No submission yet - show button
        return (
          <Button
            size="sm"
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSubmitResult?.();
            }}
            className="h-7 text-xs"
          >
            <Send className="mr-1 h-3 w-3" />
            Wprowadź wynik
          </Button>
        );
      }

      // Has submission - show status
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
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="mr-1 h-3 w-3" />
                      Odrzucony
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSubmitResult?.();
                      }}
                      className="h-7 text-xs"
                    >
                      Zgłoś ponownie
                    </Button>
                  </div>
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
    }

    return null;
  };

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
