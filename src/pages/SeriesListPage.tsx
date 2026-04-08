import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Calendar, Globe, MapPin, Trophy, Target, Layers } from 'lucide-react';
import { SeriesType } from '@/types';
import { ListContainer, ListGroup, ListEmptyState, SeriesListRow } from '@/components/lists';
import { getSeries, getEvents } from '@/api';
import { seriesTypeLabels } from '@/api/mock/labels';
import { QUERY_KEYS, SERIES_STATUS_LABELS } from '@/constants';
import { Skeleton } from '@/components/ui/skeleton';

const statusGroupConfig: Record<string, { accentColor: string }> = {
  'Aktywna': { accentColor: 'bg-success' },
  'Nadchodząca': { accentColor: 'bg-info' },
  'Zakończona': { accentColor: 'bg-muted-foreground' },
};

const SeriesListPage = () => {
  const [selectedType, setSelectedType] = useState<SeriesType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: QUERY_KEYS.series,
    queryFn: () => getSeries(),
  });

  const { data: eventsData } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getEvents(),
  });

  const allSeries = seriesData?.data ?? [];
  const allEvents = eventsData?.data ?? [];

  const filteredSeries = useMemo(() => {
    return allSeries
      .filter(s => selectedType === 'all' || s.type === selectedType)
      .filter(s => selectedStatus === 'all' || s.status === selectedStatus);
  }, [allSeries, selectedType, selectedStatus]);

  const groupedSeries = useMemo(() => {
    const groups: Record<string, typeof filteredSeries> = {};
    const order = ['active', 'upcoming', 'completed'];
    order.forEach(status => {
      const items = filteredSeries.filter(s => s.status === status);
      if (items.length > 0) {
        groups[SERIES_STATUS_LABELS[status]] = items;
      }
    });
    return groups;
  }, [filteredSeries]);

  const hasFilters = selectedType !== 'all' || selectedStatus !== 'all';
  const clearFilters = () => { setSelectedType('all'); setSelectedStatus('all'); };
  const activeCount = allSeries.filter(s => s.status === 'active').length;

  return (
    <Layout>
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--warning)/0.06),transparent_60%)]" />
        <div className="container relative py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-warning/15 border border-warning/20">
              <Layers className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Serie wydarzeń</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Dołącz do cyklicznych wydarzeń i zbieraj punkty w klasyfikacji generalnej
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-5 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/50">
              <Target className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">{activeCount} aktywnych</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/50">
              <Calendar className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">{allSeries.length} łącznie</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="bg-card/50 border border-border/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as SeriesType | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Typ serii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="virtual"><span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Wirtualne</span></SelectItem>
                <SelectItem value="local"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Ustawki lokalne</span></SelectItem>
                <SelectItem value="cup"><span className="flex items-center gap-2"><Target className="h-4 w-4" /> Cykle / Grand Prix</span></SelectItem>
                <SelectItem value="championship"><span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Mistrzostwa</span></SelectItem>
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
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                Wyczyść filtry
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Znaleziono <span className="font-medium text-foreground">{filteredSeries.length}</span> serii
        </div>

        {seriesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <ListContainer
            isEmpty={filteredSeries.length === 0}
            emptyState={
              <ListEmptyState
                icon={<Calendar className="h-12 w-12" />}
                title="Nie znaleziono serii"
                description="Spróbuj zmienić kryteria wyszukiwania"
                action={<Button variant="outline" onClick={clearFilters}>Wyczyść filtry</Button>}
              />
            }
          >
            {Object.entries(groupedSeries).map(([statusLabel, seriesList]) => (
              <ListGroup key={statusLabel} title={statusLabel}>
                {seriesList.map(series => {
                  const eventsCount = series.eventIds.length;
                  const seriesEvents = allEvents.filter(e => series.eventIds.includes(e.id));
                  const totalParticipants = seriesEvents.reduce(
                    (sum, e) => sum + e.distances.reduce((s, d) => s + d.registeredCount, 0), 0
                  );
                  return (
                    <SeriesListRow key={series.id} series={series} eventsCount={eventsCount} totalParticipants={totalParticipants} />
                  );
                })}
              </ListGroup>
            ))}
          </ListContainer>
        )}
      </div>
    </Layout>
  );
};

export default SeriesListPage;
