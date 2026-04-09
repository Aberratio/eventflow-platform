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
    .filter((e) => !e.isPrivate && e.featured && e.status === 'published')
    .slice(0, 4);

  if (featuredEvents.length === 0) return null;

  return (
    <section className="relative py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 shrink-0 rounded-full bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.3)]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold leading-tight md:text-2xl">Polecane wydarzenia</h2>
                <Badge variant="outline" className="border-warning/30 text-[10px] text-warning">
                  <Star className="mr-0.5 h-2.5 w-2.5 fill-warning" />
                  Sponsorowane
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Wyróżnione zawody w tym sezonie
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-muted-foreground hover:text-foreground sm:flex"
          >
            <Link to="/events">
              Wszystkie
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {featuredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-warning/30 hover:bg-accent/50"
            >
              <div className="shrink-0 rounded-lg bg-muted p-2 transition-colors group-hover:bg-warning/10">
                <DisciplineIcon discipline={event.discipline} size="md" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-foreground">
                  {event.name}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.city}
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {event.distances.slice(0, 3).map((d) => (
                    <Badge key={d.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
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
