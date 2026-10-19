import { getVirtualResultSubmissions, requestRefund } from '@/api';
import { getAllEventsPaged } from '@/api/fetchAllPages';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { Registration, Event } from '@/types';
import { ListContainer, ListEmptyState, RegistrationListRow } from '@/components/lists';
import { VirtualResultsSubmissionDialog } from './VirtualResultsSubmissionDialog';
import CaptainTeamInvites from './CaptainTeamInvites';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { retryErrorMessage, retryRegistrationPayment } from '@/lib/unpaidRegistration';

interface ParticipantRegistrationsTabProps {
  registrations: Registration[];
}

const ParticipantRegistrationsTab = ({ registrations }: ParticipantRegistrationsTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDistanceId, setSelectedDistanceId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRequestRefund = async (registration: Registration) => {
    try {
      await requestRefund(registration.id);
      toast({
        title: 'Wysłano prośbę o zwrot',
        description: 'Organizator lub administrator rozpatrzy Twoją prośbę.',
      });
      queryClient.invalidateQueries({ queryKey: ['registrations-by-user'] });
    } catch {
      toast({
        title: 'Nie udało się wysłać prośby',
        description: 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    }
  };
  // B-05: same button as in the unpaid banner — reopens the payment window / sends to the gateway.
  const handleRetryPayment = async (registration: Registration) => {
    try {
      const { redirected } = await retryRegistrationPayment(registration.id);
      if (!redirected) {
        toast({ title: 'Okno płatności zostało ponownie otwarte' });
      }
    } catch (error) {
      toast({
        title: 'Nie udało się ponowić płatności',
        description: retryErrorMessage(error),
        variant: 'destructive',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['registrations-by-user'] });
  };
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'participant-registrations'],
    queryFn: () => getAllEventsPaged({ includeUnpublished: true, includePrivate: true }),
  });
  const events = eventsResponse?.data ?? [];
  const { data: virtualSubmissionsResponse } = useQuery({
    queryKey: [...QUERY_KEYS.virtualResults, 'participant'],
    queryFn: () => getVirtualResultSubmissions(),
  });
  const virtualSubmissions = virtualSubmissionsResponse?.data ?? [];

  const registrationsWithEvents = registrations
    .map((reg) => {
      const event = events.find((e) => e.id === reg.eventId);
      const virtualSubmission = event?.isVirtual
        ? virtualSubmissions.find(
            (sub) =>
              sub.eventId === reg.eventId &&
              sub.userId === reg.userId &&
              sub.distanceId === reg.distanceId,
          )
        : undefined;
      return { registration: reg, event, virtualSubmission };
    })
    .filter(
      (
        item,
      ): item is {
        registration: Registration;
        event: NonNullable<typeof item.event>;
        virtualSubmission: typeof item.virtualSubmission;
      } => item.event !== undefined,
    )
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  const handleOpenSubmissionDialog = (event: Event, distanceId: string) => {
    setSelectedEvent(event);
    setSelectedDistanceId(distanceId);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
      setSelectedDistanceId(undefined);
    }
  };

  return (
    <>
      <CaptainTeamInvites items={registrationsWithEvents} />
      <ListContainer
        isEmpty={registrationsWithEvents.length === 0}
        emptyState={
          <ListEmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="Brak aktywnych zapisów"
            description="Zapisz się na nadchodzące zawody!"
            action={
              <Button asChild>
                <Link to="/events">Przeglądaj wydarzenia</Link>
              </Button>
            }
          />
        }
      >
        {registrationsWithEvents.map(({ registration, event, virtualSubmission }) => (
          <RegistrationListRow
            key={registration.id}
            registration={registration}
            event={event}
            virtualSubmission={virtualSubmission}
            onSubmitResult={() => handleOpenSubmissionDialog(event, registration.distanceId)}
            onRequestRefund={() => handleRequestRefund(registration)}
            onRetryPayment={() => handleRetryPayment(registration)}
          />
        ))}
      </ListContainer>

      {selectedEvent && (
        <VirtualResultsSubmissionDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          event={selectedEvent}
          registeredDistanceId={selectedDistanceId}
          onSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.virtualResults });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results });
          }}
        />
      )}
    </>
  );
};

export default ParticipantRegistrationsTab;
