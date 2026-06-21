import { disciplineLabels, getSeries } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bike,
  Globe,
  Medal,
  Monitor,
  PersonStanding,
  Search,
  SlidersHorizontal,
  Tag,
  Waves,
  X,
} from 'lucide-react';
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

const statusOptions = [
  { id: 'live', label: 'Trwa teraz', color: 'bg-blue-400' },
  { id: 'open', label: 'Zapisy otwarte', color: 'bg-emerald-400' },
  { id: 'ending', label: 'Kończą się zapisy', color: 'bg-amber-400' },
  { id: 'closed', label: 'Zapisy zamknięte', color: 'bg-slate-400' },
  { id: 'past', label: 'Zakończone / wyniki', color: 'bg-violet-400' },
  { id: 'cancelled', label: 'Odwołane', color: 'bg-red-400' },
];

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
  statusCounts?: Record<string, number>;
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
  statusCounts,
  onApply,
  showApplyButton = false,
  showHeader = false,
}: FiltersContentProps) => {
  const { data: seriesList } = useQuery({
    queryKey: ['series'],
    queryFn: getSeries,
    staleTime: 5 * 60 * 1000,
    select: (r) => r.data ?? [],
  });

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filtry
          </h2>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-white/10 bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground"
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
          placeholder="Szukaj wydarzeń..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          className="h-10 border-white/10 bg-background/50 pl-10"
        />
      </div>

      <ScrollArea className="-mx-1 flex-1 px-1">
        <div className="divide-y divide-white/[0.08]">
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
            <button className="text-xs font-medium text-primary" type="button">
              Pokaż więcej
            </button>
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
            {statusOptions.map((status) => (
              <CheckboxItem
                key={status.id}
                id={`status-${status.id}`}
                label={status.label}
                checked={filters.statuses.includes(status.id)}
                onCheckedChange={() => toggleArrayFilter('statuses', status.id)}
                dotClassName={status.color}
                count={statusCounts?.[status.id]}
              />
            ))}
          </FilterSection>

          <FilterSection title="Seria" defaultOpen={false}>
            <CheckboxItem
              id="series-none"
              label="Wszystkie"
              checked={filters.seriesId === null}
              onCheckedChange={() => updateFilter('seriesId', null)}
            />
            {(seriesList ?? []).map((series) => (
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

          <FilterSection title="Przedział dat" defaultOpen={false}>
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
        <div className="mt-4 border-t border-white/[0.08] pt-4">
          <Button className="w-full" onClick={onApply}>
            Pokaż wyniki ({filteredCount})
          </Button>
        </div>
      )}
    </div>
  );
};
