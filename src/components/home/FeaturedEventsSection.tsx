import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { ArrowRight, Star, Calendar, MapPin } from 'lucide-react';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface FeaturedEventsSectionProps {
  events: Event[];
}

export const FeaturedEventsSection = ({ events }: FeaturedEventsSectionProps) => {
  const featuredEvents = events
    .filter(e => e.featured && e.status === 'published')
    .slice(0, 4);

  if (featuredEvents.length === 0) return null;

  return (
    <section className="relative py-10 md:py-14 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-warning rounded-full shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold leading-tight">Polecane wydarzenia</h2>
                <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-warning" />
                  Sponsorowane
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Wyróżnione zawody w tym sezonie</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-muted-foreground hover:text-foreground">
            <Link to="/events">
              Wszystkie
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featuredEvents.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="group flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-warning/30 hover:bg-accent/50 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-muted shrink-0 group-hover:bg-warning/10 transition-colors">
                <DisciplineIcon discipline={event.discipline} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight group-hover:text-foreground transition-colors line-clamp-2">
                  {event.name}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.city}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {event.distances.slice(0, 3).map(d => (
                    <Badge key={d.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {d.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/events">
              Wszystkie wydarzenia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
