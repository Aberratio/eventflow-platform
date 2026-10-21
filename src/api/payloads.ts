/**
 * API Payload types — strict input shapes for create/update operations.
 *
 * Unlike `Partial<T>`, these explicitly define which fields are required
 * and which are optional at each operation boundary.
 */

import type {
  SportDiscipline,
  Distance,
  EventVisibility,
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
  Registration,
  ShopOrder,
  InfoPageSection,
  EventSeries,
  ShopProduct,
  ShopCategoryConfig,
  Challenge,
  Partner,
  RegistrationFormFieldAnswer,
  RegistrationIdentityPayload,
} from '@/types';
import type {
  SaveMailTemplatePayload,
  MailTemplatePreviewRequest,
  MailLogFilters,
} from '@/types/email';

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
  visibility?: EventVisibility;
  accessCode?: string;
  isTest?: boolean;
  registrationEmbed?: RegistrationEmbedConfig;
  registrationFormConfig?: RegistrationFormConfig;
  displayOptions?: EventDisplayOptions;
  logisticsInfo?: EventLogisticsInfo;
  organizerInfo?: OrganizerInfo;
  organizersHtml?: string;
  featured?: boolean;
  /** E3.2: "Biuro Zawodów" integration toggle + pasted organization token. */
  bzIntegrationEnabled?: boolean;
  bzOrganizationToken?: string | null;
  /** E8.11: embed our own registration form on an external site via iframe. */
  embedEnabled?: boolean;
  embedAllowedOrigins?: string[];
  /** R-02 (zakres P2): samodzielna rezygnacja zawodnika — przełącznik i data graniczna (null = domyślnie 7 dni przed startem). */
  selfServiceEnabled?: boolean;
  selfServiceDeadline?: string | null;
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

/**
 * PP.1: the narrower payload for a user editing their OWN Account through
 * `PATCH /users/{id}`. The server's UserUpdatePolicy rejects everything
 * outside this list for a self-edit (role, status, eventLimit,
 * organizerPackageCredits, password fields, email, avatar) with 422
 * field_not_editable — those fields are deliberately absent from this type
 * so a caller can't accidentally send them from a self-service form.
 */
export type SelfUpdateUserPayload = Pick<
  UpdateUserPayload,
  | 'name'
  | 'phone'
  | 'address'
  | 'birthDate'
  | 'birthYear'
  | 'gender'
  | 'club'
  | 'sosContacts'
  | 'companyName'
  | 'nip'
  | 'website'
  | 'description'
>;

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

/** PP.7: sets a new password from the one-time link of the reset e-mail. */
export interface ConfirmPasswordResetPayload {
  token: string;
  newPassword: string;
}

/** PP.7: the opaque one-time token of an e-mail link (verification, e-mail change). */
export interface TokenPayload {
  token: string;
}

/** PP.7: self-service e-mail change; the new address is confirmed by a link mailed to it. */
export interface EmailChangePayload {
  newEmail: string;
  currentPassword: string;
}

// ──────────────── Registrations ────────────────

/**
 * A merchandise selection as sent to the server — id + choices + quantity
 * only, no price (E1.2: the client never sends computed money, the server
 * prices the line itself).
 */
export interface RegistrationMerchandiseSelection {
  merchandiseId: string;
  size?: string;
  color?: string;
  quantity: number;
}

/**
 * Registration create payload (E1.2). The client sends only IDs/selections
 * for anything that affects price — `pricingVariantId`, `discountCode`,
 * `merchandise`, `insuranceVariantId` — and NEVER computed money amounts
 * (`price`, `discountAmount`, `pricePaid`, `totalAmount`, `insurancePrice`,
 * or the amount fields inside `paymentDetails`). The server recomputes and
 * freezes the real Rozliczenie; the client's own price math is preview-only.
 * `pricingVariantId` may be omitted for distances that were never migrated
 * to Warianty — the server then falls back to pricing off
 * `distance.price`/`distance.priceTiers` directly.
 */
export interface CreateRegistrationPayload {
  eventId: string;
  eventName: string;
  userId: string;
  /** Zawodnik będący źródłem tożsamości zapisu (E0.1) — identyfikator, nie kopiowana nazwa. */
  competitorId?: string;
  /** Ignored by the server since PP.52 — identity is derived from the JWT and `competitorId`. Still sent for older servers. */
  userName?: string;
  /** Ignored by the server since PP.52 — see `userName`. */
  userEmail?: string;
  distanceId: string;
  distanceName: string;
  category: string;
  teamName?: string;
  teamId?: string;
  /**
   * PP.54: the captain's invitation token (from the `&invite=` link parameter). The server
   * requires it to join someone else's existing Drużyna (403 `registration_team_invite_required`
   * otherwise); the captain themself needs none. Never shown or logged in the UI.
   */
  teamInviteToken?: string;
  /**
   * E7.1: explicit intent to create a brand-new, server-validated Drużyna
   * (`teamName` becomes its label) rather than just a free-text
   * classification label — the server only creates a real `teams` row and
   * rejects the request outright when this is set on a non-relay Dystans.
   * Omitted (or `teamId` set instead) keeps every pre-existing behavior:
   * a plain `teamName` with neither flag is still the legacy, unvalidated
   * classification-only label some organizers collect via `collectTeam`.
   */
  createTeam?: boolean;
  /**
   * E7.5 (issue 23 Answer §7, "Kategoria specjalna: deklaracja ręczna
   * kapitana"): only meaningful together with `createTeam` — the captain's
   * one-time, manually chosen Kategoria specjalna for the new Drużyna, from
   * the same per-Dystans configured list (`distance.specialCategories`)
   * ticket 10's individual `category` free text is picked from. The server
   * validates it against that list and rejects an unconfigured value; a
   * later roster change never recomputes or touches this value.
   */
  specialCategory?: string;
  pricingVariantId?: string;
  discountCode?: string;
  merchandise?: RegistrationMerchandiseSelection[];
  insuranceVariantId?: string;
  /**
   * B-07: answers to the organizer's custom form fields, validated and stored in the same
   * transaction as the Zapis (a failure answers 422 `registration_form_invalid`, nothing is created).
   */
  formFieldAnswers?: RegistrationFormFieldAnswer[];
  /** B-07: values of the visible identity-section positions (phone, club, address, ...). */
  identity?: RegistrationIdentityPayload;
  /** Ignored by the server since PP.52 (derived from the caller and `competitorId`). */
  registeredById?: string;
}

export type UpdateRegistrationPayload = Partial<
  Pick<
    Registration,
    'status' | 'teamName' | 'teamId' | 'pricePaid' | 'discountAmount' | 'paymentDetails'
  >
> & {
  /** R-13: `null` clears the start number. */
  bibNumber?: string | null;
};

/** R-13: `POST /events/{eventId}/bib-numbers/assign` body. */
export interface AssignBibNumbersPayload {
  /** Omit to assign in every distance that has a range. */
  distanceIds?: string[];
  order?: 'registered' | 'name';
  /** Default (server) true: only confirmed registrations get a number. */
  paidOnly?: boolean;
}

export interface AssignBibNumbersResult {
  assigned: number;
  assignments: { registrationId: string; bibNumber: string }[];
  skipped: { distanceId: string; reason: 'no_range' | 'range_exhausted'; count: number }[];
}

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
  netTime?: string | null;
  netTimeInSeconds?: number | null;
  position: number;
  categoryPosition: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
  gender?: 'M' | 'K';
  birthYear?: number;
}

export type UpdateResultPayload = Partial<Omit<CreateResultPayload, 'position' | 'categoryPosition'>> & {
  /** G-03: corrected place (open / in category): a positive integer, or null to keep the computed ranking. */
  position?: number | null;
  categoryPosition?: number | null;
  /** G-03: why the result is corrected - stored in the correction trail, not on the result. */
  reason?: string;
};

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

/**
 * E6.5 (issue 15 §4-5): payload for POST /challenges/{id}/claim-reward.
 * Deliberately mirrors CreateOrderPayload's shape (minus `userId`/`items` —
 * the server derives the buyer from the JWT and the single reward item from
 * `productId`/`size`/`color`) since this is the same order-creation flow
 * with one line item instead of a cart.
 */
export interface ClaimChallengeRewardPayload {
  productId: string;
  size?: string;
  color?: string;
  deliveryMethod: ShopOrder['deliveryMethod'];
  paymentMethod: ShopOrder['paymentMethod'];
  shippingAddress?: ShopOrder['shippingAddress'];
  invoiceData?: ShopOrder['invoiceData'];
}

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

export type { SaveMailTemplatePayload, MailTemplatePreviewRequest, MailLogFilters };

/**
 * G-04 (spec 23 §2): who takes over a relay member's Zapis — an existing Zawodnik the caller may
 * register (own profile or under their Opieka; the event's manager may name any), or the data of a
 * brand-new person. Exactly one of the two.
 */
export type SwapTeamMemberPayload =
  | { competitorId: string; newPerson?: undefined }
  | { competitorId?: undefined; newPerson: SwapTeamMemberNewPerson };

export interface SwapTeamMemberNewPerson {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'M' | 'K';
  email?: string;
  phone?: string;
  club?: string;
}
