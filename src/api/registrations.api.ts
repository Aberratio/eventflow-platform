import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, RegistrationFilters } from './types';
import { mockRegistrations } from './mock/registrations.mock';
import type { Registration, PaymentDetails } from '@/types';

export async function getRegistrations(filters?: RegistrationFilters): Promise<PaginatedResponse<Registration>> {
  await simulateDelay();
  let filtered = [...mockRegistrations];

  if (filters?.eventId) filtered = filtered.filter((r) => r.eventId === filters.eventId);
  if (filters?.userId) filtered = filtered.filter((r) => r.userId === filters.userId);
  if (filters?.status) filtered = filtered.filter((r) => r.status === filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((r) => r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q));
  }

  return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1 };
}

export async function getRegistrationsByEvent(eventId: string): Promise<ApiResponse<Registration[]>> {
  await simulateDelay();
  return { data: mockRegistrations.filter((r) => r.eventId === eventId), success: true };
}

export async function getRegistrationsByUser(userId: string): Promise<ApiResponse<Registration[]>> {
  await simulateDelay();
  return { data: mockRegistrations.filter((r) => r.userId === userId), success: true };
}

export async function createRegistration(data: Partial<Registration>): Promise<ApiResponse<Registration>> {
  await simulateDelay();
  const reg: Registration = {
    id: `reg-${Date.now()}`,
    eventId: '',
    eventName: '',
    userId: '',
    userName: '',
    userEmail: '',
    distanceId: '',
    distanceName: '',
    category: '',
    registeredAt: new Date().toISOString(),
    status: 'pending',
    ...data,
  } as Registration;
  return { data: reg, success: true };
}

export async function updateRegistration(id: string, data: Partial<Registration>): Promise<ApiResponse<Registration>> {
  await simulateDelay();
  const reg = mockRegistrations.find((r) => r.id === id);
  if (!reg) return { data: null as unknown as Registration, success: false, message: 'Registration not found' };
  return { data: { ...reg, ...data }, success: true };
}

export async function cancelRegistration(id: string): Promise<ApiResponse<Registration>> {
  return updateRegistration(id, { status: 'cancelled' });
}

export async function updatePaymentDetails(id: string, paymentDetails: PaymentDetails): Promise<ApiResponse<Registration>> {
  return updateRegistration(id, { paymentDetails });
}
