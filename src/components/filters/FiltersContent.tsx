import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
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
import { disciplineLabels } from '@/api/mock/labels';
import { mockSeries } from '@/api/mock/series.mock';
import { SportDiscipline } from '@/types';
import { distanceRangeOptions, EventFiltersState } from '@/hooks/useEventFilters';
import { FilterSection } from './FilterSection';
import { CheckboxItem } from './CheckboxItem';

const disciplineIcons: Record<SportDiscipline, React.ElementType> = {
  running: PersonStanding,
  cycling: Bike,
  triathlon: Waves,
  multisport: Medal,
};

interface FiltersContentProps {
  filters: EventFiltersState;
  updateFilter: <K extends keyof EventFiltersState>(key: K, value: EventFiltersState[K]) => void;
  toggleArrayFilter: <K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K] extends (infer T)[] ? T : never,
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  cities: string[];
  organizers: { id: string; name: string }[];
  filteredCount: number;
  onApply?: () => void;
  showApplyButton?: boolean;
  showHeader?: boolean;
}

export const FiltersContent = ({
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
  showHeader = false,
}: FiltersContentProps) => {
  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filtry
          </h2>
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
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="-mx-1 flex-1 px-1">
        <div className="divide-y divide-border">
          <FilterSection title="Dyscyplina">
            {(Object.keys(disciplineLabels) as SportDiscipline[]).map((discipline) => (
              <CheckboxItem
                key={discipline}
                id={`discipline-${discipline}`}
                label={disciplineLabels[discipline]}
                checked={filters.disciplines.includes(discipline)}
                onCheckedChange={() => toggleArrayFilter('disciplines', discipline)}
                icon={disciplineIcons[discipline]}
              />
            ))}
          </FilterSection>

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

          <FilterSection title="Organizator" defaultOpen={false}>
            {organizers.map((org) => (
              <CheckboxItem
                key={org.id}
                id={`org-${org.id}`}
                label={org.name}
                checked={filters.organizerId === org.id}
                onCheckedChange={() =>
                  updateFilter('organizerId', filters.organizerId === org.id ? null : org.id)
                }
              />
            ))}
          </FilterSection>

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

      {showApplyButton && onApply && (
        <div className="mt-4 border-t border-border pt-4">
          <Button className="w-full" onClick={onApply}>
            Pokaż wyniki ({filteredCount})
          </Button>
        </div>
      )}
    </div>
  );
};
