export type UserRole = 'participant' | 'organizer' | 'moderator' | 'admin';

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

export interface DiscountCodeUsage {
  userId: string;
  userName: string;
  usedAt: string;
  registrationId: string;
  distanceName: string;
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
  usedBy?: DiscountCodeUsage[];
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

export interface BannerCropArea {
  x: number;      // % od lewej
  y: number;      // % od góry
  width: number;  // % szerokości
  height: number; // % wysokości
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
  galleryAlbums?: GalleryAlbum[];
  routeMapUrl?: string;
  routeGpxUrl?: string;
  routeElevationProfile?: string;
  // Banner and organizer logo
  bannerUrl?: string;
  bannerCropArea?: BannerCropArea;
  organizerLogoUrl?: string;
  // Virtual event fields
  isVirtual?: boolean;
  startDate?: string;  // Start of virtual event window
  endDate?: string;    // End of virtual event window
  resultDocuments?: EventResultDocument[];
  // Payment configuration
  paymentConfig?: PaymentConfig;
  // Rich text fields
  organizersHtml?: string;          // HTML with organizers info (multiple, sponsors, links)
  rulesHtml?: string;               // HTML with rules/regulations (links to PDFs)
  finalAcceptanceHtml?: string;     // HTML with final acceptance text for registration
  requireFinalAcceptance?: boolean; // Whether to show final acceptance checkbox
}

// Payment configuration types
export type PaymentConfigType = 'organizer_bank' | 'admin_gateway';

export interface PaymentConfig {
  type: PaymentConfigType;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  transferTitle?: string;
}

// Detailed payment tracking for bank transfers
export interface MerchandisePaymentStatus {
  merchandiseId: string;
  merchandiseName: string;
  paid: boolean;
  paidAt?: string;
  amount: number;
}

export interface PaymentDetails {
  startFeePaid: boolean;
  startFeePaidAt?: string;
  startFeeAmount: number;
  insurancePaid: boolean;
  insurancePaidAt?: string;
  insuranceAmount?: number;
  merchandisePayments: MerchandisePaymentStatus[];
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
  // Detailed payment tracking for bank transfer events
  paymentDetails?: PaymentDetails;
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

// Result classification types
export type ResultClassificationType = 'open' | 'category' | 'team' | 'distance';

// Team result for group classifications
export interface TeamResult {
  id: string;
  eventId: string;
  distanceId: string;
  distanceName: string;
  teamName: string;
  members: Array<{
    userId: string;
    userName: string;
    time: string;
    timeInSeconds: number;
  }>;
  totalTime: string;
  totalTimeInSeconds: number;
  position: number;
}

// PDF documents with results
export interface EventResultDocument {
  id: string;
  eventId: string;
  name: string;
  type: ResultClassificationType;
  distanceId?: string;
  distanceName?: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
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

// Gallery album for external photo platforms
export type GalleryPlatform = 'google_photos' | 'flickr' | 'facebook' | 'instagram' | 'other';

export interface GalleryAlbum {
  id: string;
  name: string;
  url: string;
  platform: GalleryPlatform;
  photographer?: string;
}

// Virtual event result submission
export type VirtualResultSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface VirtualResultSubmission {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  submittedTime: string;          // Format HH:MM:SS
  submittedTimeInSeconds: number;
  proofUrl?: string;              // Link to proof (Strava, photo)
  notes?: string;                 // Participant's note
  submittedAt: string;            // Submission date
  status: VirtualResultSubmissionStatus;
  reviewedAt?: string;            // Review date
  reviewedBy?: string;            // Organizer ID
  rejectionReason?: string;       // Reason for rejection
}

// CMS Info Page types
export type InfoPageSectionType = 'hero' | 'text' | 'cards' | 'faq' | 'cta' | 'stats' | 'team' | 'pricing';

export interface InfoPageSectionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  link?: string;
  image?: string;
  price?: number;
  features?: string[];
}

export interface InfoPageSection {
  id: string;
  type: InfoPageSectionType;
  title?: string;
  content?: string;
  items?: InfoPageSectionItem[];
}

export interface InfoPage {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  content: InfoPageSection[];
  published: boolean;
  showInFooter: boolean;
  showInHeader: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Global insurance settings (editable by admin)
export interface GlobalInsuranceSettings {
  infoHtml: string;        // Rich text description HTML
  baseFee: number;         // Base fee (e.g. 15 PLN)
  ageMultiplier: number;   // Age multiplier (e.g. 0.5 PLN/year)
  maxAge: number;          // Maximum age (e.g. 70)
}

// Online session for staff presence tracking
export interface OnlineSession {
  userId: string;
  userName: string;
  role: 'admin' | 'moderator';
  loginAt: string;           // ISO date
  lastActiveAt: string;      // ISO date
  ipAddress?: string;
  browser?: string;
  location?: string;
}

// Google Calendar integration settings
export interface GoogleCalendarSettings {
  enabled: boolean;
  connected: boolean;
  calendarId?: string;        // e.g. 'primary' or specific calendar ID
  lastSyncAt?: string;
}