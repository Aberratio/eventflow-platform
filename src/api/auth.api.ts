import { httpAdapter } from './adapters/http.adapter';
import type {
  ApiResponse,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from './types';
import type { User, UserRole } from '@/types';

export async function login(credentials: LoginCredentials): Promise<ApiResponse<User | null>> {
  return httpAdapter.login(credentials);
}

export async function loginByRole(role: UserRole): Promise<ApiResponse<User | null>> {
  const users = await httpAdapter.getUsers({ role, pageSize: 1 });
  const user = users.data[0] ?? null;
  return { data: user, success: !!user };
}

export async function logout(): Promise<ApiResponse<void>> {
  return httpAdapter.logout();
}

export async function getCurrentUser(): Promise<ApiResponse<User | null>> {
  return httpAdapter.getCurrentUser();
}

export async function register(data: RegisterPayload): Promise<ApiResponse<User>> {
  return httpAdapter.register(data);
}

export async function resetPassword(_payload: ResetPasswordPayload): Promise<ApiResponse<void>> {
  return httpAdapter.resetPassword(_payload);
}

export async function changePassword(_payload: ChangePasswordPayload): Promise<ApiResponse<void>> {
  return httpAdapter.changePassword(_payload);
}
