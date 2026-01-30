import { useMemo, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/data/mockData';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { getMonth, getYear } from 'date-fns';
import { useResultsFilters, distanceRangeOptions } from '@/hooks/useResultsFilters';
import { ResultsFiltersSidebar, ResultsFiltersDrawerTrigger } from '@/components/filters/ResultsFiltersSidebar';
import { ListContainer, ListGroup, ListEmptyState } from '@/components/lists/ListContainer';
import { ResultEventListRow } from '@/components/lists/ResultEventListRow';

const ResultsCalendarPage = () => {
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
  } = useResultsFilters();

  const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Get all completed events
  const completedEvents = useMemo(() => {
    return mockEvents
      .filter(e => e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    completedEvents.forEach(e => {
      years.add(getYear(new Date(e.date)));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [completedEvents]);

  // Filter events by selected year and other filters
  const filteredEvents = useMemo(() => {
    let events = completedEvents.filter(e => getYear(new Date(e.date)) === filters.selectedYear);

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(e => 
        e.name.toLowerCase().includes(searchLower) ||
        e.city.toLowerCase().includes(searchLower)
      );
    }

    // Discipline filter
    if (filters.disciplines.length > 0) {
      events = events.filter(e => filters.disciplines.includes(e.discipline));
    }

    // City filter
    if (filters.cities.length > 0) {
      events = events.filter(e => filters.cities.includes(e.city));
    }

    // Distance range filter
    if (filters.distanceRanges.length > 0) {
      events = events.filter(event => {
        return event.distances.some(distance => {
          // Convert to km if unit is 'm'
          const distanceKm = distance.unit === 'm' ? distance.length / 1000 : distance.length;
          return filters.distanceRanges.some(rangeId => {
            const range = distanceRangeOptions.find(r => r.id === rangeId);
            if (!range) return false;
            const minOk = !('min' in range) || distanceKm >= range.min;
            const maxOk = !('max' in range) || distanceKm <= range.max;
            return minOk && maxOk;
          });
        });
      });
    }

    // Series filter
    if (filters.seriesId) {
      events = events.filter(e => e.seriesId === filters.seriesId);
    }

    return events;
  }, [completedEvents, filters]);

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const groups: Record<number, typeof filteredEvents> = {};
    
    filteredEvents.forEach(event => {
      const month = getMonth(new Date(event.date));
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(event);
    });
    
    return groups;
  }, [filteredEvents]);

  // Scroll to current month on mount
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const targetMonth = Object.keys(eventsByMonth)
      .map(Number)
      .find(m => m <= currentMonth) || Object.keys(eventsByMonth)[0];
    
    if (targetMonth !== undefined && monthRefs.current[targetMonth]) {
      setTimeout(() => {
        monthRefs.current[targetMonth]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [filters.selectedYear]);

  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const filterProps = {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
    filteredCount: filteredEvents.length,
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
        {/* Desktop Sidebar */}
        <ResultsFiltersSidebar {...filterProps} />

        {/* Main Content */}
        <div className="flex-1 py-8 px-4 lg:px-8 min-w-0 overflow-hidden">
          {/* Header with mobile filter button */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Kalendarz wyników</h1>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Przeglądaj wyniki zakończonych zawodów
                  </p>
                </div>
              </div>
              {/* Filter button - mobile/tablet only */}
              <ResultsFiltersDrawerTrigger {...filterProps} />
            </div>
          </div>

          {/* Year navigation */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter('selectedYear', filters.selectedYear - 1)}
              disabled={!availableYears.includes(filters.selectedYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold min-w-[80px] text-center">{filters.selectedYear}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter('selectedYear', filters.selectedYear + 1)}
              disabled={!availableYears.includes(filters.selectedYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Events by month */}
          {filteredEvents.length > 0 ? (
            <div className="space-y-6">
              {months.map((monthName, monthIndex) => {
                const monthEvents = eventsByMonth[monthIndex];
                if (!monthEvents || monthEvents.length === 0) return null;

                return (
                  <div
                    key={monthIndex}
                    ref={(el) => { monthRefs.current[monthIndex] = el; }}
                    className="scroll-mt-24"
                  >
                    <ListContainer>
                      <ListGroup 
                        title={`${monthName} ${filters.selectedYear}`} 
                        count={monthEvents.length}
                      >
                        {monthEvents.map(event => (
                          <ResultEventListRow key={event.id} event={event} />
                        ))}
                      </ListGroup>
                    </ListContainer>
                  </div>
                );
              })}
            </div>
          ) : (
            <ListContainer isEmpty emptyState={
              <ListEmptyState
                icon={<Trophy className="h-16 w-16" />}
                title="Brak wyników"
                description={
                  hasActiveFilters 
                    ? "Nie znaleziono wyników dla wybranych filtrów."
                    : `W roku ${filters.selectedYear} nie ma jeszcze opublikowanych wyników.`
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Wyczyść filtry
                    </Button>
                  ) : availableYears.length > 0 ? (
                    <Button variant="outline" onClick={() => updateFilter('selectedYear', availableYears[0])}>
                      Przejdź do {availableYears[0]}
                    </Button>
                  ) : null
                }
              />
            } />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResultsCalendarPage;
