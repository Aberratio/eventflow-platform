import { getAdapter } from './provider';
import type { ApiResponse } from './types';
import type { Partner } from '@/types';

export async function getPartners(): Promise<ApiResponse<Partner[]>> {
  return getAdapter().then((adapter) => adapter.getPartners());
}

export async function getFeaturedPartners(): Promise<ApiResponse<Partner[]>> {
  return getAdapter().then((adapter) => adapter.getFeaturedPartners());
}
