import type { TeamAggregationRule } from './result';

export type SportDiscipline = 'running' | 'cycling' | 'triathlon' | 'multisport';

export type RegistrationStatus = 'open' | 'closed' | 'none';

export type PriceTierDiscountType = 'percent' | 'fixed';
export type DistanceStartType = 'individual' | 'relay';
/**
 * TD.8 (spec 07 rozstrzygniecie 10): sposob naliczania oplaty startowej dla
 * Dystansu sztafetowego. `per_person` (domyslne, jedyne dotychczasowe
 * zachowanie) - kazdy czlonek zespolu placi osobno. `per_team` - kapitan
 * placi cala oplate za druzyne, pozostali czlonkowie maja oplate zerowa.
 * Ma sens tylko dla `startType === 'relay'`, ale serwer tego nie wymusza.
 */
export type TeamPricingMode = 'per_person' | 'per_team';

export const TEAM_PRICING_MODE_LABELS: Record<TeamPricingMode, string> = {
  per_person: 'Za osobę (każdy płaci osobno)',
  per_team: 'Za drużynę (cała opłata na Zapisie kapitana)',
};

export interface VipPrice {
  id: string;
  name: string;
  discountType: PriceTierDiscountType;
  discountValue: number;
  customFieldLabel?: string;
  customFieldRequired?: boolean;
}

/**
 * A Próg (price tier). `endDate` and `participantLimit` are independent, both
 * optional, and can be set at the same time — the tier expires on whichever
 * is hit first ("co nastąpi wcześniej"). There is no mode flag choosing
 * between them (E0.3).
 */
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

/**
 * A pricing variant belonging to a Dystans — e.g. the office-only "zapis w
 * biurze zawodow" price that used to be the special-cased `officePrice` field
 * on Distance (E0.3). Office-only variants are hidden from the public
 * registration form.
 *
 * Per the E1.2 pricing algorithm ("Rozliczenie", steps 1-2), the Wariant
 * carries its own base `price` AND its own Próg (tier) list — it is a full
 * price list, not a discount off the distance's base price. `priceTiers`
 * uses the same dual-optional-limit shape as `PriceTier` (see
 * `isTierExpired`). Field name matches the server's
 * `EventRepository::children(..., ['priceTiers'])` payload shape.
 */
export interface DistancePricingVariant {
  id: string;
  name: string;
  price: number;
  officeOnly?: boolean;
  visibleInPublicForm?: boolean;
  sortOrder?: number;
  priceTiers?: PriceTier[];
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
  gender?: 'K' | 'M' | null;
  birthYearFrom?: number;
  birthYearTo?: number;
}

export interface SpecialCategory {
  id: string;
  name: string;
  description?: string;
}

export type DistanceRouteFileType = 'map' | 'elevation' | 'gpx' | 'image' | 'regulation' | 'other';

export const DISTANCE_ROUTE_FILE_TYPE_LABELS: Record<DistanceRouteFileType, string> = {
  map: 'Mapa trasy',
  elevation: 'Profil przewyższeń',
  gpx: 'Plik GPX',
  image: 'Zdjęcie',
  regulation: 'Regulamin',
  other: 'Inny',
};

export interface DistanceRouteFile {
  id: string;
  name: string;
  type: DistanceRouteFileType;
  url: string;
}

export type DistanceDocumentType = 'regulation' | 'schedule' | 'map' | 'other';

export const DISTANCE_DOCUMENT_TYPE_LABELS: Record<DistanceDocumentType, string> = {
  regulation: 'Regulamin',
  schedule: 'Harmonogram',
  map: 'Mapa trasy',
  other: 'Inny dokument',
};

export interface DistanceDocument {
  id: string;
  name: string;
  type: DistanceDocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export interface Distance {
  id: string;
  name: string;
  length: number | null;
  unit: 'km' | 'm';
  categories: string[];
  startType?: DistanceStartType;
  relayMinTeamSize?: number;
  relayMaxTeamSize?: number;
  relayTeamCompletionDeadline?: string;
  relaySwapDeadline?: string;
  teamPricingMode?: TeamPricingMode;
  /**
   * E2.7 (spec 14 sekcja 4): regula agregacji wyniku druzynowego z wynikow
   * indywidualnych czlonkow, konfigurowalna per Dystans (relacja z
   * `startType === 'relay'` tak sama jak reszta pol relay*: jest sens tylko
   * dla dystansu sztafetowego, ale serwer jej nie wymusza - patrz
   * ResultRepository::teamClassification() dla domyslnego fallbacku).
   */
  teamAggregationRule?: TeamAggregationRule;
  ageCategories?: AgeCategory[];
  specialCategories?: SpecialCategory[];
  limit?: number;
  registeredCount: number;
  paidCount?: number;
  /**
   * E8.2 (spec 21 Answer §4): live-computed remaining capacity (limit -
   * registeredCount, null when the Distance has no limit). Present only when
   * the Event's `displayOptions.showFreeSlots` toggle is on for a
   * non-manager reader — the server omits the key entirely when hidden
   * (routes.php's `$stripBzToken`), so absence, not `null`, is what "hidden"
   * looks like here. Always present for the owning organizer/staff.
   */
  slotsRemaining?: number | null;
  price: number;
  pricingVariants?: DistancePricingVariant[];
  infoHtml?: string;
  priceTiers?: PriceTier[];
  vipPrices?: VipPrice[];
  routeMapUrl?: string;
  routeElevationProfile?: string;
  routeGpxUrl?: string;
  routeFiles?: DistanceRouteFile[];
  documents?: DistanceDocument[];
}

export interface OrganizerContact {
  email: string;
  phone?: string;
  website?: string;
}

export interface OrganizerContactEntry {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface EventSponsor {
  id: string;
  name: string;
  url?: string;
  logoUrl?: string;
  logoOriginalUrl?: string;
}

export interface CoOrganizer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  logoOriginalUrl?: string;
}

export interface OrganizerInfo {
  contacts: OrganizerContactEntry[];
  sponsors: EventSponsor[];
  coOrganizers?: CoOrganizer[];
}

/** @deprecated Single-object legacy insurance config. Superseded by the global
 * catalog of `InsuranceVariant`s (E1.2) — an event now offers 0..n catalog
 * variants via `Event.insuranceVariants` instead of one ad-hoc option. Kept
 * for backward compatibility with call sites that haven't migrated yet;
 * the registration flow no longer reads it. */
export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
  enabled: boolean;
}

/**
 * A catalog NNW (accident insurance) variant, defined globally by the admin
 * with its pricing formula parameters; an organizer opts an event into 0, 1,
 * or several of these (E1.2, resolution #9). Premium = baseFee +
 * max(0, age-18) * ageMultiplier, age computed as of the EVENT date (not
 * registration date), unavailable above maxAge.
 */
export interface InsuranceVariant {
  id: string;
  name: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
  infoHtml?: string;
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
  hideUnpaid: boolean; // @deprecated - use showParticipants
  showParticipants: 'all' | 'paid_only';
  /**
   * E8.2 (spec 21 Answer §4): "ten sam wzorzec przełącznika co przy liście
   * startowej publicznej/ukrytej" (showParticipants above) — free-slots
   * counter, visible by default (undefined/true), organizer can hide it per
   * Event. Same JSON blob, same generic PATCH /events/{id} write path.
   */
  showFreeSlots?: boolean;
}

export interface BannerCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type OrganizerLogoShape = 'square' | 'portrait' | 'landscape';

export interface EventBackground {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  createdAt: string;
}

export interface EventBackgroundUsage {
  id: string;
  name: string;
  slug: string;
  status: string;
}

/**
 * Axis 1 — moderation workflow (E1.1). Replaces the old mixed `status` field.
 *
 *   draft -> submitted -> published -> finished
 *                       \-> rejected (organizer edits, resubmits)
 *              published -> cancelled (irreversible, terminal)
 *
 * Approval is a single moderator/admin action that results directly in
 * `published` — there is no separate resting "approved" state to manage.
 * `finished` is set automatically by the backend after the event date.
 * `archived` / `deleted` are pre-existing organizer/admin housekeeping states
 * (archive a finished event, soft-delete a draft) — orthogonal to the
 * moderation workflow itself but kept as part of the same enum for
 * backward compatibility with existing archive/delete features.
 */
export type EventPublicationStatus =
  | 'draft'
  | 'submitted'
  | 'rejected'
  | 'published'
  | 'finished'
  | 'cancelled';

/**
 * Axis 2 — visibility (E1.1). Only meaningful/editable while
 * `publicationStatus === 'published'`: public events show in calendar/search,
 * private events are hidden from them and reachable only via direct link
 * (optionally gated by `accessCode`).
 */
export type EventVisibility = 'public' | 'private';

export interface Event {
  id: string;
  name: string;
  slug: string;
  discipline: SportDiscipline;
  date: string;
  location: string;
  locationMapsUrl?: string;
  city: string;
  description: string;
  imageUrl: string;
  originalImageUrl?: string;
  seriesId?: string;
  distances: Distance[];
  organizerId: string;
  organizerName: string;
  organizerContact?: OrganizerContact;
  organizerInfo?: OrganizerInfo;
  publicationStatus: EventPublicationStatus;
  /** Only meaningful/editable while `publicationStatus === 'draft'`; cleared and locked once submitted. */
  isTest?: boolean;
  /**
   * E6.4 (issue 15 §3): "Wydarzenie zewnętrzne" — a barebones Event with no
   * Dystansy and no registrations, created by a Moderator/Admin purely as the
   * reference point a Zawodnik's manual challenge-entry proof points at (a
   * pre-platform completion, or a race that never ran on this platform).
   */
  isExternal?: boolean;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdBy?: string;
  registrationDeadline: string;
  registrationOpenDate?: string;
  registrationUntilEventStart?: boolean;
  featured: boolean;
  liveResultsUrl?: string;
  isLive?: boolean;
  registrationStatus?: RegistrationStatus;
  paymentMethods?: PaymentMethod[];
  merchandise?: EventMerchandise[];
  discountCodes?: DiscountCode[];
  enableMerchandiseInRegistration?: boolean;
  /** @deprecated see `InsuranceOption`. Use `insuranceVariants` instead. */
  insuranceOption?: InsuranceOption;
  /** Catalog NNW variants this event offers (E1.2, resolution #9). Empty/absent = no insurance step. */
  insuranceVariants?: InsuranceVariant[];
  galleryAlbums?: GalleryAlbum[];
  routeMapUrl?: string;
  routeGpxUrl?: string;
  routeElevationProfile?: string;
  bannerUrl?: string;
  originalBannerUrl?: string;
  bannerCropArea?: BannerCropArea;
  organizerLogoUrl?: string;
  originalOrganizerLogoUrl?: string;
  organizerLogoShape?: OrganizerLogoShape;
  isVirtual?: boolean;
  startDate?: string;
  endDate?: string;
  resultDocuments?: EventResultDocument[];
  documents?: EventDocument[];
  paymentConfig?: PaymentConfig;
  organizersHtml?: string;
  rulesHtml?: string;
  finalAcceptanceHtml?: string;
  requireFinalAcceptance?: boolean;
  /** Only meaningful/editable while `publicationStatus === 'published'`. */
  visibility?: EventVisibility;
  accessCode?: string;
  registrationEmbed?: RegistrationEmbedConfig;
  registrationFormConfig?: RegistrationFormConfig;
  displayOptions?: EventDisplayOptions;
  logisticsInfo?: EventLogisticsInfo;
  backgroundId?: string;
  /**
   * E3.2: "Biuro Zawodów" (BZ) integration toggle (issue 12 §3). The platform
   * never creates a BZ organization itself — the organizer pastes an
   * existing organization token/identifier when flipping this on.
   */
  bzIntegrationEnabled?: boolean;
  /**
   * The pasted BZ organization token/identifier. Never present on a public/
   * anonymous read of an Event (server strips it for non-managers) — only
   * the owning organizer or staff ever see the real value. Preserved when
   * `bzIntegrationEnabled` is turned off, so re-enabling later doesn't
   * require re-pasting it.
   */
  bzOrganizationToken?: string | null;
  /**
   * E8.11 ("Zewnętrzny formularz w iframe"): lets the organizer embed THIS
   * platform's own registration form on an external (organizer-owned) site
   * via `<iframe>`. Deliberately separate from `registrationEmbed` above,
   * which is the opposite direction — embedding an EXTERNAL registration
   * provider INTO this site.
   */
  embedEnabled?: boolean;
  /**
   * Origin allowlist checked (client-side, defense-in-depth only — see the
   * comment in `src/pages/EmbedEventRegistrationPage.tsx`) before the embed
   * page renders the form. Each entry is a bare `http(s)://host[:port]`
   * origin — no path/query/fragment (enforced server-side on write).
   */
  embedAllowedOrigins?: string[];
}

export type PaymentConfigType = 'organizer_bank' | 'admin_gateway';

export interface PaymentConfig {
  type: PaymentConfigType;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  transferTitle?: string;
  /**
   * E1.4: okno płatności, konfigurowalne per Wydarzenie (docs/20 pkt 1). Bramka
   * (Tpay/PayNow): domyślnie 45 minut. Serwer (EventRepository) domyśla te wartości
   * na czytaniu, więc zawsze przychodzą wypełnione — undefined tu oznacza tylko
   * "jeszcze nie wysłano do API", nie "brak wartości".
   */
  gatewayWindowMinutes?: number;
  /** Przelew tradycyjny: domyślnie 3 dni robocze. */
  transferWindowDays?: number;
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

export interface GadgetDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export type GadgetQuantityMode = 'any' | 'max' | 'one';

export interface GadgetImage {
  id: string;
  url: string;
  caption?: string;
  colorId?: string;
}

export interface EventMerchandise {
  id: string;
  name: string;
  description?: string;
  descriptionHtml?: string;
  documents?: GadgetDocument[];
  brand?: string;
  price: number;
  originalPrice?: number;
  sizes: string[];
  colors: MerchandiseColor[];
  imageUrl?: string;
  images?: GadgetImage[];
  available: boolean;
  stockCount?: number;
  quantityMode?: GadgetQuantityMode;
  quantityMax?: number;
  saleFrom?: string;
  saleTo?: string;
  distanceIds?: string[];
  shopProductId?: string;
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

export type EventDocumentType =
  | 'regulamin'
  | 'harmonogram'
  | 'mapa'
  | 'informacje'
  | 'wyniki'
  | 'inne';

export const EVENT_DOCUMENT_TYPE_LABELS: Record<EventDocumentType, string> = {
  regulamin: 'Regulamin',
  harmonogram: 'Harmonogram',
  mapa: 'Mapa trasy',
  informacje: 'Informacje dodatkowe',
  wyniki: 'Wyniki',
  inne: 'Inne',
};

export interface EventDocument {
  id: string;
  name: string;
  type: EventDocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export type LogisticsFieldStatus = 'yes' | 'no' | null;

export interface LogisticsLocation {
  id: string;
  label: string;
  mapsUrl?: string;
  address?: string;
  date?: string;
  openFrom?: string;
  openTo?: string;
  note?: string;
}

export interface LogisticsField {
  status: LogisticsFieldStatus;
  infoHtml?: string;
  locations?: LogisticsLocation[];
}

export interface EventLogisticsInfo {
  parking?: LogisticsField;
  changingRooms?: LogisticsField;
  luggage?: LogisticsField;
  toilets?: LogisticsField;
  buffet?: LogisticsField;
  meals?: LogisticsField;
  medicalPoint?: LogisticsField;
  showers?: LogisticsField;
  merchandise?: LogisticsField;
  baggage?: LogisticsField;
  timeMeasurement?: LogisticsField;
  awardsClassifications?: LogisticsField;
  additionalInfo?: LogisticsField;
  raceOffice?: LogisticsField;
}

export interface GlobalInsuranceSettings {
  infoHtml: string;
  baseFee: number;
  ageMultiplier: number;
  maxAge: number;
}

/**
 * E6.2 (issue 15 §2, "Punktacja: za miejsce, N najlepszych startow"): global,
 * admin-configurable points-per-place table a Wyzwanie's `point_threshold`
 * condition node converts an Event classification place into points with.
 * `pointsTable[i]` is the points for place `i + 1`; `floorPoints` is awarded
 * for any place beyond the table's length.
 */
export interface ChallengePointsSettings {
  pointsTable: number[];
  floorPoints: number;
}

export interface GroupDiscountCode extends DiscountCode {
  minParticipants?: number;
}

/**
 * E2.5: automatic answer-count tally for one choice-type custom form field
 * (single_choice/multi_choice/consent) — server computes this live from
 * FormFieldRepository::aggregatesForEvent(), no organizer configuration.
 */
export interface FormFieldAggregateCount {
  key: string;
  label: string;
  count: number;
}

export interface FormFieldAggregate {
  formFieldId: string;
  fieldKey: string;
  label: string;
  fieldType: 'single_choice' | 'multi_choice' | 'consent';
  counts: FormFieldAggregateCount[];
}

/**
 * E8.2 (spec 21 Answer §2): built-in organizer cross-sections computed
 * live from the Zapis record itself (RegistrationRepository::organizerStats()),
 * complementing FormFieldAggregate above (which covers configurable form
 * fields, E2.5). `byGender`/`byClub`/`ageCategories` are genuinely absent
 * (key missing, not an empty array) whenever the underlying field/config
 * isn't set up for this Event — mirror this on render: check for the key,
 * don't render an empty chart for a present-but-empty array vs an absent key.
 */
export interface RegistrationStatsDistanceCount {
  distanceId: string;
  distanceName: string;
  count: number;
}

export interface RegistrationStatsPaymentStatusCount {
  status: 'paid' | 'pending' | 'expired' | 'cancelled' | 'refunded';
  label: string;
  count: number;
}

export interface RegistrationStatsSignupDay {
  date: string;
  count: number;
}

export interface RegistrationStatsFieldCount {
  key: string;
  label: string;
  count: number;
}

export interface RegistrationStatsAgeCategoryBreakdown {
  distanceId: string;
  distanceName: string;
  counts: RegistrationStatsFieldCount[];
}

export interface RegistrationStats {
  byDistance: RegistrationStatsDistanceCount[];
  byPaymentStatus: RegistrationStatsPaymentStatusCount[];
  signupCurve: RegistrationStatsSignupDay[];
  byGender?: RegistrationStatsFieldCount[];
  byClub?: RegistrationStatsFieldCount[];
  ageCategories?: RegistrationStatsAgeCategoryBreakdown[];
}

/**
 * E1.13 (ticket 10, model-formularza-zapisow.md): one "Pozycja formularza" as the
 * server returns it from `/events/{id}/form-fields*` — 13 system positions plus the
 * organizer's custom fields, one ordered list per Wydarzenie.
 */
export type FormFieldState = 'hidden' | 'shown' | 'required';
export type FormFieldKind = 'system' | 'custom';
export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multi_choice'
  | 'consent';

export interface FormFieldOption {
  key: string;
  label: string;
  /** Variant price modifier (may be negative); 0 when the variant is free. */
  price: number;
}

export interface FormFieldValidationConfig {
  maxLength?: number;
  min?: number | string;
  max?: number | string;
}

export interface FormField {
  id: string;
  eventId: string;
  distanceId: string | null;
  kind: FormFieldKind;
  /** Stable canonical key (system key or generated `custom_…`), never changed by label edits. */
  fieldKey: string;
  storageLocation: 'competitor' | 'registration';
  state: FormFieldState;
  sortOrder: number;
  labelOverride: string | null;
  tooltipOverride: string | null;
  publicListVisible: boolean;
  visibleToBz: boolean;
  isConfidential: boolean;
  /** Custom fields only. */
  fieldType: FormFieldType | null;
  validationConfig: FormFieldValidationConfig | null;
  options: FormFieldOption[] | null;
  createdAt?: string;
  updatedAt?: string;
  /**
   * R-04, only on a distance's effective form: where the position comes from — `event` (inherited
   * as is), `override` (this distance replaces it) or `distance` (exists on this distance only).
   */
  source?: 'event' | 'override' | 'distance';
}

export interface CreateFormFieldPayload {
  fieldType: FormFieldType;
  label: string;
  tooltip?: string | null;
  state?: FormFieldState;
  options?: Array<{ label: string; price?: number }>;
  validationConfig?: FormFieldValidationConfig | null;
  isConfidential?: boolean;
  publicListVisible?: boolean;
  visibleToBz?: boolean;
  sortOrder?: number;
}

/**
 * PATCH accepts only these (confidentiality is fixed at creation). B-02: a custom field's type
 * and variants are editable in place; the server answers 409 `form_field_has_answers` for a type
 * change once the field has answers, and 409 `form_field_option_in_use` for dropping a variant
 * an answer still points at. Send the existing `key` to keep a variant's identity.
 */
export interface UpdateFormFieldPayload {
  fieldType?: FormFieldType;
  options?: Array<{ key?: string; label: string; price?: number }>;
  state?: FormFieldState;
  label?: string | null;
  tooltip?: string | null;
  publicListVisible?: boolean;
  visibleToBz?: boolean;
}

export interface FormFieldAnswer {
  id: string;
  formFieldId: string;
  registrationId: string;
  valueText: string | null;
  valueJson: unknown[] | null;
}

/** Value sent to `PUT /registrations/{id}/form-field-answers/{fieldId}` and in `POST /registrations`. */
export type FormFieldAnswerValue = string | number | boolean | string[] | null;

/** One answer in `POST /registrations` `formFieldAnswers` (amounts are never sent). */
export interface RegistrationFormFieldAnswer {
  fieldId: string;
  value: FormFieldAnswerValue;
}

/**
 * Identity-section values in `POST /registrations` `identity` (B-07). Every key is optional;
 * the server ignores values for hidden positions and takes `voivodeship` from a closed list.
 */
export interface RegistrationIdentityPayload {
  phone?: string;
  club?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
  address?: string;
  isAnonymized?: boolean;
}

/** One entry of the 422 `registration_form_invalid` `error.details.fields`. */
export interface RegistrationFormFieldError {
  fieldId: string;
  fieldKey: string;
  code: string;
  message: string;
}
