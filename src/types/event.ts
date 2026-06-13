export type SportDiscipline = 'running' | 'cycling' | 'triathlon' | 'multisport';

export type RegistrationStatus = 'open' | 'closed' | 'none';

export type PriceTierMode = 'date' | 'participants';
export type ParticipantCountType = 'registered' | 'paid';
export type PriceTierDiscountType = 'percent' | 'fixed';

export interface VipPrice {
  id: string;
  name: string;
  discountType: PriceTierDiscountType;
  discountValue: number;
  customFieldLabel?: string;
  customFieldRequired?: boolean;
}

export interface PriceTier {
  id: string;
  name: string;
  discountType: PriceTierDiscountType;
  discountValue: number;
  endDate?: string;
  participantLimit?: number;
  description?: string;
  /** @deprecated Use discountType+discountValue. Kept for backward compat in views. */
  price?: number;
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

export interface AgeCategory {
  id: string;
  name: string;
  gender: 'K' | 'M';
  birthYearFrom: number;
  birthYearTo: number;
}

export interface SpecialCategory {
  id: string;
  name: string;
  description?: string;
}

export type DistanceRouteFileType = 'map' | 'elevation' | 'gpx' | 'image';

export interface DistanceRouteFile {
  id: string;
  name: string;
  type: DistanceRouteFileType;
  url: string;
}

export interface Distance {
  id: string;
  name: string;
  length: number;
  unit: 'km' | 'm';
  categories: string[];
  ageCategories?: AgeCategory[];
  specialCategories?: SpecialCategory[];
  limit?: number;
  registeredCount: number;
  price: number;
  priceTierMode?: PriceTierMode;
  participantCountType?: ParticipantCountType;
  priceTiers?: PriceTier[];
  vipPrices?: VipPrice[];
  routeMapUrl?: string;
  routeElevationProfile?: string;
  routeGpxUrl?: string;
  routeFiles?: DistanceRouteFile[];
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

export interface RegistrationEmbedConfig {
  enabled: boolean;
  mode?: 'internal' | 'external_embed';
  externalUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomRegistrationField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface RegistrationFormConfig {
  collectPhone: boolean;
  collectClub: boolean;
  collectBirthDate: boolean;
  collectTeam: boolean;
  collectInsurance: boolean;
  collectMerchandise: boolean;
  customFields: CustomRegistrationField[];
}

export interface EventDisplayOptions {
  defaultSort: 'name' | 'bib' | 'date' | 'distance';
  uppercaseNames: boolean;
  hideUnpaid: boolean;
}

export interface BannerCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  status:
    | 'draft'
    | 'awaiting_approval'
    | 'approved'
    | 'active'
    | 'past'
    | 'archived'
    | 'deleted';
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  createdBy?: string;
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
  galleryAlbums?: GalleryAlbum[];
  routeMapUrl?: string;
  routeGpxUrl?: string;
  routeElevationProfile?: string;
  bannerUrl?: string;
  bannerCropArea?: BannerCropArea;
  organizerLogoUrl?: string;
  isVirtual?: boolean;
  startDate?: string;
  endDate?: string;
  resultDocuments?: EventResultDocument[];
  paymentConfig?: PaymentConfig;
  organizersHtml?: string;
  rulesHtml?: string;
  finalAcceptanceHtml?: string;
  requireFinalAcceptance?: boolean;
  isPrivate?: boolean;
  accessCode?: string;
  registrationEmbed?: RegistrationEmbedConfig;
  registrationFormConfig?: RegistrationFormConfig;
  displayOptions?: EventDisplayOptions;
}

export type PaymentConfigType = 'organizer_bank' | 'admin_gateway';

export interface PaymentConfig {
  type: PaymentConfigType;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  transferTitle?: string;
}

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

export type GalleryPlatform = 'google_photos' | 'flickr' | 'facebook' | 'instagram' | 'other';

export interface GalleryAlbum {
  id: string;
  name: string;
  url: string;
  platform: GalleryPlatform;
  photographer?: string;
}

export type ResultClassificationType = 'open' | 'category' | 'team' | 'distance';

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

export interface GlobalInsuranceSettings {
  infoHtml: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
}

export interface GroupDiscountCode extends DiscountCode {
  minParticipants?: number;
}
