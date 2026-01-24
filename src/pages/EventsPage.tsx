import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockEvents, disciplineLabels } from '@/data/mockData';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Search, Filter, MapPin, Calendar as CalendarIcon, PersonStanding, Bike, Waves, Medal, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { SportDiscipline } from '@/types';
import { ListContainer, ListGroup, ListEmptyState, EventListRow } from '@/components/lists';
import { format, getYear, getMonth, parse } from 'date-fns';
import { pl } from 'date-fns/locale';

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const selectedDiscipline = searchParams.get('discipline') as SportDiscipline | null;
  const selectedCity = searchParams.get('city');
  const selectedStatus = searchParams.get('status') as 'open' | 'closed' | 'none' | 'completed' | null;

  // Get current year (2026)
  const currentYear = 2026;
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Available years from mock data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    mockEvents
      .filter(e => e.status === 'published' || e.status === 'completed')
      .forEach(e => years.add(getYear(new Date(e.date))));
    return Array.from(years).sort((a, b) => a - b);
  }, []);

  const cities = useMemo(() => {
    const uniqueCities = [...new Set(mockEvents.map(e => e.city))];
    return uniqueCities.sort();
  }, []);

  const filteredEvents = useMemo(() => {
    return mockEvents
      .filter(e => e.status === 'published' || e.status === 'completed')
      .filter(e => getYear(new Date(e.date)) === selectedYear)
      .filter(e => {
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            e.name.toLowerCase().includes(searchLower) ||
            e.city.toLowerCase().includes(searchLower) ||
            e.location.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter(e => !selectedDiscipline || e.discipline === selectedDiscipline)
      .filter(e => !selectedCity || e.city === selectedCity)
      .filter(e => {
        if (!selectedStatus) return true;
        if (selectedStatus === 'completed') {
          return new Date(e.date) < new Date();
        }
        return e.registrationStatus === selectedStatus;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [search, selectedDiscipline, selectedCity, selectedYear, selectedStatus]);

  // Group events by month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    
    filteredEvents.forEach(event => {
      const monthKey = format(new Date(event.date), 'LLLL yyyy', { locale: pl });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });
    
    return groups;
  }, [filteredEvents]);

  // Auto-scroll to current month on load (only for current year)
  useEffect(() => {
    if (selectedYear !== currentYear) return;
    
    const currentMonth = new Date().getMonth();
    const monthKeys = Object.keys(groupedEvents);
    
    // Find first month >= current month
    const targetMonth = monthKeys.find(key => {
      try {
        const parsed = parse(key, 'LLLL yyyy', new Date(), { locale: pl });
        return getMonth(parsed) >= currentMonth;
      } catch {
        return false;
      }
    }) || monthKeys[0];
    
    if (targetMonth && monthRefs.current[targetMonth]) {
      setTimeout(() => {
        monthRefs.current[targetMonth]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [selectedYear, groupedEvents, currentYear]);

  const handleDisciplineChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('discipline');
    } else {
      params.set('discipline', value);
    }
    setSearchParams(params);
  };

  const handleCityChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('city');
    } else {
      params.set('city', value);
    }
    setSearchParams(params);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  const hasFilters = search || selectedDiscipline || selectedCity || selectedStatus;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wydarzenia sportowe</h1>
          <p className="text-muted-foreground">
            Znajdź idealne zawody dla siebie
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po nazwie lub miejscu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDiscipline || 'all'} onValueChange={handleDisciplineChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Dyscyplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="running">
                  <span className="flex items-center gap-2">
                    <PersonStanding className="h-4 w-4" /> Bieganie
                  </span>
                </SelectItem>
                <SelectItem value="cycling">
                  <span className="flex items-center gap-2">
                    <Bike className="h-4 w-4" /> Kolarstwo
                  </span>
                </SelectItem>
                <SelectItem value="triathlon">
                  <span className="flex items-center gap-2">
                    <Waves className="h-4 w-4" /> Triathlon
                  </span>
                </SelectItem>
                <SelectItem value="multisport">
                  <span className="flex items-center gap-2">
                    <Medal className="h-4 w-4" /> Multisport
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCity || 'all'} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Miasto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie miasta</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <ClipboardList className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status zapisów" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="open">Zapisy otwarte</SelectItem>
                <SelectItem value="closed">Zapisy zamknięte</SelectItem>
                <SelectItem value="none">Brak zapisów</SelectItem>
                <SelectItem value="completed">Zakończone</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Wyczyść
              </Button>
            )}
          </div>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y - 1)}
            disabled={!availableYears.includes(selectedYear - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold min-w-[80px] text-center">{selectedYear}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y + 1)}
            disabled={!availableYears.includes(selectedYear + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Znaleziono {filteredEvents.length} wydarzeń
        </p>

        {/* Events List */}
        <ListContainer
          isEmpty={filteredEvents.length === 0}
          emptyState={
            <ListEmptyState
              icon={<CalendarIcon className="h-12 w-12" />}
              title="Nie znaleziono wydarzeń"
              description="Spróbuj zmienić kryteria wyszukiwania"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              }
            />
          }
        >
          {Object.entries(groupedEvents).map(([monthKey, events]) => (
            <div key={monthKey} ref={el => monthRefs.current[monthKey] = el}>
              <ListGroup title={monthKey}>
                {events.map(event => (
                  <EventListRow key={event.id} event={event} showDetails={true} />
                ))}
              </ListGroup>
            </div>
          ))}
        </ListContainer>
      </div>
    </Layout>
  );
};

export default EventsPage;
