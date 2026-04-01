import { useMemo, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { mockEvents } from '@/data/mockData';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ListContainer, ListGroup, ListEmptyState, EventListRow } from '@/components/lists';
import { YearNavigation } from '@/components/lists/YearNavigation';
import { format, getYear, getMonth, parse } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useEventFilters, distanceRangeOptions } from '@/hooks/useEventFilters';
import { EventFiltersSidebar, EventFiltersDrawerTrigger } from '@/components/filters/EventFiltersSidebar';

const EventsPage = () => {
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters,
  } = useEventFilters();

  const currentYear = new Date().getFullYear();

  // Available years from mock data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    mockEvents
      .filter(e => !e.isPrivate)
      .filter(e => e.status === 'published' || e.status === 'completed')
      .forEach(e => years.add(getYear(new Date(e.date))));
    return Array.from(years).sort((a, b) => a - b);
  }, []);

  const filteredEvents = useMemo(() => {
    return mockEvents
      .filter(e => !e.isPrivate)
      .filter(e => e.status === 'published' || e.status === 'completed')
      .filter(e => getYear(new Date(e.date)) === filters.selectedYear)
      .filter(e => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            e.name.toLowerCase().includes(searchLower) ||
            e.city.toLowerCase().includes(searchLower) ||
            e.location.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter(e => filters.disciplines.length === 0 || filters.disciplines.includes(e.discipline))
      .filter(e => filters.cities.length === 0 || filters.cities.includes(e.city))
      .filter(e => {
        if (filters.statuses.length === 0) return true;
        const isPast = new Date(e.date) < new Date();
        if (filters.statuses.includes('completed') && isPast) return true;
        if (!isPast && filters.statuses.includes(e.registrationStatus)) return true;
        return false;
      })
      .filter(e => {
        if (filters.eventTypes.length === 0) return true;
        const isVirtual = e.isVirtual || false;
        if (filters.eventTypes.includes('virtual') && isVirtual) return true;
        if (filters.eventTypes.includes('standard') && !isVirtual) return true;
        return false;
      })
      .filter(e => {
        if (!filters.seriesId) return true;
        return e.seriesId === filters.seriesId;
      })
      .filter(e => {
        if (filters.distanceRanges.length === 0) return true;
        return e.distances.some(d => {
          const distanceKm = d.unit === 'km' ? d.length : d.length / 1000;
          return filters.distanceRanges.some(rangeId => {
            const range = distanceRangeOptions.find(r => r.id === rangeId);
            if (!range) return false;
            const min = 'min' in range ? range.min : 0;
            const max = 'max' in range ? range.max : Infinity;
            return distanceKm >= min && distanceKm <= max;
          });
        });
      })
      .filter(e => {
        if (!filters.organizerId) return true;
        return e.organizerId === filters.organizerId;
      })
      .filter(e => {
        if (!filters.hasEarlyBird) return true;
        // Check if any distance has active early bird pricing
        return e.distances.some(d => {
          if (!d.priceTiers || d.priceTiers.length === 0) return false;
          const now = new Date();
          return d.priceTiers.some(tier => 
            tier.name.toLowerCase().includes('wczesn') && 
            new Date(tier.endDate) > now
          );
        });
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filters]);

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

  // Auto-scroll to current/nearest month on load
  useEffect(() => {
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const monthKeys = Object.keys(groupedEvents);
    
    if (monthKeys.length === 0) return;

    let targetMonth: string | undefined;

    if (filters.selectedYear === nowYear) {
      // Current year: scroll to current month or next available
      targetMonth = monthKeys.find(key => {
        try {
          const parsed = parse(key, 'LLLL yyyy', new Date(), { locale: pl });
          return getMonth(parsed) >= nowMonth;
        } catch {
          return false;
        }
      }) || monthKeys[monthKeys.length - 1];
    } else if (filters.selectedYear < nowYear) {
      // Past year: scroll to last month (most recent)
      targetMonth = monthKeys[monthKeys.length - 1];
    } else {
      // Future year: scroll to first month
      targetMonth = monthKeys[0];
    }
    
    if (targetMonth && monthRefs.current[targetMonth]) {
      setTimeout(() => {
        monthRefs.current[targetMonth!]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 150);
    }
  }, [filters.selectedYear, groupedEvents]);

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
        {/* Sidebar (desktop only, managed internally) */}
        <EventFiltersSidebar
          filters={filters}
          updateFilter={updateFilter}
          toggleArrayFilter={toggleArrayFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
          filteredCount={filteredEvents.length}
        />

        {/* Main Content */}
        <div className="flex-1 py-8 px-4 lg:px-8 min-w-0 overflow-hidden">
          {/* Header with filter button on mobile */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-warning rounded-full" />
                  <h1 className="text-2xl lg:text-3xl font-bold">Wydarzenia sportowe</h1>
                </div>
                <p className="text-muted-foreground text-sm lg:text-base">
                  Znajdź idealne zawody dla siebie
                </p>
              </div>
              {/* Filter button - mobile/tablet only */}
              <EventFiltersDrawerTrigger
                filters={filters}
                updateFilter={updateFilter}
                toggleArrayFilter={toggleArrayFilter}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                activeFiltersCount={activeFiltersCount}
                filteredCount={filteredEvents.length}
              />
            </div>
          </div>

          {/* Year Navigation */}
          <YearNavigation
            selectedYear={filters.selectedYear}
            availableYears={availableYears}
            onYearChange={(year) => updateFilter('selectedYear', year)}
          />

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
              <div key={monthKey} ref={el => monthRefs.current[monthKey] = el} className="scroll-mt-4">
                <ListGroup title={monthKey} count={events.length}>
                  {events.map(event => (
                    <EventListRow key={event.id} event={event} showDetails={true} />
                  ))}
                </ListGroup>
              </div>
            ))}
          </ListContainer>
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;
