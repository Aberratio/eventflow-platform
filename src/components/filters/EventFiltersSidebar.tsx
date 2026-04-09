import { useMemo } from 'react';
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
import { mockEvents } from '@/api/mock/events.mock';
import { EventFiltersState } from '@/hooks/useEventFilters';
import { FiltersContent } from './FiltersContent';

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
}

function useFilterOptions() {
  const cities = useMemo(() => [...new Set(mockEvents.map((e) => e.city))].sort(), []);
  const organizers = useMemo(() => {
    const m = new Map<string, string>();
    mockEvents.forEach((e) => {
      if (e.organizerId && e.organizerName) m.set(e.organizerId, e.organizerName);
    });
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, []);
  return { cities, organizers };
}

export const EventFiltersSidebar = ({
  filters,
  updateFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  filteredCount,
}: EventFiltersSidebarProps) => {
  const { cities, organizers } = useFilterOptions();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-card/50 p-4 lg:flex">
      <FiltersContent
        filters={filters}
        updateFilter={updateFilter}
        toggleArrayFilter={toggleArrayFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        cities={cities}
        organizers={organizers}
        filteredCount={filteredCount}
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
}: EventFiltersSidebarProps) => {
  const { cities, organizers } = useFilterOptions();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtry
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
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
