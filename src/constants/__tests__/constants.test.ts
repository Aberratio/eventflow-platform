import { describe, it, expect } from 'vitest';
import {
  QUERY_KEYS,
  STORAGE_KEYS,
  MOCK_PASSWORD,
  ROLE_LABELS,
  EVENT_STATUS_LABELS,
} from '@/constants';

describe('constants', () => {
  it('has correct storage keys', () => {
    expect(STORAGE_KEYS.AUTH).toBe('zmierzymyczas_auth');
    expect(STORAGE_KEYS.EVENTS_FILTERS).toBe('events-page-filters');
  });

  it('has mock password', () => {
    expect(MOCK_PASSWORD).toBe('demo1234');
  });

  it('has role labels', () => {
    expect(ROLE_LABELS.admin).toBe('Administrator');
    expect(ROLE_LABELS.participant).toBe('Uczestnik');
  });

  it('has event status labels', () => {
    expect(EVENT_STATUS_LABELS.published).toBe('Opublikowane');
  });

  it('generates query keys correctly', () => {
    expect(QUERY_KEYS.events).toEqual(['events']);
    expect(QUERY_KEYS.event('e1')).toEqual(['events', 'e1']);
    expect(QUERY_KEYS.seriesBySlug('test')).toEqual(['series', 'slug', 'test']);
  });
});
