import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockEvents, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { Search, Filter, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { SportDiscipline } from '@/types';
import { ListContainer, ListGroup, ListEmptyState, EventListRow } from '@/components/lists';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  
  const selectedDiscipline = searchParams.get('discipline') as SportDiscipline | null;
  const selectedCity = searchParams.get('city');

  const cities = useMemo(() => {
    const uniqueCities = [...new Set(mockEvents.map(e => e.city))];
    return uniqueCities.sort();
  }, []);

  const filteredEvents = useMemo(() => {
    return mockEvents
      .filter(e => e.status === 'published' || e.status === 'completed')
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [search, selectedDiscipline, selectedCity]);

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

  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  const hasFilters = search || selectedDiscipline || selectedCity;

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
                <SelectItem value="running">🏃 Bieganie</SelectItem>
                <SelectItem value="cycling">🚴 Kolarstwo</SelectItem>
                <SelectItem value="triathlon">🏊 Triathlon</SelectItem>
                <SelectItem value="multisport">🎯 Multisport</SelectItem>
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
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Wyczyść
              </Button>
            )}
          </div>
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
            <ListGroup key={monthKey} title={monthKey}>
              {events.map(event => (
                <EventListRow key={event.id} event={event} />
              ))}
            </ListGroup>
          ))}
        </ListContainer>
      </div>
    </Layout>
  );
};

export default EventsPage;
