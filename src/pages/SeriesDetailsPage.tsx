import { mockEvents, mockResults, mockSeries } from '@/api';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, ArrowLeft } from 'lucide-react';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { SeriesHero } from './series/SeriesHero';
import { SeriesStandingsTable, type SeriesStanding } from './series/SeriesStandingsTable';
import { SeriesEventsList } from './series/SeriesEventsList';

const getPointsForPosition = (position: number): number => {
  const pointsTable: Record<number, number> = {
    1: 100,
    2: 80,
    3: 60,
    4: 50,
    5: 45,
    6: 40,
    7: 36,
    8: 32,
    9: 29,
    10: 26,
  };
  if (position <= 10) return pointsTable[position];
  if (position <= 20) return Math.max(25 - (position - 10), 1);
  return 1;
};

const calculateAge = (birthYear?: number): number | null => {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
};

const isInAgeCategory = (age: number | null, category: string): boolean => {
  if (age === null) return false;
  switch (category) {
    case '18-29':
      return age >= 18 && age <= 29;
    case '30-39':
      return age >= 30 && age <= 39;
    case '40-49':
      return age >= 40 && age <= 49;
    case '50-59':
      return age >= 50 && age <= 59;
    case '60+':
      return age >= 60;
    default:
      return true;
  }
};

const SeriesDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const series = mockSeries.find((s) => s.slug === slug);
  const { toast } = useToast();

  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'K'>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');

  const seriesEvents = useMemo(() => {
    if (!series) return [];
    return mockEvents.filter((event) => series.eventIds.includes(event.id));
  }, [series]);

  const completedEvents = useMemo(() => {
    return seriesEvents.filter((e) => e.status === 'past');
  }, [seriesEvents]);

  const standings = useMemo((): SeriesStanding[] => {
    if (!series || completedEvents.length === 0) return [];
    const standingsMap = new Map<string, SeriesStanding>();

    completedEvents.forEach((event) => {
      const eventResults = mockResults.filter((r) => r.eventId === event.id);
      eventResults.forEach((result) => {
        const points = getPointsForPosition(result.position);
        if (!standingsMap.has(result.userId)) {
          standingsMap.set(result.userId, {
            userId: result.userId,
            userName: result.userName,
            totalPoints: 0,
            eventsCount: 0,
            eventPoints: {},
            gender: result.gender,
            birthYear: result.birthYear,
          });
        }
        const standing = standingsMap.get(result.userId)!;
        standing.totalPoints += points;
        standing.eventsCount += 1;
        standing.eventPoints[event.id] = points;
        if (!standing.gender && result.gender) standing.gender = result.gender;
        if (!standing.birthYear && result.birthYear) standing.birthYear = result.birthYear;
      });
    });

    return Array.from(standingsMap.values()).sort((a, b) =>
      b.totalPoints !== a.totalPoints
        ? b.totalPoints - a.totalPoints
        : b.eventsCount - a.eventsCount,
    );
  }, [series, completedEvents]);

  const filteredStandings = useMemo(() => {
    return standings.filter((s) => {
      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
      if (ageFilter !== 'all') {
        const age = calculateAge(s.birthYear);
        if (!isInAgeCategory(age, ageFilter)) return false;
      }
      return true;
    });
  }, [standings, genderFilter, ageFilter]);

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
    const data = filteredStandings.map((s, i) => ({
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
    const rows = filteredStandings.map((s, i) => [
      String(i + 1),
      s.userName,
      String(s.totalPoints),
      String(s.eventsCount),
    ]);
    generatePrintableHTML(`Klasyfikacja generalna - ${series.name}`, columns, rows);
  };

  const showStandings =
    (series.type === 'cup' || series.type === 'championship') && standings.length > 0;

  const clearFilters = () => {
    setGenderFilter('all');
    setAgeFilter('all');
  };

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
            standings={filteredStandings}
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
