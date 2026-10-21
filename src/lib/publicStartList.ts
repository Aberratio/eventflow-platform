import type { PublicStartListEntry, Registration } from '@/types';

/**
 * Preview mode (organizer/staff viewing their own not-yet-public event)
 * maps a full `Registration` down to the same DTO shape the public
 * `/start-list` endpoint returns, so `EventStartListTab` only ever has to
 * render one shape. Preview is for the owning organizer or staff, so no
 * anonymization is applied here — that masking only ever happens server-side
 * for the real public endpoint.
 */
export function toPublicStartListEntry(r: Registration): PublicStartListEntry {
  return {
    id: r.id,
    distanceId: r.distanceId,
    distanceName: r.distanceName,
    category: r.category,
    userId: r.userId,
    userName: r.userName,
    bibNumber: r.bibNumber,
    teamName: r.teamName,
    teamId: r.teamId,
    status: r.status,
    registeredAt: r.registeredAt,
    hasMerchandise: (r.merchandiseOrders?.length ?? 0) > 0,
    formFields: [],
  };
}
