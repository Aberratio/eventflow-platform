export type UserRole = 'participant' | 'organizer' | 'admin';

export type SeriesType = 'virtual' | 'local' | 'championship' | 'cup';

export interface EventSeries {
  id: string;
  name: string;
  slug: string;
  type: SeriesType;
  description: string;
  organizerId: string;
  organizerName: string;
  eventIds: string[];
  rules?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // Participant fields
  phone?: string;
  birthYear?: number;
  gender?: 'M' | 'K';
  club?: string;
  // Organizer fields
  companyName?: string;
  nip?: string;
  website?: string;
  description?: string;
  // New user tracking
  isNewUser?: boolean;
}

export type SportDiscipline = 'running' | 'cycling' | 'triathlon' | 'multisport';

export type RegistrationStatus = 'open' | 'closed' | 'none';

export interface PriceTier {
  id: string;
  name: string;
  price: number;
  endDate: string;
  description?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validFrom?: string;
  validTo?: string;
  maxUses?: number;
  usedCount: number;
  distanceIds?: string[];
  active: boolean;
}

export interface MerchandiseOrder {
  merchandiseId: string;
  merchandiseName: string;
  size?: string;
  color?: string;
  colorHex?: string;
  quantity: number;
  price: number;
}

export interface Distance {
  id: string;
  name: string;
  length: number;
  unit: 'km' | 'm';
  categories: string[];
  limit?: number;
  registeredCount: number;
  price: number;
  priceTiers?: PriceTier[];
}

export interface OrganizerContact {
  email: string;
  phone?: string;
  website?: string;
}

export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
  enabled: boolean;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  discipline: SportDiscipline;
  date: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  seriesId?: string;
  distances: Distance[];
  organizerId: string;
  organizerName: string;
  organizerContact?: OrganizerContact;
  status: 'draft' | 'awaiting_approval' | 'published' | 'completed' | 'cancelled' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  registrationDeadline: string;
  featured: boolean;
  liveResultsUrl?: string;
  isLive?: boolean;
  registrationStatus?: RegistrationStatus;
  paymentMethods?: PaymentMethod[];
  merchandise?: EventMerchandise[];
  discountCodes?: DiscountCode[];
  enableMerchandiseInRegistration?: boolean;
  insuranceOption?: InsuranceOption;
  // Gallery and route
  gallery?: string[];
  routeMapUrl?: string;
  routeGpxUrl?: string;
  routeElevationProfile?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

export interface MerchandiseColor {
  id: string;
  name: string;
  hex: string;
}

export interface EventMerchandise {
  id: string;
  name: string;
  description?: string;
  price: number;
  sizes: string[];
  colors: MerchandiseColor[];
  imageUrl?: string;
  available: boolean;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  featured: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  distanceId: string;
  distanceName: string;
  category: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'removed';
  bibNumber?: string;
  teamName?: string;
  teamId?: string;
  pricePaid?: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders?: MerchandiseOrder[];
  insurancePaid?: number;
  removedAt?: string;
}

export interface Result {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  userName: string;
  bibNumber: string;
  category: string;
  time: string;
  timeInSeconds: number;
  position: number;
  categoryPosition: number;
  status: 'finished' | 'dnf' | 'dsq';
  gender?: 'M' | 'K';
  birthYear?: number;
}

export interface PersonalRecord {
  distance: string;
  time: string;
  eventName: string;
  date: string;
}

export interface Certificate {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  distance: string;
  time: string;
  position: number;
  downloadUrl: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  subject: string;
  content: string;
  sentAt: string;
  read: boolean;
  eventId?: string;
}

// Shop types
export type ShopCategory = 'apparel' | 'footwear' | 'accessories' | 'nutrition' | 'electronics' | 'services';

export interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description?: string;
}

export interface ShopPaymentMethod {
  id: string;
  name: string;
  icon?: string;
  surcharge?: number;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ShopCategory;
  brand: string;
  sizes?: string[];
  colors?: MerchandiseColor[];
  imageUrl: string;
  images?: string[];
  inStock: boolean;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  // Service-specific fields
  isService?: boolean;
  serviceDetails?: string;
  validityDays?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface OrderDetails {
  orderId: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: ShopPaymentMethod;
  productTotal: number;
  deliveryPrice: number;
  paymentSurcharge: number;
  totalPrice: number;
  estimatedDelivery: string;
  createdAt: string;
}

// Ticket types
export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  distanceId: string;
  distanceName: string;
  location: string;
  participantName: string;
  participantId: string;
  bibNumber: string;
  category: string;
  registrationId: string;
}

// Shop order types
export interface ShopOrder {
  id: string;
  orderNumber: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: ShopPaymentMethod;
  productTotal: number;
  deliveryPrice: number;
  paymentSurcharge: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  trackingNumber?: string;
}

// Extended discount code with group discounts
export interface GroupDiscountCode extends DiscountCode {
  minParticipants?: number;
}

// Admin activity log
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

// Security settings
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

// Notification types
export type NotificationType = 'registration' | 'moderation' | 'order' | 'message' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}