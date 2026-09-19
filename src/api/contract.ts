/**
 * API Contract — the single source of truth for all backend operations.
 *
 * Every method is async and returns a typed response wrapper.
 * The active implementation (mock or real) is selected via `setApiAdapter()`.
 *
 * To connect a real backend:
 *   1. Create `src/api/adapters/supabase.ts` implementing `ApiAdapter`.
 *   2. Call `setApiAdapter(supabaseAdapter)` before app renders.
 *   3. That's it — all consumers import from `@/api` and stay unchanged.
 */

import type {
  ApiResponse,
  PaginatedResponse,
  EventFilters,
  UserFilters,
  ResultFilters,
  PublishOfficialResultsResponse,
  RegistrationFilters,
  ShopProductFilters,
  ActivityLogFilters,
  EventActivityLogFilters,
  VirtualResultFilters,
  SeriesFilters,
  ChallengeFilters,
} from './types';
import type {
  CreateEventPayload,
  UpdateEventPayload,
  CreateUserPayload,
  UpdateUserPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  CreateRegistrationPayload,
  UpdateRegistrationPayload,
  CreateResultPayload,
  UpdateResultPayload,
  CreateOrderPayload,
  CreateShopProductPayload,
  UpdateShopProductPayload,
  CreateShopCategoryPayload,
  UpdateShopCategoryPayload,
  CreateSeriesPayload,
  UpdateSeriesPayload,
  CreateChallengePayload,
  UpdateChallengePayload,
  ClaimChallengeRewardPayload,
  CreateInfoPagePayload,
  UpdateInfoPagePayload,
  CreatePartnerPayload,
  UpdatePartnerPayload,
} from './payloads';
import type {
  Event,
  EventVisibility,
  User,
  UserRole,
  Registration,
  Result,
  ResultImportBatch,
  ResultImportMode,
  PersonalRecord,
  TeamResult,
  TeamClassificationEntry,
  EventResultDocument,
  EventSeries,
  ShopProduct,
  ShopCategoryConfig,
  DeliveryMethod,
  ShopPaymentMethod,
  ShopOrder,
  Challenge,
  ChallengeParticipation,
  ChallengeEntry,
  ChallengeEntryStatus,
  Message,
  Ticket,
  Certificate,
  Partner,
  CareResponse,
  Competitor,
  GrantCareResult,
  AddCompetitorPayload,
  GlobalInsuranceSettings,
  ChallengePointsSettings,
  AdminActivityLog,
  SecuritySettings,
  OnlineSession,
  InfoPage,
  GoogleCalendarSettings,
  VirtualResultSubmission,
  VirtualResultSubmissionStatus,
  PaymentDetails,
  OrganizerEventLimit,
  EventBackground,
  EventBackgroundUsage,
  FormFieldAggregate,
} from '@/types';
import type {
  EmailTemplate,
  EmailSendLog,
  CreateEmailTemplatePayload,
  SendEmailResult,
  EmailPreviewRequest,
  EmailPreviewResult,
} from '@/types/email';
import type { SalesStats } from '@/types/admin';

// ─────────────────────────────────────────────────────────
// API Adapter Interface
// ─────────────────────────────────────────────────────────

export interface ApiAdapter {
  // ── Events ──
  getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>>;
  getEventBySlug(slug: string): Promise<ApiResponse<Event | null>>;
  getEventById(id: string): Promise<ApiResponse<Event | null>>;
  createEvent(data: CreateEventPayload): Promise<ApiResponse<Event>>;
  updateEvent(id: string, data: UpdateEventPayload): Promise<ApiResponse<Event>>;
  deleteEvent(id: string): Promise<ApiResponse<void>>;
  /** draft/rejected -> submitted. Also irreversibly clears `isTest`. */
  submitEvent(id: string): Promise<ApiResponse<Event>>;
  /** submitted -> published (single action, no separate resting "approved" state). */
  approveEvent(id: string): Promise<ApiResponse<Event>>;
  /** submitted -> rejected. */
  rejectEvent(id: string, reason: string): Promise<ApiResponse<Event>>;
  /** published -> cancelled. Manual, by owner or admin. Irreversible/terminal. */
  cancelEvent(id: string): Promise<ApiResponse<Event>>;
  /** Only valid while publicationStatus === 'published'. */
  setEventVisibility(
    id: string,
    visibility: EventVisibility,
    accessCode?: string,
  ): Promise<ApiResponse<Event>>;
  /** Only valid while publicationStatus === 'draft'. */
  setEventIsTest(id: string, isTest: boolean): Promise<ApiResponse<Event>>;
  /**
   * E6.4 (issue 15 §3): creates a barebones "Wydarzenie zewnętrzne" — no
   * Dystansy, no registrations — as the reference point for a Zawodnik's
   * manual challenge-entry proof (a pre-platform completion, or a race
   * that never ran on this platform). Moderator-or-above.
   */
  createExternalEvent(data: {
    name: string;
    date: string;
    location: string;
    city: string;
    description?: string;
  }): Promise<ApiResponse<Event>>;
  getFeaturedEvents(): Promise<ApiResponse<Event[]>>;
  getLiveEvents(): Promise<ApiResponse<Event[]>>;
  getEventsByOrganizer(organizerId: string): Promise<ApiResponse<Event[]>>;
  getOrganizerEventLimit(organizerId: string): Promise<ApiResponse<OrganizerEventLimit>>;
  updateOrganizerEventLimit(
    organizerId: string,
    limit: number,
  ): Promise<ApiResponse<OrganizerEventLimit>>;
  uploadEventImage(file: File): Promise<ApiResponse<{ url: string }>>;
  uploadEventDocument(
    file: File,
  ): Promise<ApiResponse<{ url: string; originalName: string; mimeType: string }>>;

  // ── Event Backgrounds ──
  getEventBackgrounds(): Promise<ApiResponse<EventBackground[]>>;
  getEventBackgroundById(id: string): Promise<ApiResponse<EventBackground | null>>;
  getEventBackgroundUsages(id: string): Promise<ApiResponse<EventBackgroundUsage[]>>;
  createEventBackground(data: {
    name: string;
    imageUrl: string;
    thumbnailUrl?: string;
    sortOrder?: number;
  }): Promise<ApiResponse<EventBackground>>;
  updateEventBackground(
    id: string,
    data: Partial<{ name: string; imageUrl: string; thumbnailUrl: string; sortOrder: number }>,
  ): Promise<ApiResponse<EventBackground>>;
  deleteEventBackground(id: string): Promise<ApiResponse<void>>;
  uploadEventBackground(file: File): Promise<ApiResponse<{ url: string }>>;

  // ── Users ──
  getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>>;
  getUserById(id: string): Promise<ApiResponse<User | null>>;
  getUserByEmail(email: string): Promise<ApiResponse<User | null>>;
  createUser(data: CreateUserPayload): Promise<ApiResponse<User>>;
  updateUser(id: string, data: UpdateUserPayload): Promise<ApiResponse<User>>;
  deleteUser(id: string): Promise<ApiResponse<void>>;
  updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>>;
  updateUserStatus(id: string, status: 'active' | 'blocked'): Promise<ApiResponse<User>>;
  getParticipants(): Promise<ApiResponse<User[]>>;
  getOrganizers(): Promise<ApiResponse<User[]>>;
  uploadAvatar(file: File): Promise<ApiResponse<{ url: string }>>;

  // ── Auth ──
  login(credentials: LoginCredentials): Promise<ApiResponse<User | null>>;
  loginByRole(role: UserRole): Promise<ApiResponse<User | null>>;
  logout(): Promise<ApiResponse<void>>;
  getCurrentUser(): Promise<ApiResponse<User | null>>;
  register(data: RegisterPayload): Promise<ApiResponse<User>>;
  resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<void>>;
  changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<void>>;

  // ── Registrations ──
  getRegistrations(filters?: RegistrationFilters): Promise<PaginatedResponse<Registration>>;
  getRegistrationsByEvent(eventId: string): Promise<ApiResponse<Registration[]>>;
  getPublicStartList(eventId: string): Promise<ApiResponse<Registration[]>>;
  getRegistrationsByUser(userId: string): Promise<ApiResponse<Registration[]>>;
  createRegistration(data: CreateRegistrationPayload): Promise<ApiResponse<Registration>>;
  updateRegistration(
    id: string,
    data: UpdateRegistrationPayload,
  ): Promise<ApiResponse<Registration>>;
  cancelRegistration(id: string): Promise<ApiResponse<Registration>>;
  updatePaymentDetails(
    id: string,
    paymentDetails: PaymentDetails,
  ): Promise<ApiResponse<Registration>>;
  /** E1.5: zawodnik (właściciel Zapisu) prosi o zwrot — nigdy nie wyzwala go sam. */
  requestRefund(id: string, reason?: string): Promise<ApiResponse<Registration>>;
  /** Organizator (własne Wydarzenie) lub admin zatwierdza żądanie — "do zwrotu". */
  approveRefund(id: string, amount?: number): Promise<ApiResponse<Registration>>;
  /** Wykonuje zwrot (trasa B: organizator ręcznie odznacza „zwrócono"). */
  completeRefund(id: string): Promise<ApiResponse<Registration>>;
  /** Jednoklikowe ponowienie płatności dla wygasłego Zapisu — otwiera nowe okno. */
  retryPayment(id: string): Promise<ApiResponse<Registration>>;
  /**
   * E1.8: organizator (własne Wydarzenie) lub admin ręcznie potwierdza wpłatę
   * przelewem tradycyjnym (trasa B) — jedyna droga oznaczenia trasy B jako
   * opłaconej; serwer odrzuci wywołanie dla Zapisu na trasie A (bramka).
   */
  markRegistrationPaid(id: string): Promise<ApiResponse<Registration>>;

  // ── Results ──
  getResults(filters?: ResultFilters): Promise<PaginatedResponse<Result>>;
  getResultsByEvent(eventId: string, distanceId?: string): Promise<ApiResponse<Result[]>>;
  getResultsByUser(userId: string): Promise<ApiResponse<Result[]>>;
  createResult(data: CreateResultPayload): Promise<ApiResponse<Result>>;
  updateResult(id: string, data: UpdateResultPayload): Promise<ApiResponse<Result>>;
  deleteResult(id: string): Promise<ApiResponse<void>>;
  getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>>;
  getTeamResults(eventId: string): Promise<ApiResponse<TeamResult[]>>;
  /** E2.7: live-computed team/relay classification for one event+distance. */
  getTeamClassification(
    eventId: string,
    distanceId: string,
  ): Promise<ApiResponse<TeamClassificationEntry[]>>;
  getResultDocuments(eventId: string): Promise<ApiResponse<EventResultDocument[]>>;
  uploadResultDocument(
    data: Partial<EventResultDocument>,
  ): Promise<ApiResponse<EventResultDocument>>;
  createResultImport(
    eventId: string,
    distanceId: string,
    file: File,
    mode: ResultImportMode,
  ): Promise<ApiResponse<ResultImportBatch>>;
  updateResultImportMapping(
    importId: string,
    mapping: Record<string, string>,
    sheetName?: string | null,
  ): Promise<ApiResponse<ResultImportBatch>>;
  updateResultImportRow(
    rowId: string,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<ResultImportBatch>>;
  commitResultImport(importId: string): Promise<ApiResponse<ResultImportBatch>>;
  /**
   * E2.3 (spec 14 Answer §6): oznacza wszystkie wyniki danego Wydarzenia+Dystansu
   * jako oficjalne (nieodwracalne z poziomu klienta - serwer nie udostepnia
   * cofniecia). Korekty pojedynczych wynikow pozostaja mozliwe zawsze.
   */
  publishOfficialResults(
    eventId: string,
    distanceId: string,
  ): Promise<ApiResponse<PublishOfficialResultsResponse>>;

  // ── Series ──
  getSeries(filters?: SeriesFilters): Promise<PaginatedResponse<EventSeries>>;
  getSeriesById(id: string): Promise<ApiResponse<EventSeries | null>>;
  getSeriesBySlug(slug: string): Promise<ApiResponse<EventSeries | null>>;
  createSeries(data: CreateSeriesPayload): Promise<ApiResponse<EventSeries>>;
  updateSeries(id: string, data: UpdateSeriesPayload): Promise<ApiResponse<EventSeries>>;
  archiveSeries(id: string): Promise<ApiResponse<EventSeries>>;

  // ── Shop ──
  getProducts(filters?: ShopProductFilters): Promise<PaginatedResponse<ShopProduct>>;
  getProductBySlug(slug: string): Promise<ApiResponse<ShopProduct | null>>;
  getProductById(id: string): Promise<ApiResponse<ShopProduct | null>>;
  createProduct(data: CreateShopProductPayload): Promise<ApiResponse<ShopProduct>>;
  updateProduct(id: string, data: UpdateShopProductPayload): Promise<ApiResponse<ShopProduct>>;
  deleteProduct(id: string): Promise<ApiResponse<void>>;
  getShopCategories(includeArchived?: boolean): Promise<ApiResponse<ShopCategoryConfig[]>>;
  createShopCategory(data: CreateShopCategoryPayload): Promise<ApiResponse<ShopCategoryConfig>>;
  updateShopCategory(
    id: string,
    data: UpdateShopCategoryPayload,
  ): Promise<ApiResponse<ShopCategoryConfig>>;
  deleteShopCategory(id: string): Promise<ApiResponse<void>>;
  getDeliveryMethods(): Promise<ApiResponse<DeliveryMethod[]>>;
  getShopPaymentMethods(): Promise<ApiResponse<ShopPaymentMethod[]>>;
  getOrders(userId?: string): Promise<ApiResponse<ShopOrder[]>>;
  getOrderById(id: string): Promise<ApiResponse<ShopOrder | null>>;
  createOrder(data: CreateOrderPayload): Promise<ApiResponse<ShopOrder>>;
  updateOrderStatus(
    id: string,
    status: ShopOrder['status'],
    trackingNumber?: string,
  ): Promise<ApiResponse<ShopOrder>>;

  // ── Challenges ──
  getChallenges(filters?: ChallengeFilters): Promise<ApiResponse<Challenge[]>>;
  getChallengeBySlug(slug: string): Promise<ApiResponse<Challenge | null>>;
  getChallengeById(id: string): Promise<ApiResponse<Challenge | null>>;
  createChallenge(data: CreateChallengePayload): Promise<ApiResponse<Challenge>>;
  updateChallenge(id: string, data: UpdateChallengePayload): Promise<ApiResponse<Challenge>>;
  archiveChallenge(id: string): Promise<ApiResponse<Challenge>>;
  getChallengeParticipations(
    challengeId?: string,
    userId?: string,
  ): Promise<ApiResponse<ChallengeParticipation[]>>;
  joinChallenge(challengeId: string): Promise<ApiResponse<ChallengeParticipation>>;
  submitChallengeEntry(data: Partial<ChallengeEntry>): Promise<ApiResponse<ChallengeEntry>>;
  reviewChallengeEntry(
    entryId: string,
    status: ChallengeEntryStatus,
    reason?: string,
  ): Promise<ApiResponse<ChallengeEntry>>;
  /**
   * E6.5 (issue 15 §4-5): claims a completed Wyzwanie's reward Product,
   * creating a real shop order through the existing checkout flow —
   * `deliveryMethod`/`paymentMethod` are required exactly like
   * `createOrder()` (a free reward still goes through the same order
   * mechanism, "bez kroku płatności" meaning no charge, not no method
   * selection). Returns the updated participation (`rewardGranted` flips to
   * true) or rejects with a `challenge_*`/`order_*` error code — see
   * ChallengeRepository::claimReward()'s doc comment server-side.
   */
  claimChallengeReward(
    challengeId: string,
    data: ClaimChallengeRewardPayload,
  ): Promise<ApiResponse<ChallengeParticipation>>;

  // ── Messages ──
  getMessages(userId: string): Promise<ApiResponse<Message[]>>;
  getMessage(id: string): Promise<ApiResponse<Message | null>>;
  sendMessage(data: Partial<Message>): Promise<ApiResponse<Message>>;
  markAsRead(id: string): Promise<ApiResponse<Message>>;

  // ── Tickets ──
  getTickets(userId: string): Promise<ApiResponse<Ticket[]>>;
  getCertificates(userId: string): Promise<ApiResponse<Certificate[]>>;

  // ── Partners ──
  getPartners(): Promise<ApiResponse<Partner[]>>;
  getFeaturedPartners(): Promise<ApiResponse<Partner[]>>;
  getPartnerById(id: string): Promise<ApiResponse<Partner | null>>;
  createPartner(data: CreatePartnerPayload): Promise<ApiResponse<Partner>>;
  updatePartner(id: string, data: UpdatePartnerPayload): Promise<ApiResponse<Partner>>;
  deletePartner(id: string): Promise<ApiResponse<void>>;
  uploadPartnerLogo(file: File): Promise<ApiResponse<{ url: string }>>;

  // ── Opieka (Care) i Zawodnicy (Competitors) ──
  getCare(): Promise<ApiResponse<CareResponse>>;
  grantCareByEmail(email: string): Promise<ApiResponse<GrantCareResult>>;
  addCompetitor(payload: AddCompetitorPayload): Promise<ApiResponse<GrantCareResult>>;
  revokeCare(id: string): Promise<ApiResponse<void>>;
  checkCompetitorDuplicates(
    firstName: string,
    lastName: string,
    birthDate?: string,
  ): Promise<ApiResponse<Competitor[]>>;
  /** E1.12: rotacja kodu tożsamości — wywołujący musi być Zawodnikiem albo mieć nad nim Opiekę. */
  rotateIdentityCode(competitorId: string): Promise<ApiResponse<Competitor>>;

  // ── Insurance ──
  getGlobalInsuranceSettings(): Promise<ApiResponse<GlobalInsuranceSettings>>;
  updateGlobalInsuranceSettings(
    data: Partial<GlobalInsuranceSettings>,
  ): Promise<ApiResponse<GlobalInsuranceSettings>>;

  // ── Challenge points settings (E6.2) ──
  getChallengePointsSettings(): Promise<ApiResponse<ChallengePointsSettings>>;
  updateChallengePointsSettings(
    data: Partial<ChallengePointsSettings>,
  ): Promise<ApiResponse<ChallengePointsSettings>>;

  // ── Admin ──
  // E0.8: global list — admin/superadmin only, enforced server-side.
  getActivityLogs(filters?: ActivityLogFilters): Promise<ApiResponse<AdminActivityLog[]>>;
  // E0.8: event-owner-scoped slice — organizer sees only their own event's entries,
  // authorized server-side via the existing single-owner check.
  getEventActivityLogs(
    eventId: string,
    filters?: EventActivityLogFilters,
  ): Promise<ApiResponse<AdminActivityLog[]>>;
  // E2.5: automatic, no-opt-in answer-count aggregation for choice-type form fields
  // (single_choice/multi_choice/consent) — organizer-scoped, same $canManageEvent gate.
  getFormFieldAggregates(eventId: string): Promise<ApiResponse<FormFieldAggregate[]>>;
  // E2.6: organizer-facing start-list export (CSV/XLSX) for one Distance —
  // triggers a real browser file download (fetch blob -> object URL -> anchor
  // click), unlike every other adapter method here which returns JSON data.
  // Same $canManageEvent gate as the rest of this group, server-side.
  exportStartList(eventId: string, distanceId: string, format: 'csv' | 'xlsx'): Promise<void>;
  getSecuritySettings(): Promise<ApiResponse<SecuritySettings>>;
  updateSecuritySettings(data: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>>;
  getOnlineSessions(): Promise<ApiResponse<OnlineSession[]>>;
  getSalesStats(): Promise<ApiResponse<SalesStats>>;

  // ── CMS ──
  getInfoPages(): Promise<ApiResponse<InfoPage[]>>;
  getInfoPageBySlug(slug: string): Promise<ApiResponse<InfoPage | null>>;
  createInfoPage(data: CreateInfoPagePayload): Promise<ApiResponse<InfoPage>>;
  updateInfoPage(id: string, data: UpdateInfoPagePayload): Promise<ApiResponse<InfoPage>>;
  deleteInfoPage(id: string): Promise<ApiResponse<void>>;
  reorderInfoPages(ids: string[]): Promise<ApiResponse<void>>;

  // ── Calendar ──
  getCalendarSettings(): Promise<ApiResponse<GoogleCalendarSettings>>;
  updateCalendarSettings(
    data: Partial<GoogleCalendarSettings>,
  ): Promise<ApiResponse<GoogleCalendarSettings>>;
  addEventToCalendar(event: Event): Promise<ApiResponse<void>>;

  // ── Virtual Results ──
  getVirtualResultSubmissions(
    filters?: VirtualResultFilters,
  ): Promise<ApiResponse<VirtualResultSubmission[]>>;
  submitVirtualResult(
    data: Partial<VirtualResultSubmission>,
  ): Promise<ApiResponse<VirtualResultSubmission>>;
  reviewVirtualResult(
    id: string,
    status: VirtualResultSubmissionStatus,
    reason?: string,
  ): Promise<ApiResponse<VirtualResultSubmission>>;

  // ── Email Templates ──
  getEmailTemplates(eventId?: string | null): Promise<PaginatedResponse<EmailTemplate>>;
  getEmailTemplateById(id: string): Promise<ApiResponse<EmailTemplate | null>>;
  getEmailSendLogs(eventId?: string): Promise<ApiResponse<EmailSendLog[]>>;
  createEmailTemplate(payload: CreateEmailTemplatePayload): Promise<ApiResponse<EmailTemplate>>;
  updateEmailTemplate(
    id: string,
    data: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'sentCount'>>,
  ): Promise<ApiResponse<EmailTemplate>>;
  deleteEmailTemplate(id: string): Promise<ApiResponse<void>>;
  toggleEmailTemplate(id: string, active: boolean): Promise<ApiResponse<EmailTemplate>>;
  sendEmailNow(templateId: string, recipientIds?: string[]): Promise<ApiResponse<SendEmailResult>>;
  previewEmailTemplate(request: EmailPreviewRequest): Promise<ApiResponse<EmailPreviewResult>>;
}
