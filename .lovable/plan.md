

# Plan naprawczy repozytorium ZmierzymyCzas

## Stan obecny — podsumowanie audytu

| Metryka | Wartość |
|---|---|
| Pliki z `any` | 0 — czysto |
| Błędy TSC | 0 |
| Console.log w produkcji | 0 |
| Testy jednostkowe (Vitest) | 10 plików |
| Testy E2E (Playwright) | 9 plików |
| Pliki >400 linii (komponenty) | 12 |
| Bezpośrednie importy z mockData | **65 plików** — główny dług |

---

## Priorytet 1: Migracja na warstwę API (krytyczne)

**Problem:** 65 komponentów importuje dane synchronicznie z `@/data/mockData` zamiast korzystać z asynchronicznych funkcji API (`src/api/*.api.ts`). To blokuje integrację z backendem i powoduje brak obsługi stanów loading/error.

**Plan:**
- Przenieść wszystkie 65 plików na importy z `src/api/` + TanStack Query (`useQuery`/`useMutation`)
- Dodać obsługę stanów loading (skeletony), error (komunikaty) i empty state
- Po migracji usunąć `src/data/mockData.ts` (warstwa kompatybilności wstecznej)
- Podzielić na etapy: konteksty (Auth, Cart) → strony publiczne → panele dashboardów

**Objętość:** ~65 plików, 3-5 sesji implementacyjnych

---

## Priorytet 2: Dekompozycja pozostałych dużych komponentów (wysokie)

8 komponentów nadal przekracza 400 linii i łamie SRP:

| Plik | Linii | Sugerowana dekompozycja |
|---|---|---|
| `EmailTemplateEditor.tsx` | 575 | Wydzielić `VariableChipsList`, `EmailPreviewPane`, hook `useEmailTemplate` |
| `SeriesDetailsPage.tsx` | 507 | Wydzielić `SeriesStandingsTable`, `SeriesEventsList`, `SeriesHero` |
| `PageEditorPage.tsx` | 491 | Wydzielić `SectionEditor` (już istnieje?), hook `usePageEditor` |
| `AdminModerationTab.tsx` | 480 | Wydzielić `ModerationEventCard`, `ModerationFilters` |
| `ResultsTab.tsx` | 479 | Wydzielić `AddResultDialog`, `ResultDocumentsList`, hook `useResultsTab` |
| `EventFiltersSidebar.tsx` | 437 | Wydzielić hook `useEventFilters` (już istnieje — zintegrować) |
| `UsersOrganizersTab.tsx` | 425 | Wydzielić `UserViewEditDialog` (już istnieje — reuse) |
| `MerchandiseEditor.tsx` | 353 | Wydzielić `MerchandiseItemForm` |

---

## Priorytet 3: Pokrycie testami (wysokie)

Obecne 10 plików testów jednostkowych to za mało. Brakuje testów dla:

**Hooki (najwyższy priorytet):**
- `useRegistrationForm` — złożona logika walidacji i stanu
- `useEventFormState` — logika kroków formularza
- `useParticipantsActions` — akcje bulk, eksport
- `useEventFilters` — filtrowanie i sortowanie

**Utile i helpery:**
- `src/api/mock/helpers.ts` — `getCurrentPrice`, `validateDiscountCode`, `validateTeamName`
- Dodać testy dla transformacji danych w API

**Konteksty:**
- `CartContext` — operacje koszyka (add/remove/clear)
- `NotificationContext` — zarządzanie powiadomieniami

**Komponenty krytyczne:**
- `RegistrationForm` — pełny flow rejestracji
- `EventCard` — (istnieje, rozszerzyć)

**Szacunek:** ~10-12 nowych plików testowych

---

## Priorytet 4: Porządki strukturalne (średnie)

1. **Spójność eksportów** — niektóre komponenty mają barrel files (`index.ts`), inne nie. Ujednolicić dla `components/event-details/`, `components/lists/`, `components/errors/`, `components/skeletons/`
2. **Usunięcie duplikacji** — `src/hooks/use-toast.ts` vs `src/components/ui/use-toast.ts` (dwa pliki z tą samą odpowiedzialnością)
3. **Stałe** — wyciągnąć magic strings (statusy, role, URL-e) do `src/constants/`
4. **Konwencja nazw plików** — mieszanka `kebab-case` i `PascalCase` w pages. Ustandaryzować

---

## Priorytet 5: Usprawnienia DX i jakości (niskie)

1. **ESLint** — dodać reguły: `no-console`, `no-unused-imports`, `react-hooks/exhaustive-deps`
2. **Husky + lint-staged** — automatyczna walidacja przed commitem
3. **Storybook** — dla kluczowych komponentów UI (opcjonalnie)
4. **Accessibility audit** — dodać `aria-label` do interaktywnych elementów, sprawdzić kontrast

---

## Sugerowana kolejność wykonania

```text
Sesja 1 → Migracja kontekstów (Auth, Cart) na async API + useQuery
Sesja 2 → Migracja stron publicznych (Index, Events, Series, Shop)
Sesja 3 → Migracja paneli (participant, organizer)
Sesja 4 → Migracja paneli (moderator, admin)
Sesja 5 → Dekompozycja 8 dużych komponentów
Sesja 6 → Testy hooków i helperów (~12 plików)
Sesja 7 → Porządki strukturalne + DX
```

Każda sesja kończy się weryfikacją: `tsc --noEmit` + `vitest run` + test manualny.

