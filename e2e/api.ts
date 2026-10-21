import { expect, type APIRequestContext } from '@playwright/test';
import { API_URL } from './env';
import { credentialsByRole, type TestRole } from './helpers';

export { API_URL };

const PASSWORD = 'demo1234';

export async function apiToken(request: APIRequestContext, role: TestRole): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email: credentialsByRole[role].email, password: PASSWORD },
  });
  expect(res.status(), `API login as ${role}`).toBe(200);
  return (await res.json()).data.token as string;
}

async function adminHeaders(request: APIRequestContext) {
  return { Authorization: `Bearer ${await apiToken(request, 'admin')}` };
}

export interface SeededEvent {
  id: string;
  name: string;
  slug: string;
  publicationStatus: string;
  rejectionReason?: string | null;
}

// Fixture IDs are stable but FixtureCalendar::retitleForYear rewrites year-stamped names and slugs on
// every seed, so specs resolve events by ID through the API instead of hard-coding names.
export async function seededEvent(request: APIRequestContext, id: string): Promise<SeededEvent> {
  const res = await request.get(`${API_URL}/events/${id}`, {
    headers: await adminHeaders(request),
  });
  expect(res.status(), `GET /events/${id}`).toBe(200);
  return (await res.json()).data as SeededEvent;
}

// The seed gives u-organizer more events than its event_limit, so "Utwórz wydarzenie" is
// disabled on a fresh seed. Raise the limit when fewer than `headroom` slots are left.
export async function ensureOrganizerCapacity(
  request: APIRequestContext,
  organizerId = 'u-organizer',
  headroom = 5,
): Promise<void> {
  const headers = await adminHeaders(request);
  const url = `${API_URL}/organizers/${organizerId}/event-limit`;
  const res = await request.get(url, { headers });
  expect(res.status(), `GET ${url}`).toBe(200);
  const { limit, used } = (await res.json()).data as { limit: number; used: number };
  if (limit - used < headroom) {
    const patch = await request.patch(url, { headers, data: { limit: used + headroom } });
    expect(patch.status(), `PATCH ${url}`).toBe(200);
  }
}

export async function organizerPackageCredits(
  request: APIRequestContext,
  userId = 'u-organizer',
): Promise<number> {
  const res = await request.get(`${API_URL}/users/${userId}`, {
    headers: await adminHeaders(request),
  });
  expect(res.status(), `GET /users/${userId}`).toBe(200);
  return Number((await res.json()).data.organizerPackageCredits ?? 0);
}
