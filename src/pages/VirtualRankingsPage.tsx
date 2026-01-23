import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { mockEvents, mockVirtualResultSubmissions, mockUsers } from '@/data/mockData';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { Globe, Trophy, Filter, Download, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ageCategories = [
  { value: 'all', label: 'Wszystkie' },
  { value: '18-29', label: '18-29' },
  { value: '30-39', label: '30-39' },
  { value: '40-49', label: '40-49' },
  { value: '50-59', label: '50-59' },
  { value: '60+', label: '60+' },
];

const calculateAge = (birthYear?: number): number | null => {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
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

const VirtualRankingsPage = () => {
  const isMobile = useIsMobile();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedDistanceId, setSelectedDistanceId] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'K'>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Get all virtual events from mockEvents
  const virtualEvents = useMemo(() => {
    return mockEvents.filter(e => e.isVirtual);
  }, []);

  // Get approved submissions with user data
  const approvedSubmissions = useMemo(() => {
    return mockVirtualResultSubmissions
      .filter(sub => sub.status === 'approved')
      .map(sub => {
        const user = mockUsers.find(u => u.id === sub.userId);
        return {
          ...sub,
          gender: user?.gender,
          birthYear: user?.birthYear,
          club: user?.club,
        };
      });
  }, []);

  // Get available distances for selected event
  const availableDistances = useMemo(() => {
    if (selectedEventId === 'all') {
      const distances = new Map<string, string>();
      approvedSubmissions.forEach(sub => {
        distances.set(sub.distanceId, sub.distanceName);
      });
      return Array.from(distances.entries()).map(([id, name]) => ({ id, name }));
    }
    const event = virtualEvents.find(e => e.id === selectedEventId);
    return event?.distances.map(d => ({ id: d.id, name: d.name })) || [];
  }, [selectedEventId, virtualEvents, approvedSubmissions]);

  // Filter and sort submissions
  const filteredRankings = useMemo(() => {
    return approvedSubmissions
      .filter(sub => selectedEventId === 'all' || sub.eventId === selectedEventId)
      .filter(sub => selectedDistanceId === 'all' || sub.distanceId === selectedDistanceId)
      .filter(sub => genderFilter === 'all' || sub.gender === genderFilter)
      .filter(sub => {
        if (ageFilter === 'all') return true;
        const age = calculateAge(sub.birthYear);
        return isInAgeCategory(age, ageFilter);
      })
      .sort((a, b) => a.submittedTimeInSeconds - b.submittedTimeInSeconds);
  }, [approvedSubmissions, selectedEventId, selectedDistanceId, genderFilter, ageFilter]);

  // Group by distance for display
  const groupedByDistance = useMemo(() => {
    if (selectedDistanceId !== 'all') {
      return { [selectedDistanceId]: filteredRankings };
    }
    const groups: Record<string, typeof filteredRankings> = {};
    filteredRankings.forEach(sub => {
      if (!groups[sub.distanceId]) {
        groups[sub.distanceId] = [];
      }
      groups[sub.distanceId].push(sub);
    });
    return groups;
  }, [filteredRankings, selectedDistanceId]);

  const hasActiveFilters = selectedEventId !== 'all' || selectedDistanceId !== 'all' || genderFilter !== 'all' || ageFilter !== 'all';

  const clearFilters = () => {
    setSelectedEventId('all');
    setSelectedDistanceId('all');
    setGenderFilter('all');
    setAgeFilter('all');
  };

  const getPositionDisplay = (position: number) => {
    if (position === 1) return <span className="text-primary font-bold">🥇 1</span>;
    if (position === 2) return <span className="text-muted-foreground font-bold">🥈 2</span>;
    if (position === 3) return <span className="text-accent-foreground font-bold">🥉 3</span>;
    return position;
  };

  const handleExportCSV = () => {
    const data = filteredRankings.map((sub, i) => ({
      'Pozycja': i + 1,
      'Zawodnik': sub.userName,
      'Dystans': sub.distanceName,
      'Czas': sub.submittedTime,
      'Płeć': sub.gender || '-',
      'Wiek': sub.birthYear ? calculateAge(sub.birthYear) : '-',
    }));
    exportToCSV(data, 'ranking-wirtualny');
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    const columns = ['Poz.', 'Zawodnik', 'Dystans', 'Czas', 'Płeć'];
    const rows = filteredRankings.map((sub, i) => [
      String(i + 1),
      sub.userName,
      sub.distanceName,
      sub.submittedTime,
      sub.gender || '-',
    ]);
    generatePrintableHTML('Ranking wydarzeń wirtualnych', columns, rows);
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Płeć</label>
        <ToggleGroup 
          type="single" 
          value={genderFilter} 
          onValueChange={(v) => v && setGenderFilter(v as 'all' | 'M' | 'K')}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="flex-1">Wszyscy</ToggleGroupItem>
          <ToggleGroupItem value="M" className="flex-1">Mężczyźni</ToggleGroupItem>
          <ToggleGroupItem value="K" className="flex-1">Kobiety</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Kategoria wiekowa</label>
        <ToggleGroup 
          type="single" 
          value={ageFilter} 
          onValueChange={(v) => v && setAgeFilter(v)}
          className="flex-wrap justify-start"
        >
          {ageCategories.map(cat => (
            <ToggleGroupItem key={cat.value} value={cat.value}>
              {cat.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Ranking wirtualny</h1>
          </div>
          <p className="text-muted-foreground">
            Klasyfikacja uczestników wydarzeń wirtualnych na podstawie zatwierdzonych wyników.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Event & Distance Selects */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Filtry:</span>
                </div>
                <Select 
                  value={selectedEventId} 
                  onValueChange={(v) => {
                    setSelectedEventId(v);
                    setSelectedDistanceId('all');
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Wydarzenie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie wydarzenia</SelectItem>
                    {virtualEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDistanceId} onValueChange={setSelectedDistanceId}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Dystans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie dystanse</SelectItem>
                    {availableDistances.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Desktop Filters */}
                {!isMobile && (
                  <>
                    <ToggleGroup 
                      type="single" 
                      value={genderFilter} 
                      onValueChange={(v) => v && setGenderFilter(v as 'all' | 'M' | 'K')}
                    >
                      <ToggleGroupItem value="all">Wszyscy</ToggleGroupItem>
                      <ToggleGroupItem value="M">M</ToggleGroupItem>
                      <ToggleGroupItem value="K">K</ToggleGroupItem>
                    </ToggleGroup>
                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Wiek" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {/* Mobile Filter Drawer */}
                {isMobile && (
                  <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        Więcej filtrów
                        {(genderFilter !== 'all' || ageFilter !== 'all') && (
                          <Badge variant="secondary" className="ml-2">
                            {[genderFilter !== 'all', ageFilter !== 'all'].filter(Boolean).length}
                          </Badge>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Filtry</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4">
                        <FilterContent />
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => setFilterDrawerOpen(false)}
                        >
                          Zastosuj
                        </Button>
                      </div>
                    </DrawerContent>
                  </Drawer>
                )}

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-1" />
                    Wyczyść
                  </Button>
                )}
              </div>

              {/* Export Actions */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Eksportuj
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      Pobierz CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      Drukuj / PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rankings */}
        {filteredRankings.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByDistance).map(([distanceId, submissions]) => {
              const distanceName = submissions[0]?.distanceName || distanceId;
              
              return (
                <Card key={distanceId}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {distanceName}
                      </CardTitle>
                      <Badge variant="secondary">{submissions.length} uczestników</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Poz.</TableHead>
                          <TableHead>Zawodnik</TableHead>
                          {selectedEventId === 'all' && <TableHead className="hidden md:table-cell">Wydarzenie</TableHead>}
                          <TableHead>Czas</TableHead>
                          <TableHead className="hidden sm:table-cell">Płeć</TableHead>
                          <TableHead className="hidden md:table-cell">Wiek</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((sub, index) => (
                          <TableRow 
                            key={sub.id}
                            className={index < 3 ? 'bg-muted/30' : ''}
                          >
                            <TableCell className="font-medium">
                              {getPositionDisplay(index + 1)}
                            </TableCell>
                            <TableCell>
                              <Link 
                                to={`/athlete/${sub.userId}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {sub.userName}
                              </Link>
                              {sub.club && (
                                <div className="text-xs text-muted-foreground">{sub.club}</div>
                              )}
                            </TableCell>
                            {selectedEventId === 'all' && (
                              <TableCell className="hidden md:table-cell text-muted-foreground">
                                {sub.eventName}
                              </TableCell>
                            )}
                            <TableCell className="font-mono font-medium">{sub.submittedTime}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {sub.gender === 'M' ? 'Mężczyzna' : sub.gender === 'K' ? 'Kobieta' : '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {sub.birthYear ? `${calculateAge(sub.birthYear)} lat` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak wyników</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'Nie znaleziono wyników dla wybranych filtrów.'
                : 'Nie ma jeszcze zatwierdzonych wyników wydarzeń wirtualnych.'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VirtualRankingsPage;
