import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/EventCard';
import { Event, Registration, Result } from '@/types';
import { ArrowRight } from 'lucide-react';

interface UpcomingEventsProps {
  events: Event[];
  userRegistrations: Registration[];
  userResults: Result[];
}

export const UpcomingEvents = ({ events, userRegistrations, userResults }: UpcomingEventsProps) => {
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date) > now && e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  if (upcomingEvents.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Nadchodzące wydarzenia</h2>
            <p className="text-muted-foreground mt-1">Najbliższe zawody w kalendarzu</p>
          </div>
          <Button asChild variant="ghost" className="gap-2 hidden sm:flex">
            <Link to="/events">
              Zobacz kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              userRegistrations={userRegistrations}
              userResults={userResults}
              variant="compact"
            />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/events">
              Zobacz pełny kalendarz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
