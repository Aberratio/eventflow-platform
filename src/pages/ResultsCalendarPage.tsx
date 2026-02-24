import { useMemo, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { mockEvents } from '@/data/mockData';
import { Trophy } from 'lucide-react';
import { getMonth, getYear } from 'date-fns';
import { useResultsFilters, distanceRangeOptions } from '@/hooks/useResultsFilters';
import { ResultsFiltersSidebar, ResultsFiltersDrawerTrigger } from '@/components/filters/ResultsFiltersSidebar';
import { ListContainer, ListGroup, ListEmptyState } from '@/components/lists/ListContainer';
import { ResultEventListRow } from '@/components/lists/ResultEventListRow';
import { YearNavigation } from '@/components/lists/YearNavigation';

const months = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

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

  const completedEvents = useMemo(() => {
    return mockEvents
      .filter(e => !e.isPrivate && e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    completedEvents.forEach(e => years.add(getYear(new Date(e.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [completedEvents]);

  const filteredEvents = useMemo(() => {
    let events = completedEvents.filter(e => getYear(new Date(e.date)) === filters.selectedYear);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(e => 
        e.name.toLowerCase().includes(searchLower) ||
        e.city.toLowerCase().includes(searchLower)
      );
    }
    if (filters.disciplines.length > 0) {
      events = events.filter(e => filters.disciplines.includes(e.discipline));
    }
    if (filters.cities.length > 0) {
      events = events.filter(e => filters.cities.includes(e.city));
    }
    if (filters.distanceRanges.length > 0) {
      events = events.filter(event => {
        return event.distances.some(distance => {
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
    if (filters.seriesId) {
      events = events.filter(e => e.seriesId === filters.seriesId);
    }

    return events;
  }, [completedEvents, filters]);

  const eventsByMonth = useMemo(() => {
    const groups: Record<number, typeof filteredEvents> = {};
    filteredEvents.forEach(event => {
      const month = getMonth(new Date(event.date));
      if (!groups[month]) groups[month] = [];
      groups[month].push(event);
    });
    return groups;
  }, [filteredEvents]);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const targetMonth = Object.keys(eventsByMonth)
      .map(Number)
      .find(m => m <= currentMonth) || Number(Object.keys(eventsByMonth)[0]);
    
    if (targetMonth !== undefined && monthRefs.current[targetMonth]) {
      setTimeout(() => {
        monthRefs.current[targetMonth]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [filters.selectedYear]);

  const filterProps = {
    filters, updateFilter, toggleArrayFilter, clearFilters,
    hasActiveFilters, activeFiltersCount, filteredCount: filteredEvents.length,
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
        <ResultsFiltersSidebar {...filterProps} />

        <div className="flex-1 py-8 px-4 lg:px-8 min-w-0 overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-warning rounded-full" />
                  <h1 className="text-2xl lg:text-3xl font-bold">Kalendarz wyników</h1>
                </div>
                <p className="text-muted-foreground text-sm lg:text-base mt-1">
                  Przeglądaj wyniki zakończonych zawodów
                </p>
              </div>
              <ResultsFiltersDrawerTrigger {...filterProps} />
            </div>
          </div>

          <YearNavigation
            selectedYear={filters.selectedYear}
            availableYears={availableYears}
            onYearChange={(year) => updateFilter('selectedYear', year)}
          />

          <p className="text-sm text-muted-foreground mb-4">
            Znaleziono {filteredEvents.length} wydarzeń
          </p>

          {/* Events list - single container like EventsPage */}
          <ListContainer
            isEmpty={filteredEvents.length === 0}
            emptyState={
              <ListEmptyState
                icon={<Trophy className="h-12 w-12" />}
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
            }
          >
            {months.map((monthName, monthIndex) => {
              const monthEvents = eventsByMonth[monthIndex];
              if (!monthEvents || monthEvents.length === 0) return null;

              return (
                <div key={monthIndex} ref={(el) => { monthRefs.current[monthIndex] = el; }} className="scroll-mt-4">
                  <ListGroup title={`${monthName} ${filters.selectedYear}`} count={monthEvents.length}>
                    {monthEvents.map(event => (
                      <ResultEventListRow key={event.id} event={event} />
                    ))}
                  </ListGroup>
                </div>
              );
            })}
          </ListContainer>
        </div>
      </div>
    </Layout>
  );
};

export default ResultsCalendarPage;
