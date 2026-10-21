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
  ConfirmPasswordResetPayload,
  TokenPayload,
  EmailChangePayload,
  CreateRegistrationPayload,
  AssignBibNumbersPayload,
  AssignBibNumbersResult,
  SwapTeamMemberPayload,
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
  ChangeDistancePayload,
} from './payloads';
import type {
  DiscountCodeBatch,
  DiscountCodeBatchDetail,
  DiscountCodeBatchInput,
  Event,
  EventVisibility,
  User,
  UserRole,
  Registration,
  RegistrationChange,
  DistanceChangeQuote,
  DistanceChangeResult,
  TransferRegistrationResult,
  RegistrationQuote,
  PublicStartListEntry,
  RelayTeam,
  TeamInvite,
  TeamMember,
  Result,
  ResultCorrection,
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
  ChallengeRanking,
  Ticket,
  Certificate,
  Partner,
  CareResponse,
  Competitor,
  GrantCareResult,
  AddCompetitorPayload,
  CompetitorMergeComparison,
  CompetitorMergePayload,
  CompetitorMergeResult,
  CompetitorDuplicateReport,
  CompetitorDuplicateReportStatus,
  ReportCompetitorDuplicatePayload,
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
  FormField,
  CreateFormFieldPayload,
  UpdateFormFieldPayload,
  FormFieldAnswer,
  FormFieldAnswerValue,
  RegistrationStats,
} from '@/types';
import type {
  EmailTemplate,
  EmailSendLog,
  CreateEmailTemplatePayload,
  SendEmailResult,
  EmailPreviewRequest,
  EmailPreviewResult,
} from '@/types/email';
import type {
  SalesStats,
  PlatformStats,
  SettlementReport,
  SettlementReportParams,
} from '@/types/admin';
import type {
  EventTeam,
  EventTeamMember,
  EventTeamMemberWithMail,
  TeamInvitationAcceptance,
  TeamInvitationPreview,
} from '@/types/eventTeam';

// ─────────────────────────────────────────────────────────
// API Adapter Interface
// ─────────────────────────────────────────────────────────

export interface ApiAdapter {
  // ── Events ──
  getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>>;
  getEventBySlug(slug: string, accessCode?: string): Promise<ApiResponse<Event | null>>;
  getEventById(id: string): Promise<ApiResponse<Event | null>>;
  createEvent(data: CreateEventPayload): Promise<ApiResponse<Event>>;
  updateEvent(id: string, data: UpdateEventPayload): Promise<ApiResponse<Event>>;
  deleteEvent(id: string): Promise<ApiResponse<void>>;
  /**
   * The Event Team. The roster, invitations
   * and revocations are Owner/admin only (403 for a Co-manager).
   */
  getEventTeam(eventId: string): Promise<ApiResponse<EventTeam>>;
  inviteEventTeamMember(
    eventId: string,
    email: string,
  ): Promise<ApiResponse<EventTeamMemberWithMail>>;
  resendEventTeamInvitation(
    eventId: string,
    memberId: string,
  ): Promise<ApiResponse<EventTeamMemberWithMail>>;
  /** Takes the access away (status -> revoked); also kills a pending invitation link. */
  revokeEventTeamMember(eventId: string, memberId: string): Promise<ApiResponse<EventTeamMember>>;
  /** Public preview of an invitation (masked address); 404 unknown/revoked, 410 expired. */
  getTeamInvitation(token: string): Promise<ApiResponse<TeamInvitationPreview>>;
  /** Authenticated; 403 `invitation_email_mismatch` for another Account, 410 `invitation_expired`. */
  acceptTeamInvitation(token: string): Promise<ApiResponse<TeamInvitationAcceptance>>;
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
   * Creates a barebones "Wydarzenie zewnętrzne" — no
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
  confirmPasswordReset(payload: ConfirmPasswordResetPayload): Promise<ApiResponse<void>>;
  verifyEmail(payload: TokenPayload): Promise<ApiResponse<void>>;
  resendEmailVerification(): Promise<ApiResponse<{ alreadyVerified: boolean }>>;
  requestEmailChange(payload: EmailChangePayload): Promise<ApiResponse<{ pendingEmail: string }>>;
  confirmEmailChange(payload: TokenPayload): Promise<ApiResponse<void>>;

  // ── Registrations ──
  getRegistrations(filters?: RegistrationFilters): Promise<PaginatedResponse<Registration>>;
  getRegistrationsByEvent(eventId: string): Promise<ApiResponse<Registration[]>>;
  /**
   * Joinable Drużyny (with server-derived completeness) for one relay
   * Dystans — the source of truth the "join an existing team" registration
   * step reads from, instead of its old purely client-side text-grouping
   * heuristic (`getExistingTeamsForEvent`, kept for the unrelated
   * non-relay `collectTeam` classification case).
   */
  getTeamsForDistance(eventId: string, distanceId: string): Promise<ApiResponse<RelayTeam[]>>;
  /**
   * Invitation link for the remaining spots:
   * resolves a single Drużyna by its own id — the read side of a captain's
   * shareable invitation link (`/events/{eventSlug}/register?joinTeam=
   * {teamId}&invite={token}`). The team id is public and is NOT the
   * invitation — the secret is the separate `inviteToken` (see
   * `getTeamInvite`). This lets the landing page show a clear "team
   * full"/"link invalid" message before the invitee ever opens the
   * registration form. Rejects (404) for an unknown id — callers must catch,
   * not assume success.
   */
  getTeamById(teamId: string): Promise<ApiResponse<RelayTeam>>;
  /**
   * The invitation token of a Drużyna, for building the link
   * (`buildTeamInviteLink`). Authenticated; the server answers 403 unless the
   * caller is the team's captain or manages the event, 404 for an unknown id.
   */
  getTeamInvite(teamId: string): Promise<ApiResponse<TeamInvite>>;
  /**
   * The active roster of a Drużyna (the list to pick the member to swap out of). Authenticated;
   * 403 unless the caller is the team's captain or manages the event, 404 for an unknown id.
   */
  getTeamMembers(teamId: string): Promise<ApiResponse<TeamMember[]>>;
  /**
   * Swaps the person on a relay member's Zapis. Price, bib
   * number and status stay, the start code rotates. Captain until the Dystans's swap deadline
   * (409 `team_swap_deadline_passed` afterwards), the event's manager always. Rejects with
   * `ApiRequestError` (codes: `team_not_captain`, `not_authorized_to_register`,
   * `team_swap_deadline_passed`, `team_swap_competitor_already_registered`, `team_swap_same_person`).
   */
  swapTeamMember(
    teamId: string,
    registrationId: string,
    data: SwapTeamMemberPayload,
  ): Promise<ApiResponse<Registration>>;
  getPublicStartList(eventId: string): Promise<ApiResponse<PublicStartListEntry[]>>;
  /**
   * Unauthenticated — the embed page (`/embed/event/:id/register`)
   * calls this before rendering the form, to check whether embedding is
   * enabled for the event and what origins are allowlisted. Mirrors the
   * server's own "returns 200 with enabled:false rather than 404" contract
   * for an event that exists but isn't embeddable; only a nonexistent event
   * 404s.
   */
  getEventEmbedPublicConfig(
    eventId: string,
  ): Promise<ApiResponse<{ enabled: boolean; allowedOrigins: string[] }>>;
  getRegistrationsByUser(userId: string): Promise<ApiResponse<Registration[]>>;
  createRegistration(data: CreateRegistrationPayload): Promise<ApiResponse<Registration>>;
  /** Prices the payload (same as `createRegistration`) without creating a Zapis. */
  quoteRegistration(data: CreateRegistrationPayload): Promise<ApiResponse<RegistrationQuote>>;
  updateRegistration(
    id: string,
    data: UpdateRegistrationPayload,
  ): Promise<ApiResponse<Registration>>;
  /** R-13: gives the next free number inside each distance's range to registrations without one. */
  assignBibNumbers(
    eventId: string,
    data: AssignBibNumbersPayload,
  ): Promise<ApiResponse<AssignBibNumbersResult>>;
  cancelRegistration(id: string): Promise<ApiResponse<Registration>>;
  /** History of changes of one Zapis (owner and organizer), oldest first. */
  getRegistrationChanges(id: string): Promise<ApiResponse<RegistrationChange[]>>;
  /** What a change of Dystans would do — the new price and balance; persists nothing. */
  quoteDistanceChange(
    id: string,
    data: ChangeDistancePayload,
  ): Promise<ApiResponse<DistanceChangeQuote>>;
  /** Changes the Dystans/Wariant of a Zapis (the owner inside the window, the organizer always). */
  changeRegistrationDistance(
    id: string,
    data: ChangeDistancePayload,
  ): Promise<ApiResponse<DistanceChangeResult>>;
  /** The organizer moves a Zapis to another person (an existing Zawodnik or a new one). */
  transferRegistration(
    id: string,
    data: SwapTeamMemberPayload,
  ): Promise<ApiResponse<TransferRegistrationResult>>;
  updatePaymentDetails(
    id: string,
    paymentDetails: PaymentDetails,
  ): Promise<ApiResponse<Registration>>;
  /** The Zawodnik (owner of the Zapis) asks for a refund — never triggers it on their own. */
  requestRefund(id: string, reason?: string): Promise<ApiResponse<Registration>>;
  /** The organizer (own Wydarzenie) or an admin approves the request — "do zwrotu". */
  approveRefund(id: string, amount?: number): Promise<ApiResponse<Registration>>;
  /** Completes the refund (route B: the organizer manually marks it "zwrócono"). */
  completeRefund(id: string): Promise<ApiResponse<Registration>>;
  /** One-click payment retry for an expired Zapis — opens a new payment window. */
  retryPayment(id: string): Promise<ApiResponse<Registration>>;
  /**
   * The organizer (own Wydarzenie) or an admin manually confirms a payment
   * made by traditional bank transfer (route B) — the only way to mark a route-B
   * Zapis as paid; the server rejects the call for a route-A (gateway) Zapis.
   */
  markRegistrationPaid(id: string): Promise<ApiResponse<Registration>>;

  // ── Results ──
  getResults(filters?: ResultFilters): Promise<PaginatedResponse<Result>>;
  getResultsByEvent(eventId: string, distanceId?: string): Promise<ApiResponse<Result[]>>;
  getResultsByUser(userId: string): Promise<ApiResponse<Result[]>>;
  createResult(data: CreateResultPayload): Promise<ApiResponse<Result>>;
  updateResult(id: string, data: UpdateResultPayload): Promise<ApiResponse<Result>>;
  deleteResult(id: string): Promise<ApiResponse<void>>;
  /** Correction trail of one result, newest first. */
  getResultCorrections(id: string): Promise<ApiResponse<ResultCorrection[]>>;
  getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>>;
  getTeamResults(eventId: string): Promise<ApiResponse<TeamResult[]>>;
  /** Live-computed team/relay classification for one event+distance. */
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
   * Marks all results of the given Wydarzenie+Dystans as official (irreversible
   * from the client — the server offers no way back). Corrections of single
   * results always remain possible.
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
  getMyOrders(): Promise<ApiResponse<ShopOrder[]>>;
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
  /** `competitorId` = a ward under the caller's care (403 otherwise); omitted = own profile. */
  joinChallenge(
    challengeId: string,
    competitorId?: string,
  ): Promise<ApiResponse<ChallengeParticipation>>;
  submitChallengeEntry(data: Partial<ChallengeEntry>): Promise<ApiResponse<ChallengeEntry>>;
  reviewChallengeEntry(
    entryId: string,
    status: ChallengeEntryStatus,
    reason?: string,
  ): Promise<ApiResponse<ChallengeEntry>>;
  /**
   * Claims a completed Wyzwanie's reward Product,
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
  /**
   * Public, unauthenticated — descending points, ties
   * sharing a rank ("1,1,3"), anonymized competitors masked server-side.
   */
  getChallengeRanking(challengeId: string): Promise<ApiResponse<ChallengeRanking>>;
  /** "Klasyfikacja Serii" — the union of a Series's linked Wyzwania's rankings. */
  getSeriesRanking(seriesId: string): Promise<ApiResponse<ChallengeRanking>>;

  // ── Messages ──

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
  /** Rotates the identity code — the caller must be the Zawodnik or have Opieka over them. */
  rotateIdentityCode(competitorId: string): Promise<ApiResponse<Competitor>>;
  /** Own profile or a Zawodnik under my Opieka; drives name masking in public rankings. */
  setCompetitorAnonymization(
    competitorId: string,
    isAnonymized: boolean,
  ): Promise<ApiResponse<Competitor>>;

  // ── Merging Zawodnik profiles (Moderator/Admin only) ──
  /** Searches merge candidates by first name / last name / identity code. */
  searchCompetitorsForMerge(q: string): Promise<ApiResponse<Competitor[]>>;
  /** Side-by-side view of two profiles with the list of Zapis conflicts, before the surviving profile is chosen. */
  getCompetitorMergeComparison(
    competitorIdA: string,
    competitorIdB: string,
  ): Promise<ApiResponse<CompetitorMergeComparison>>;
  /** Performs (or holds back) the merge — see CompetitorMergeResult.status. */
  mergeCompetitors(payload: CompetitorMergePayload): Promise<ApiResponse<CompetitorMergeResult>>;

  // ── Duplicate reports of a Zawodnik ──
  /** A guardian / organizer reports that a profile duplicates another (merges nothing). */
  reportCompetitorDuplicate(
    competitorId: string,
    payload: ReportCompetitorDuplicatePayload,
  ): Promise<ApiResponse<CompetitorDuplicateReport>>;
  /** Report queue for the Moderator/Admin; open reports only by default. */
  listCompetitorDuplicateReports(
    status?: CompetitorDuplicateReportStatus | 'all',
  ): Promise<ApiResponse<CompetitorDuplicateReport[]>>;
  /** The Moderator/Admin rejects an open report (optional reason). */
  rejectCompetitorDuplicateReport(
    id: string,
    reason?: string,
  ): Promise<ApiResponse<CompetitorDuplicateReport>>;

  // ── Insurance ──
  getGlobalInsuranceSettings(): Promise<ApiResponse<GlobalInsuranceSettings>>;
  updateGlobalInsuranceSettings(
    data: Partial<GlobalInsuranceSettings>,
  ): Promise<ApiResponse<GlobalInsuranceSettings>>;

  // ── Challenge points settings ──
  getChallengePointsSettings(): Promise<ApiResponse<ChallengePointsSettings>>;
  updateChallengePointsSettings(
    data: Partial<ChallengePointsSettings>,
  ): Promise<ApiResponse<ChallengePointsSettings>>;

  // ── Admin ──
  // Global list — admin/superadmin only, enforced server-side.
  getActivityLogs(filters?: ActivityLogFilters): Promise<ApiResponse<AdminActivityLog[]>>;
  // Event-owner-scoped slice — organizer sees only their own event's entries,
  // authorized server-side via the existing single-owner check.
  getEventActivityLogs(
    eventId: string,
    filters?: EventActivityLogFilters,
  ): Promise<ApiResponse<AdminActivityLog[]>>;
  // Automatic, no-opt-in answer-count aggregation for choice-type form fields
  // (single_choice/multi_choice/consent) — organizer-scoped, same $canManageEvent gate.
  getFormFieldAggregates(eventId: string): Promise<ApiResponse<FormFieldAggregate[]>>;
  // Configurable registration form ("Pozycje formularza"). The public list is
  // unauthenticated (non-hidden positions only); the rest is organizer/staff-scoped.
  // With a `distanceId` the public list is that distance's effective form.
  getPublicFormFields(eventId: string, distanceId?: string): Promise<ApiResponse<FormField[]>>;
  getFormFields(eventId: string): Promise<ApiResponse<FormField[]>>;
  // Per-distance form — effective list (event form + overrides + own fields), a distance-only
  // field, copy-on-override of an inherited position and reset (inherit again).
  getDistanceFormFields(eventId: string, distanceId: string): Promise<ApiResponse<FormField[]>>;
  createDistanceFormField(
    eventId: string,
    distanceId: string,
    data: CreateFormFieldPayload,
  ): Promise<ApiResponse<FormField>>;
  overrideFormField(
    eventId: string,
    distanceId: string,
    fieldId: string,
  ): Promise<ApiResponse<FormField>>;
  resetFormFieldOverride(
    eventId: string,
    distanceId: string,
    fieldId: string,
  ): Promise<ApiResponse<{ reset: boolean }>>;
  createFormField(eventId: string, data: CreateFormFieldPayload): Promise<ApiResponse<FormField>>;
  updateFormField(
    eventId: string,
    fieldId: string,
    data: UpdateFormFieldPayload,
  ): Promise<ApiResponse<FormField>>;
  deleteFormField(eventId: string, fieldId: string): Promise<ApiResponse<{ deleted: boolean }>>;
  reorderFormFields(eventId: string, orderedIds: string[]): Promise<ApiResponse<FormField[]>>;
  saveFormFieldAnswer(
    registrationId: string,
    fieldId: string,
    value: FormFieldAnswerValue,
  ): Promise<ApiResponse<FormFieldAnswer>>;
  getFormFieldAnswers(registrationId: string): Promise<ApiResponse<FormFieldAnswer[]>>;
  // Built-in cross-sections from the Zapis record itself (distance,
  // payment status, signup curve, plus gender/club/age-category when
  // configured) — complements getFormFieldAggregates above. Same
  // $canManageEvent gate.
  getRegistrationStats(eventId: string): Promise<ApiResponse<RegistrationStats>>;
  // Organizer-facing start-list export (CSV/XLSX) for one Distance —
  // triggers a real browser file download (fetch blob -> object URL -> anchor
  // click), unlike every other adapter method here which returns JSON data.
  // Same $canManageEvent gate as the rest of this group, server-side.
  exportStartList(
    eventId: string,
    distanceId: string,
    format: 'csv' | 'xlsx' | 'xml',
  ): Promise<void>;
  // Discount code batches (generator over the ordinary event discount codes).
  // Same event-manager gate as the start-list export; the CSV is a real file download.
  createDiscountCodeBatch(
    eventId: string,
    input: DiscountCodeBatchInput,
  ): Promise<ApiResponse<DiscountCodeBatchDetail>>;
  getDiscountCodeBatches(eventId: string): Promise<ApiResponse<DiscountCodeBatch[]>>;
  getDiscountCodeBatch(
    eventId: string,
    batchId: string,
  ): Promise<ApiResponse<DiscountCodeBatchDetail>>;
  exportDiscountCodeBatch(eventId: string, batchId: string): Promise<void>;
  getSecuritySettings(): Promise<ApiResponse<SecuritySettings>>;
  updateSecuritySettings(data: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>>;
  getOnlineSessions(): Promise<ApiResponse<OnlineSession[]>>;
  getSalesStats(): Promise<ApiResponse<SalesStats>>;
  // Minimal platform-admin cross-section — Events by publication_status,
  // Organizer count, active package-credit total. Admin-only (not moderator).
  getPlatformStats(): Promise<ApiResponse<PlatformStats>>;
  // Admin-only settlement report (amounts in minor units) and its
  // CSV/XLSX download (same browser-download idiom as exportStartList).
  getSettlementReport(params: SettlementReportParams): Promise<ApiResponse<SettlementReport>>;
  exportSettlementReport(params: SettlementReportParams, format: 'csv' | 'xlsx'): Promise<void>;

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

  // ── Mail templates & log — eventId omitted/null = global (admin) scope ──
  getMailTemplates(eventId?: string | null): Promise<ApiResponse<MailTemplate[]>>;
  saveMailTemplate(
    mailType: string,
    payload: SaveMailTemplatePayload,
    eventId?: string | null,
  ): Promise<ApiResponse<MailTemplate>>;
  /** Removes the event override; the server answers with the now-effective template. */
  resetMailTemplate(mailType: string, eventId: string): Promise<ApiResponse<MailTemplate>>;
  previewMailTemplate(
    mailType: string,
    payload: MailTemplatePreviewRequest,
    eventId?: string | null,
  ): Promise<ApiResponse<MailTemplatePreview>>;
  getMailLog(
    filters?: MailLogFilters,
    eventId?: string | null,
  ): Promise<PaginatedResponse<MailLogEntry>>;
}
