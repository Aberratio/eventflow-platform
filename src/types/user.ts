export type UserRole = 'participant' | 'organizer' | 'moderator' | 'admin' | 'superadmin';

export interface UserAddress {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface SosContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  birthYear?: number;
  birthDate?: string;
  gender?: 'M' | 'K';
  club?: string;
  companyName?: string;
  nip?: string;
  website?: string;
  description?: string;
  address?: UserAddress;
  sosContacts?: SosContact[];
  isNewUser?: boolean;
  status?: 'active' | 'blocked';
  eventLimit?: number;
}

export interface AuthorizationGrantedToMe {
  id: string;
  grantorId: string;
  grantorName: string;
  grantorEmail: string;
  grantorAvatar?: string;
  createdAt: string;
}

export interface AuthorizationGrantedByMe {
  id: string;
  granteeId: string;
  granteeName: string;
  granteeEmail: string;
  granteeAvatar?: string;
  createdAt: string;
}

export interface AuthorizationsResponse {
  grantedToMe: AuthorizationGrantedToMe[];
  grantedByMe: AuthorizationGrantedByMe[];
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
  role: 'admin' | 'superadmin' | 'moderator';
  loginAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  browser?: string;
  location?: string;
}
