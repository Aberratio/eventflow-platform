import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Calendar, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { Event } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface LiveResultsSectionProps {
  events: Event[];
}

export const LiveResultsSection = ({ events }: LiveResultsSectionProps) => {
  // Get live events
  const today = new Date().toISOString().split('T')[0];
  const liveEvents = events.filter(e => 
    e.isLive || (e.liveResultsUrl && e.date === today)
  ).slice(0, 4);

  if (liveEvents.length === 0) return null;

  return (
    <section className="relative py-8 md:py-12 bg-destructive/5 border-y border-destructive/10 animate-fade-in overflow-hidden">
      {/* Radial gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--destructive)/0.06)_0%,_transparent_70%)]" />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="relative">
                <Radio className="h-5 w-5 text-destructive" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Wyniki na żywo</h2>
            </div>
            <p className="text-sm text-muted-foreground">Śledź aktualnie trwające zawody</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/wyniki/live">
              Wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveEvents.map(event => (
            <Card key={event.id} className="border-destructive/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-destructive/40 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Live indicator */}
                  <div className="bg-destructive/10 p-4 flex items-center justify-center w-16 shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <span className="h-2.5 w-2.5 bg-destructive rounded-full animate-pulse" />
                      <span className="text-destructive font-bold text-xs">LIVE</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-medium truncate block mb-1">{event.name}</span>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.date), 'd MMM', { locale: pl })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.city}
                          </span>
                        </div>
                      </div>
                      {event.liveResultsUrl && (
                        <Button size="sm" className="shrink-0" asChild>
                          <a href={event.liveResultsUrl} target="_blank" rel="noopener noreferrer">
                            LIVE
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/wyniki/live">
              Wszystkie transmisje
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
