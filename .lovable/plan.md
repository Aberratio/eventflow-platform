

## Plan naprawczy — postęp

### ✅ Priorytet 1: Migracja na warstwę API (ZREALIZOWANE)
- Przeniesiono **wszystkie 56 plików** z `@/data/mockData` na bezpośrednie importy z `src/api/mock/`
- `src/data/mockData.ts` pełni teraz jedynie rolę re-eksportów (do usunięcia po pełnym audycie)
- Strony publiczne (Index, Events, Series, Shop) zmigrowane na TanStack Query + `useQuery`
- Dodano stany loading (Skeleton) na stronach publicznych
- AuthContext i CartContext zmigrowane na importy z `src/api/mock/`

### ✅ Priorytet 4: Porządki strukturalne (ZREALIZOWANE częściowo)
- Utworzono `src/constants/index.ts` — stałe: role, statusy, klucze storage, query keys, mock password
- Dodano 27 testów dla `helpers.ts` (applyDiscount, getCurrentPrice, validateDiscountCode, validateTeamName, getExistingTeamsForEvent)
- Dodano 5 testów dla `constants`

### 🔲 Pozostałe do realizacji
- Priorytet 2: Dekompozycja 8 dużych komponentów (EmailTemplateEditor, SeriesDetailsPage, PageEditorPage, AdminModerationTab, ResultsTab, EventFiltersSidebar, UsersOrganizersTab, MerchandiseEditor)
- Priorytet 3: Więcej testów (hooki useRegistrationForm, useEventFormState, konteksty CartContext, NotificationContext)
- Priorytet 5: ESLint rules, accessibility audit
