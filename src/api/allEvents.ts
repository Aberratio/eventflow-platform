import { getEvents } from './index';
import type { EventFilters } from './types';
import type { Event } from '@/types';

/** The API caps a page at 100; anything larger is silently reduced. */
const MAX_PAGE_SIZE = 100;

/** Stops a malformed `total` from turning the loop into an unbounded one. */
const MAX_PAGES = 50;

/**
 * Every event matching the filters, not just the first page.
 *
 * `getEvents()` defaults to 25 rows ordered by date ascending, so calling it bare hands
 * back the 25 oldest events and nothing else. The calendar and the home page both did
 * that, which is why they disagreed: each was filtering a truncated list, and the
 * calendar's year filter could empty it out completely. Views that present the whole
 * calendar need the whole calendar.
 */
export async function getAllEvents(filters: EventFilters = {}): Promise<Event[]> {
  const collected: Event[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await getEvents({ ...filters, page, pageSize: MAX_PAGE_SIZE });
    const batch = response?.data ?? [];
    collected.push(...batch);

    const total = response?.total ?? collected.length;
    if (batch.length === 0 || collected.length >= total) {
      break;
    }
  }

  return collected;
}
