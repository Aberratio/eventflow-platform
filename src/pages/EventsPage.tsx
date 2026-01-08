import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockEvents, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { SportDiscipline } from '@/types';

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

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => {
              const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
              
              return (
                <Link key={event.id} to={`/events/${event.slug}`}>
                  <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl shrink-0">{disciplineIcons[event.discipline]}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{event.name}</h3>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {event.city}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3" />
                              {totalParticipants.toLocaleString()} uczestników
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nie znaleziono wydarzeń spełniających kryteria.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventsPage;
