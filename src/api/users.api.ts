import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, UserFilters } from './types';
import { mockUsers } from './mock/users.mock';
import type { User, UserRole } from '@/types';

export async function getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
  await simulateDelay();
  let filtered = [...mockUsers];

  if (filters?.role) filtered = filtered.filter((u) => u.role === filters.role);
  if (filters?.status) filtered = filtered.filter((u) => (u.status ?? 'active') === filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1 };
}

export async function getUserById(id: string): Promise<ApiResponse<User | null>> {
  await simulateDelay();
  const user = mockUsers.find((u) => u.id === id) ?? null;
  return { data: user, success: !!user };
}

export async function getUserByEmail(email: string): Promise<ApiResponse<User | null>> {
  await simulateDelay();
  const user = mockUsers.find((u) => u.email === email) ?? null;
  return { data: user, success: !!user };
}

export async function createUser(data: Partial<User>): Promise<ApiResponse<User>> {
  await simulateDelay();
  const newUser: User = { id: `u-${Date.now()}`, name: '', email: '', role: 'participant', ...data } as User;
  return { data: newUser, success: true };
}

export async function updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  await simulateDelay();
  const user = mockUsers.find((u) => u.id === id);
  if (!user) return { data: null as unknown as User, success: false, message: 'User not found' };
  return { data: { ...user, ...data }, success: true };
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: mockUsers.some((u) => u.id === id) };
}

export async function updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>> {
  return updateUser(id, { role });
}

export async function updateUserStatus(id: string, status: 'active' | 'blocked'): Promise<ApiResponse<User>> {
  return updateUser(id, { status });
}

export async function getParticipants(): Promise<ApiResponse<User[]>> {
  await simulateDelay();
  return { data: mockUsers.filter((u) => u.role === 'participant'), success: true };
}

export async function getOrganizers(): Promise<ApiResponse<User[]>> {
  await simulateDelay();
  return { data: mockUsers.filter((u) => u.role === 'organizer'), success: true };
}
