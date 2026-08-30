/**
 * API Payload types — strict input shapes for create/update operations.
 *
 * Unlike `Partial<T>`, these explicitly define which fields are required
 * and which are optional at each operation boundary.
 */

import type {
  SportDiscipline,
  Distance,
  OrganizerContact,
  OrganizerInfo,
  PaymentMethod,
  EventMerchandise,
  DiscountCode,
  InsuranceOption,
  GalleryAlbum,
  BannerCropArea,
  OrganizerLogoShape,
  RegistrationEmbedConfig,
  RegistrationFormConfig,
  EventDisplayOptions,
  EventLogisticsInfo,
  PaymentConfig,
  UserRole,
  UserAddress,
  SosContact,
  MerchandiseOrder,
  Registration,
  RelayTeamMember,
  ShopOrder,
  InfoPageSection,
  EventSeries,
  ShopProduct,
  ShopCategoryConfig,
  Challenge,
  Partner,
} from '@/types';
import type { CreateEmailTemplatePayload, EmailPreviewRequest } from '@/types/email';

// ──────────────── Events ────────────────

export interface CreateEventPayload {
  name: string;
  slug: string;
  discipline: SportDiscipline;
  date: string;
  location: string;
  city: string;
  description: string;
  imageUrl: string;
  distances: Distance[];
  organizerId: string;
  organizerName: string;
  registrationDeadline: string;
  organizerContact?: OrganizerContact;
  seriesId?: string;
  paymentMethods?: PaymentMethod[];
  merchandise?: EventMerchandise[];
  discountCodes?: DiscountCode[];
  liveResultsUrl?: string;
  enableMerchandiseInRegistration?: boolean;
  insuranceOption?: InsuranceOption;
  galleryAlbums?: GalleryAlbum[];
  bannerUrl?: string;
  bannerCropArea?: BannerCropArea;
  organizerLogoUrl?: string;
  organizerLogoShape?: OrganizerLogoShape;
  isVirtual?: boolean;
  startDate?: string;
  endDate?: string;
  paymentConfig?: PaymentConfig;
  rulesHtml?: string;
  finalAcceptanceHtml?: string;
  requireFinalAcceptance?: boolean;
  isPrivate?: boolean;
  accessCode?: string;
  registrationEmbed?: RegistrationEmbedConfig;
  registrationFormConfig?: RegistrationFormConfig;
  displayOptions?: EventDisplayOptions;
  logisticsInfo?: EventLogisticsInfo;
  organizerInfo?: OrganizerInfo;
  organizersHtml?: string;
  featured?: boolean;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

// ──────────────── Users ────────────────

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
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
}

export type UpdateUserPayload = Partial<CreateUserPayload> & {
  status?: 'active' | 'blocked';
  avatar?: string;
};

// ──────────────── Auth ────────────────

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

// ──────────────── Registrations ────────────────

export interface CreateRegistrationPayload {
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  distanceId: string;
  distanceName: string;
  category: string;
  teamName?: string;
  teamId?: string;
  relayMembers?: RelayTeamMember[];
  discountCode?: string;
  discountAmount?: number;
  pricePaid?: number;
  totalAmount?: number;
  merchandiseOrders?: MerchandiseOrder[];
  paymentDetails?: Registration['paymentDetails'];
  registeredById?: string;
}

export type UpdateRegistrationPayload = Partial<
  Pick<
    Registration,
    | 'status'
    | 'bibNumber'
    | 'teamName'
    | 'teamId'
    | 'pricePaid'
    | 'discountAmount'
    | 'paymentDetails'
  >
>;

// ──────────────── Results ────────────────

export interface CreateResultPayload {
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

export type UpdateResultPayload = Partial<CreateResultPayload>;

// ──────────────── Shop ────────────────

export interface CreateOrderPayload {
  userId: string;
  items: ShopOrder['items'];
  deliveryMethod: ShopOrder['deliveryMethod'];
  paymentMethod: ShopOrder['paymentMethod'];
  shippingAddress?: ShopOrder['shippingAddress'];
  invoiceData?: ShopOrder['invoiceData'];
  customerNotes?: string;
}

export type CreateShopProductPayload = Omit<ShopProduct, 'id' | 'rating' | 'reviewCount'> & {
  id?: string;
};

export type UpdateShopProductPayload = Partial<CreateShopProductPayload>;

export type CreateShopCategoryPayload = Pick<ShopCategoryConfig, 'id' | 'name'> &
  Partial<Pick<ShopCategoryConfig, 'sortOrder'>>;

export type UpdateShopCategoryPayload = Partial<CreateShopCategoryPayload> & {
  status?: 'active' | 'archived';
};

export type CreateSeriesPayload = Omit<EventSeries, 'id'> & {
  id?: string;
};

export type UpdateSeriesPayload = Partial<CreateSeriesPayload>;

export type CreateChallengePayload = Omit<Challenge, 'id' | 'rewards'> & {
  id?: string;
  rewards?: Challenge['rewards'];
};

export type UpdateChallengePayload = Partial<CreateChallengePayload>;

// ──────────────── CMS ────────────────

export interface CreateInfoPagePayload {
  title: string;
  slug: string;
  icon: string;
  description: string;
  content: InfoPageSection[];
  published?: boolean;
  showInFooter?: boolean;
  showInHeader?: boolean;
  order?: number;
}

export type UpdateInfoPagePayload = Partial<CreateInfoPagePayload>;

export type CreatePartnerPayload = Omit<Partner, 'id'> & {
  id?: string;
  sortOrder?: number;
};

export type UpdatePartnerPayload = Partial<CreatePartnerPayload>;

// ──────────────── Re-exports for convenience ────────────────

export type { CreateEmailTemplatePayload, EmailPreviewRequest };
