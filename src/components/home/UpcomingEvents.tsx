import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Event, Registration } from '@/types';
import { ArrowRight } from 'lucide-react';
import { ListContainer, EventListRow } from '@/components/lists';

interface UpcomingEventsProps {
  events: Event[];
  userRegistrations: Registration[];
}

export const UpcomingEvents = ({ events, userRegistrations }: UpcomingEventsProps) => {
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date) > now && e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  if (upcomingEvents.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Nadchodzące wydarzenia</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Najbliższe zawody w kalendarzu</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/events">
              Kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <ListContainer>
          {upcomingEvents.map(event => (
            <EventListRow
              key={event.id}
              event={event}
              userRegistrations={userRegistrations}
            />
          ))}
        </ListContainer>
        
        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/events">
              Zobacz kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
