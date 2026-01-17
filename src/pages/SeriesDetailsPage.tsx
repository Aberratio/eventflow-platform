import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy,
  ArrowLeft,
  Globe,
  Target,
  Award,
  Medal,
  Filter,
  Download,
  FileText,
  Printer,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { mockSeries, mockEvents, mockResults, seriesTypeLabels, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const seriesTypeColors: Record<string, string> = {
  virtual: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  local: 'bg-green-500/10 text-green-600 border-green-500/20',
  championship: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  cup: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const seriesTypeIcons: Record<string, React.ReactNode> = {
  virtual: <Globe className="h-4 w-4" />,
  local: <MapPin className="h-4 w-4" />,
  championship: <Trophy className="h-4 w-4" />,
  cup: <Target className="h-4 w-4" />,
};

const ageCategories = [
  { id: 'all', label: 'Wszystkie kategorie' },
  { id: '18-29', label: '18-29 lat' },
  { id: '30-39', label: '30-39 lat' },
  { id: '40-49', label: '40-49 lat' },
  { id: '50-59', label: '50-59 lat' },
  { id: '60+', label: '60+ lat' },
];

const genderOptions = [
  { id: 'all', label: 'Open' },
  { id: 'M', label: 'Mężczyźni' },
  { id: 'K', label: 'Kobiety' },
];

interface SeriesStanding {
  userId: string;
  userName: string;
  totalPoints: number;
  eventsCount: number;
  eventPoints: Record<string, number>;
  gender?: 'M' | 'K';
  birthYear?: number;
}

const getPointsForPosition = (position: number): number => {
  const pointsTable: Record<number, number> = {
    1: 100, 2: 80, 3: 60, 4: 50, 5: 45,
    6: 40, 7: 36, 8: 32, 9: 29, 10: 26,
  };
  if (position <= 10) return pointsTable[position];
  if (position <= 20) return Math.max(25 - (position - 10), 1);
  return 1;
};

const calculateAge = (birthYear?: number): number | null => {
  if (!birthYear) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

const isInAgeCategory = (age: number | null, category: string): boolean => {
  if (age === null) return false;
  switch (category) {
    case '18-29': return age >= 18 && age <= 29;
    case '30-39': return age >= 30 && age <= 39;
    case '40-49': return age >= 40 && age <= 49;
    case '50-59': return age >= 50 && age <= 59;
    case '60+': return age >= 60;
    default: return true;
  }
};

const SeriesDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const series = mockSeries.find(s => s.slug === slug);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'K'>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [genderDrawerOpen, setGenderDrawerOpen] = useState(false);
  const [ageDrawerOpen, setAgeDrawerOpen] = useState(false);

  const handleExportCSV = () => {
    if (!series) return;
    const data = filteredStandings.map((s, i) => ({
      'Pozycja': i + 1,
      'Zawodnik': s.userName,
      'Punkty': s.totalPoints,
      'Starty': s.eventsCount,
    }));
    exportToCSV(data, `klasyfikacja-${series.slug}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    if (!series) return;
    const columns = ['Poz.', 'Zawodnik', 'Punkty', 'Starty'];
    const rows = filteredStandings.map((s, i) => [
      String(i + 1),
      s.userName,
      String(s.totalPoints),
      String(s.eventsCount),
    ]);
    generatePrintableHTML(`Klasyfikacja generalna - ${series.name}`, columns, rows);
  };

  const seriesEvents = useMemo(() => {
    if (!series) return [];
    return mockEvents.filter(event => series.eventIds.includes(event.id));
  }, [series]);

  const completedEvents = useMemo(() => {
    return seriesEvents.filter(e => e.status === 'completed');
  }, [seriesEvents]);

  const standings = useMemo((): SeriesStanding[] => {
    if (!series || completedEvents.length === 0) return [];

    const standingsMap = new Map<string, SeriesStanding>();

    completedEvents.forEach(event => {
      const eventResults = mockResults.filter(r => r.eventId === event.id);
      
      eventResults.forEach(result => {
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
        // Update gender and birthYear if not set
        if (!standing.gender && result.gender) standing.gender = result.gender;
        if (!standing.birthYear && result.birthYear) standing.birthYear = result.birthYear;
      });
    });

    return Array.from(standingsMap.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.eventsCount - a.eventsCount;
      });
  }, [series, completedEvents]);

  const filteredStandings = useMemo(() => {
    return standings.filter(standing => {
      // Gender filter
      if (genderFilter !== 'all' && standing.gender !== genderFilter) {
        return false;
      }
      
      // Age category filter
      if (ageFilter !== 'all') {
        const age = calculateAge(standing.birthYear);
        if (!isInAgeCategory(age, ageFilter)) {
          return false;
        }
      }
      
      return true;
    });
  }, [standings, genderFilter, ageFilter]);

  if (!series) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Seria nie została znaleziona</h1>
          <Button asChild>
            <Link to="/series">Wróć do listy serii</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getPositionDisplay = (position: number) => {
    if (position === 1) return <span className="text-amber-500 font-bold">🥇 1</span>;
    if (position === 2) return <span className="text-slate-400 font-bold">🥈 2</span>;
    if (position === 3) return <span className="text-amber-700 font-bold">🥉 3</span>;
    return position;
  };

  const showStandings = (series.type === 'cup' || series.type === 'championship') && standings.length > 0;

  const getGenderLabel = (id: string) => genderOptions.find(o => o.id === id)?.label || 'Open';
  const getAgeLabel = (id: string) => ageCategories.find(c => c.id === id)?.label || 'Wszystkie kategorie';

  const hasActiveFilters = genderFilter !== 'all' || ageFilter !== 'all';

  const clearFilters = () => {
    setGenderFilter('all');
    setAgeFilter('all');
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/series">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wszystkie serie
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant="outline" 
              className={`${seriesTypeColors[series.type]} flex items-center gap-1`}
            >
              {seriesTypeIcons[series.type]}
              {seriesTypeLabels[series.type]}
            </Badge>
            <Badge variant={series.status === 'active' ? 'default' : 'secondary'}>
              {series.status === 'active' ? 'Aktywna' : series.status === 'completed' ? 'Zakończona' : 'Nadchodząca'}
            </Badge>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{series.name}</h1>
          
          <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {series.organizerName}
            </span>
            {series.startDate && series.endDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(series.startDate).toLocaleDateString('pl-PL')} - {new Date(series.endDate).toLocaleDateString('pl-PL')}
              </span>
            )}
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl">
            {series.description}
          </p>
        </div>

        {/* Rules */}
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

        {/* General standings */}
        {showStandings && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" />
                Klasyfikacja generalna
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Eksport
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="h-4 w-4 mr-2" /> Pobierz CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Printer className="h-4 w-4 mr-2" /> Drukuj PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {/* Simple filter - just gender toggle */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <ToggleGroup 
                  type="single" 
                  value={genderFilter} 
                  onValueChange={(value) => value && setGenderFilter(value as 'all' | 'M' | 'K')}
                  className="bg-muted/50 rounded-lg p-1"
                >
                  {genderOptions.map(option => (
                    <ToggleGroupItem 
                      key={option.id} 
                      value={option.id}
                      className="px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm text-sm"
                    >
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Table or empty state */}
              {filteredStandings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Brak zawodników spełniających kryteria</p>
                  <Button variant="link" onClick={clearFilters}>
                    Wyczyść filtry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Poz.</TableHead>
                          <TableHead>Zawodnik</TableHead>
                          {completedEvents.map(event => (
                            <TableHead key={event.id} className="text-center min-w-24">
                              <Link 
                                to={`/events/${event.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name}
                              </Link>
                            </TableHead>
                          ))}
                          <TableHead className="text-center font-bold">Suma</TableHead>
                          <TableHead className="text-center">Starty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStandings.map((standing, index) => (
                          <TableRow 
                            key={standing.userId}
                            className={index < 3 ? 'bg-muted/30' : ''}
                          >
                            <TableCell className="font-medium">
                              {getPositionDisplay(index + 1)}
                            </TableCell>
                            <TableCell>
                              <Link 
                                to={`/athlete/${standing.userId}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {standing.userName}
                              </Link>
                            </TableCell>
                            {completedEvents.map(event => (
                              <TableCell key={event.id} className="text-center">
                                {standing.eventPoints[event.id] ? (
                                  <span className="font-medium">{standing.eventPoints[event.id]}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-bold text-primary">
                              {standing.totalPoints}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {standing.eventsCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Points legend */}
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Punktacja:</strong> 1. miejsce - 100 pkt, 2. miejsce - 80 pkt, 3. miejsce - 60 pkt, 
                      4. miejsce - 50 pkt, 5. miejsce - 45 pkt, 6-10 miejsce - od 40 do 26 pkt
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events in series */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Wydarzenia w serii ({seriesEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seriesEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Brak wydarzeń w tej serii
              </p>
            ) : (
              <div className="space-y-4">
                {seriesEvents.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{disciplineIcons[event.discipline]}</span>
                        <div>
                          <h3 className="font-semibold">{event.name}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString('pl-PL')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.distances.map(d => (
                              <Badge key={d.id} variant="outline" className="text-xs">
                                {d.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={event.status === 'published' ? 'default' : event.status === 'completed' ? 'secondary' : 'outline'}
                      >
                        {event.status === 'published' ? 'Otwarta rejestracja' : event.status === 'completed' ? 'Zakończone' : 'Wersja robocza'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SeriesDetailsPage;