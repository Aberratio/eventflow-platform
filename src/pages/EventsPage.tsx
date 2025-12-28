import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
            Znajdź idealne zawody dla siebie. Wybieraj spośród {mockEvents.length} wydarzeń.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
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
        <div className="mb-4 text-sm text-muted-foreground">
          Znaleziono {filteredEvents.length} wydarzeń
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isPast = new Date(event.date) < new Date();
              return (
                <Card key={event.id} className="overflow-hidden group hover:shadow-lg transition-all">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge>
                        {disciplineIcons[event.discipline]} {disciplineLabels[event.discipline]}
                      </Badge>
                      {isPast && (
                        <Badge variant="secondary">Zakończone</Badge>
                      )}
                      {event.featured && !isPast && (
                        <Badge variant="default" className="bg-primary">
                          ⭐ Wyróżnione
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.city}, {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.distances.reduce((acc, d) => acc + d.registeredCount, 0).toLocaleString()} uczestników
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.distances.slice(0, 3).map((d) => (
                        <Badge key={d.id} variant="outline" className="text-xs">
                          {d.length}{d.unit}
                        </Badge>
                      ))}
                      {event.distances.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.distances.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild className="w-full" variant={isPast ? 'outline' : 'default'}>
                      <Link to={`/events/${event.slug}`}>
                        {isPast ? 'Zobacz wyniki' : 'Szczegóły i zapisy'}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nie znaleziono wydarzeń spełniających kryteria wyszukiwania.
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
