import { useState, useEffect, useCallback, useMemo } from 'react';
import { SportDiscipline } from '@/types';

const STORAGE_KEY = 'results-page-filters';

export interface ResultsFiltersState {
  search: string;
  disciplines: SportDiscipline[];
  cities: string[];
  distanceRanges: string[];
  seriesId: string | null;
  selectedYear: number;
}

const defaultFilters: ResultsFiltersState = {
  search: '',
  disciplines: [],
  cities: [],
  distanceRanges: [],
  seriesId: null,
  selectedYear: 2026,
};

export const distanceRangeOptions = [
  { id: '5k', label: 'do 5 km', max: 5 },
  { id: '10k', label: '5-10 km', min: 5, max: 10 },
  { id: 'half', label: '10-21 km', min: 10, max: 21.1 },
  { id: 'marathon', label: '21-42 km', min: 21.1, max: 42.2 },
  { id: 'ultra', label: '42+ km', min: 42.2 },
] as const;

export const useResultsFilters = () => {
  const [filters, setFilters] = useState<ResultsFiltersState>(() => {
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

  const updateFilter = useCallback(<K extends keyof ResultsFiltersState>(
    key: K,
    value: ResultsFiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback(<K extends keyof ResultsFiltersState>(
    key: K,
    value: ResultsFiltersState[K] extends (infer T)[] ? T : never
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
    if (filters.distanceRanges.length > 0) count++;
    if (filters.seriesId) count++;
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
