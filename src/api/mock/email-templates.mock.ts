import type { EmailTemplate, EmailSendLog } from '@/types/email';

// ──────────────── Mock Email Templates ────────────────

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-registration-confirm',
    eventId: undefined, // global template
    name: 'Potwierdzenie rejestracji',
    subject: 'Potwierdzenie zapisu na {{wydarzenie.nazwa}}',
    body: `Cześć {{uczestnik.imie}},

Twoja rejestracja na **{{wydarzenie.nazwa}}** została przyjęta!

📅 Data: {{wydarzenie.data}}
📍 Miasto: {{wydarzenie.miasto}}
🏁 Dystans: {{uczestnik.dystans}}
🏷️ Kategoria: {{uczestnik.kategoria}}

**Dane do przelewu:**
- Kwota: {{platnosc.kwota}} zł
- Numer konta: {{platnosc.nr_konta}}
- Tytuł przelewu: {{platnosc.tytul_przelewu}}

Prosimy o dokonanie płatności w ciągu 7 dni. Po zaksięgowaniu przelewu status Twojej rejestracji zostanie zmieniony na "Potwierdzony".

Szczegóły wydarzenia: {{wydarzenie.link}}

Do zobaczenia na trasie!
Zespół SportTime`,
    triggerType: 'on_registration',
    recipientFilter: {
      statuses: ['pending'],
      paymentStatus: 'all',
    },
    active: true,
    createdAt: '2025-01-10T09:00:00Z',
    createdBy: 'user-admin-1',
    lastSentAt: '2026-02-18T14:23:00Z',
    sentCount: 342,
  },
  {
    id: 'tpl-payment-confirmed',
    eventId: 'evt-1',
    name: 'Płatność potwierdzona',
    subject: '✅ Płatność zatwierdzona — {{wydarzenie.nazwa}}',
    body: `Cześć {{uczestnik.imie}},

Świetna wiadomość! Twoja płatność za udział w **{{wydarzenie.nazwa}}** została zaksięgowana.

🎉 Twój start jest potwierdzony!
🔢 Numer startowy: {{uczestnik.numer_startowy}}
🏁 Dystans: {{uczestnik.dystans}}
📅 Data: {{wydarzenie.data}}
📍 Miejsce: {{wydarzenie.miasto}}

Szczegółowe informacje techniczne znajdziesz na stronie wydarzenia:
{{wydarzenie.link}}

Życzymy udanego startu!
Zespół SportTime`,
    triggerType: 'on_payment_confirmed',
    recipientFilter: {
      statuses: ['confirmed'],
      paymentStatus: 'paid',
    },
    active: true,
    createdAt: '2025-01-10T09:30:00Z',
    createdBy: 'user-admin-1',
    lastSentAt: '2026-02-17T11:05:00Z',
    sentCount: 198,
  },
  {
    id: 'tpl-reminder-3days',
    eventId: 'evt-1',
    name: 'Przypomnienie o starcie (3 dni)',
    subject: '⏰ Już za 3 dni — {{wydarzenie.nazwa}}!',
    body: `Cześć {{uczestnik.imie}},

Przypominamy, że już za **3 dni** odbędzie się **{{wydarzenie.nazwa}}**!

📅 Data: {{wydarzenie.data}}
📍 Gdzie: {{wydarzenie.miasto}}
🏁 Twój dystans: {{uczestnik.dystans}}
🔢 Numer startowy: {{uczestnik.numer_startowy}}

Nie zapomnij o:
- Odebraniu pakietu startowego
- Odpowiednim stroju i wyposażeniu
- Dotarciu na miejsce z wyprzedzeniem

Pełne informacje techniczne: {{wydarzenie.link}}

Powodzenia!
Zespół SportTime`,
    triggerType: 'days_before_event',
    triggerDaysOffset: 3,
    recipientFilter: {
      statuses: ['confirmed'],
      paymentStatus: 'paid',
    },
    active: true,
    createdAt: '2025-01-11T10:00:00Z',
    createdBy: 'user-organizer-1',
    lastSentAt: '2026-02-16T08:00:00Z',
    sentCount: 156,
  },
  {
    id: 'tpl-payment-reminder',
    eventId: 'evt-1',
    name: 'Przypomnienie o płatności (7 dni)',
    subject: '💳 Uzupełnij płatność — {{wydarzenie.nazwa}}',
    body: `Cześć {{uczestnik.imie}},

Twoja rejestracja na **{{wydarzenie.nazwa}}** oczekuje na płatność.

Prosimy o dokonanie przelewu, aby potwierdzić swój udział:

- Kwota: {{platnosc.kwota}} zł
- Numer konta: {{platnosc.nr_konta}}
- Tytuł przelewu: {{platnosc.tytul_przelewu}}

⚠️ Jeśli płatność nie wpłynie w ciągu 7 dni, Twoja rejestracja może zostać anulowana.

Masz pytania? Odpowiemy pod adresem kontakt@sporttime.pl

Rejestracja: {{wydarzenie.link}}`,
    triggerType: 'days_after_registration',
    triggerDaysOffset: 7,
    recipientFilter: {
      statuses: ['pending'],
      paymentStatus: 'unpaid',
    },
    active: true,
    createdAt: '2025-01-12T11:00:00Z',
    createdBy: 'user-admin-1',
    lastSentAt: '2026-02-15T09:00:00Z',
    sentCount: 87,
  },
  {
    id: 'tpl-bib-assigned',
    eventId: 'evt-2',
    name: 'Przypisanie numeru startowego',
    subject: '🔢 Twój numer startowy — {{wydarzenie.nazwa}}',
    body: `Cześć {{uczestnik.imie}},

Twój numer startowy na **{{wydarzenie.nazwa}}** jest już gotowy!

🔢 Numer startowy: **{{uczestnik.numer_startowy}}**
🏁 Dystans: {{uczestnik.dystans}}
📅 Data: {{wydarzenie.data}}

Numer startowy będzie wymagany przy odbiorze pakietu startowego.

Do zobaczenia!
Zespół SportTime`,
    triggerType: 'on_bib_assigned',
    recipientFilter: {
      statuses: ['confirmed'],
      paymentStatus: 'paid',
    },
    active: false,
    createdAt: '2025-02-01T12:00:00Z',
    createdBy: 'user-organizer-1',
    sentCount: 0,
  },
];

// ──────────────── Mock Email Send Logs ────────────────

export const mockEmailSendLogs: EmailSendLog[] = [
  {
    id: 'log-001',
    templateId: 'tpl-registration-confirm',
    templateName: 'Potwierdzenie rejestracji',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'jan.kowalski@email.com',
    recipientName: 'Jan Kowalski',
    subject: 'Potwierdzenie zapisu na Maraton Warszawski 2026',
    sentAt: '2026-02-18T14:23:11Z',
    status: 'sent',
  },
  {
    id: 'log-002',
    templateId: 'tpl-registration-confirm',
    templateName: 'Potwierdzenie rejestracji',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'anna.nowak@email.com',
    recipientName: 'Anna Nowak',
    subject: 'Potwierdzenie zapisu na Maraton Warszawski 2026',
    sentAt: '2026-02-18T14:23:12Z',
    status: 'sent',
  },
  {
    id: 'log-003',
    templateId: 'tpl-payment-confirmed',
    templateName: 'Płatność potwierdzona',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'piotr.wisniewski@email.com',
    recipientName: 'Piotr Wiśniewski',
    subject: '✅ Płatność zatwierdzona — Maraton Warszawski 2026',
    sentAt: '2026-02-17T11:05:44Z',
    status: 'sent',
  },
  {
    id: 'log-004',
    templateId: 'tpl-reminder-3days',
    templateName: 'Przypomnienie o starcie (3 dni)',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'maria.kowalczyk@email.com',
    recipientName: 'Maria Kowalczyk',
    subject: '⏰ Już za 3 dni — Maraton Warszawski 2026!',
    sentAt: '2026-02-16T08:00:05Z',
    status: 'sent',
  },
  {
    id: 'log-005',
    templateId: 'tpl-payment-reminder',
    templateName: 'Przypomnienie o płatności (7 dni)',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'tomasz.krawczyk@email.com',
    recipientName: 'Tomasz Krawczyk',
    subject: '💳 Uzupełnij płatność — Maraton Warszawski 2026',
    sentAt: '2026-02-15T09:00:18Z',
    status: 'sent',
  },
  {
    id: 'log-006',
    templateId: 'tpl-payment-reminder',
    templateName: 'Przypomnienie o płatności (7 dni)',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'katarzyna.zajac@email.com',
    recipientName: 'Katarzyna Zając',
    subject: '💳 Uzupełnij płatność — Maraton Warszawski 2026',
    sentAt: '2026-02-15T09:00:21Z',
    status: 'failed',
  },
  {
    id: 'log-007',
    templateId: 'tpl-registration-confirm',
    templateName: 'Potwierdzenie rejestracji',
    eventId: 'evt-2',
    eventName: 'Triathlon Krakowski',
    recipientEmail: 'marek.nowacki@email.com',
    recipientName: 'Marek Nowacki',
    subject: 'Potwierdzenie zapisu na Triathlon Krakowski',
    sentAt: '2026-02-14T16:11:33Z',
    status: 'sent',
  },
  {
    id: 'log-008',
    templateId: 'tpl-reminder-3days',
    templateName: 'Przypomnienie o starcie (3 dni)',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'agnieszka.duda@email.com',
    recipientName: 'Agnieszka Duda',
    subject: '⏰ Już za 3 dni — Maraton Warszawski 2026!',
    sentAt: '2026-02-20T08:00:00Z',
    status: 'scheduled',
    scheduledFor: '2026-02-21T08:00:00Z',
  },
  {
    id: 'log-009',
    templateId: 'tpl-reminder-3days',
    templateName: 'Przypomnienie o starcie (3 dni)',
    eventId: 'evt-1',
    eventName: 'Maraton Warszawski 2026',
    recipientEmail: 'robert.majewski@email.com',
    recipientName: 'Robert Majewski',
    subject: '⏰ Już za 3 dni — Maraton Warszawski 2026!',
    sentAt: '2026-02-20T08:00:00Z',
    status: 'scheduled',
    scheduledFor: '2026-02-21T08:00:00Z',
  },
  {
    id: 'log-010',
    templateId: 'tpl-payment-confirmed',
    templateName: 'Płatność potwierdzona',
    eventId: 'evt-2',
    eventName: 'Triathlon Krakowski',
    recipientEmail: 'beata.szymanska@email.com',
    recipientName: 'Beata Szymańska',
    subject: '✅ Płatność zatwierdzona — Triathlon Krakowski',
    sentAt: '2026-02-13T10:22:41Z',
    status: 'sent',
  },
];
