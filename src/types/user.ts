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
  /** PP.7: informational only; absent on older API responses. */
  emailVerified?: boolean;
  /** G-07 (umowa §5.8): last successful login, ISO 8601; null before the first login. */
  lastLoginAt?: string | null;
}

/**
 * Zawodnik: profil danych startowych. Byt samodzielny — nie własność Konta,
 * może istnieć bez żadnego powiązanego Konta (np. dziecko zarejestrowane przez rodzica).
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
   * E1.12: kod tożsamości QR (`zqr_` + 48 hex) — generowany zawsze, przy
   * utworzeniu Zawodnika, więc zawsze obecny (ta sama konwencja co
   * Registration.qrCode z E1.11 — klient nigdy nie musi obsługiwać braku).
   * Bez wygasania; rotuje wyłącznie na żądanie (zob. rotateIdentityCode()).
   */
  identityCode: string;
  userId?: string | null;
  /**
   * E8.1: `scalony` (merged) is a permanent archival state — the profile was
   * absorbed into another one and its own registrations/care relations have
   * all been repointed away. Absent/`active` for every ordinary profile;
   * older responses that predate this field are treated as `active`.
   */
  status?: 'active' | 'scalony';
  /** E8.1: set only when status === 'scalony' — the profile that survived. */
  mergedIntoCompetitorId?: string | null;
  /** G-09: public name masking in rankings (POST /competitors/{id}/anonymization). */
  isAnonymized?: boolean;
}

/** Zawodnik pod moją opieką — mogę go zapisywać na zawody. */
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
  /** E1.12: kod tożsamości tego Zawodnika — patrz Competitor.identityCode. */
  identityCode: string;
  competitorUserId?: string | null;
  /** G-09: absent in GET /care today (server gap) — treated as false until toggled in this session. */
  isAnonymized?: boolean;
}

/** Konto, które sprawuje opiekę nade mną (może mnie zapisywać). */
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
   * E1.12: własny profil Zawodnika wywołującego Konta (z identityCode) — każde
   * Konto uczestnika dostaje go automatycznie przy rejestracji. Null tylko dla
   * kont, które jeszcze nie mają swojego profilu Zawodnika (praktycznie nie
   * zdarza się dla uczestników, ale typ zostaje szczery co do tego brzegu).
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
 * E8.1 ("Scalanie i przejmowanie profili Zawodnika"): jeden zwycięski czas na
 * dystansie, wyliczany na żywo z historii Wyników/Zapisów tego Zawodnika
 * (patrz `ResultRepository::lifetimeRecordsForCompetitor()` po stronie
 * serwera) — nigdy nie jest to przechowywany osobno wiersz, więc scalanie
 * nigdy nie musi go ręcznie przepinać: przepięcie Zapisów wystarcza.
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
 * E8.1: wszystko, co dany profil "niesie" — widok "obok siebie" (spec Answer
 * §2 krok 2). `challengeParticipations` pokazuje udział w Wyzwaniach jego
 * WŁASNEGO Konta, jeśli je ma — Uczestnictwa są kluczowane po `user_id`
 * (Koncie), nie po Zawodniku, więc scalanie dwóch profili nigdy ich nie
 * przepina (dwaj różni Zawodnicy nigdy nie dzielą tego samego Konta —
 * `competitors.user_id` jest UNIQUE) i ta lista jest tu wyłącznie
 * informacyjna, dla pełnego obrazu profilu.
 */
export interface CompetitorMergeProfileBundle {
  competitor: Competitor;
  registrations: import('./registration').Registration[];
  lifetimeRecords: CompetitorLifetimeRecord[];
  challengeParticipations: import('./challenge').ChallengeParticipation[];
  caregivers: Caregiver[];
}

/**
 * Dwa aktywne Zapisy (nie anulowane/usunięte/wygasłe) na ten sam Dystans tego
 * samego Wydarzenia, po jednym z każdego profilu (spec Answer §2 krok 6).
 * `registrationIds` jest celowo nieuporządkowana para (obie strony
 * "kandydują" jednakowo, dopóki moderator nie wybierze zwycięzcy).
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

/** Pola, w których dwa profile Zawodnika mogą się rozjechać i wymagają jawnej decyzji moderatora. */
export type CompetitorMergeComparableField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'gender'
  | 'email'
  | 'phone'
  | 'club';

/** Które konto (przeżywające czy wchłonięte) wygrywa dla danego rozbieżnego pola. */
export type CompetitorMergeFieldDecisions = Partial<
  Record<CompetitorMergeComparableField, 'survivor' | 'absorbed'>
>;

export interface CompetitorMergeConflictResolution {
  eventId: string;
  distanceId: string;
  /** Id Zapisu (z jednej z dwóch stron), który ma przetrwać ten konkretny konflikt. */
  winnerRegistrationId: string;
}

export interface CompetitorMergePayload {
  survivorId: string;
  absorbedId: string;
  fieldDecisions: CompetitorMergeFieldDecisions;
  conflictResolutions?: CompetitorMergeConflictResolution[];
}

/**
 * Trzy możliwe wyniki POST /admin/competitors/merge, wszystkie jako 200
 * (spec Answer §2 krok 6 — wstrzymanie na konflikcie to normalny, oczekiwany
 * krok tego przepływu, nie błąd HTTP; mirror idiomu `duplicateWarnings` z
 * POST /care). `status` jest dyskryminatorem — UI przełącza się na jego
 * podstawie, nie na kodzie HTTP.
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
