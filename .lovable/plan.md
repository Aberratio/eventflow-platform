

# Plan: Implement 5.3, 5.17, and 5.18

Points 3.4, 4.3, and 4.4 are already fully implemented in the current codebase. The real work is on 5.3, 5.17, and 5.18.

---

## Status of Already-Complete Features

- **3.4 (Registration)**: Full multi-step form with distance, category, merchandise, insurance, discount codes, team, terms acceptance
- **4.3 (Moderator)**: Dashboard with moderation, featured events, readonly users, orders, challenges, event management routes
- **4.4 (Admin)**: All 16 sidebar sections including users, shop, CMS, emails, settings, challenges, partners

---

## 1. External Registration Embed (5.3)

Create an embeddable registration widget that external sites can load via iframe.

**Changes:**
- Add `registrationEmbedEnabled` and `registrationEmbedConfig` fields to the `Event` type (embed start/end dates, allowed origin)
- Create a new route `/events/:slug/embed` rendering a standalone `RegistrationEmbed` page (no Layout wrapper, minimal chrome, branded header)
- The embed page shows event name, dates, a "Zapisz sie" button linking to the full registration form
- Add configuration UI in `EventForm.tsx` (Step 1) -- toggle "Zapisy przez iframe", date inputs for embed window, and a copyable embed code snippet (`<iframe src="..." />`)
- Add configuration in `AdminEventManage.tsx` advanced tab as well

**New files:**
- `src/pages/EventRegistrationEmbed.tsx` -- lightweight embed page

**Modified files:**
- `src/types/index.ts` -- add `RegistrationEmbedConfig` interface and fields on `Event`
- `src/pages/organizer/EventForm.tsx` -- add embed config UI in Step 1
- `src/App.tsx` -- add `/events/:slug/embed` route

---

## 2. Registration Form Field Configuration (5.17)

Allow organizers to configure which fields are collected during registration.

**Changes:**
- Add `registrationFormConfig` to `Event` type with boolean flags: `collectPhone`, `collectClub`, `collectBirthDate` (default true), `collectTeam`, `collectInsurance`, `collectMerchandise`, `customFields` array
- Add `CustomRegistrationField` interface (label, type: text/select/checkbox, required, options)
- Add configuration UI in `EventForm.tsx` Step 1 -- a collapsible "Konfiguracja formularza zapisow" section with checkboxes for standard fields and ability to add custom fields
- Update `RegistrationForm.tsx` to read `event.registrationFormConfig` and conditionally show/hide steps and fields (e.g., skip team step if `collectTeam` is false, skip insurance if disabled)

**Modified files:**
- `src/types/index.ts` -- add `RegistrationFormConfig`, `CustomRegistrationField`
- `src/pages/organizer/EventForm.tsx` -- add config UI
- `src/components/registration/RegistrationForm.tsx` -- respect config, render custom fields in Step 2
- `src/data/mockData.ts` -- add sample config to some events

---

## 3. Event Display Options (5.18)

Add per-event display settings for participant lists.

**Changes:**
- Add `displayOptions` to `Event` type: `defaultSort` (name/bib/date/distance), `uppercaseNames` (boolean), `hideUnpaid` (boolean)
- Add configuration UI in `EventForm.tsx` Step 1 -- a collapsible "Opcje wyswietlania" section with select for sorting and two switches
- Apply options in `ParticipantsTab.tsx`: sort by selected field, transform names to uppercase if enabled, filter out unpaid if enabled

**Modified files:**
- `src/types/index.ts` -- add `EventDisplayOptions`
- `src/pages/organizer/EventForm.tsx` -- add display options UI
- `src/pages/organizer/components/ParticipantsTab.tsx` -- apply sorting, uppercase, filtering
- `src/data/mockData.ts` -- add sample displayOptions

---

## Technical Details

### New types (src/types/index.ts)
```typescript
interface RegistrationEmbedConfig {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}

interface CustomRegistrationField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // for select type
}

interface RegistrationFormConfig {
  collectPhone: boolean;
  collectClub: boolean;
  collectBirthDate: boolean;
  collectTeam: boolean;
  collectInsurance: boolean;
  collectMerchandise: boolean;
  customFields: CustomRegistrationField[];
}

interface EventDisplayOptions {
  defaultSort: 'name' | 'bib' | 'date' | 'distance';
  uppercaseNames: boolean;
  hideUnpaid: boolean;
}
```

### New route
- `/events/:slug/embed` -- renders `EventRegistrationEmbed` (standalone, no navigation)

### File count
- 1 new file
- ~6 modified files

