import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockTickets, mockCertificates } from './mock/tickets.mock';
import type { Ticket, Certificate } from '@/types';

export async function getTickets(userId: string): Promise<ApiResponse<Ticket[]>> {
  await simulateDelay();
  return { data: mockTickets.filter((t) => t.participantId === userId), success: true };
}

export async function getCertificates(userId: string): Promise<ApiResponse<Certificate[]>> {
  await simulateDelay();
  // Mock returns all certificates (userId filtering would apply in real API)
  void userId;
  return { data: [...mockCertificates], success: true };
}
