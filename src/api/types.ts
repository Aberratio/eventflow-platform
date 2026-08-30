import type {
  SportDiscipline,
  RegistrationStatus,
  UserRole,
  Event,
  ShopCategory,
  AdminActionType,
  VirtualResultSubmissionStatus,
} from '@/types';

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Structured API error */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// ──────────────── Domain Filters ────────────────

export interface EventFilters {
  page?: number;
  pageSize?: number;
  discipline?: SportDiscipline;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: Event['status'];
  seriesId?: string;
  search?: string;
  registrationStatus?: RegistrationStatus;
  includePrivate?: boolean;
  includeUnpublished?: boolean;
  includeDeleted?: boolean;
}

export interface UserFilters {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  search?: string;
  status?: 'active' | 'blocked';
}

export interface ResultFilters {
  eventId?: string;
  distanceId?: string;
  category?: string;
  gender?: 'M' | 'K';
  search?: string;
}

export interface RegistrationFilters {
  eventId?: string;
  userId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'removed';
  search?: string;
}

export interface ShopProductFilters {
  category?: ShopCategory;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  includeArchived?: boolean;
}

export interface OrderFilters {
  userId?: string;
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
}

export interface ActivityLogFilters {
  action?: AdminActionType;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** E0.8: filters for the event-owner-scoped slice of the activity log. */
export interface EventActivityLogFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface VirtualResultFilters {
  eventId?: string;
  status?: VirtualResultSubmissionStatus;
}

export interface ChallengeParticipationFilters {
  challengeId?: string;
  userId?: string;
}

export interface SeriesFilters {
  type?: string;
  status?: 'active' | 'completed' | 'upcoming' | 'archived';
  search?: string;
  includeArchived?: boolean;
}

export interface ChallengeFilters {
  status?: 'active' | 'completed' | 'upcoming' | 'archived';
  seriesId?: string;
  search?: string;
  includeArchived?: boolean;
}

// ──────────────── Auth payloads ────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface ResetPasswordPayload {
  email: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
