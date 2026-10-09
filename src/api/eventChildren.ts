import type { Event } from '@/types';
import type { UpdateEventPayload } from './payloads';

/**
 * Event child collections the server diff-syncs row by row (see
 * EventChildSchema::COLLECTIONS in the API). Rows the payload does not claim by
 * id are deleted and unknown ids are inserted under a new server UUID, so a
 * client that keeps a temporary id after a save re-creates the row (and resets
 * its counters) on the next save.
 */
export const CHILD_COLLECTIONS = [
  'distances',
  'paymentMethods',
  'merchandise',
  'discountCodes',
  'galleryAlbums',
  'documents',
] as const;

export type ChildCollection = (typeof CHILD_COLLECTIONS)[number];

type IdRow = { id: string };
type ChildRow = IdRow & { distanceIds?: string[]; pricingVariants?: IdRow[] };

const rowsOf = (source: unknown, collection: string): ChildRow[] | undefined => {
  const value = (source as Record<string, unknown> | null | undefined)?.[collection];
  return Array.isArray(value) ? (value as ChildRow[]) : undefined;
};

const withoutKeys = <T extends object>(row: T, keys: string[]): T => {
  const copy: Record<string, unknown> = { ...row };
  for (const key of keys) delete copy[key];
  return copy as T;
};

/**
 * Builds the body for POST/PATCH /events: system counters (`usedCount`,
 * `usedBy`, `registeredCount`) are owned by the server and are never sent.
 * Returns a new object, the input is not mutated.
 */
export function toEventWritePayload(payload: UpdateEventPayload): Record<string, unknown> {
  const body: Record<string, unknown> = { ...payload };
  const discountCodes = rowsOf(payload, 'discountCodes');
  if (discountCodes) {
    body.discountCodes = discountCodes.map((row) => withoutKeys(row, ['usedCount', 'usedBy']));
  }
  const distances = rowsOf(payload, 'distances');
  if (distances) {
    body.distances = distances.map((row) => withoutKeys(row, ['registeredCount']));
  }
  return body;
}

/**
 * Maps temporary child ids sent in `submitted` to the ids the server stored.
 * The server persists `sort_order` as the payload index and returns children
 * ordered by it (EventRepository::syncChildren), so saved[i] corresponds to
 * submitted[i]. Only pairs whose ids differ are recorded; a collection whose
 * length differs from the submitted one is skipped.
 */
export function buildChildIdMap(submitted: UpdateEventPayload, saved: Event): Map<string, string> {
  const map = new Map<string, string>();
  const pair = (sent: IdRow | undefined, stored: IdRow | undefined) => {
    if (sent && stored && sent.id !== stored.id) map.set(sent.id, stored.id);
  };
  for (const collection of CHILD_COLLECTIONS) {
    const sent = rowsOf(submitted, collection);
    const stored = rowsOf(saved, collection);
    if (!sent || !stored || sent.length !== stored.length) continue;
    sent.forEach((row, index) => {
      pair(row, stored[index]);
      if (collection !== 'distances') return;
      const sentVariants = row.pricingVariants;
      const storedVariants = stored[index].pricingVariants;
      if (!sentVariants || !storedVariants || sentVariants.length !== storedVariants.length) return;
      sentVariants.forEach((variant, variantIndex) => pair(variant, storedVariants[variantIndex]));
    });
  }
  return map;
}

/**
 * Replaces temporary ids with server ids on the rows, on their `distanceIds`
 * references and on nested `pricingVariants`. Returns the same array when
 * nothing changes.
 */
export function remapChildIds<T extends IdRow>(items: T[], map: Map<string, string>): T[] {
  if (map.size === 0) return items;
  const swap = (id: string) => map.get(id) ?? id;
  return items.map((item) => {
    const row = item as T & ChildRow;
    const next: T & ChildRow = { ...row, id: swap(row.id) };
    if (row.distanceIds) next.distanceIds = row.distanceIds.map(swap);
    if (row.pricingVariants) {
      next.pricingVariants = row.pricingVariants.map((variant) => ({
        ...variant,
        id: swap(variant.id),
      }));
    }
    return next;
  });
}
