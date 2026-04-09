import { simulateDelay } from './client';
import type { ApiResponse, VirtualResultFilters } from './types';
import { mockVirtualResultSubmissions } from './mock/virtual-results.mock';
import type { VirtualResultSubmission, VirtualResultSubmissionStatus } from '@/types';

export async function getVirtualResultSubmissions(
  filters?: VirtualResultFilters,
): Promise<ApiResponse<VirtualResultSubmission[]>> {
  await simulateDelay();
  let results = [...mockVirtualResultSubmissions];

  if (filters?.eventId) results = results.filter((r) => r.eventId === filters.eventId);
  if (filters?.status) results = results.filter((r) => r.status === filters.status);

  return { data: results, success: true };
}

export async function submitVirtualResult(
  data: Partial<VirtualResultSubmission>,
): Promise<ApiResponse<VirtualResultSubmission>> {
  await simulateDelay();
  const submission: VirtualResultSubmission = {
    id: `vrs-${Date.now()}`,
    eventId: '',
    eventName: '',
    distanceId: '',
    distanceName: '',
    userId: '',
    userName: '',
    userEmail: '',
    submittedTime: '',
    submittedTimeInSeconds: 0,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    ...data,
  } as VirtualResultSubmission;
  return { data: submission, success: true };
}

export async function reviewVirtualResult(
  id: string,
  status: VirtualResultSubmissionStatus,
  reason?: string,
): Promise<ApiResponse<VirtualResultSubmission>> {
  await simulateDelay();
  const sub = mockVirtualResultSubmissions.find((s) => s.id === id);
  if (!sub)
    return {
      data: null as unknown as VirtualResultSubmission,
      success: false,
      message: 'Submission not found',
    };
  return {
    data: { ...sub, status, rejectionReason: reason, reviewedAt: new Date().toISOString() },
    success: true,
  };
}
