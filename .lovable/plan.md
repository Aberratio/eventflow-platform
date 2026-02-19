
# System szablonów emaili z wyzwalaczami i harmonogramem

## Cel

Stworzenie pełnego systemu automatycznych i ręcznych emaili dla administratorów, moderatorów i organizatorów. System obejmuje:
- Edytor szablonów ze zmiennymi `{{zmienna}}`
- Wyzwalacze automatyczne (triggery)
- Filtrowanie odbiorców
- Harmonogram wysyłki (planowanie)
- Podgląd szablonu z podstawionymi danymi

---

## Nowe typy w `src/types/index.ts`

```typescript
// Dostępne zmienne szablonowe
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

// Trigger automatyczny
export type EmailTriggerType =
  | 'on_registration'        // Po rejestracji
  | 'on_payment_confirmed'   // Po potwierdzeniu płatności
  | 'on_registration_cancelled' // Po anulowaniu rejestracji
  | 'on_event_approved'      // Po zatwierdzeniu wydarzenia (dla organizatora)
  | 'on_bib_assigned'        // Po przypisaniu numeru startowego
  | 'days_before_event'      // X dni przed wydarzeniem
  | 'days_after_registration'// X dni po rejestracji (przypomnienie o płatności)
  | 'manual';                // Ręczna wysyłka (jednorazowa)

// Filtr odbiorców szablonu
export interface EmailRecipientFilter {
  distanceIds?: string[];     // puste = wszyscy dystanse
  statuses?: Array<'pending' | 'confirmed' | 'cancelled'>;
  paymentStatus?: 'paid' | 'unpaid' | 'all';
}

// Szablon emaila
export interface EmailTemplate {
  id: string;
  eventId?: string;           // null = szablon globalny (admin)
  name: string;               // Nazwa szablonu (wewnętrzna, dla admina)
  subject: string;            // Temat emaila (może zawierać zmienne)
  body: string;               // Treść emaila (może zawierać zmienne)
  triggerType: EmailTriggerType;
  triggerDaysOffset?: number; // Dla 'days_before_event' i 'days_after_registration'
  recipientFilter: EmailRecipientFilter;
  active: boolean;
  createdAt: string;
  createdBy: string;          // userId twórcy
  lastSentAt?: string;
  sentCount: number;
}

// Log wysyłki emaila
export interface EmailSendLog {
  id: string;
  templateId: string;
  templateName: string;
  eventId?: string;
  eventName?: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'scheduled';
  scheduledFor?: string;      // Dla zaplanowanych
}
```

---

## Nowe pliki

### 1. `src/api/mock/email-templates.mock.ts`

Dane mockowe: 3-4 przykładowe szablony (po rejestracji, przypomnienie o płatności, X dni przed startem).

### 2. `src/api/email-templates.api.ts`

```typescript
getEmailTemplates(eventId?: string): Promise<PaginatedResponse<EmailTemplate>>
getEmailTemplateById(id: string): Promise<ApiResponse<EmailTemplate | null>>
createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'sentCount'>): Promise<ApiResponse<EmailTemplate>>
updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>>
deleteEmailTemplate(id: string): Promise<ApiResponse<void>>
toggleEmailTemplate(id: string, active: boolean): Promise<ApiResponse<EmailTemplate>>
sendEmailNow(templateId: string, recipientIds?: string[]): Promise<ApiResponse<{ sent: number }>>
getEmailSendLogs(eventId?: string): Promise<ApiResponse<EmailSendLog[]>>
previewEmailTemplate(template: Pick<EmailTemplate, 'subject' | 'body'>, sampleRegistrationId?: string): Promise<ApiResponse<{ subject: string; body: string }>>
```

### 3. `src/components/email/EmailTemplateEditor.tsx`

Główny komponent edytora szablonu. Dialog (lub drawer) z formularzem:

**Sekcja 1 - Podstawowe info:**
- Input: Nazwa szablonu (wewnętrzna)
- Input: Temat emaila (z chip-ami dostępnych zmiennych do kliknięcia)
- Textarea (duże): Treść emaila (z chip-ami zmiennych)

**Sekcja 2 - Wyzwalacz:**
- RadioGroup: typ triggera
  - Po rejestracji uczestnika
  - Po potwierdzeniu płatności
  - Po anulowaniu rejestracji
  - Po przypisaniu numeru startowego
  - X dni przed wydarzeniem (+ input liczbowy)
  - X dni po rejestracji (np. przypomnienie) (+ input liczbowy)
  - Ręcznie (wyślij teraz lub zaplanuj)

**Sekcja 3 - Odbiorcy:**
- MultiSelect dystansów (opcjonalnie, puste = wszyscy)
- Checkboxy statusów: Potwierdzeni / Oczekujący / Anulowani
- Select: Status płatności (Opłaceni / Nieopłaceni / Wszyscy)

**Sekcja 4 - Harmonogram (tylko dla trigger "manual"):**
- Toggle: Wyślij teraz / Zaplanuj na datę
- DateTimePicker (jeśli "Zaplanuj")

**Pasek zmiennych:**
- Pod polami Subject i Body wyświetlone jako małe badże do kliknięcia (wstawia zmienną do aktywnego pola)

**Podgląd:**
- Zakładka "Podgląd" (preview) zastępuje zmienne przykładowymi danymi z pierwszego uczestnika

### 4. `src/components/email/EmailTemplateCard.tsx`

Karta jednego szablonu na liście: nazwa, trigger, licznik wysłanych, status (aktywny/nieaktywny), przyciski Edytuj / Wyślij teraz / Usuń.

### 5. `src/components/email/EmailTemplatesManager.tsx`

Główny widok listy szablonów dla danego wydarzenia lub globalnie. Zawiera:
- Nagłówek z przyciskiem "Nowy szablon"
- Lista `EmailTemplateCard`
- Zakładka "Historia wysyłek" z tabelą logów

### 6. `src/components/email/VariableChipsList.tsx`

Pomocniczy komponent — lista badży zmiennych do wstawiania w edytorze.

---

## Integracja w panelach

### Panel Organizatora — `EventManage.tsx`

Nowa zakładka "Emaile" (ikona: `Mail`) obok zakładki "Kody rabatowe". Renderuje `<EmailTemplatesManager eventId={event.id} />`. Grid zakładek zmienia się z `grid-cols-5` na `grid-cols-6`.

### Panel Administratora — `AdminDashboard.tsx`

Nowa pozycja "Emaile" w grupie nawigacyjnej "Treści" (obok Partnerzy, Strony). Renderuje `<EmailTemplatesManager />` (bez eventId = szablony globalne).

### Panel Moderatora — `ModeratorDashboard.tsx`

Nowa pozycja "Emaile" w grupie "Moderacja". Moderator może tylko przeglądać szablony i historię wysyłek (tryb readonly — bez tworzenia i usuwania).

---

## Dostępne zmienne — tabela

| Zmienna | Opis |
|---------|------|
| `{{uczestnik.imie}}` | Imię i nazwisko uczestnika |
| `{{uczestnik.email}}` | Adres email uczestnika |
| `{{uczestnik.numer_startowy}}` | Przypisany numer startowy |
| `{{uczestnik.dystans}}` | Nazwa dystansu |
| `{{uczestnik.kategoria}}` | Kategoria wiekowa |
| `{{uczestnik.status}}` | Status rejestracji |
| `{{uczestnik.druzyna}}` | Nazwa drużyny |
| `{{wydarzenie.nazwa}}` | Nazwa wydarzenia |
| `{{wydarzenie.data}}` | Data wydarzenia |
| `{{wydarzenie.miasto}}` | Miasto wydarzenia |
| `{{wydarzenie.link}}` | Link do strony wydarzenia |
| `{{wydarzenie.termin_rejestracji}}` | Deadline rejestracji |
| `{{platnosc.kwota}}` | Kwota do zapłaty |
| `{{platnosc.nr_konta}}` | Numer konta bankowego |
| `{{platnosc.tytul_przelewu}}` | Tytuł przelewu |

---

## Szczegóły techniczne

### Typy TypeScript

- Wszystkie interfejsy z explicit `readonly` gdzie dane mockowe
- Strict union types dla `EmailTriggerType` i `EmailTriggerType`
- `Omit<EmailTemplate, ...>` przy tworzeniu szablonu
- Generic constraints zgodne z `ApiResponse<T>` i `PaginatedResponse<T>`

### Architektura komponentów

```text
EmailTemplatesManager
├── EmailTemplateCard (x N)
│   └── trigger: otwiera EmailTemplateEditor
├── EmailTemplateEditor (Dialog)
│   ├── VariableChipsList (Subject)
│   ├── VariableChipsList (Body)
│   ├── TriggerSelector
│   ├── RecipientFilterForm
│   └── SchedulerPanel
└── EmailSendLogsTable (zakładka Historia)
```

### Logika wstawiania zmiennych

`VariableChipsList` otrzymuje ref do `<input>` lub `<textarea>` i przy kliknięciu badża wstawia zmienną w pozycji kursora (używając `selectionStart` / `selectionEnd`).

### Mock danych

Szablony mockowe:
1. `on_registration` — "Potwierdzenie rejestracji" — dostępny globalnie
2. `on_payment_confirmed` — "Płatność potwierdzona" — per wydarzenie
3. `days_before_event` (3 dni) — "Przypomnienie o starcie" — per wydarzenie
4. `days_after_registration` (7 dni) — "Przypomnienie o płatności" — per wydarzenie

Logi mockowe: 10-15 wpisów z różnymi statusami.

### Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/types/index.ts` | Dodanie 4 nowych interfejsów/typów |
| `src/pages/organizer/EventManage.tsx` | Nowa zakładka Mail (grid-cols-5 → grid-cols-6) |
| `src/pages/admin/AdminDashboard.tsx` | Nowa pozycja nawigacyjna |
| `src/pages/moderator/ModeratorDashboard.tsx` | Nowa pozycja nawigacyjna (readonly) |
| `src/api/index.ts` | Barrel export nowego API |

### Nowe pliki

| Plik | Opis |
|------|------|
| `src/types/email.ts` | Typy dla systemu emaili (wydzielone) |
| `src/api/mock/email-templates.mock.ts` | Dane mockowe |
| `src/api/email-templates.api.ts` | Warstwa API |
| `src/components/email/EmailTemplatesManager.tsx` | Główny widok |
| `src/components/email/EmailTemplateCard.tsx` | Karta szablonu |
| `src/components/email/EmailTemplateEditor.tsx` | Edytor szablonu (dialog) |
| `src/components/email/VariableChipsList.tsx` | Lista zmiennych |
| `src/components/email/EmailSendLogsTable.tsx` | Historia wysyłek |
