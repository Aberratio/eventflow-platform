import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, EventFilters } from './types';
import { mockEvents } from './mock/events.mock';
import type { Event } from '@/types';

// GET /api/events
export async function getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
  await simulateDelay();
  let filtered = [...mockEvents];

  if (!filters?.includeUnpublished) {
    filtered = filtered.filter((e) => ['active', 'past', 'archived'].includes(e.status));
  } else if (!filters.includeDeleted) {
    filtered = filtered.filter((e) => e.status !== 'deleted');
  }
  // Exclude private events by default
  if (!filters?.includePrivate) filtered = filtered.filter((e) => !e.isPrivate);

  if (filters?.discipline) filtered = filtered.filter((e) => e.discipline === filters.discipline);
  if (filters?.city)
    filtered = filtered.filter((e) => e.city.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters?.status) filtered = filtered.filter((e) => e.status === filters.status);
  if (filters?.seriesId) filtered = filtered.filter((e) => e.seriesId === filters.seriesId);
  if (filters?.registrationStatus)
    filtered = filtered.filter((e) => e.registrationStatus === filters.registrationStatus);
  if (filters?.dateFrom) filtered = filtered.filter((e) => e.date >= filters.dateFrom!);
  if (filters?.dateTo) filtered = filtered.filter((e) => e.date <= filters.dateTo!);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (e) => e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q),
    );
  }

  return {
    data: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length,
    totalPages: 1,
  };
}

// GET /api/events/:slug
export async function getEventBySlug(slug: string): Promise<ApiResponse<Event | null>> {
  await simulateDelay();
  const event = mockEvents.find((e) => e.slug === slug) ?? null;
  return { data: event, success: !!event, message: event ? undefined : 'Event not found' };
}

// GET /api/events/:id
export async function getEventById(id: string): Promise<ApiResponse<Event | null>> {
  await simulateDelay();
  const event = mockEvents.find((e) => e.id === id) ?? null;
  return { data: event, success: !!event, message: event ? undefined : 'Event not found' };
}

// POST /api/events
export async function createEvent(data: Partial<Event>): Promise<ApiResponse<Event>> {
  await simulateDelay();
  const newEvent: Event = {
    id: `e-${Date.now()}`,
    name: data.name ?? '',
    slug: data.slug ?? '',
    discipline: data.discipline ?? 'running',
    date: data.date ?? '',
    location: data.location ?? '',
    city: data.city ?? '',
    description: data.description ?? '',
    imageUrl: data.imageUrl ?? '',
    distances: data.distances ?? [],
    organizerId: data.organizerId ?? '',
    organizerName: data.organizerName ?? '',
    status: 'draft',
    registrationDeadline: data.registrationDeadline ?? '',
    featured: false,
    ...data,
  } as Event;
  return { data: newEvent, success: true };
}

// PUT /api/events/:id
export async function updateEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
  await simulateDelay();
  const event = mockEvents.find((e) => e.id === id);
  if (!event) return { data: null as unknown as Event, success: false, message: 'Event not found' };
  const updated = { ...event, ...data };
  return { data: updated, success: true };
}

// DELETE /api/events/:id
export async function deleteEvent(id: string): Promise<ApiResponse<void>> {
  await simulateDelay();
  const exists = mockEvents.some((e) => e.id === id);
  return {
    data: undefined as unknown as void,
    success: exists,
    message: exists ? undefined : 'Event not found',
  };
}

// PUT /api/events/:id/status
export async function updateEventStatus(
  id: string,
  status: Event['status'],
  reason?: string,
): Promise<ApiResponse<Event>> {
  await simulateDelay();
  const event = mockEvents.find((e) => e.id === id);
  if (!event) return { data: null as unknown as Event, success: false, message: 'Event not found' };
  const updated = { ...event, status, rejectionReason: reason };
  return { data: updated, success: true };
}

// GET /api/events/featured
export async function getFeaturedEvents(): Promise<ApiResponse<Event[]>> {
  await simulateDelay();
  return { data: mockEvents.filter((e) => e.featured), success: true };
}

// GET /api/events/live
export async function getLiveEvents(): Promise<ApiResponse<Event[]>> {
  await simulateDelay();
  return { data: mockEvents.filter((e) => e.isLive), success: true };
}

// GET /api/events/organizer/:organizerId
export async function getEventsByOrganizer(organizerId: string): Promise<ApiResponse<Event[]>> {
  await simulateDelay();
  return { data: mockEvents.filter((e) => e.organizerId === organizerId), success: true };
}
