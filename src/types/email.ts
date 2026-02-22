// ──────────────── Email Template System Types ────────────────

/**
 * Available template variables that get replaced per-recipient at send time.
 * Format: {{namespace.field}}
 */
export type EventEmailTemplateVariable =
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

export type SystemEmailTemplateVariable =
  | '{{uzytkownik.imie}}'
  | '{{uzytkownik.email}}'
  | '{{platforma.nazwa}}'
  | '{{platforma.link}}';

export type EmailTemplateVariable = EventEmailTemplateVariable | SystemEmailTemplateVariable;

/** Human-readable metadata for each template variable */
export interface EmailVariableMeta {
  readonly variable: EmailTemplateVariable;
  readonly label: string;
  readonly description: string;
  readonly group: 'uczestnik' | 'wydarzenie' | 'platnosc' | 'uzytkownik' | 'platforma';
}

// ──────────────── Trigger types ────────────────

/**
 * Event-scoped triggers — available to organizers per event.
 */
export type EventTriggerType =
  | 'on_registration'
  | 'on_payment_confirmed'
  | 'on_registration_cancelled'
  | 'on_event_approved'
  | 'on_bib_assigned'
  | 'days_before_event'
  | 'days_after_registration'
  | 'manual';

/**
 * System-scoped triggers — available only to admins for global templates.
 */
export type SystemTriggerType =
  | 'on_account_created'
  | 'on_password_reset'
  | 'on_account_deleted'
  | 'on_email_verified';

export type EmailTriggerType = EventTriggerType | SystemTriggerType;

/** Arrays for filtering in UI */
export const EVENT_TRIGGER_TYPES: EventTriggerType[] = [
  'on_registration',
  'on_payment_confirmed',
  'on_registration_cancelled',
  'on_event_approved',
  'on_bib_assigned',
  'days_before_event',
  'days_after_registration',
  'manual',
];

export const SYSTEM_TRIGGER_TYPES: SystemTriggerType[] = [
  'on_account_created',
  'on_password_reset',
  'on_account_deleted',
  'on_email_verified',
];

/** Labels for display in UI */
export const EMAIL_TRIGGER_LABELS: Record<EmailTriggerType, string> = {
  // Event triggers
  on_registration: 'Po rejestracji uczestnika',
  on_payment_confirmed: 'Po potwierdzeniu płatności',
  on_registration_cancelled: 'Po anulowaniu rejestracji',
  on_event_approved: 'Po zatwierdzeniu wydarzenia',
  on_bib_assigned: 'Po przypisaniu numeru startowego',
  days_before_event: 'Dni przed wydarzeniem',
  days_after_registration: 'Dni po rejestracji',
  manual: 'Ręcznie (jednorazowo / zaplanowane)',
  // System triggers
  on_account_created: 'Po utworzeniu konta',
  on_password_reset: 'Po resecie hasła',
  on_account_deleted: 'Po usunięciu konta',
  on_email_verified: 'Po weryfikacji adresu email',
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

/** Scope for email templates: event-level or system-level */
export type EmailTemplateScope = 'event' | 'system';

// ──────────────── Variable metadata registry ────────────────

export const EVENT_EMAIL_VARIABLES: readonly EmailVariableMeta[] = [
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

export const SYSTEM_EMAIL_VARIABLES: readonly EmailVariableMeta[] = [
  { variable: '{{uzytkownik.imie}}',  label: 'Imię użytkownika',  description: 'Imię i nazwisko użytkownika',    group: 'uzytkownik' },
  { variable: '{{uzytkownik.email}}', label: 'Email użytkownika', description: 'Adres email użytkownika',        group: 'uzytkownik' },
  { variable: '{{platforma.nazwa}}',  label: 'Nazwa platformy',  description: 'Nazwa platformy (SportTime)',    group: 'platforma' },
  { variable: '{{platforma.link}}',   label: 'Link do platformy', description: 'Link do strony głównej platformy', group: 'platforma' },
] as const;

/** All variables — kept for backward compatibility */
export const EMAIL_VARIABLES: readonly EmailVariableMeta[] = [
  ...EVENT_EMAIL_VARIABLES,
  ...SYSTEM_EMAIL_VARIABLES,
] as const;