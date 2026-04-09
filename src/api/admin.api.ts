import { simulateDelay } from './client';
import type { ApiResponse, ActivityLogFilters } from './types';
import {
  mockAdminActivityLogs,
  mockSecuritySettings,
  mockOnlineSessions,
  mockSalesStats,
} from './mock/admin.mock';
import type { AdminActivityLog, SecuritySettings, OnlineSession } from '@/types';

export async function getActivityLogs(
  filters?: ActivityLogFilters,
): Promise<ApiResponse<AdminActivityLog[]>> {
  await simulateDelay();
  let logs = [...mockAdminActivityLogs];

  if (filters?.action) logs = logs.filter((l) => l.action === filters.action);
  if (filters?.userId) logs = logs.filter((l) => l.userId === filters.userId);
  if (filters?.dateFrom) logs = logs.filter((l) => l.timestamp >= filters.dateFrom!);
  if (filters?.dateTo) logs = logs.filter((l) => l.timestamp <= filters.dateTo!);

  return { data: logs, success: true };
}

export async function getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
  await simulateDelay();
  return { data: { ...mockSecuritySettings }, success: true };
}

export async function updateSecuritySettings(
  data: Partial<SecuritySettings>,
): Promise<ApiResponse<SecuritySettings>> {
  await simulateDelay();
  return { data: { ...mockSecuritySettings, ...data }, success: true };
}

export async function getOnlineSessions(): Promise<ApiResponse<OnlineSession[]>> {
  await simulateDelay();
  return { data: [...mockOnlineSessions], success: true };
}

export async function getSalesStats(): Promise<ApiResponse<typeof mockSalesStats>> {
  await simulateDelay();
  return { data: { ...mockSalesStats }, success: true };
}
