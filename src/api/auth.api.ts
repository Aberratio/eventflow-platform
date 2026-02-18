import { simulateDelay } from './client';
import type { ApiResponse, LoginCredentials, RegisterPayload, ResetPasswordPayload, ChangePasswordPayload } from './types';
import { mockUsers } from './mock/users.mock';
import type { User, UserRole } from '@/types';

export async function login(credentials: LoginCredentials): Promise<ApiResponse<User | null>> {
  await simulateDelay();
  const user = mockUsers.find((u) => u.email === credentials.email) ?? null;
  return { data: user, success: !!user, message: user ? undefined : 'Invalid credentials' };
}

/** Mock login by role (development convenience). */
export async function loginByRole(role: UserRole): Promise<ApiResponse<User | null>> {
  await simulateDelay();
  const user = mockUsers.find((u) => u.role === role) ?? null;
  return { data: user, success: !!user };
}

export async function logout(): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: true };
}

export async function getCurrentUser(): Promise<ApiResponse<User | null>> {
  await simulateDelay();
  return { data: null, success: true };
}

export async function register(data: RegisterPayload): Promise<ApiResponse<User>> {
  await simulateDelay();
  const newUser: User = {
    id: `u-${Date.now()}`,
    name: data.name,
    email: data.email,
    role: data.role ?? 'participant',
    isNewUser: true,
  };
  return { data: newUser, success: true };
}

export async function resetPassword(_payload: ResetPasswordPayload): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: true, message: 'Password reset email sent' };
}

export async function changePassword(_payload: ChangePasswordPayload): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: true, message: 'Password changed' };
}
