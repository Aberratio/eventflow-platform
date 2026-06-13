import type { ApiResponse, PaginatedResponse, UserFilters } from './types';
import { httpAdapter } from './adapters/http.adapter';
import type { User, UserRole } from '@/types';

export async function getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
  return httpAdapter.getUsers(filters);
}

export async function getUserById(id: string): Promise<ApiResponse<User | null>> {
  return httpAdapter.getUserById(id);
}

export async function getUserByEmail(email: string): Promise<ApiResponse<User | null>> {
  return httpAdapter.getUserByEmail(email);
}

export async function createUser(data: Partial<User>): Promise<ApiResponse<User>> {
  return httpAdapter.createUser(data);
}

export async function updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  return httpAdapter.updateUser(id, data);
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return httpAdapter.deleteUser(id);
}

export async function updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>> {
  return updateUser(id, { role });
}

export async function updateUserStatus(
  id: string,
  status: 'active' | 'blocked',
): Promise<ApiResponse<User>> {
  return updateUser(id, { status });
}

export async function getParticipants(): Promise<ApiResponse<User[]>> {
  return httpAdapter.getParticipants();
}

export async function getOrganizers(): Promise<ApiResponse<User[]>> {
  return httpAdapter.getOrganizers();
}
