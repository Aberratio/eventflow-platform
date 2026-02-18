import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockGoogleCalendarSettings } from './mock/calendar.mock';
import type { GoogleCalendarSettings, Event } from '@/types';

export async function getCalendarSettings(): Promise<ApiResponse<GoogleCalendarSettings>> {
  await simulateDelay();
  return { data: { ...mockGoogleCalendarSettings }, success: true };
}

export async function updateCalendarSettings(
  data: Partial<GoogleCalendarSettings>,
): Promise<ApiResponse<GoogleCalendarSettings>> {
  await simulateDelay();
  return { data: { ...mockGoogleCalendarSettings, ...data }, success: true };
}

export async function addEventToCalendar(event: Event): Promise<ApiResponse<void>> {
  await simulateDelay();
  void event;
  return { data: undefined as unknown as void, success: true, message: 'Event added to calendar' };
}
