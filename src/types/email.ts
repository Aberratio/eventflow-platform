// ──────────────── Mail template system ────────────────
// Shapes mirror the server routes: GET/PUT /admin/mail-templates, GET/PUT/DELETE
// /events/{id}/mail-templates, POST …/preview and GET …/mail-log.

/** Where the effective template of a mail type comes from. */
export type MailTemplateSource = 'event_override' | 'global' | 'catalog_default';

/** One row of the template catalogue (GET /admin/mail-templates, GET /events/{id}/mail-templates). */
export interface MailTemplate {
  mailType: string;
  /** false = systemic mail (authentication etc.): editable only globally, never per event. */
  overridable: boolean;
  subject: string;
  bodyHtml: string;
  version: number;
  source: MailTemplateSource;
}

/** PUT body for the global template and for an event override. */
export interface SaveMailTemplatePayload {
  subject: string;
  bodyHtml: string;
}

/** POST …/preview body — both fields optional (omitted = the saved effective template). */
export interface MailTemplatePreviewRequest {
  subject?: string;
  bodyHtml?: string;
}

export interface MailTemplatePreview {
  mailType: string;
  eventId: string | null;
  source: 'draft' | MailTemplateSource;
  subject: string;
  bodyHtml: string;
  template: { subject: string; bodyHtml: string };
  /** Allowed variables of the mail type -> sample value. */
  variables: Record<string, string>;
  unknownVariables: string[];
}

export interface MailLogFilters {
  page?: number;
  pageSize?: number;
  mailType?: string;
  status?: string;
  /** Recipient address fragment (global log only). */
  search?: string;
}

export interface MailLogEntry {
  id: string;
  mailType: string;
  priority: string;
  /** Masked by the server, e.g. "j***@example.com". */
  recipient: string;
  subject: string;
  eventId: string | null;
  status: string;
  attempts: number;
  nextAttemptAt: string | null;
  createdAt: string;
  sentToMailerAt: string | null;
  lastCheckedAt: string | null;
  /** Global (admin) log only. */
  lastError?: string | null;
}

export type EmailTemplateScope = 'event' | 'system';

/** Polish labels of the server's mail catalogue (MailCatalog). Unknown types fall back to the raw id. */
export const MAIL_TYPE_LABELS: Record<string, string> = {
  email_verification: 'Weryfikacja adresu e-mail',
  password_reset: 'Reset hasła',
  account_locked: 'Konto zablokowane',
  account_setup: 'Ustawienie hasła do konta',
  registration_created: 'Zapis na wydarzenie',
  payment_confirmed: 'Potwierdzenie płatności',
  identity_code: 'Kod tożsamości',
  unpaid_reminder: 'Przypomnienie o nieopłaconym zapisie',
  event_changed: 'Zmiana wydarzenia',
  moderation_decision: 'Decyzja moderacji wydarzenia',
  results_published: 'Opublikowane wyniki',
  virtual_result_verdict: 'Werdykt wyniku wirtualnego',
  shop_order_status: 'Status zamówienia ze sklepu',
  challenge_completed: 'Ukończone wyzwanie',
  refund_approved: 'Zatwierdzony zwrot',
};

export const mailTypeLabel = (mailType: string): string => MAIL_TYPE_LABELS[mailType] ?? mailType;

export const MAIL_SOURCE_LABELS: Record<MailTemplateSource | 'draft', string> = {
  event_override: 'Nadpisany dla wydarzenia',
  global: 'Globalny',
  catalog_default: 'Domyślny',
  draft: 'Wersja robocza',
};

export const MAIL_LOG_STATUS_LABELS: Record<string, string> = {
  queued: 'W kolejce',
  pending: 'Oczekuje',
  sent: 'Wysłany',
  failed: 'Błąd',
};
