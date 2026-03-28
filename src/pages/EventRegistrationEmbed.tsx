import { useParams, Link } from 'react-router-dom';
import { mockEvents } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const EventRegistrationEmbed = () => {
  const { slug } = useParams();
  const event = mockEvents.find(e => e.slug === slug);

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground">Nie znaleziono wydarzenia.</p>
      </div>
    );
  }

  const isEmbedActive = () => {
    if (!event.registrationEmbed?.enabled) return true; // no config = always active
    const now = new Date();
    if (event.registrationEmbed.startDate && new Date(event.registrationEmbed.startDate) > now) return false;
    if (event.registrationEmbed.endDate && new Date(event.registrationEmbed.endDate) < now) return false;
    return true;
  };

  const active = isEmbedActive();
  const registrationOpen = event.registrationStatus !== 'closed' && new Date(event.registrationDeadline) >= new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branded header */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Zmierzymy Czas</p>
        </div>

        {/* Event card */}
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          {event.imageUrl && (
            <div className="h-40 overflow-hidden">
              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5 space-y-4">
            <h2 className="text-xl font-bold text-foreground">{event.name}</h2>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}, {event.city}</span>
              </div>
            </div>

            {/* Distances preview */}
            <div className="flex flex-wrap gap-2">
              {event.distances.map(d => (
                <Badge key={d.id} variant="secondary" className="text-xs">
                  {d.name} — {d.price} zł
                </Badge>
              ))}
            </div>

            {/* CTA */}
            {active && registrationOpen ? (
              <Button asChild className="w-full" size="lg">
                <a href={`/events/${event.slug}/register`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Zapisz się
                </a>
              </Button>
            ) : (
              <Button disabled className="w-full" size="lg">
                {!registrationOpen ? 'Zapisy zamknięte' : 'Zapisy niedostępne'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Rejestracja przez{' '}
          <a href="/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            ZmierzymyCzas.pl
          </a>
        </p>
      </div>
    </div>
  );
};

export default EventRegistrationEmbed;
