export interface Result {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  registrationId?: string;
  userName: string;
  bibNumber: string;
  category: string;
  time: string;
  timeInSeconds: number;
  /**
   * Czas netto (spec 14 sekcja 2) - opcjonalny, nie kazdy pomiar ma mate
   * startowa. Serwer zwraca go od E2.1 (ResultRepository::COLUMNS), ale
   * typ klienta dotad go nie odzwierciedlal.
   */
  netTime?: string | null;
  netTimeInSeconds?: number | null;
  position: number;
  categoryPosition: number;
  /** G-03: miejsce wg płci (wśród zawodników tej samej płci w klasyfikacji); 0 = brak płci / nie ukończył. */
  genderPosition?: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
  gender?: 'M' | 'K';
  birthYear?: number;
  /**
   * Publikacja wyników (spec 14 Answer §6, E2.3) - wstepne od razu po
   * imporcie/recznym wpisaniu, oficjalne dopiero po weryfikacji organizatora.
   * Granulacja: Wydarzenie+Dystans (klasyfikacja), nie pojedynczy wiersz -
   * wszystkie wyniki tej samej klasyfikacji dziela ta sama wartosc. Korekta
   * pojedynczego wyniku (PATCH /results/{id}) NIE zmienia tego pola.
   */
  publicationStatus: 'preliminary' | 'official';
}

/** G-03: one row of GET /results/{id}/corrections - who, when, what changed (from -> to) and why. */
export type ResultCorrectionField = 'time' | 'netTime' | 'status' | 'position' | 'categoryPosition';

export interface ResultCorrection {
  id: string;
  resultId: string;
  correctedBy: string;
  correctedByName?: string | null;
  correctedAt: string;
  reason: string | null;
  /** The classification was already official when this correction was made. */
  wasOfficial: boolean;
  changes: Partial<
    Record<ResultCorrectionField, { from: string | number | null; to: string | number | null }>
  >;
}

export type ResultImportMode = 'replace' | 'upsert';
export type ResultImportRowStatus =
  | 'ready'
  | 'needs_match'
  | 'ambiguous'
  | 'invalid'
  | 'ignored'
  | 'committed';

export interface ResultImportCandidate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  distanceId: string;
  distanceName: string;
  category: string;
  bibNumber?: string;
  status: string;
  gender?: 'M' | 'K';
  birthYear?: number;
  club?: string;
  _matchScore?: number;
}

export interface ResultImportMappedData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  bibNumber?: string;
  time?: string;
  timeInSeconds?: number | null;
  status?: 'finished' | 'dnf' | 'dns' | 'dsq' | '';
  position?: string | number;
  category?: string;
  gender?: 'M' | 'K' | '';
  birthYear?: string | number;
  club?: string;
}

export interface ResultImportRow {
  id: string;
  batchId: string;
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData?: ResultImportMappedData | null;
  candidates?: ResultImportCandidate[] | null;
  selectedRegistrationId?: string | null;
  selectedUserId?: string | null;
  status: ResultImportRowStatus;
  errors: string[];
  warnings: string[];
  ignoreRow: boolean;
  updatedAt: string;
}

export interface ResultImportSummary {
  total: number;
  ready: number;
  needsMatch: number;
  ambiguous: number;
  invalid: number;
  ignored: number;
  sheets?: string[];
}

export interface ResultImportBatch {
  id: string;
  eventId: string;
  distanceId: string;
  mode: ResultImportMode;
  status: 'uploaded' | 'mapped' | 'analyzed' | 'committed';
  fileName: string;
  fileUrl?: string;
  fileMimeType: string;
  sheetName?: string | null;
  headers: string[];
  mapping?: Record<string, string> | null;
  summary?: ResultImportSummary | null;
  uploadedBy: string;
  uploadedAt: string;
  committedAt?: string | null;
  rows: ResultImportRow[];
}

export type TeamAggregationRule = 'sum' | 'best' | 'average';

export const TEAM_AGGREGATION_RULE_LABELS: Record<TeamAggregationRule, string> = {
  sum: 'Suma czasów członków',
  best: 'Czas najlepszego członka',
  average: 'Średnia czasów członków',
};

/**
 * E2.7 (spec 14 sekcja 4): live-computed row of the team/relay classification
 * for one event+distance - see server ResultRepository::teamClassification()
 * for the aggregation/edge-case rules this reflects (partial teams and teams
 * with a dnf/dns/dsq member are excluded server-side, never sent here).
 * Deliberately NOT the same shape as the legacy `TeamResult` below (which
 * this table replaces in the UI - see ResultsSection.tsx/ResultsTab.tsx).
 */
export interface TeamClassificationEntry {
  teamId: string;
  teamName: string;
  memberCount: number;
  aggregationRule: TeamAggregationRule;
  aggregatedTimeInSeconds: number;
  position: number;
}

/** @deprecated LEGACY (E2.7) - see ResultRepository::teamResults()'s docblock on the server. No longer surfaced anywhere in the UI; kept only so the type of the still-existing GET /events/{eventId}/team-results endpoint has a home. */
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
  submittedTime: string;
  submittedTimeInSeconds: number;
  proofUrl?: string;
  notes?: string;
  submittedAt: string;
  status: VirtualResultSubmissionStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
