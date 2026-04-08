

## Plan naprawczy — postęp

### ✅ Priorytet 1: Migracja na warstwę API (ZREALIZOWANE)
- Przeniesiono **wszystkie 56 plików** z `@/data/mockData` na bezpośrednie importy z `src/api/mock/`
- `src/data/mockData.ts` **usunięty** — warstwa kompatybilności wstecznej nie jest już potrzebna
- Strony publiczne (Index, Events, Series, Shop) zmigrowane na TanStack Query + `useQuery`
- Dodano stany loading (Skeleton) na stronach publicznych
- AuthContext i CartContext zmigrowane na importy z `src/api/mock/`

### ✅ Priorytet 2: Dekompozycja dużych komponentów (ZREALIZOWANE)
- **EmailTemplateEditor** (575→220 linii): wydzielono `EmailPreviewPane`, `EmailTriggerSection`, `EmailRecipientsSection`
- **SeriesDetailsPage** (511→165 linii): wydzielono `SeriesHero`, `SeriesStandingsTable`, `SeriesEventsList`
- **AdminModerationTab** (482→200 linii): wydzielono `ModerationEventCard`
- **PriceTiersEditor** (594→280 linii): wydzielono `TierEditor`, `VipPricesSection`
- **DiscountCodesEditor** (485→165 linii): wydzielono `AddDiscountCodeDialog`, `EditDiscountCodeDialog`

### ✅ Priorytet 3: Pokrycie testami (ZREALIZOWANE częściowo)
- 90 testów łącznie (14 plików testowych)
- Dodano testy dla `useEventFilters` (6 testów)
- Dodano testy dla `CartContext` (7 testów)
- Dodano testy dla `AuthContext` (6 testów)
- Dodano 27 testów dla `helpers.ts`
- Dodano 5 testów dla `constants`

### ✅ Priorytet 4: Porządki strukturalne (ZREALIZOWANE częściowo)
- Usunięto `src/data/mockData.ts`
- Usunięto duplikację `src/components/ui/use-toast.ts`
- Utworzono `src/constants/index.ts` — stałe: role, statusy, klucze storage, query keys

### 🔲 Pozostałe do realizacji
- Priorytet 2 (kontynuacja): Dekompozycja `ResultsTab`, `EventFiltersSidebar`, `UsersOrganizersTab`, `MerchandiseEditor`
- Priorytet 3 (kontynuacja): Testy dla hooków `useRegistrationForm`, `useEventFormState`, `useParticipantsActions`
- Priorytet 4 (kontynuacja): Barrel exports, konwencja nazw plików
- Priorytet 5: ESLint rules, accessibility audit
