import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Event, Registration, Result } from '@/types';
import { ArrowRight } from 'lucide-react';
import { ListContainer, EventListRow } from '@/components/lists';

interface FeaturedEventsProps {
  events: Event[];
  userRegistrations: Registration[];
  userResults: Result[];
}

export const FeaturedEvents = ({ events, userRegistrations, userResults }: FeaturedEventsProps) => {
  const featuredEvents = events
    .filter(e => !e.isPrivate && e.featured && e.status === 'published')
    .slice(0, 4);

  if (featuredEvents.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Wyróżnione wydarzenia</h2>
            <p className="text-muted-foreground mt-1">Najciekawsze zawody w tym sezonie</p>
          </div>
          <Button asChild variant="ghost" className="gap-2 hidden sm:flex">
            <Link to="/events">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <ListContainer>
          {featuredEvents.map(event => (
            <EventListRow
              key={event.id}
              event={event}
              userRegistrations={userRegistrations}
              userResults={userResults}
            />
          ))}
        </ListContainer>
        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/events">
              Zobacz wszystkie wydarzenia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
