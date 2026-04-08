export type UserRole = 'participant' | 'organizer' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  birthYear?: number;
  gender?: 'M' | 'K';
  club?: string;
  companyName?: string;
  nip?: string;
  website?: string;
  description?: string;
  isNewUser?: boolean;
  status?: 'active' | 'blocked';
}

export type AdminActionType =
  | 'login'
  | 'logout'
  | 'user_edit'
  | 'user_delete'
  | 'event_approve'
  | 'event_reject'
  | 'order_update'
  | 'product_edit'
  | 'settings_change'
  | 'password_change';

export interface AdminActivityLog {
  id: string;
  userId: string;
  action: AdminActionType;
  description: string;
  targetType?: 'user' | 'event' | 'order' | 'product' | 'settings';
  targetId?: string;
  targetName?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastUsed: string;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  browser: string;
  os: string;
  success: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'app' | 'sms';
  lastPasswordChange: string;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  trustedDevices: TrustedDevice[];
  loginHistory: LoginHistoryEntry[];
}

export interface OnlineSession {
  userId: string;
  userName: string;
  role: 'admin' | 'moderator';
  loginAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  browser?: string;
  location?: string;
}
