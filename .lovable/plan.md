
# Naprawa Dark Theme: kontrast, tla, hardcoded kolory

## Problem

Po wdrozeniu ciemnego motywu wiele elementow UI ma problemy z czytelnoscia:
- Czarny/ciemny tekst na ciemnym tle (nieczytelny)
- Sekcje z `bg-green-50`, `bg-yellow-50`, `bg-red-50` (jasne tla na ciemnym motywie)
- Statusy i badge'e z hardcoded kolorami Tailwind (`text-green-600`, `text-blue-500` itd.) ktore nie pasuja do ciemnego motywu
- Sekcje z `bg-primary/5` lub `bg-muted/30` ktore sa prawie niewidoczne na ciemnym tle

## Zakres zmian

### Grupa 1: Bazowe poprawki CSS (2 pliki)

**`src/styles/base.css`** — dodanie warstwy `@layer base` zeby Tailwind poprawnie dziedziczyc zmienne. Dodanie utility klas dla statusow kompatybilnych z dark theme:
```css
.status-success { color: hsl(var(--success)); }
.status-warning { color: hsl(var(--warning)); }
.status-info    { color: hsl(var(--info)); }
```

**`src/styles/tokens.css`** — dodanie brakujacych tokenow dla statusow w dark-friendly wartosciach:
```css
--success-subtle: 142 71% 40% / 0.1;   /* tlo statusu success */
--warning-subtle: 45 93% 47% / 0.1;    /* tlo statusu warning */
--info-subtle:    210 40% 50% / 0.1;    /* tlo statusu info */
```

### Grupa 2: Sekcje home page (4 pliki)

**`src/components/home/StatsSection.tsx`**
- `bg-primary/5` (prawie niewidoczne) → `bg-secondary/50`
- Ikony: `text-primary` → `text-muted-foreground` (ikony nieinteraktywne nie powinny byc czerwone)
- Wartosc liczbowa: `text-primary` → `text-foreground font-bold`

**`src/components/home/DisciplinesSection.tsx`**
- `hover:border-primary/50` → `hover:border-border-active` (subtelny hover)

**`src/components/home/OpenRegistrations.tsx`**
- `bg-muted/30` → `bg-card/50`
- `hover:border-primary/30` → `hover:border-muted-foreground/30`

**`src/components/home/HeroSection.tsx`**
- `bg-gradient-to-br from-primary/10` → ciemny gradient jak w HomeHero

### Grupa 3: Statusy i badge'e — zamiana hardcoded kolorow (16 plikow)

Wszystkie uzywaja jasnych kolorow Tailwind ktore sa nieczytelne na ciemnym tle. Zamiana na semantic tokens:

| Stary kolor | Nowy kolor | Uzycie |
|---|---|---|
| `bg-green-50` / `bg-green-500/10` | `bg-[hsl(var(--success)/0.1)]` | Tlo success |
| `text-green-600` / `text-green-700` | `text-[hsl(var(--success))]` | Tekst success |
| `border-green-200` / `border-green-300` | `border-[hsl(var(--success)/0.3)]` | Border success |
| `bg-yellow-50` / `bg-yellow-500/10` | `bg-[hsl(var(--warning)/0.1)]` | Tlo warning |
| `text-yellow-600` / `text-yellow-500` | `text-[hsl(var(--warning))]` | Tekst warning |
| `bg-red-50` | `bg-destructive/10` | Tlo error |
| `text-red-600` / `text-red-700` | `text-destructive` | Tekst error |
| `bg-blue-500/10` / `text-blue-600` | `bg-[hsl(var(--info)/0.1)]` / `text-[hsl(var(--info))]` | Tlo/tekst info |
| `bg-orange-500/10` / `text-orange-600` | `bg-[hsl(var(--warning)/0.15)]` / `text-[hsl(var(--warning))]` | Shipped status |
| `text-gray-400` (medal) | `text-muted-foreground` | Silver medal |

**Pliki do zmiany:**

1. `src/pages/organizer/components/ResultsTab.tsx` — badge "Ukonczyl" green → success
2. `src/pages/organizer/components/EventOverviewTab.tsx` — ikony statystyk green/yellow → muted
3. `src/pages/organizer/components/EventSettingsTab.tsx` — badge "Opublikowane" green → success
4. `src/pages/participant/components/ParticipantOrdersTab.tsx` — badge statusy paid/shipped/delivered
5. `src/pages/participant/components/ParticipantChallengesTab.tsx` — text green/yellow → success/warning
6. `src/pages/admin/components/AdminChallengesTab.tsx` — row classes + statusy
7. `src/pages/admin/components/AdminProfileTab.tsx` — badge login success/fail + password strength
8. `src/pages/admin/components/OnlineStaffCard.tsx` — status dots green/yellow → success/warning
9. `src/pages/moderator/components/ModeratorChallengesTab.tsx` — row classes + statusy
10. `src/pages/ChallengeDetailsPage.tsx` — statusConfig row classes
11. `src/pages/ForgotPasswordPage.tsx` — success icon green → success token
12. `src/pages/ResetPasswordPage.tsx` — success icon green → success token
13. `src/pages/NotificationsPage.tsx` — ikony typow kolorowe → muted/primary
14. `src/pages/SeriesDetailsPage.tsx` — seriesTypeColors blue/green/purple → neutral dark variants
15. `src/components/registration/RegistrationForm.tsx` — alert success, discount applied
16. `src/components/email/EmailSendLogsTable.tsx` — status sent green → success
17. `src/components/lists/ResultListRow.tsx` — medal colors
18. `src/pages/ResultsPage.tsx` — medal colors
19. `src/pages/EventDetailsPage.tsx` — medal colors
20. `src/pages/AthleteProfilePage.tsx` — medal colors

### Grupa 4: Tailwind config — semantic color utilities (1 plik)

**`tailwind.config.ts`** — dodanie utility kolorow `success`, `warning`, `info` do Tailwind zeby mozna uzywac `bg-success/10`, `text-success` itd.:

```typescript
success: "hsl(var(--success))",
"success-foreground": "hsl(var(--success-foreground))",
warning: "hsl(var(--warning))",
"warning-foreground": "hsl(var(--warning-foreground))",
info: "hsl(var(--info))",
"info-foreground": "hsl(var(--info-foreground))",
```

To umozliwi uzywanie `bg-success/10`, `text-success`, `text-warning` zamiast brzydkich `bg-[hsl(var(--success)/0.1)]`.

## Kolejnosc implementacji

1. `tailwind.config.ts` — dodanie semantic colors (success, warning, info)
2. `src/styles/tokens.css` — subtle warianty tokenow
3. `src/styles/base.css` — utility klasy statusowe
4. Home page sections (StatsSection, DisciplinesSection, OpenRegistrations, HeroSection)
5. Statusy w organizatorze (ResultsTab, EventOverviewTab, EventSettingsTab)
6. Statusy w uczestnikach (ParticipantOrdersTab, ParticipantChallengesTab)
7. Statusy w adminie (AdminChallengesTab, AdminProfileTab, OnlineStaffCard)
8. Statusy w moderatorze (ModeratorChallengesTab)
9. Pozostale strony (ChallengeDetailsPage, ForgotPasswordPage, ResetPasswordPage, NotificationsPage, SeriesDetailsPage)
10. Formularze (RegistrationForm)
11. Email (EmailSendLogsTable)
12. Medale (ResultListRow, ResultsPage, EventDetailsPage, AthleteProfilePage)

## Efekt koncowy

Wszystkie elementy UI beda czytelne na ciemnym tle. Statusy beda uzywac semantic tokenow (`--success`, `--warning`, `--info`) zamiast hardcoded kolorow Tailwind. Medale zachowaja swoje kolory (zloty, srebrny, brazowy) ale w wersjach kompatybilnych z dark theme.
