/**
 * Email Templates API Service
 *
 * All functions are async and currently backed by mock data.
 * To connect to a real backend, replace the mock implementations
 * with fetch() calls to the corresponding REST endpoints.
 */

import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse } from './types';
import type {
  EmailTemplate,
  EmailSendLog,
  CreateEmailTemplatePayload,
  SendEmailResult,
  EmailPreviewRequest,
  EmailPreviewResult,
  EmailTemplateVariable,
  EmailTemplateScope,
} from '@/types/email';
import { SYSTEM_TRIGGER_TYPES } from '@/types/email';
import { EMAIL_VARIABLES } from '@/types/email';
import { mockEmailTemplates, mockEmailSendLogs } from './mock/email-templates.mock';

// Mutable in-memory stores for mock CRUD
let templates: EmailTemplate[] = [...mockEmailTemplates];
let logs: EmailSendLog[] = [...mockEmailSendLogs];
let nextId = 100;

// ──────────────── Queries ────────────────

/**
 * GET /api/email-templates
 * Returns all templates, optionally filtered by eventId.
 * Passing undefined returns global templates + all event-specific ones.
 * Passing null returns only global (admin) templates.
 * Passing an eventId returns templates for that event + global ones.
 */
export async function getEmailTemplates(
  eventId?: string | null,
): Promise<PaginatedResponse<EmailTemplate>> {
  await simulateDelay();

  let filtered: EmailTemplate[];

  if (eventId === null) {
    // Only system/global templates (no eventId, system trigger)
    filtered = templates.filter(
      (t) =>
        t.eventId === undefined &&
        (SYSTEM_TRIGGER_TYPES as readonly string[]).includes(t.triggerType),
    );
  } else if (eventId) {
    // Only this specific event's templates
    filtered = templates.filter((t) => t.eventId === eventId);
  } else {
    // All templates
    filtered = [...templates];
  }

  return {
    data: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length,
    totalPages: 1,
  };
}

/** GET /api/email-templates/:id */
export async function getEmailTemplateById(id: string): Promise<ApiResponse<EmailTemplate | null>> {
  await simulateDelay();
  const template = templates.find((t) => t.id === id) ?? null;
  return {
    data: template,
    success: template !== null,
    message: template ? undefined : 'Szablon nie został znaleziony',
  };
}

/** GET /api/email-send-logs */
export async function getEmailSendLogs(eventId?: string): Promise<ApiResponse<EmailSendLog[]>> {
  await simulateDelay();
  const filtered = eventId ? logs.filter((l) => l.eventId === eventId) : [...logs];
  return { data: filtered, success: true };
}

// ──────────────── Mutations ────────────────

/** POST /api/email-templates */
export async function createEmailTemplate(
  payload: CreateEmailTemplatePayload,
): Promise<ApiResponse<EmailTemplate>> {
  await simulateDelay();

  const newTemplate: EmailTemplate = {
    ...payload,
    id: `tpl-${++nextId}`,
    createdAt: new Date().toISOString(),
    sentCount: 0,
  };
  templates = [...templates, newTemplate];

  return { data: newTemplate, success: true, message: 'Szablon został utworzony' };
}

/** PUT /api/email-templates/:id */
export async function updateEmailTemplate(
  id: string,
  data: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'sentCount'>>,
): Promise<ApiResponse<EmailTemplate>> {
  await simulateDelay();

  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) {
    return { data: templates[0], success: false, message: 'Szablon nie został znaleziony' };
  }

  const updated: EmailTemplate = { ...templates[index], ...data };
  templates = templates.map((t) => (t.id === id ? updated : t));

  return { data: updated, success: true, message: 'Szablon został zaktualizowany' };
}

/** DELETE /api/email-templates/:id */
export async function deleteEmailTemplate(id: string): Promise<ApiResponse<void>> {
  await simulateDelay();

  const exists = templates.some((t) => t.id === id);
  if (!exists) {
    return { data: undefined, success: false, message: 'Szablon nie został znaleziony' };
  }

  templates = templates.filter((t) => t.id !== id);
  return { data: undefined, success: true, message: 'Szablon został usunięty' };
}

/** PATCH /api/email-templates/:id/toggle */
export async function toggleEmailTemplate(
  id: string,
  active: boolean,
): Promise<ApiResponse<EmailTemplate>> {
  return updateEmailTemplate(id, { active });
}

/**
 * POST /api/email-templates/:id/send
 * Triggers immediate send (or schedules) for the given template.
 * Optional recipientIds narrows the audience; omitting = all matching the filter.
 */
export async function sendEmailNow(
  templateId: string,
  recipientIds?: string[],
): Promise<ApiResponse<SendEmailResult>> {
  await simulateDelay();

  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return {
      data: { sent: 0, failed: 0, scheduled: 0 },
      success: false,
      message: 'Szablon nie został znaleziony',
    };
  }

  // Mock: simulate sending to some recipients
  const targetCount = recipientIds ? recipientIds.length : 12;
  const failed = Math.floor(targetCount * 0.05); // 5% failure rate in mock
  const sent = targetCount - failed;

  // Update sent count on template
  templates = templates.map((t) =>
    t.id === templateId
      ? { ...t, sentCount: t.sentCount + sent, lastSentAt: new Date().toISOString() }
      : t,
  );

  // Add log entries
  const newLogs: EmailSendLog[] = Array.from({ length: sent }, (_, i) => ({
    id: `log-${Date.now()}-${i}`,
    templateId,
    templateName: template.name,
    eventId: template.eventId,
    eventName: template.eventId ? 'Wydarzenie testowe' : undefined,
    recipientEmail: `uczestnik${i + 1}@example.com`,
    recipientName: `Uczestnik ${i + 1}`,
    subject: template.subject,
    sentAt: new Date().toISOString(),
    status: 'sent' as const,
  }));
  logs = [...newLogs, ...logs];

  return {
    data: { sent, failed, scheduled: 0 },
    success: true,
    message: `Wysłano do ${sent} odbiorców${failed > 0 ? `, ${failed} błędów` : ''}`,
  };
}

/**
 * POST /api/email-templates/preview
 * Returns subject and body with template variables replaced by sample data.
 */
export async function previewEmailTemplate(
  request: EmailPreviewRequest,
): Promise<ApiResponse<EmailPreviewResult>> {
  await simulateDelay();

  const sampleValues: Record<EmailTemplateVariable, string> = {
    '{{uczestnik.imie}}': 'Jan Kowalski',
    '{{uczestnik.email}}': 'jan.kowalski@example.com',
    '{{uczestnik.numer_startowy}}': '247',
    '{{uczestnik.dystans}}': 'Półmaraton (21,097 km)',
    '{{uczestnik.kategoria}}': 'M30',
    '{{uczestnik.status}}': 'Potwierdzony',
    '{{uczestnik.druzyna}}': 'Biegacze Warszawy',
    '{{wydarzenie.nazwa}}': 'Maraton Warszawski 2026',
    '{{wydarzenie.data}}': '15 marca 2026, 09:00',
    '{{wydarzenie.miasto}}': 'Warszawa',
    '{{wydarzenie.link}}': 'https://zmierzymyczas.pl/events/maraton-warszawski-2026',
    '{{wydarzenie.termin_rejestracji}}': '28 lutego 2026',
    '{{platnosc.kwota}}': '149,00',
    '{{platnosc.nr_konta}}': '12 3456 7890 1234 5678 9012 3456',
    '{{platnosc.tytul_przelewu}}': 'REJESTRACJA-247-MARATON2026',
    '{{uzytkownik.imie}}': 'Jan Kowalski',
    '{{uzytkownik.email}}': 'jan.kowalski@example.com',
    '{{platforma.nazwa}}': 'ZmierzymyCzas',
    '{{platforma.link}}': 'https://zmierzymyczas.pl',
  };

  let subject = request.subject;
  let body = request.body;

  for (const meta of EMAIL_VARIABLES) {
    const value = sampleValues[meta.variable];
    const regex = new RegExp(meta.variable.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { data: { subject, body }, success: true };
}
