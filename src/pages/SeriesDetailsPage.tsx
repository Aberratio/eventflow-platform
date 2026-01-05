import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockSeries, mockEvents, seriesTypeLabels, seriesTypeIcons, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { Calendar, MapPin, Users, ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  upcoming: 'Nadchodząca',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  upcoming: 'outline',
};

const SeriesDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const series = mockSeries.find(s => s.slug === slug);

  if (!series) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Seria nie została znaleziona</h1>
          <Button asChild>
            <Link to="/series">Wróć do listy serii</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const seriesEvents = mockEvents.filter(e => series.eventIds.includes(e.id));
  const totalParticipants = seriesEvents.reduce(
    (sum, e) => sum + e.distances.reduce((s, d) => s + d.registeredCount, 0),
    0
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/series">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do serii
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="text-sm">
              {seriesTypeIcons[series.type]} {seriesTypeLabels[series.type]}
            </Badge>
            <Badge variant={statusVariants[series.status]}>
              {statusLabels[series.status]}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
          
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span>Organizator: {series.organizerName}</span>
            {series.startDate && series.endDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(series.startDate), 'd MMM yyyy', { locale: pl })} - {format(new Date(series.endDate), 'd MMM yyyy', { locale: pl })}
              </span>
            )}
            {totalParticipants > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalParticipants.toLocaleString()} uczestników
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-3">O serii</h2>
            <p className="text-muted-foreground whitespace-pre-line">{series.description}</p>
          </CardContent>
        </Card>

        {/* Rules (if available) */}
        {series.rules && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Regulamin punktacji
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">{series.rules}</p>
            </CardContent>
          </Card>
        )}

        {/* Events in series */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Wydarzenia w serii ({seriesEvents.length})
          </h2>
          
          {seriesEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {seriesEvents.map((event) => {
                const isPast = new Date(event.date) < new Date();
                const registeredCount = event.distances.reduce((s, d) => s + d.registeredCount, 0);
                
                return (
                  <Card key={event.id} className="hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl shrink-0">{disciplineIcons[event.discipline]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {disciplineLabels[event.discipline]}
                            </Badge>
                            {isPast && (
                              <Badge variant="secondary" className="text-xs">Zakończone</Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold mb-2 line-clamp-2">{event.name}</h3>
                          
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                            </span>
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {event.city}
                            </span>
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {registeredCount} uczestników
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {event.distances.slice(0, 3).map((d) => (
                              <Badge key={d.id} variant="outline" className="text-xs">
                                {d.length}{d.unit}
                              </Badge>
                            ))}
                            {event.distances.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{event.distances.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <Button asChild size="sm" variant={isPast ? 'outline' : 'default'}>
                            <Link to={`/events/${event.slug}`}>
                              {isPast ? 'Zobacz wyniki' : 'Szczegóły'}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Brak wydarzeń w tej serii. Wkrótce zostaną dodane!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SeriesDetailsPage;
