import { useState, useEffect, useCallback, useMemo } from 'react';
import { SportDiscipline } from '@/types';

const STORAGE_KEY = 'events-page-filters';

export interface EventFiltersState {
  search: string;
  disciplines: SportDiscipline[];
  cities: string[];
  statuses: string[];
  eventTypes: ('standard' | 'virtual')[];
  seriesId: string | null;
  distanceRanges: string[];
  organizerId: string | null;
  hasEarlyBird: boolean;
  selectedYear: number;
}

const defaultFilters: EventFiltersState = {
  search: '',
  disciplines: [],
  cities: [],
  statuses: [],
  eventTypes: [],
  seriesId: null,
  distanceRanges: [],
  organizerId: null,
  hasEarlyBird: false,
  selectedYear: 2026,
};

export const distanceRangeOptions = [
  { id: '5k', label: 'do 5 km', max: 5 },
  { id: '10k', label: '5-10 km', min: 5, max: 10 },
  { id: 'half', label: '10-21 km', min: 10, max: 21.1 },
  { id: 'marathon', label: '21-42 km', min: 21.1, max: 42.2 },
  { id: 'ultra', label: '42+ km', min: 42.2 },
] as const;

export const useEventFilters = () => {
  const [filters, setFilters] = useState<EventFiltersState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse saved filters:', e);
    }
    return defaultFilters;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback(<K extends keyof EventFiltersState>(
    key: K,
    value: EventFiltersState[K] extends (infer T)[] ? T : never
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as unknown[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  }, []);

  const clearFilters = useCallback(() => {
    const clearedFilters = { ...defaultFilters, selectedYear: filters.selectedYear };
    setFilters(clearedFilters);
    localStorage.removeItem(STORAGE_KEY);
  }, [filters.selectedYear]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.disciplines.length > 0) count++;
    if (filters.cities.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.seriesId) count++;
    if (filters.distanceRanges.length > 0) count++;
    if (filters.organizerId) count++;
    if (filters.hasEarlyBird) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters,
  };
};
