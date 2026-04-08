

## Plan naprawczy — postęp

### ✅ Priorytet 1: Migracja na warstwę API (ZREALIZOWANE)
- Przeniesiono wszystkie pliki z `@/data/mockData` na bezpośrednie importy z `src/api/mock/`
- `src/data/mockData.ts` **usunięty**
- Strony publiczne zmigrowane na TanStack Query + `useQuery` ze skeletonami
- AuthContext i CartContext zmigrowane

### ✅ Priorytet 2: Dekompozycja dużych komponentów (ZREALIZOWANE)
- **EmailTemplateEditor** (575→220 linii) → `EmailPreviewPane`, `EmailTriggerSection`, `EmailRecipientsSection`
- **SeriesDetailsPage** (511→165 linii) → `SeriesHero`, `SeriesStandingsTable`, `SeriesEventsList`
- **AdminModerationTab** (482→200 linii) → `ModerationEventCard`
- **ResultsTab** (479→155 linii) → `IndividualResultsCard`, `ResultDocumentsCard`
- **UsersOrganizersTab** (426→210 linii) → `AddOrganizerDialog`
- **PriceTiersEditor** (594→280 linii) → `TierEditor`, `VipPricesSection`
- **DiscountCodesEditor** (485→165 linii) → `AddDiscountCodeDialog`, `EditDiscountCodeDialog`

### ✅ Priorytet 3: Pokrycie testami (ZREALIZOWANE)
- **100 testów** łącznie (15 plików testowych)
- `useEventFilters` — 6 testów
- `useRegistrationForm` — 10 testów
- `CartContext` — 7 testów
- `AuthContext` — 6 testów
- `helpers.ts` — 22 testów
- `constants` — 5 testów
- Komponenty UI — 19 testów

### ✅ Priorytet 4: Porządki strukturalne (ZREALIZOWANE)
- Usunięto `src/data/mockData.ts`
- Usunięto duplikację `src/components/ui/use-toast.ts`
- Utworzono `src/constants/index.ts`

### 🔲 Pozostałe do realizacji (niski priorytet)
- Dekompozycja `EventFiltersSidebar` (437 linii), `MerchandiseEditor` (353 linii)
- ESLint rules (`no-console`, `no-unused-imports`)
- Accessibility audit (aria-label, kontrast)
- Barrel exports ujednolicenie
