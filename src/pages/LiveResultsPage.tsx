import { mockEvents } from '@/api';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Calendar, MapPin, ExternalLink, Trophy } from 'lucide-react';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const LiveResultsPage = () => {
  // Get events that are currently live (have liveResultsUrl and isLive flag or today's date)
  const today = new Date().toISOString().split('T')[0];

  const liveEvents = mockEvents.filter((e) => e.isLive || (e.liveResultsUrl && e.date === today));

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="relative">
              <Radio className="h-8 w-8 text-destructive" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Wyniki na żywo</h1>
          </div>
          <p className="text-muted-foreground">
            Śledź wyniki aktualnie trwających zawodów w czasie rzeczywistym
          </p>
        </div>

        {liveEvents.length > 0 ? (
          <div className="space-y-4">
            {liveEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden border-destructive/20">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Live indicator */}
                    <div className="flex items-center justify-center bg-destructive/10 p-4 md:w-24 md:p-6">
                      <div className="flex items-center gap-2 md:flex-col md:gap-1">
                        <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
                        <span className="text-sm font-bold text-destructive">LIVE</span>
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <DisciplineIcon discipline={event.discipline} size="lg" />
                            <h2 className="text-xl font-semibold">{event.name}</h2>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {event.city}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {event.distances.map((d) => (
                              <Badge key={d.id} variant="secondary" className="text-xs">
                                {d.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {event.liveResultsUrl && (
                            <Button asChild>
                              <a
                                href={event.liveResultsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Radio className="mr-2 h-4 w-4" />
                                Zobacz LIVE
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" asChild>
                            <Link to={`/events/${event.slug}`}>Szczegóły</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Radio className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="mb-2 text-xl font-semibold">Brak aktywnych transmisji</h2>
              <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                Obecnie nie odbywają się żadne zawody z transmisją wyników na żywo. Sprawdź
                kalendarz nadchodzących wydarzeń lub przejrzyj archiwalne wyniki.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild variant="default">
                  <Link to="/wydarzenia">
                    <Calendar className="mr-2 h-4 w-4" />
                    Kalendarz wydarzeń
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/wyniki">
                    <Trophy className="mr-2 h-4 w-4" />
                    Archiwum wyników
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default LiveResultsPage;
