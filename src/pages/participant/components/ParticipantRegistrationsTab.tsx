import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { Registration } from '@/types';
import { mockEvents } from '@/data/mockData';
import { ListContainer, ListEmptyState, RegistrationListRow } from '@/components/lists';

interface ParticipantRegistrationsTabProps {
  registrations: Registration[];
}

const ParticipantRegistrationsTab = ({ registrations }: ParticipantRegistrationsTabProps) => {
  const registrationsWithEvents = registrations
    .map(reg => {
      const event = mockEvents.find(e => e.id === reg.eventId);
      return { registration: reg, event };
    })
    .filter((item): item is { registration: Registration; event: NonNullable<typeof item.event> } => 
      item.event !== undefined
    )
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  return (
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
      {registrationsWithEvents.map(({ registration, event }) => (
        <RegistrationListRow
          key={registration.id}
          registration={registration}
          event={event}
        />
      ))}
    </ListContainer>
  );
};

export default ParticipantRegistrationsTab;
