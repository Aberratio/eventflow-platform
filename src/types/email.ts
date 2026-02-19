// ──────────────── Email Template System Types ────────────────

/**
 * Available template variables that get replaced per-recipient at send time.
 * Format: {{namespace.field}}
 */
export type EmailTemplateVariable =
  | '{{uczestnik.imie}}'
  | '{{uczestnik.email}}'
  | '{{uczestnik.numer_startowy}}'
  | '{{uczestnik.dystans}}'
  | '{{uczestnik.kategoria}}'
  | '{{uczestnik.status}}'
  | '{{uczestnik.druzyna}}'
  | '{{wydarzenie.nazwa}}'
  | '{{wydarzenie.data}}'
  | '{{wydarzenie.miasto}}'
  | '{{wydarzenie.link}}'
  | '{{wydarzenie.termin_rejestracji}}'
  | '{{platnosc.kwota}}'
  | '{{platnosc.nr_konta}}'
  | '{{platnosc.tytul_przelewu}}';

/** Human-readable metadata for each template variable */
export interface EmailVariableMeta {
  readonly variable: EmailTemplateVariable;
  readonly label: string;
  readonly description: string;
  readonly group: 'uczestnik' | 'wydarzenie' | 'platnosc';
}

/**
 * What event triggers this email to be sent automatically.
 * Use 'manual' for one-off or scheduled sends initiated by the admin/organizer.
 */
export type EmailTriggerType =
  | 'on_registration'            // immediately after participant registers
  | 'on_payment_confirmed'       // when payment is confirmed
  | 'on_registration_cancelled'  // when registration is cancelled
  | 'on_event_approved'          // when organizer's event gets approved by admin
  | 'on_bib_assigned'            // when a bib number is assigned to participant
  | 'days_before_event'          // N days before event date
  | 'days_after_registration'    // N days after registration (e.g. payment reminder)
  | 'manual';                    // manually triggered, possibly scheduled

/** Labels for display in UI */
export const EMAIL_TRIGGER_LABELS: Record<EmailTriggerType, string> = {
  on_registration: 'Po rejestracji uczestnika',
  on_payment_confirmed: 'Po potwierdzeniu płatności',
  on_registration_cancelled: 'Po anulowaniu rejestracji',
  on_event_approved: 'Po zatwierdzeniu wydarzenia',
  on_bib_assigned: 'Po przypisaniu numeru startowego',
  days_before_event: 'Dni przed wydarzeniem',
  days_after_registration: 'Dni po rejestracji',
  manual: 'Ręcznie (jednorazowo / zaplanowane)',
} as const;

/**
 * Filters that determine which participants receive this email.
 * All fields are optional — omitting means "all".
 */
export interface EmailRecipientFilter {
  /** Empty array or undefined = all distances */
  distanceIds?: string[];
  /** Empty array or undefined = all statuses */
  statuses?: Array<'pending' | 'confirmed' | 'cancelled'>;
  /** 'all' or undefined = regardless of payment */
  paymentStatus?: 'paid' | 'unpaid' | 'all';
}

/**
 * An email template that can be triggered automatically or sent manually.
 * eventId is undefined for global (admin-level) templates.
 */
export interface EmailTemplate {
  readonly id: string;
  /** If undefined, this is a global/platform-wide template */
  eventId?: string;
  name: string;
  subject: string;
  body: string;
  triggerType: EmailTriggerType;
  /** Number of days offset, only relevant for days_before_event / days_after_registration */
  triggerDaysOffset?: number;
  recipientFilter: EmailRecipientFilter;
  active: boolean;
  readonly createdAt: string;
  readonly createdBy: string;
  lastSentAt?: string;
  sentCount: number;
}

/**
 * Input shape when creating a new template (server assigns id, createdAt, sentCount).
 */
export type CreateEmailTemplatePayload = Omit<
  EmailTemplate,
  'id' | 'createdAt' | 'sentCount'
>;

/**
 * Individual log entry for one email sent to one recipient.
 */
export interface EmailSendLog {
  readonly id: string;
  readonly templateId: string;
  readonly templateName: string;
  eventId?: string;
  eventName?: string;
  readonly recipientEmail: string;
  readonly recipientName: string;
  readonly subject: string;
  readonly sentAt: string;
  status: 'sent' | 'failed' | 'scheduled';
  /** Populated when status === 'scheduled' */
  scheduledFor?: string;
}

/** Result returned after triggering a manual send */
export interface SendEmailResult {
  sent: number;
  failed: number;
  scheduled: number;
}

/** Payload for previewing a template with sample data substituted */
export interface EmailPreviewRequest {
  subject: string;
  body: string;
  /** Optionally pick a specific registration to seed sample values */
  sampleRegistrationId?: string;
}

export interface EmailPreviewResult {
  subject: string;
  body: string;
}

// ──────────────── Variable metadata registry ────────────────

export const EMAIL_VARIABLES: readonly EmailVariableMeta[] = [
  // Participant group
  { variable: '{{uczestnik.imie}}',           label: 'Imię i nazwisko',        description: 'Pełne imię i nazwisko uczestnika',     group: 'uczestnik' },
  { variable: '{{uczestnik.email}}',          label: 'Email',                  description: 'Adres email uczestnika',               group: 'uczestnik' },
  { variable: '{{uczestnik.numer_startowy}}', label: 'Numer startowy',          description: 'Przypisany numer startowy',            group: 'uczestnik' },
  { variable: '{{uczestnik.dystans}}',        label: 'Dystans',                description: 'Nazwa wybranego dystansu',             group: 'uczestnik' },
  { variable: '{{uczestnik.kategoria}}',      label: 'Kategoria',              description: 'Kategoria wiekowa uczestnika',         group: 'uczestnik' },
  { variable: '{{uczestnik.status}}',         label: 'Status rejestracji',     description: 'Aktualny status zapisu',               group: 'uczestnik' },
  { variable: '{{uczestnik.druzyna}}',        label: 'Drużyna',                description: 'Nazwa drużyny (jeśli dotyczy)',        group: 'uczestnik' },
  // Event group
  { variable: '{{wydarzenie.nazwa}}',         label: 'Nazwa wydarzenia',       description: 'Pełna nazwa wydarzenia',              group: 'wydarzenie' },
  { variable: '{{wydarzenie.data}}',          label: 'Data wydarzenia',        description: 'Data i godzina startu',               group: 'wydarzenie' },
  { variable: '{{wydarzenie.miasto}}',        label: 'Miasto',                 description: 'Miasto, w którym odbywa się zawody',  group: 'wydarzenie' },
  { variable: '{{wydarzenie.link}}',          label: 'Link do strony',         description: 'Pełny URL strony wydarzenia',         group: 'wydarzenie' },
  { variable: '{{wydarzenie.termin_rejestracji}}', label: 'Termin rejestracji', description: 'Data zamknięcia rejestracji',       group: 'wydarzenie' },
  // Payment group
  { variable: '{{platnosc.kwota}}',           label: 'Kwota do zapłaty',       description: 'Cena wpisowego za wybrany dystans',   group: 'platnosc' },
  { variable: '{{platnosc.nr_konta}}',        label: 'Numer konta',            description: 'Numer konta bankowego organizatora',  group: 'platnosc' },
  { variable: '{{platnosc.tytul_przelewu}}',  label: 'Tytuł przelewu',         description: 'Wymagany tytuł przelewu bankowego',   group: 'platnosc' },
] as const;
