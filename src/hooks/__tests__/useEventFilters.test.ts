import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventFilters } from '@/hooks/useEventFilters';

describe('useEventFilters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default filters on init', () => {
    const { result } = renderHook(() => useEventFilters());
    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.disciplines).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it('updateFilter updates a single filter key', () => {
    const { result } = renderHook(() => useEventFilters());
    act(() => {
      result.current.updateFilter('search', 'maraton');
    });
    expect(result.current.filters.search).toBe('maraton');
    expect(result.current.activeFiltersCount).toBe(1);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('toggleArrayFilter adds and removes values', () => {
    const { result } = renderHook(() => useEventFilters());
    act(() => {
      result.current.toggleArrayFilter('disciplines', 'running');
    });
    expect(result.current.filters.disciplines).toContain('running');

    act(() => {
      result.current.toggleArrayFilter('disciplines', 'running');
    });
    expect(result.current.filters.disciplines).not.toContain('running');
  });

  it('clearFilters resets all except selectedYear', () => {
    const { result } = renderHook(() => useEventFilters());
    act(() => {
      result.current.updateFilter('search', 'test');
      result.current.updateFilter('selectedYear', 2025);
      result.current.toggleArrayFilter('cities', 'Warszawa');
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.cities).toEqual([]);
    expect(result.current.filters.selectedYear).toBe(2025);
  });

  it('counts active filters correctly', () => {
    const { result } = renderHook(() => useEventFilters());
    act(() => {
      result.current.updateFilter('search', 'bieg');
      result.current.toggleArrayFilter('disciplines', 'running');
      result.current.updateFilter('hasEarlyBird', true);
    });
    expect(result.current.activeFiltersCount).toBe(3);
  });

  it('restores filters from localStorage', () => {
    localStorage.setItem(
      'events-page-filters',
      JSON.stringify({ search: 'saved', disciplines: ['cycling'] }),
    );
    const { result } = renderHook(() => useEventFilters());
    expect(result.current.filters.search).toBe('saved');
    expect(result.current.filters.disciplines).toContain('cycling');
  });
});
