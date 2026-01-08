import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Search, Users, ChevronRight, Trophy, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { mockResults, mockEvents, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { SportDiscipline } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const allDisciplines: SportDiscipline[] = ['running', 'cycling', 'triathlon', 'multisport'];

const sortOptions = [
  { value: 'name-asc', label: 'Nazwisko A-Z' },
  { value: 'name-desc', label: 'Nazwisko Z-A' },
  { value: 'starts-desc', label: 'Najwięcej startów' },
  { value: 'starts-asc', label: 'Najmniej startów' },
];

interface AthleteData {
  userId: string;
  name: string;
  racesCount: number;
  podiumCount: number;
  disciplines: SportDiscipline[];
}

const AthletesPage = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<SportDiscipline | 'all'>('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Create event map for quick lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, SportDiscipline>();
    mockEvents.forEach(event => {
      map.set(event.id, event.discipline);
    });
    return map;
  }, []);

  // Collect unique athletes from results
  const athletes = useMemo(() => {
    const athleteMap = new Map<string, AthleteData>();

    mockResults.forEach(result => {
      const discipline = eventMap.get(result.eventId);
      
      if (!athleteMap.has(result.userId)) {
        athleteMap.set(result.userId, {
          userId: result.userId,
          name: result.userName,
          racesCount: 0,
          podiumCount: 0,
          disciplines: [],
        });
      }
      const athlete = athleteMap.get(result.userId)!;
      athlete.racesCount++;
      
      if (result.position && result.position <= 3 && result.status === 'finished') {
        athlete.podiumCount++;
      }
      
      if (discipline && !athlete.disciplines.includes(discipline)) {
        athlete.disciplines.push(discipline);
      }
    });

    return Array.from(athleteMap.values());
  }, [eventMap]);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    const filtered = athletes.filter(athlete => {
      // Text filter
      if (searchQuery && !athlete.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Discipline filter
      if (disciplineFilter !== 'all' && !athlete.disciplines.includes(disciplineFilter)) {
        return false;
      }
      
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pl');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pl');
        case 'starts-desc':
          return b.racesCount - a.racesCount;
        case 'starts-asc':
          return a.racesCount - b.racesCount;
        default:
          return 0;
      }
    });
  }, [athletes, searchQuery, disciplineFilter, sortBy]);

  const clearFilters = () => {
    setDisciplineFilter('all');
    setSortBy('name-asc');
    setSearchQuery('');
  };

  const hasActiveFilters = disciplineFilter !== 'all' || searchQuery;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Zawodnicy</h1>
          <p className="text-muted-foreground">
            Znajdź profil zawodnika i sprawdź jego wyniki
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Szukaj po imieniu lub nazwisku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isMobile && (
              <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Filtry i sortowanie</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Dyscyplina</label>
                      <Select value={disciplineFilter} onValueChange={(v) => setDisciplineFilter(v as SportDiscipline | 'all')}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Wszystkie</SelectItem>
                          {allDisciplines.map(d => (
                            <SelectItem key={d} value={d}>
                              {disciplineIcons[d]} {disciplineLabels[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sortowanie</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button>Zastosuj</Button>
                    </DrawerClose>
                    <Button variant="outline" onClick={clearFilters}>
                      Wyczyść filtry
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            )}
          </div>

          {/* Desktop filters */}
          {!isMobile && (
            <div className="flex flex-wrap items-center gap-3">
              <Select value={disciplineFilter} onValueChange={(v) => setDisciplineFilter(v as SportDiscipline | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Dyscyplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {allDisciplines.map(d => (
                    <SelectItem key={d} value={d}>
                      {disciplineIcons[d]} {disciplineLabels[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Wyczyść
                </Button>
              )}
            </div>
          )}

          {/* Active filter badge (mobile) */}
          {isMobile && disciplineFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {disciplineLabels[disciplineFilter]}
              <button onClick={() => setDisciplineFilter('all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Stats */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredAthletes.length} zawodników
        </p>

        {/* Athletes Grid */}
        {filteredAthletes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredAthletes.map((athlete) => (
              <Link key={athlete.userId} to={`/athlete/${athlete.userId}`}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{athlete.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {athlete.racesCount} startów
                          {athlete.podiumCount > 0 && (
                            <span className="ml-2">
                              <Trophy className="h-3 w-3 text-yellow-500 inline mr-0.5" />
                              {athlete.podiumCount}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">
              Nie znaleziono zawodników
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AthletesPage;
