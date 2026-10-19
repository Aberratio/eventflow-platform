import { getEvents, getSeriesBySlug, getSeriesRanking } from '@/api';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { QueryErrorState } from '@/components/ui/query-error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, ArrowLeft } from 'lucide-react';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { SeriesHero } from './series/SeriesHero';
import { SeriesStandingsTable, type SeriesStanding } from './series/SeriesStandingsTable';
import { SeriesEventsList } from './series/SeriesEventsList';
import { QUERY_KEYS } from '@/constants';

const SeriesDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const {
    data: seriesData,
    isLoading: seriesLoading,
    isError: seriesError,
    refetch: refetchSeries,
  } = useQuery({
    queryKey: slug ? QUERY_KEYS.seriesBySlug(slug) : ['series'],
    queryFn: () => getSeriesBySlug(slug!),
    enabled: !!slug,
  });
  const { data: eventsData } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getEvents(),
  });
  const seriesId = seriesData?.data?.id;
  const { data: rankingData } = useQuery({
    queryKey: ['series-ranking', seriesId],
    queryFn: () => getSeriesRanking(seriesId!),
    enabled: !!seriesId,
  });
  const series = seriesData?.data;
  const allEvents = eventsData?.data ?? [];

  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'K'>('all');

  const seriesEvents = useMemo(() => {
    if (!series) return [];
    return allEvents.filter((event) => series.eventIds.includes(event.id));
  }, [allEvents, series]);

  const completedEvents = useMemo(() => {
    return seriesEvents.filter((e) => e.publicationStatus === 'finished');
  }, [seriesEvents]);

  // The server sums the series' challenge rankings (E6.6); it owns ordering and ties.
  const ranking = rankingData?.data;
  const standings = useMemo(
    (): SeriesStanding[] =>
      (ranking?.entries ?? []).map((entry) => ({
        userId: entry.userId,
        userName: entry.name,
        totalPoints: entry.points,
        eventsCount: 0,
        eventPoints: {},
        rank: entry.rank,
        isAnonymized: entry.isAnonymized,
      })),
    [ranking],
  );

  if (seriesLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">Ładowanie serii...</div>
      </Layout>
    );
  }

  if (seriesError && !series) {
    return (
      <Layout>
        <div className="container py-12">
          <QueryErrorState onRetry={() => void refetchSeries()} />
        </div>
      </Layout>
    );
  }

  if (!series) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Seria nie została znaleziona</h1>
          <Button asChild>
            <Link to="/series">Wróć do listy serii</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleExportCSV = () => {
    const data = standings.map((s, i) => ({
      Pozycja: i + 1,
      Zawodnik: s.userName,
      Punkty: s.totalPoints,
      Starty: s.eventsCount,
    }));
    exportToCSV(data, `klasyfikacja-${series.slug}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    const columns = ['Poz.', 'Zawodnik', 'Punkty', 'Starty'];
    const rows = standings.map((s, i) => [
      String(i + 1),
      s.userName,
      String(s.totalPoints),
      String(s.eventsCount),
    ]);
    generatePrintableHTML(`Klasyfikacja generalna - ${series.name}`, columns, rows);
  };

  const showStandings =
    (series.type === 'cup' || series.type === 'championship') && standings.length > 0;

  const clearFilters = () => setGenderFilter('all');

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/series">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wszystkie serie
          </Link>
        </Button>

        <SeriesHero series={series} />

        {series.rules && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Regulamin punktacji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{series.rules}</p>
            </CardContent>
          </Card>
        )}

        {showStandings && (
          <SeriesStandingsTable
            standings={standings}
            serverRanking={{ hasPoints: ranking?.hasPoints ?? true }}
            completedEvents={completedEvents}
            genderFilter={genderFilter}
            onGenderFilterChange={setGenderFilter}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onClearFilters={clearFilters}
          />
        )}

        <SeriesEventsList events={seriesEvents} />
      </div>
    </Layout>
  );
};

export default SeriesDetailsPage;
