import type { ApiResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
const MOCK_DELAY_MIN = 150;
const MOCK_DELAY_MAX = 300;

/** Simulate realistic network latency (random 150-300 ms). */
export async function simulateDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN + 1)) + MOCK_DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Base HTTP client – prepared for real backend.
 * Currently throws; each *.api.ts file uses `simulateDelay()` + mock data instead.
 * When a backend is ready, swap mock logic for this function.
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  await simulateDelay();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `API error ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}
