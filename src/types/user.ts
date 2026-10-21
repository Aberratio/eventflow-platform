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
  /** Informational only; absent on older API responses. */
  emailVerified?: boolean;
  /** Last successful login, ISO 8601; null before the first login. */
  lastLoginAt?: string | null;
}

/**
 * Zawodnik: a profile of start data. A standalone entity — not owned by an account,
 * it can exist without any linked account (e.g. a child registered by a parent).
 */
export interface Competitor {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'M' | 'K';
  email?: string;
  phone?: string;
  club?: string;
  /**
   * Identity QR code (`zqr_` + 48 hex) — always generated when the
   * Zawodnik is created, so always present (same convention as
   * Registration.qrCode — the client never has to handle its absence).
   * It never expires; it rotates only on request (see rotateIdentityCode()).
   */
  identityCode: string;
  userId?: string | null;
  /**
   * `scalony` (merged) is a permanent archival state — the profile was
   * absorbed into another one and its own registrations/care relations have
   * all been repointed away. Absent/`active` for every ordinary profile;
   * older responses that predate this field are treated as `active`.
   */
  status?: 'active' | 'scalony';
  /** Set only when status === 'scalony' — the profile that survived. */
  mergedIntoCompetitorId?: string | null;
  /** Public name masking in rankings (POST /competitors/{id}/anonymization). */
  isAnonymized?: boolean;
}

/** A Zawodnik under my care — I can register them for events. */
export interface MyCompetitor {
  id: string; // id relacji Opieki
  competitorId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'M' | 'K';
  email?: string;
  phone?: string;
  club?: string;
  /** Identity code of this Zawodnik — see Competitor.identityCode. */
  identityCode: string;
  competitorUserId?: string | null;
  /** Current masking state of this ward, returned by GET /care. */
  isAnonymized?: boolean;
}

/** An account that has care of me (it can register me). */
export interface Caregiver {
  id: string; // id relacji Opieki
  kontoId: string;
  kontoName: string;
  kontoEmail: string;
  kontoAvatar?: string;
  createdAt: string;
}

export interface CareResponse {
  /**
   * The own Zawodnik profile of the calling account (with identityCode) — every
   * participant account gets it automatically on sign-up. Null only for
   * accounts that do not have a Zawodnik profile yet (practically never
   * happens for participants, but the type stays honest about this edge).
   */
  myProfile: Competitor | null;
  myCompetitors: MyCompetitor[];
  caregivers: Caregiver[];
}

export interface GrantCareByEmailPayload {
  email: string;
}

export interface AddCompetitorPayload {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'M' | 'K';
  email?: string;
  phone?: string;
  club?: string;
}

export interface GrantCareResult {
  id: string;
  kontoId?: string;
  competitorId: string;
  createdAt: string;
  competitor?: Competitor;
  duplicateWarnings?: Competitor[];
}

/**
 * One best time on a
 * distance, computed live from the history of this Zawodnik's Wyniki/Zapisy
 * (see `ResultRepository::lifetimeRecordsForCompetitor()` on the
 * server) — it is never stored as a separate row, so merging
 * never has to re-point it by hand: re-pointing the Zapisy is enough.
 */
export interface CompetitorLifetimeRecord {
  distanceLabel: string;
  distanceLengthMeters: number | null;
  resultId: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  time: string;
  timeInSeconds: number;
  netTime: string | null;
  netTimeInSeconds: number | null;
  achievedAt: string | null;
}

/**
 * Everything a profile "carries" — the side-by-side view
 * `challengeParticipations` shows participation in the Wyzwania of its
 * OWN account, if it has one — Uczestnictwa are keyed by `user_id`
 * (the account), not by Zawodnik, so merging two profiles never re-points
 * them (two different Zawodnicy never share the same account —
 * `competitors.user_id` is UNIQUE) and this list is here purely
 * informational, for a complete picture of the profile.
 */
export interface CompetitorMergeProfileBundle {
  competitor: Competitor;
  registrations: import('./registration').Registration[];
  lifetimeRecords: CompetitorLifetimeRecord[];
  challengeParticipations: import('./challenge').ChallengeParticipation[];
  caregivers: Caregiver[];
}

/**
 * Two active Zapisy (not cancelled/removed/expired) for the same Dystans of the
 * same Wydarzenie, one from each profile.
 * `registrationIds` is deliberately an unordered pair (both sides
 * "compete" equally until a moderator picks the winner).
 */
export interface CompetitorMergeConflict {
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  registrationIds: [string, string];
}

export interface CompetitorMergeComparison {
  competitors: [CompetitorMergeProfileBundle, CompetitorMergeProfileBundle];
  conflicts: CompetitorMergeConflict[];
}

/** Fields where two Zawodnik profiles may differ and need an explicit moderator decision. */
export type CompetitorMergeComparableField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'gender'
  | 'email'
  | 'phone'
  | 'club';

/** Which account (surviving or absorbed) wins for a given differing field. */
export type CompetitorMergeFieldDecisions = Partial<
  Record<CompetitorMergeComparableField, 'survivor' | 'absorbed'>
>;

export interface CompetitorMergeConflictResolution {
  eventId: string;
  distanceId: string;
  /** Id of the Zapis (from either side) that survives this particular conflict. */
  winnerRegistrationId: string;
}

export interface CompetitorMergePayload {
  survivorId: string;
  absorbedId: string;
  fieldDecisions: CompetitorMergeFieldDecisions;
  conflictResolutions?: CompetitorMergeConflictResolution[];
}

/**
 * The three possible outcomes of POST /admin/competitors/merge, all returned as 200
 * (pausing on a conflict is a normal, expected
 * step of this flow, not an HTTP error; mirrors the `duplicateWarnings` idiom of
 * POST /care). `status` is the discriminator — the UI switches on it,
 * not on the HTTP code.
 */
export type CompetitorMergeResult =
  | { status: 'field_decisions_required'; fields: CompetitorMergeComparableField[] }
  | { status: 'conflict_pending'; conflicts: CompetitorMergeConflict[] }
  | { status: 'merged'; survivor: Competitor; absorbed: Competitor };

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

/** A report of a possible Zawodnik duplicate (guardian/organizer -> Moderator/Admin). */
export interface ReportCompetitorDuplicatePayload {
  duplicateOfId: string;
  note?: string;
}

export interface CompetitorDuplicateReportProfile {
  firstName: string;
  lastName: string;
  birthDate: string | null;
}

/** open -> rejected (Moderator/Admin) or merged (set by merging the profiles). */
export type CompetitorDuplicateReportStatus = 'open' | 'rejected' | 'merged';

export interface CompetitorDuplicateReport {
  id: string;
  competitorId: string;
  duplicateOfId: string;
  competitor: CompetitorDuplicateReportProfile;
  duplicateOf: CompetitorDuplicateReportProfile;
  reporterName: string | null;
  reporterRole: string;
  note: string;
  status: CompetitorDuplicateReportStatus;
  rejectReason: string | null;
  createdAt: string;
}
