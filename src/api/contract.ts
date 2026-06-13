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

import type { ApiResponse, PaginatedResponse } from './types';
import type {
  EventFilters,
  UserFilters,
  ResultFilters,
  RegistrationFilters,
  ShopProductFilters,
  OrderFilters,
  ActivityLogFilters,
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
  CreateInfoPagePayload,
  UpdateInfoPagePayload,
  CreatePartnerPayload,
  UpdatePartnerPayload,
} from './payloads';
import type {
  Event,
  User,
  UserRole,
  Registration,
  Result,
  PersonalRecord,
  TeamResult,
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
  GlobalInsuranceSettings,
  AdminActivityLog,
  SecuritySettings,
  OnlineSession,
  InfoPage,
  GoogleCalendarSettings,
  VirtualResultSubmission,
  VirtualResultSubmissionStatus,
  PaymentDetails,
  OrganizerEventLimit,
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
  updateEventStatus(
    id: string,
    status: Event['status'],
    reason?: string,
  ): Promise<ApiResponse<Event>>;
  submitEvent(id: string): Promise<ApiResponse<Event>>;
  approveEvent(id: string): Promise<ApiResponse<Event>>;
  rejectEvent(id: string, reason: string): Promise<ApiResponse<Event>>;
  publishEvent(id: string): Promise<ApiResponse<Event>>;
  getFeaturedEvents(): Promise<ApiResponse<Event[]>>;
  getLiveEvents(): Promise<ApiResponse<Event[]>>;
  getEventsByOrganizer(organizerId: string): Promise<ApiResponse<Event[]>>;
  getOrganizerEventLimit(organizerId: string): Promise<ApiResponse<OrganizerEventLimit>>;
  updateOrganizerEventLimit(
    organizerId: string,
    limit: number,
  ): Promise<ApiResponse<OrganizerEventLimit>>;
  uploadEventImage(file: File): Promise<ApiResponse<{ url: string }>>;

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

  // ── Results ──
  getResults(filters?: ResultFilters): Promise<PaginatedResponse<Result>>;
  getResultsByEvent(eventId: string, distanceId?: string): Promise<ApiResponse<Result[]>>;
  getResultsByUser(userId: string): Promise<ApiResponse<Result[]>>;
  createResult(data: CreateResultPayload): Promise<ApiResponse<Result>>;
  updateResult(id: string, data: UpdateResultPayload): Promise<ApiResponse<Result>>;
  deleteResult(id: string): Promise<ApiResponse<void>>;
  getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>>;
  getTeamResults(eventId: string): Promise<ApiResponse<TeamResult[]>>;
  getResultDocuments(eventId: string): Promise<ApiResponse<EventResultDocument[]>>;
  uploadResultDocument(
    data: Partial<EventResultDocument>,
  ): Promise<ApiResponse<EventResultDocument>>;

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

  // ── Insurance ──
  getGlobalInsuranceSettings(): Promise<ApiResponse<GlobalInsuranceSettings>>;
  updateGlobalInsuranceSettings(
    data: Partial<GlobalInsuranceSettings>,
  ): Promise<ApiResponse<GlobalInsuranceSettings>>;

  // ── Admin ──
  getActivityLogs(filters?: ActivityLogFilters): Promise<ApiResponse<AdminActivityLog[]>>;
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
