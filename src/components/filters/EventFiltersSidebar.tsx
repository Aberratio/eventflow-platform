import { getAllEventsPaged } from '@/api/fetchAllPages';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SlidersHorizontal, X } from 'lucide-react';
import { EventFiltersState } from '@/hooks/useEventFilters';
import { FiltersContent } from './FiltersContent';
import { cn } from '@/lib/utils';

interface EventFiltersSidebarProps {
  filters: EventFiltersState;
  updateFilter: <K extends keyof EventFiltersState>(key: K, value: EventFiltersState[K]) => void;
  toggleArrayFilter: <K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K] extends (infer T)[] ? T : never,
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  filteredCount: number;
  statusCounts?: Record<string, number>;
  triggerMode?: 'default' | 'icon';
}

function useFilterOptions() {
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'filter-options'],
    queryFn: () => getAllEventsPaged(),
  });
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);
  const cities = useMemo(() => [...new Set(events.map((e) => e.city))].sort(), [events]);
  const organizers = useMemo(() => {
    const m = new Map<string, string>();
    events.forEach((e) => {
      if (e.organizerId && e.organizerName) m.set(e.organizerId, e.organizerName);
    });
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);
  return { cities, organizers };
}

export const EventFiltersSidebar = ({
  filters,
  updateFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  filteredCount,
  statusCounts,
}: EventFiltersSidebarProps) => {
  const { cities, organizers } = useFilterOptions();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#081019]/70 p-5 backdrop-blur-xl lg:flex">
      <FiltersContent
        filters={filters}
        updateFilter={updateFilter}
        toggleArrayFilter={toggleArrayFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        cities={cities}
        organizers={organizers}
        filteredCount={filteredCount}
        statusCounts={statusCounts}
        showHeader
      />
    </aside>
  );
};

export const EventFiltersDrawerTrigger = ({
  filters,
  updateFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  activeFiltersCount,
  filteredCount,
  statusCounts,
  triggerMode = 'default',
}: EventFiltersSidebarProps) => {
  const { cities, organizers } = useFilterOptions();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size={triggerMode === 'icon' ? 'icon' : 'sm'}
          aria-label={triggerMode === 'icon' ? 'Filtry' : undefined}
          className={cn(
            'shrink-0 lg:hidden',
            triggerMode === 'icon'
              ? 'h-16 w-full rounded-xl border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.055] sm:h-[68px]'
              : '',
          )}
        >
          <SlidersHorizontal className={cn('h-5 w-5', triggerMode !== 'icon' && 'mr-2 h-4 w-4')} />
          {triggerMode !== 'icon' && (
            <>
              Filtry
              {activeFiltersCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtry wydarzeń
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Wyczyść
              </Button>
            )}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <FiltersContent
            filters={filters}
            updateFilter={updateFilter}
            toggleArrayFilter={toggleArrayFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            cities={cities}
            organizers={organizers}
            filteredCount={filteredCount}
            statusCounts={statusCounts}
            showApplyButton
            onApply={() =>
              document.querySelector<HTMLButtonElement>('[data-drawer-close]')?.click()
            }
          />
        </div>
        <DrawerFooter className="pt-0">
          <DrawerClose asChild data-drawer-close>
            <Button variant="outline">Zamknij</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
