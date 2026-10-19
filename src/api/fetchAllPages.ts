import { getEvents, getRegistrations, getUsers } from './index';
import type { EventFilters, PaginatedResponse, RegistrationFilters, UserFilters } from './types';

/** The API caps a page at 100 (Repository.php); a bigger `pageSize` is silently reduced. */
export const MAX_PAGE_SIZE = 100;

/** Stops a malformed `total` from turning the loop into an unbounded one (50 x 100 rows). */
export const MAX_PAGES = 50;

/** How many page requests may be in flight at once. */
const CONCURRENCY = 3;

/**
 * Every row of a paginated endpoint, not just the first page. Asking for `pageSize: 1000`
 * returns only 100 rows and no error, so lists built that way were truncated without notice.
 * The first page tells us `total`; the rest are fetched 3 at a time and returned in order.
 * The result keeps the PaginatedResponse shape (one "page" holding everything), so callers
 * only swap their query function.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
): Promise<PaginatedResponse<T>> {
  const first = await fetchPage(1, MAX_PAGE_SIZE);
  const firstRows = first?.data ?? [];
  const total = first?.total ?? firstRows.length;
  const pageCount = Math.min(Math.ceil(total / MAX_PAGE_SIZE), MAX_PAGES);

  const pages: T[][] = [firstRows];
  for (let start = 2; start <= pageCount; start += CONCURRENCY) {
    const batch = [];
    for (let page = start; page < start + CONCURRENCY && page <= pageCount; page++) {
      batch.push(fetchPage(page, MAX_PAGE_SIZE).then((r) => r?.data ?? []));
    }
    pages.push(...(await Promise.all(batch)));
  }

  const data = pages.flat();
  return { data, total: Math.max(total, data.length), page: 1, pageSize: data.length, totalPages: 1 };
}

export const getAllEventsPaged = (filters: EventFilters = {}) =>
  fetchAllPages((page, pageSize) => getEvents({ ...filters, page, pageSize }));

export const getAllUsers = (filters: UserFilters = {}) =>
  fetchAllPages((page, pageSize) => getUsers({ ...filters, page, pageSize }));

export const getAllRegistrations = (filters: RegistrationFilters = {}) =>
  fetchAllPages((page, pageSize) => getRegistrations({ ...filters, page, pageSize }));
