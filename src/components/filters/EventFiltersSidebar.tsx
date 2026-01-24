import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { 
  Search, 
  ChevronDown, 
  SlidersHorizontal, 
  X,
  PersonStanding,
  Bike,
  Waves,
  Medal,
  Monitor,
  Globe,
  Tag,
} from 'lucide-react';
import { mockEvents, mockSeries, disciplineLabels } from '@/data/mockData';
import { SportDiscipline } from '@/types';
import { useEventFilters, distanceRangeOptions, EventFiltersState } from '@/hooks/useEventFilters';
import { useIsMobile } from '@/hooks/use-mobile';

const disciplineIcons: Record<SportDiscipline, React.ElementType> = {
  running: PersonStanding,
  cycling: Bike,
  triathlon: Waves,
  multisport: Medal,
};

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const FilterSection = ({ title, defaultOpen = true, children }: FilterSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className="border-b border-border pb-4">
    <CollapsibleTrigger className="flex justify-between items-center w-full py-2 group">
      <span className="font-medium text-sm">{title}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-2 space-y-2">
      {children}
    </CollapsibleContent>
  </Collapsible>
);

interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ElementType;
}

const CheckboxItem = ({ id, label, checked, onCheckedChange, icon: Icon }: CheckboxItemProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox 
      id={id} 
      checked={checked} 
      onCheckedChange={onCheckedChange}
    />
    <Label 
      htmlFor={id} 
      className="text-sm font-normal cursor-pointer flex items-center gap-2"
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {label}
    </Label>
  </div>
);

interface FiltersContentProps {
  filters: EventFiltersState;
  updateFilter: <K extends keyof EventFiltersState>(key: K, value: EventFiltersState[K]) => void;
  toggleArrayFilter: <K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K] extends (infer T)[] ? T : never
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  cities: string[];
  organizers: { id: string; name: string }[];
  filteredCount: number;
  onApply?: () => void;
  showApplyButton?: boolean;
}

const FiltersContent = ({
  filters,
  updateFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  cities,
  organizers,
  filteredCount,
  onApply,
  showApplyButton = false,
}: FiltersContentProps) => {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Separator />

          {/* Discipline */}
          <FilterSection title="Dyscyplina">
            {(Object.keys(disciplineLabels) as SportDiscipline[]).map((discipline) => {
              const Icon = disciplineIcons[discipline];
              return (
                <CheckboxItem
                  key={discipline}
                  id={`discipline-${discipline}`}
                  label={disciplineLabels[discipline]}
                  checked={filters.disciplines.includes(discipline)}
                  onCheckedChange={() => toggleArrayFilter('disciplines', discipline)}
                  icon={Icon}
                />
              );
            })}
          </FilterSection>

          {/* Event Type */}
          <FilterSection title="Typ wydarzenia">
            <CheckboxItem
              id="type-standard"
              label="Standardowe"
              checked={filters.eventTypes.includes('standard')}
              onCheckedChange={() => toggleArrayFilter('eventTypes', 'standard')}
              icon={Monitor}
            />
            <CheckboxItem
              id="type-virtual"
              label="Wirtualne"
              checked={filters.eventTypes.includes('virtual')}
              onCheckedChange={() => toggleArrayFilter('eventTypes', 'virtual')}
              icon={Globe}
            />
          </FilterSection>

          {/* Status */}
          <FilterSection title="Status">
            <CheckboxItem
              id="status-open"
              label="Zapisy otwarte"
              checked={filters.statuses.includes('open')}
              onCheckedChange={() => toggleArrayFilter('statuses', 'open')}
            />
            <CheckboxItem
              id="status-closed"
              label="Zapisy zamknięte"
              checked={filters.statuses.includes('closed')}
              onCheckedChange={() => toggleArrayFilter('statuses', 'closed')}
            />
            <CheckboxItem
              id="status-none"
              label="Brak zapisów"
              checked={filters.statuses.includes('none')}
              onCheckedChange={() => toggleArrayFilter('statuses', 'none')}
            />
            <CheckboxItem
              id="status-completed"
              label="Zakończone"
              checked={filters.statuses.includes('completed')}
              onCheckedChange={() => toggleArrayFilter('statuses', 'completed')}
            />
          </FilterSection>

          {/* Series */}
          <FilterSection title="Seria" defaultOpen={false}>
            <CheckboxItem
              id="series-none"
              label="Wszystkie"
              checked={filters.seriesId === null}
              onCheckedChange={() => updateFilter('seriesId', null)}
            />
            {mockSeries.map((series) => (
              <CheckboxItem
                key={series.id}
                id={`series-${series.id}`}
                label={series.name}
                checked={filters.seriesId === series.id}
                onCheckedChange={() => updateFilter('seriesId', series.id)}
              />
            ))}
          </FilterSection>

          {/* Distance */}
          <FilterSection title="Dystans" defaultOpen={false}>
            {distanceRangeOptions.map((range) => (
              <CheckboxItem
                key={range.id}
                id={`distance-${range.id}`}
                label={range.label}
                checked={filters.distanceRanges.includes(range.id)}
                onCheckedChange={() => toggleArrayFilter('distanceRanges', range.id)}
              />
            ))}
          </FilterSection>

          {/* City */}
          <FilterSection title="Miasto" defaultOpen={false}>
            {cities.map((city) => (
              <CheckboxItem
                key={city}
                id={`city-${city}`}
                label={city}
                checked={filters.cities.includes(city)}
                onCheckedChange={() => toggleArrayFilter('cities', city)}
              />
            ))}
          </FilterSection>

          {/* Organizer */}
          <FilterSection title="Organizator" defaultOpen={false}>
            {organizers.map((org) => (
              <CheckboxItem
                key={org.id}
                id={`org-${org.id}`}
                label={org.name}
                checked={filters.organizerId === org.id}
                onCheckedChange={() => updateFilter('organizerId', filters.organizerId === org.id ? null : org.id)}
              />
            ))}
          </FilterSection>

          {/* Early Bird */}
          <FilterSection title="Promocje" defaultOpen={false}>
            <CheckboxItem
              id="early-bird"
              label="Tylko z aktywną zniżką"
              checked={filters.hasEarlyBird}
              onCheckedChange={(checked) => updateFilter('hasEarlyBird', checked as boolean)}
              icon={Tag}
            />
          </FilterSection>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-border space-y-2">
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Wyczyść filtry
          </Button>
        )}
        {showApplyButton && onApply && (
          <Button className="w-full" onClick={onApply}>
            Pokaż wyniki ({filteredCount})
          </Button>
        )}
      </div>
    </div>
  );
};

interface EventFiltersSidebarProps {
  filters: EventFiltersState;
  updateFilter: <K extends keyof EventFiltersState>(key: K, value: EventFiltersState[K]) => void;
  toggleArrayFilter: <K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K] extends (infer T)[] ? T : never
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  filteredCount: number;
}

export const EventFiltersSidebar = ({
  filters,
  updateFilter,
  toggleArrayFilter,
  clearFilters,
  hasActiveFilters,
  activeFiltersCount,
  filteredCount,
}: EventFiltersSidebarProps) => {
  const isMobile = useIsMobile();

  // Derive cities and organizers from mock data
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(mockEvents.map(e => e.city))];
    return uniqueCities.sort();
  }, []);

  const organizers = useMemo(() => {
    const uniqueOrgs = new Map<string, string>();
    mockEvents.forEach(e => {
      if (e.organizerId && e.organizerName) {
        uniqueOrgs.set(e.organizerId, e.organizerName);
      }
    });
    return Array.from(uniqueOrgs.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside className="w-64 shrink-0 border-r border-border bg-card p-4 h-[calc(100vh-4rem)] sticky top-16">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
          {activeFiltersCount > 0 && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        <FiltersContent
          filters={filters}
          updateFilter={updateFilter}
          toggleArrayFilter={toggleArrayFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          cities={cities}
          organizers={organizers}
          filteredCount={filteredCount}
        />
      </aside>
    );
  }

  // Mobile drawer
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtry
          {activeFiltersCount > 0 && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtry wydarzeń
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 flex-1 overflow-hidden">
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
            onApply={() => {
              // Close drawer by clicking the close button programmatically
              document.querySelector<HTMLButtonElement>('[data-drawer-close]')?.click();
            }}
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
