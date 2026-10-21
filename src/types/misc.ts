export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  logoDarkUrl?: string;
  websiteUrl?: string;
  featured: boolean;
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
  /** Status of the Zapis this ticket belongs to. */
  registrationStatus?: 'pending' | 'confirmed' | 'cancelled' | 'removed' | 'expired';
  /** Start code; the server returns it only for a `confirmed`/paid Zapis, otherwise null. */
  qrCode?: string | null;
  /**
   * Status Zapisu stojącego za biletem — QR kodu startowego
   * jest pokazywany tylko dla `confirmed` (opłacony/potwierdzony).
   */
  registrationStatus?: 'pending' | 'confirmed' | 'cancelled' | 'removed' | 'expired';
  /** Kod startowy `pqr_…` Zapisu (z Registration.qrCode); QR = sam ten token. */
  qrCode?: string | null;
  /**
   * The Odprawa fact reported back by Biuro Zawodów —
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
