import { getEvents, getResultsByUser, disciplineLabels } from '@/api';
import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicationStatusBadge } from '@/components/results/PublicationStatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Trophy, Medal, Target, Calendar, MapPin } from 'lucide-react';
import { formatTimeToWholeSeconds } from '@/lib/utils';

const AthleteProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'athlete-profile'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true, pageSize: 1000 }),
  });
  const events = eventsResponse?.data ?? [];

  const { data: resultsResponse } = useQuery({
    queryKey: ['results-by-user', userId],
    queryFn: () => getResultsByUser(userId!),
    enabled: Boolean(userId),
  });
  const userResults = resultsResponse?.data ?? [];

  const athleteResults = useMemo(() => {
    return userResults.sort((a, b) => {
      const eventA = events.find((e) => e.id === a.eventId);
      const eventB = events.find((e) => e.id === b.eventId);
      return new Date(eventB?.date || 0).getTime() - new Date(eventA?.date || 0).getTime();
    });
  }, [events, userResults]);

  const athleteName = athleteResults[0]?.userName || 'Nieznany zawodnik';

  const personalRecords = useMemo(() => {
    const prMap = new Map<string, (typeof athleteResults)[0]>();

    athleteResults
      .filter((r) => r.status === 'finished')
      .forEach((result) => {
        const existing = prMap.get(result.distanceName);
        if (!existing || result.timeInSeconds < existing.timeInSeconds) {
          prMap.set(result.distanceName, result);
        }
      });

    return Array.from(prMap.values()).sort((a, b) => {
      const distA = parseFloat(a.distanceName) || 0;
      const distB = parseFloat(b.distanceName) || 0;
      return distA - distB;
    });
  }, [athleteResults]);

  const stats = useMemo(() => {
    const finishedRaces = athleteResults.filter((r) => r.status === 'finished').length;
    const totalRaces = athleteResults.length;
    const podiums = athleteResults.filter((r) => r.position <= 3 && r.status === 'finished').length;

    return { finishedRaces, totalRaces, podiums };
  }, [athleteResults]);

  const getEventDetails = (eventId: string) => {
    return events.find((e) => e.id === eventId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return (
          <Badge variant="default" className="bg-success">
            Ukończył
          </Badge>
        );
      case 'dnf':
        return <Badge variant="secondary">DNF</Badge>;
      case 'dns':
        return <Badge variant="secondary">DNS</Badge>;
      case 'dsq':
        return <Badge variant="destructive">DSQ</Badge>;
      default:
        return null;
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-warning" />;
    if (position === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (position === 3) return <Medal className="h-4 w-4 text-warning/70" />;
    return null;
  };

  if (athleteResults.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="pt-6">
              <p className="mb-4 text-muted-foreground">
                Brak dostępnych wyników dla tego zawodnika.
              </p>
              <Button asChild>
                <Link to="/results">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wróć do wyników
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/results">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do wyników
            </Link>
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{athleteName}</h1>
              <p className="text-muted-foreground">Profil zawodnika</p>
            </div>

            <div className="flex gap-4">
              <Card className="px-4 py-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.finishedRaces}</div>
                  <div className="text-xs text-muted-foreground">Ukończonych</div>
                </div>
              </Card>
              <Card className="px-4 py-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalRaces}</div>
                  <div className="text-xs text-muted-foreground">Startów</div>
                </div>
              </Card>
              <Card className="px-4 py-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.podiums}</div>
                  <div className="text-xs text-muted-foreground">Podium</div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Personal Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rekordy osobiste
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personalRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dystans</TableHead>
                      <TableHead>Czas</TableHead>
                      <TableHead className="hidden sm:table-cell">Wydarzenie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personalRecords.map((pr) => {
                      const event = getEventDetails(pr.eventId);
                      return (
                        <TableRow key={pr.id}>
                          <TableCell className="font-medium">{pr.distanceName}</TableCell>
                          <TableCell className="font-mono">{pr.time}</TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {event?.name}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-4 text-center text-muted-foreground">Brak ukończonych zawodów</p>
              )}
            </CardContent>
          </Card>

          {/* Race History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historia startów
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {athleteResults.map((result) => {
                  const event = getEventDetails(result.eventId);
                  if (!event) return null;

                  return (
                    <div
                      key={result.id}
                      className="flex flex-col gap-2 rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/events/${event.slug}`}
                            className="line-clamp-1 font-medium transition-colors hover:text-primary hover:underline"
                          >
                            {event.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.city}</span>
                            <span>•</span>
                            <span>{new Date(event.date).toLocaleDateString('pl-PL')}</span>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.distanceName}</Badge>
                          <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
                          <PublicationStatusBadge status={result.publicationStatus} />
                        </div>

                        {(result.status === 'finished' ||
                          (result.status === 'dnf' && result.time)) && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">
                              {formatTimeToWholeSeconds(result.time)}
                            </span>
                            {result.netTime && (
                              <span className="font-mono text-xs text-muted-foreground">
                                (netto {formatTimeToWholeSeconds(result.netTime)})
                              </span>
                            )}
                            {result.status === 'finished' && (
                              <div className="flex items-center gap-1">
                                {getPositionIcon(result.position)}
                                <span className="text-muted-foreground">
                                  #{result.position} (kat. #{result.categoryPosition})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AthleteProfilePage;
