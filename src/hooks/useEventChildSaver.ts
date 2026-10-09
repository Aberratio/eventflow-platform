import { useCallback, useRef } from 'react';
import { updateEvent } from '@/api';
import { buildChildIdMap, remapChildIds, type ChildCollection } from '@/api/eventChildren';
import type { UpdateEventPayload } from '@/api/payloads';
import type { Event } from '@/types';

interface SaveCallbacks {
  /** Called after each successful save, with the event as the server stored it. */
  onSaved: (saved: Event, idMap: Map<string, string>) => void;
  /** Called when a save fails; the caller keeps its local state and shows its own toast. */
  onError: (error: unknown) => void;
}

/**
 * Serialized saver for screens that save one child collection on every edit
 * (discount codes). Saves run one at a time in call order, never in parallel,
 * and a queued save is built at send time: temporary ids that earlier saves
 * already resolved are replaced by the server ids from their responses.
 * Otherwise the second save would delete the row the first one created and
 * insert a new one, resetting its server-owned counters.
 */
export function useEventChildSaver<T extends { id: string }>(
  eventId: string | undefined,
  collection: ChildCollection,
  callbacks: SaveCallbacks,
) {
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const idMapRef = useRef<{ eventId?: string; map: Map<string, string> }>({ map: new Map() });
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const mapFor = (id: string) => {
    if (idMapRef.current.eventId !== id) idMapRef.current = { eventId: id, map: new Map() };
    return idMapRef.current.map;
  };

  const save = useCallback(
    (items: T[]): Promise<void> => {
      if (!eventId) return Promise.resolve();
      pendingRef.current += 1;
      const run = async () => {
        try {
          const map = mapFor(eventId);
          const payload = { [collection]: remapChildIds(items, map) } as UpdateEventPayload;
          const response = await updateEvent(eventId, payload);
          if (response.success === false) {
            throw new Error(response.message || 'Nie udało się zapisać kodów');
          }
          for (const [temporary, real] of buildChildIdMap(payload, response.data)) {
            map.set(temporary, real);
          }
          callbacksRef.current.onSaved(response.data, map);
        } catch (error) {
          callbacksRef.current.onError(error);
        } finally {
          pendingRef.current -= 1;
        }
      };
      queueRef.current = queueRef.current.then(run);
      return queueRef.current;
    },
    [eventId, collection],
  );

  const isBusy = useCallback(() => pendingRef.current > 0, []);

  return { save, isBusy };
}
