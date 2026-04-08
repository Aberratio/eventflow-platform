import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { Registration, Event } from '@/types';
import { mockEvents } from '@/api/mock/events.mock';
import { mockVirtualResultSubmissions } from '@/api/mock/virtual-results.mock';
import { ListContainer, ListEmptyState, RegistrationListRow } from '@/components/lists';
import { VirtualResultsSubmissionDialog } from './VirtualResultsSubmissionDialog';

interface ParticipantRegistrationsTabProps {
  registrations: Registration[];
}

const ParticipantRegistrationsTab = ({ registrations }: ParticipantRegistrationsTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDistanceId, setSelectedDistanceId] = useState<string | undefined>(undefined);

  const registrationsWithEvents = registrations
    .map(reg => {
      const event = mockEvents.find(e => e.id === reg.eventId);
      // Find virtual submission for this registration
      const virtualSubmission = event?.isVirtual 
        ? mockVirtualResultSubmissions.find(
            sub => sub.eventId === reg.eventId && sub.userId === reg.userId && sub.distanceId === reg.distanceId
          )
        : undefined;
      return { registration: reg, event, virtualSubmission };
    })
    .filter((item): item is { 
      registration: Registration; 
      event: NonNullable<typeof item.event>;
      virtualSubmission: typeof item.virtualSubmission;
    } => item.event !== undefined)
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
          />
        ))}
      </ListContainer>

      {selectedEvent && (
        <VirtualResultsSubmissionDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          event={selectedEvent}
          registeredDistanceId={selectedDistanceId}
        />
      )}
    </>
  );
};

export default ParticipantRegistrationsTab;
