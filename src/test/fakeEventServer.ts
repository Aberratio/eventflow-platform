import type { Event } from '@/types';

type Row = { id: string; usedCount?: number; usedBy?: unknown[]; registeredCount?: number };
type Rows = Row[] | undefined;

const CHILD_KEYS = ['discountCodes', 'merchandise', 'paymentMethods', 'distances'];

/**
 * Minimal stand-in for PATCH /events/{id} child syncing (EventRepository::syncChildren):
 * an id the event already owns keeps its row (server-owned counters survive), an unknown id
 * is inserted under a new server id, and rows the payload does not claim are deleted.
 * The response lists the children in payload order.
 */
export function createFakeEventServer(initial: Event[]) {
  let sequence = 0;
  const events = new Map(initial.map((event) => [event.id, structuredClone(event)]));
  const calls: Array<{ eventId: string; payload: Record<string, unknown> }> = [];

  const editableFields = (row: Row): Row => {
    const copy: Record<string, unknown> = { ...row };
    delete copy.usedCount;
    delete copy.usedBy;
    delete copy.registeredCount;
    return copy as unknown as Row;
  };

  const syncCollection = (existing: Rows, sent: Row[]): Row[] => {
    const owned = new Map((existing ?? []).map((row) => [row.id, row]));
    return sent.map((row) => {
      const kept = owned.get(row.id);
      if (kept) return { ...kept, ...editableFields(row) };
      sequence += 1;
      return {
        ...editableFields(row),
        id: `srv-${sequence}`,
        ...('code' in row ? { usedCount: 0 } : {}),
      };
    });
  };

  return {
    calls,
    event: (id: string) => events.get(id) as Event,
    list: () => ({ success: true, data: [...events.values()].map((e) => structuredClone(e)) }),
    update: (eventId: string, payload: Record<string, unknown>) => {
      calls.push({ eventId, payload: structuredClone(payload) });
      const current = events.get(eventId) as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(payload)) {
        current[key] = CHILD_KEYS.includes(key)
          ? syncCollection(current[key] as Rows, value as Row[])
          : value;
      }
      return { success: true, data: structuredClone(current) as unknown as Event };
    },
  };
}
