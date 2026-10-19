export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  logoDarkUrl?: string;
  websiteUrl?: string;
  featured: boolean;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  subject: string;
  content: string;
  sentAt: string;
  read: boolean;
  eventId?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  distanceId: string;
  distanceName: string;
  location: string;
  participantName: string;
  participantId: string;
  bibNumber: string;
  category: string;
  registrationId: string;
  /**
   * G-01 (spec 11 pkt 4): status Zapisu stojącego za biletem — QR kodu startowego
   * jest pokazywany tylko dla `confirmed` (opłacony/potwierdzony).
   */
  registrationStatus?: 'pending' | 'confirmed' | 'cancelled' | 'removed' | 'expired';
  /** B-04: kod startowy `pqr_…` Zapisu (z Registration.qrCode); QR = sam ten token. */
  qrCode?: string | null;
  /**
   * E3.6 (issue 12 §4): the Odprawa fact reported back by Biuro Zawodów —
   * set once BZ confirms check-in, undefined/null beforehand. `checkedInBy`
   * is BZ's own opaque identifier/name for whoever confirmed it.
   */
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

export type NotificationType = 'registration' | 'moderation' | 'order' | 'message' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface GoogleCalendarSettings {
  enabled: boolean;
  /** Server-derived: key configured on the server AND a calendar id is set. Not writable. */
  connected: boolean;
  /** Server-derived: the service-account key file exists on the server. Never carries the key. Not writable. */
  credentialsConfigured: boolean;
  calendarId?: string;
  /** IANA time zone used for timed events (server default Europe/Warsaw). */
  timeZone?: string;
  lastSyncAt?: string | null;
}
