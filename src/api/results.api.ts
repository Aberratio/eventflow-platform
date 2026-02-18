import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, ResultFilters } from './types';
import { mockResults, mockPersonalRecords, mockTeamResults, mockResultDocuments } from './mock/results.mock';
import type { Result, PersonalRecord, TeamResult, EventResultDocument } from '@/types';

export async function getResults(filters?: ResultFilters): Promise<PaginatedResponse<Result>> {
  await simulateDelay();
  let filtered = [...mockResults];

  if (filters?.eventId) filtered = filtered.filter((r) => r.eventId === filters.eventId);
  if (filters?.distanceId) filtered = filtered.filter((r) => r.distanceId === filters.distanceId);
  if (filters?.category) filtered = filtered.filter((r) => r.category === filters.category);
  if (filters?.gender) filtered = filtered.filter((r) => r.gender === filters.gender);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((r) => r.userName.toLowerCase().includes(q) || r.bibNumber.includes(q));
  }

  return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1 };
}

export async function getResultsByEvent(eventId: string, distanceId?: string): Promise<ApiResponse<Result[]>> {
  await simulateDelay();
  let results = mockResults.filter((r) => r.eventId === eventId);
  if (distanceId) results = results.filter((r) => r.distanceId === distanceId);
  return { data: results, success: true };
}

export async function getResultsByUser(userId: string): Promise<ApiResponse<Result[]>> {
  await simulateDelay();
  return { data: mockResults.filter((r) => r.userId === userId), success: true };
}

export async function createResult(data: Partial<Result>): Promise<ApiResponse<Result>> {
  await simulateDelay();
  const result: Result = {
    id: `res-${Date.now()}`,
    eventId: '',
    eventName: '',
    distanceId: '',
    distanceName: '',
    userId: '',
    userName: '',
    bibNumber: '',
    category: '',
    time: '',
    timeInSeconds: 0,
    position: 0,
    categoryPosition: 0,
    status: 'finished',
    ...data,
  } as Result;
  return { data: result, success: true };
}

export async function updateResult(id: string, data: Partial<Result>): Promise<ApiResponse<Result>> {
  await simulateDelay();
  const result = mockResults.find((r) => r.id === id);
  if (!result) return { data: null as unknown as Result, success: false, message: 'Result not found' };
  return { data: { ...result, ...data }, success: true };
}

export async function deleteResult(id: string): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: mockResults.some((r) => r.id === id) };
}

export async function getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>> {
  await simulateDelay();
  // In a real app, userId would filter records. Mock returns all.
  void userId;
  return { data: [...mockPersonalRecords], success: true };
}

export async function getTeamResults(eventId: string): Promise<ApiResponse<TeamResult[]>> {
  await simulateDelay();
  return { data: mockTeamResults.filter((t) => t.eventId === eventId), success: true };
}

export async function getResultDocuments(eventId: string): Promise<ApiResponse<EventResultDocument[]>> {
  await simulateDelay();
  return { data: mockResultDocuments.filter((d) => d.eventId === eventId), success: true };
}

export async function uploadResultDocument(
  data: Partial<EventResultDocument>,
): Promise<ApiResponse<EventResultDocument>> {
  await simulateDelay();
  const doc: EventResultDocument = {
    id: `doc-${Date.now()}`,
    eventId: '',
    name: '',
    type: 'open',
    fileUrl: '',
    uploadedAt: new Date().toISOString(),
    uploadedBy: '',
    ...data,
  } as EventResultDocument;
  return { data: doc, success: true };
}
