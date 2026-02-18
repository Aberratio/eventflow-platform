import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockGlobalInsuranceSettings } from './mock/insurance.mock';
import type { GlobalInsuranceSettings } from '@/types';

export async function getGlobalInsuranceSettings(): Promise<ApiResponse<GlobalInsuranceSettings>> {
  await simulateDelay();
  return { data: { ...mockGlobalInsuranceSettings }, success: true };
}

export async function updateGlobalInsuranceSettings(
  data: Partial<GlobalInsuranceSettings>,
): Promise<ApiResponse<GlobalInsuranceSettings>> {
  await simulateDelay();
  return { data: { ...mockGlobalInsuranceSettings, ...data }, success: true };
}
