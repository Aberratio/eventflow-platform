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
  position: number;
  categoryPosition: number;
  status: 'finished' | 'dnf' | 'dsq';
  gender?: 'M' | 'K';
  birthYear?: number;
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
  status?: 'finished' | 'dnf' | 'dsq' | '';
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
