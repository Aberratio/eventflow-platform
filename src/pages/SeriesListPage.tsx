import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockSeries, mockEvents, seriesTypeLabels, seriesTypeIcons } from '@/data/mockData';
import { Calendar, Users, Filter, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { SeriesType } from '@/types';

const statusLabels: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  upcoming: 'Nadchodząca',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  upcoming: 'outline',
};

const SeriesListPage = () => {
  const [selectedType, setSelectedType] = useState<SeriesType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredSeries = useMemo(() => {
    return mockSeries
      .filter(s => selectedType === 'all' || s.type === selectedType)
      .filter(s => selectedStatus === 'all' || s.status === selectedStatus);
  }, [selectedType, selectedStatus]);

  const hasFilters = selectedType !== 'all' || selectedStatus !== 'all';

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Serie wydarzeń</h1>
          <p className="text-muted-foreground">
            Dołącz do cyklicznych wydarzeń i zbieraj punkty w klasyfikacji generalnej
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as SeriesType | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Typ serii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="virtual">🌐 Wirtualne</SelectItem>
                <SelectItem value="local">📍 Ustawki lokalne</SelectItem>
                <SelectItem value="cup">🎯 Cykle / Grand Prix</SelectItem>
                <SelectItem value="championship">🏆 Mistrzostwa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="upcoming">Nadchodzące</SelectItem>
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

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Znaleziono {filteredSeries.length} serii
        </div>

        {/* Series Grid */}
        {filteredSeries.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((series) => {
              const eventsCount = series.eventIds.length;
              const seriesEvents = mockEvents.filter(e => series.eventIds.includes(e.id));
              const totalParticipants = seriesEvents.reduce(
                (sum, e) => sum + e.distances.reduce((s, d) => s + d.registeredCount, 0),
                0
              );

              return (
                <Card key={series.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    {/* Type badge and status */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-sm">
                        {seriesTypeIcons[series.type]} {seriesTypeLabels[series.type]}
                      </Badge>
                      <Badge variant={statusVariants[series.status]}>
                        {statusLabels[series.status]}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2">{series.name}</h3>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {series.description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {series.startDate && series.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(series.startDate), 'MMM yyyy', { locale: pl })} - {format(new Date(series.endDate), 'MMM yyyy', { locale: pl })}
                        </span>
                      )}
                      {eventsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {eventsCount} wydarzeń
                        </span>
                      )}
                    </div>

                    {totalParticipants > 0 && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {totalParticipants.toLocaleString()} uczestników łącznie
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/series/${series.slug}`}>
                        Zobacz serię
                        <ChevronRight className="h-4 w-4 ml-1" />
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
              Nie znaleziono serii spełniających kryteria.
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

export default SeriesListPage;
