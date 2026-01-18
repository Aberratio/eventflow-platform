import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockSeries, mockEvents, seriesTypeLabels } from '@/data/mockData';
import { Filter, Calendar, Globe, MapPin, Trophy, Target } from 'lucide-react';
import { SeriesType } from '@/types';
import { ListContainer, ListGroup, ListEmptyState, SeriesListRow } from '@/components/lists';

const statusLabels: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  upcoming: 'Nadchodząca',
};

const SeriesListPage = () => {
  const [selectedType, setSelectedType] = useState<SeriesType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredSeries = useMemo(() => {
    return mockSeries
      .filter(s => selectedType === 'all' || s.type === selectedType)
      .filter(s => selectedStatus === 'all' || s.status === selectedStatus);
  }, [selectedType, selectedStatus]);

  // Group by status
  const groupedSeries = useMemo(() => {
    const groups: Record<string, typeof filteredSeries> = {};
    
    const order = ['active', 'upcoming', 'completed'];
    order.forEach(status => {
      const items = filteredSeries.filter(s => s.status === status);
      if (items.length > 0) {
        groups[statusLabels[status]] = items;
      }
    });
    
    return groups;
  }, [filteredSeries]);

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
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as SeriesType | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Typ serii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="virtual">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Wirtualne
                  </span>
                </SelectItem>
                <SelectItem value="local">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Ustawki lokalne
                  </span>
                </SelectItem>
                <SelectItem value="cup">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" /> Cykle / Grand Prix
                  </span>
                </SelectItem>
                <SelectItem value="championship">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Mistrzostwa
                  </span>
                </SelectItem>
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

        {/* Series List */}
        <ListContainer
          isEmpty={filteredSeries.length === 0}
          emptyState={
            <ListEmptyState
              icon={<Calendar className="h-12 w-12" />}
              title="Nie znaleziono serii"
              description="Spróbuj zmienić kryteria wyszukiwania"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              }
            />
          }
        >
          {Object.entries(groupedSeries).map(([statusLabel, seriesList]) => (
            <ListGroup key={statusLabel} title={statusLabel}>
              {seriesList.map(series => {
                const eventsCount = series.eventIds.length;
                const seriesEvents = mockEvents.filter(e => series.eventIds.includes(e.id));
                const totalParticipants = seriesEvents.reduce(
                  (sum, e) => sum + e.distances.reduce((s, d) => s + d.registeredCount, 0),
                  0
                );

                return (
                  <SeriesListRow
                    key={series.id}
                    series={series}
                    eventsCount={eventsCount}
                    totalParticipants={totalParticipants}
                  />
                );
              })}
            </ListGroup>
          ))}
        </ListContainer>
      </div>
    </Layout>
  );
};

export default SeriesListPage;
