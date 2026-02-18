import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockPartners } from './mock/partners.mock';
import type { Partner } from '@/types';

export async function getPartners(): Promise<ApiResponse<Partner[]>> {
  await simulateDelay();
  return { data: [...mockPartners], success: true };
}

export async function getFeaturedPartners(): Promise<ApiResponse<Partner[]>> {
  await simulateDelay();
  return { data: mockPartners.filter((p) => p.featured), success: true };
}
