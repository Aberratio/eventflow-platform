import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Search, Users, ChevronRight, Trophy, X, SlidersHorizontal, Activity, Medal, ArrowUpDown } from 'lucide-react';
import { mockResults, mockEvents, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { SportDiscipline } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const startsOptions = [
  { value: 'all', label: 'Wszystkie' },
  { value: '1-5', label: '1-5 startów' },
  { value: '6-10', label: '6-10 startów' },
  { value: '10+', label: '10+ startów' },
];

const podiumOptions = [
  { value: 'all', label: 'Wszystkie' },
  { value: '0', label: 'Bez podium' },
  { value: '1+', label: '1+ podium' },
  { value: '3+', label: '3+ podium' },
];

const allDisciplines: SportDiscipline[] = ['running', 'cycling', 'triathlon', 'multisport'];

const sortOptions = [
  { value: 'name-asc', label: 'Nazwisko A-Z' },
  { value: 'name-desc', label: 'Nazwisko Z-A' },
  { value: 'starts-desc', label: 'Najwięcej startów' },
  { value: 'starts-asc', label: 'Najmniej startów' },
  { value: 'podium-desc', label: 'Najwięcej podium' },
  { value: 'podium-asc', label: 'Najmniej podium' },
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
  const [disciplineFilter, setDisciplineFilter] = useState<SportDiscipline[]>([]);
  const [startsFilter, setStartsFilter] = useState('all');
  const [podiumFilter, setPodiumFilter] = useState('all');
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

  // Collect unique athletes from results with discipline data
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

    return Array.from(athleteMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'pl')
    );
  }, [eventMap]);

  // Rankings
  const rankings = useMemo(() => {
    const sortedByStarts = [...athletes].sort((a, b) => b.racesCount - a.racesCount).slice(0, 10);
    const sortedByPodiums = [...athletes].sort((a, b) => b.podiumCount - a.podiumCount).slice(0, 10);
    
    return {
      mostActive: sortedByStarts,
      mostPodiums: sortedByPodiums.filter(a => a.podiumCount > 0),
    };
  }, [athletes]);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    const filtered = athletes.filter(athlete => {
      // Text filter
      if (searchQuery && !athlete.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Discipline filter
      if (disciplineFilter.length > 0) {
        const hasMatchingDiscipline = disciplineFilter.some(d => 
          athlete.disciplines.includes(d)
        );
        if (!hasMatchingDiscipline) return false;
      }
      
      // Starts filter
      if (startsFilter !== 'all') {
        if (startsFilter === '1-5' && (athlete.racesCount < 1 || athlete.racesCount > 5)) return false;
        if (startsFilter === '6-10' && (athlete.racesCount < 6 || athlete.racesCount > 10)) return false;
        if (startsFilter === '10+' && athlete.racesCount < 10) return false;
      }
      
      // Podium filter
      if (podiumFilter !== 'all') {
        if (podiumFilter === '0' && athlete.podiumCount !== 0) return false;
        if (podiumFilter === '1+' && athlete.podiumCount < 1) return false;
        if (podiumFilter === '3+' && athlete.podiumCount < 3) return false;
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
        case 'podium-desc':
          return b.podiumCount - a.podiumCount;
        case 'podium-asc':
          return a.podiumCount - b.podiumCount;
        default:
          return 0;
      }
    });
  }, [athletes, searchQuery, disciplineFilter, startsFilter, podiumFilter, sortBy]);

  const toggleDiscipline = (discipline: SportDiscipline) => {
    setDisciplineFilter(prev => 
      prev.includes(discipline) 
        ? prev.filter(d => d !== discipline)
        : [...prev, discipline]
    );
  };

  const clearFilters = () => {
    setDisciplineFilter([]);
    setStartsFilter('all');
    setPodiumFilter('all');
    setSortBy('name-asc');
    setSearchQuery('');
  };

  const activeFiltersCount = disciplineFilter.length + 
    (startsFilter !== 'all' ? 1 : 0) + 
    (podiumFilter !== 'all' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0 || searchQuery;

  // Ranking item component
  const RankingItem = ({ athlete, index, stat, statLabel }: { 
    athlete: AthleteData; 
    index: number; 
    stat: number;
    statLabel: string;
  }) => (
    <Link to={`/athlete/${athlete.userId}`}>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
        <span className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          index === 0 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          index === 1 && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          index === 2 && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
          index > 2 && "bg-muted text-muted-foreground"
        )}>
          {index + 1}
        </span>
        <span className="flex-1 font-medium truncate text-sm">{athlete.name}</span>
        <Badge variant="secondary" className="shrink-0">
          {stat} {statLabel}
        </Badge>
      </div>
    </Link>
  );

  // Filter content (shared between desktop and mobile)
  const FilterContent = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <div className={cn("space-y-4", inDrawer && "p-4")}>
      {/* Discipline filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Dyscyplina</label>
        <div className="flex flex-wrap gap-2">
          {allDisciplines.map(discipline => (
            <Button
              key={discipline}
              variant={disciplineFilter.includes(discipline) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleDiscipline(discipline)}
              className="gap-1.5"
            >
              <span>{disciplineIcons[discipline]}</span>
              {disciplineLabels[discipline]}
            </Button>
          ))}
        </div>
      </div>

      {/* Starts filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Liczba startów</label>
        <Select value={startsFilter} onValueChange={setStartsFilter}>
          <SelectTrigger className={cn(inDrawer ? "w-full" : "w-[160px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {startsOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Podium filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Podium</label>
        <Select value={podiumFilter} onValueChange={setPodiumFilter}>
          <SelectTrigger className={cn(inDrawer ? "w-full" : "w-[160px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {podiumOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sortowanie</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={cn(inDrawer ? "w-full" : "w-[180px]")}>
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
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Zawodnicy</h1>
          <p className="text-muted-foreground">
            Znajdź profil zawodnika i sprawdź jego wyniki
          </p>
        </div>

        {/* Rankings Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Rankingi
          </h2>
          
          {isMobile ? (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="active" className="flex-1 gap-1.5">
                  <Activity className="h-4 w-4" />
                  Aktywni
                </TabsTrigger>
                <TabsTrigger value="podiums" className="flex-1 gap-1.5">
                  <Trophy className="h-4 w-4" />
                  Podium
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Najbardziej aktywni</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {rankings.mostActive.map((athlete, index) => (
                        <RankingItem 
                          key={athlete.userId} 
                          athlete={athlete} 
                          index={index} 
                          stat={athlete.racesCount}
                          statLabel="startów"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="podiums">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Najwięcej podium</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {rankings.mostPodiums.length > 0 ? rankings.mostPodiums.map((athlete, index) => (
                        <RankingItem 
                          key={athlete.userId} 
                          athlete={athlete} 
                          index={index} 
                          stat={athlete.podiumCount}
                          statLabel="podium"
                        />
                      )) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Brak zawodników z podium
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Najbardziej aktywni
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {rankings.mostActive.map((athlete, index) => (
                      <RankingItem 
                        key={athlete.userId} 
                        athlete={athlete} 
                        index={index} 
                        stat={athlete.racesCount}
                        statLabel="startów"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Najwięcej podium
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {rankings.mostPodiums.length > 0 ? rankings.mostPodiums.map((athlete, index) => (
                      <RankingItem 
                        key={athlete.userId} 
                        athlete={athlete} 
                        index={index} 
                        stat={athlete.podiumCount}
                        statLabel="podium"
                      />
                    )) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Brak zawodników z podium
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
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
                  <Button variant="outline" className="relative shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Filtry</DrawerTitle>
                  </DrawerHeader>
                  <FilterContent inDrawer />
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
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-wrap gap-2">
                {allDisciplines.map(discipline => (
                  <Button
                    key={discipline}
                    variant={disciplineFilter.includes(discipline) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDiscipline(discipline)}
                    className="gap-1.5"
                  >
                    <span>{disciplineIcons[discipline]}</span>
                    {disciplineLabels[discipline]}
                  </Button>
                ))}
              </div>

              <Select value={startsFilter} onValueChange={setStartsFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Starty" />
                </SelectTrigger>
                <SelectContent>
                  {startsOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={podiumFilter} onValueChange={setPodiumFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Podium" />
                </SelectTrigger>
                <SelectContent>
                  {podiumOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sortuj" />
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

          {/* Active filter badges (mobile) */}
          {isMobile && hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {disciplineFilter.map(discipline => (
                <Badge key={discipline} variant="secondary" className="gap-1">
                  {disciplineLabels[discipline]}
                  <button onClick={() => toggleDiscipline(discipline)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {startsFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {startsOptions.find(o => o.value === startsFilter)?.label}
                  <button onClick={() => setStartsFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {podiumFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {podiumOptions.find(o => o.value === podiumFilter)?.label}
                  <button onClick={() => setPodiumFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredAthletes.length} {filteredAthletes.length === 1 ? 'zawodnik' : 'zawodników'}
          {hasActiveFilters && ' (przefiltrowano)'}
        </p>

        {/* Athletes Grid */}
        {filteredAthletes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAthletes.map((athlete) => (
              <Link key={athlete.userId} to={`/athlete/${athlete.userId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{athlete.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{athlete.racesCount} startów</span>
                          {athlete.podiumCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              {athlete.podiumCount}
                            </span>
                          )}
                        </div>
                        {athlete.disciplines.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {athlete.disciplines.map(discipline => (
                              <span 
                                key={discipline} 
                                className="text-sm"
                                title={disciplineLabels[discipline]}
                              >
                                {disciplineIcons[discipline]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
