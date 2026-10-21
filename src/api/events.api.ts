import type { ApiResponse, PaginatedResponse, EventFilters } from './types';
import { httpAdapter } from './adapters/http.adapter';
import type { Event, EventVisibility } from '@/types';
import type { CreateEventPayload, UpdateEventPayload } from './payloads';

export async function getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
  return httpAdapter.getEvents(filters);
}

export async function getEventBySlug(
  slug: string,
  accessCode?: string,
): Promise<ApiResponse<Event | null>> {
  return httpAdapter.getEventBySlug(slug, accessCode);
}

export async function getEventById(id: string): Promise<ApiResponse<Event | null>> {
  return httpAdapter.getEventById(id);
}

/** Unauthenticated embed-status check, called by the embed page. */
export async function getEventEmbedPublicConfig(
  id: string,
): Promise<ApiResponse<{ enabled: boolean; allowedOrigins: string[] }>> {
  return httpAdapter.getEventEmbedPublicConfig(id);
}

export async function createEvent(data: CreateEventPayload): Promise<ApiResponse<Event>> {
  return httpAdapter.createEvent(data);
}

export async function updateEvent(
  id: string,
  data: UpdateEventPayload,
): Promise<ApiResponse<Event>> {
  return httpAdapter.updateEvent(id, data);
}

export async function deleteEvent(id: string): Promise<ApiResponse<void>> {
  return httpAdapter.deleteEvent(id);
}

export async function submitEvent(id: string): Promise<ApiResponse<Event>> {
  return httpAdapter.submitEvent(id);
}

export async function approveEvent(id: string): Promise<ApiResponse<Event>> {
  return httpAdapter.approveEvent(id);
}

export async function rejectEvent(id: string, reason: string): Promise<ApiResponse<Event>> {
  return httpAdapter.rejectEvent(id, reason);
}

export async function cancelEvent(id: string): Promise<ApiResponse<Event>> {
  return httpAdapter.cancelEvent(id);
}

export async function setEventVisibility(
  id: string,
  visibility: EventVisibility,
  accessCode?: string,
): Promise<ApiResponse<Event>> {
  return httpAdapter.setEventVisibility(id, visibility, accessCode);
}

export async function setEventIsTest(id: string, isTest: boolean): Promise<ApiResponse<Event>> {
  return httpAdapter.setEventIsTest(id, isTest);
}

export async function getFeaturedEvents(): Promise<ApiResponse<Event[]>> {
  return httpAdapter.getFeaturedEvents();
}

export async function getLiveEvents(): Promise<ApiResponse<Event[]>> {
  return httpAdapter.getLiveEvents();
}

export async function getEventsByOrganizer(organizerId: string): Promise<ApiResponse<Event[]>> {
  return httpAdapter.getEventsByOrganizer(organizerId);
}
