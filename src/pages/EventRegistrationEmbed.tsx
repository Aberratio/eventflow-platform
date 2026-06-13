import { getEventBySlug } from '@/api';
import {
  ExternalRegistrationFrame,
  isExternalRegistrationActive,
  isExternalRegistrationEvent,
} from '@/components/event-details';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

const EventRegistrationEmbed = () => {
  const { slug } = useParams();
  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event', 'embed', slug],
    queryFn: () => getEventBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });
  const event = eventResponse?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Ładowanie wydarzenia...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Nie znaleziono wydarzenia.</p>
      </div>
    );
  }

  if (!isExternalRegistrationEvent(event)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-lg font-semibold">To wydarzenie używa formularza Zmierzymy Czas.</p>
          <Button asChild>
            <Link to={`/events/${event.slug}/register`}>Przejdź do zapisów</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <ExternalRegistrationFrame
          event={event}
          active={isExternalRegistrationActive(event)}
          closedReason="Zewnętrzny formularz zapisów nie jest teraz aktywny."
        />
      </div>
    </div>
  );
};

export default EventRegistrationEmbed;
