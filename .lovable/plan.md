

# Warstwa API -- odseparowane zapytania REST z zamockowanymi odpowiedziami

## Cel

Stworzyc folder `src/api/` z pelna warstwa abstrakcji nad danymi. Kazdy "endpoint" to funkcja async, ktora teraz zwraca mockowane dane, ale jest gotowa na podmiane na `fetch()` do prawdziwego backendu. Dane mockowe przenosimy do podfolderu `src/api/mock/`. Caly pozostaly kod importuje wylacznie z `src/api/`, nigdy z `src/data/mockData.ts`.

## Struktura folderow

```text
src/api/
  client.ts            -- bazowy klient HTTP (fetch wrapper, przygotowany na backend)
  types.ts             -- typy API: ApiResponse<T>, PaginatedResponse<T>, ApiError, filtry
  index.ts             -- barrel export wszystkich serwisow
  events.api.ts        -- CRUD wydarzen, dystanse, merchandise, kody rabatowe
  users.api.ts         -- uzytkownicy, profil, role
  auth.api.ts          -- logowanie, rejestracja, sesja
  registrations.api.ts -- zapisy na wydarzenia
  results.api.ts       -- wyniki, rekordy, dokumenty PDF, wyniki druzynowe
  series.api.ts        -- serie wydarzen
  shop.api.ts          -- produkty, zamowienia, dostawy, platnosci
  challenges.api.ts    -- wyzwania, uczestnictwo
  messages.api.ts      -- wiadomosci
  tickets.api.ts       -- bilety, certyfikaty
  partners.api.ts      -- partnerzy
  insurance.api.ts     -- ustawienia ubezpieczen
  admin.api.ts         -- logi, bezpieczenstwo, sesje online, statystyki, moderacja
  cms.api.ts           -- strony informacyjne (CMS)
  calendar.api.ts      -- integracja Google Calendar
  virtual-results.api.ts -- wyniki wirtualne
  mock/
    events.mock.ts
    users.mock.ts
    registrations.mock.ts
    results.mock.ts
    series.mock.ts
    shop.mock.ts
    challenges.mock.ts
    messages.mock.ts
    tickets.mock.ts
    partners.mock.ts
    insurance.mock.ts
    admin.mock.ts
    cms.mock.ts
    calendar.mock.ts
    virtual-results.mock.ts
    helpers.ts           -- getCurrentPrice, validateDiscountCode, validateTeamName, getExistingTeamsForEvent
    labels.ts            -- seriesTypeLabels, disciplineLabels, shopCategoryLabels, defaultPaymentMethods
```

## Typy API (`src/api/types.ts`)

```typescript
// Generyczna odpowiedz API
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Odpowiedz z paginacja
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Blad API
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// Filtry dla list
interface EventFilters {
  discipline?: SportDiscipline;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: Event['status'];
  seriesId?: string;
  search?: string;
  registrationStatus?: RegistrationStatus;
}

interface UserFilters {
  role?: UserRole;
  search?: string;
  status?: 'active' | 'blocked';
}

interface ResultFilters {
  eventId?: string;
  distanceId?: string;
  category?: string;
  gender?: 'M' | 'K';
  search?: string;
}

// ... i inne specyficzne filtry per domena
```

## Klient HTTP (`src/api/client.ts`)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const MOCK_DELAY_MS = 200;

// Symulacja opoznienia sieciowego
async function simulateDelay(): Promise<void> { ... }

// Bazowa funkcja fetch (przygotowana na prawdziwy backend)
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // Na razie: mock delay + zwracanie danych
  // W przyszlosci: fetch(`${API_BASE_URL}${endpoint}`, options)
  await simulateDelay();
  throw new Error(`Not implemented: ${endpoint}`);
}

export { apiRequest, simulateDelay };
```

## Przykladowy serwis (`src/api/events.api.ts`)

```typescript
import { simulateDelay } from './client';
import { ApiResponse, PaginatedResponse, EventFilters } from './types';
import { mockEvents } from './mock/events.mock';
import { Event, Distance } from '@/types';

// GET /api/events
export async function getEvents(
  filters?: EventFilters
): Promise<PaginatedResponse<Event>> {
  await simulateDelay();
  let filtered = [...mockEvents];
  if (filters?.discipline) filtered = filtered.filter(...);
  if (filters?.city) filtered = filtered.filter(...);
  // ... filtrowanie
  return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1 };
}

// GET /api/events/:slug
export async function getEventBySlug(slug: string): Promise<ApiResponse<Event | null>> {
  await simulateDelay();
  const event = mockEvents.find(e => e.slug === slug) || null;
  return { data: event, success: !!event, message: event ? undefined : 'Event not found' };
}

// GET /api/events/:id
export async function getEventById(id: string): Promise<ApiResponse<Event | null>> { ... }

// POST /api/events
export async function createEvent(data: Partial<Event>): Promise<ApiResponse<Event>> { ... }

// PUT /api/events/:id
export async function updateEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> { ... }

// DELETE /api/events/:id
export async function deleteEvent(id: string): Promise<ApiResponse<void>> { ... }

// PUT /api/events/:id/status
export async function updateEventStatus(
  id: string, 
  status: Event['status'], 
  reason?: string
): Promise<ApiResponse<Event>> { ... }

// GET /api/events/featured
export async function getFeaturedEvents(): Promise<ApiResponse<Event[]>> { ... }

// GET /api/events/live
export async function getLiveEvents(): Promise<ApiResponse<Event[]>> { ... }
```

## Pelna lista endpointow per domena

### Events (events.api.ts)
- `getEvents(filters?)` -- lista z filtrami
- `getEventBySlug(slug)` -- po slug
- `getEventById(id)` -- po ID
- `createEvent(data)` -- tworzenie
- `updateEvent(id, data)` -- edycja
- `deleteEvent(id)` -- usuwanie
- `updateEventStatus(id, status, reason?)` -- zmiana statusu (publish/approve/reject)
- `getFeaturedEvents()` -- wyrozniowane
- `getLiveEvents()` -- live wydarzenia
- `getEventsByOrganizer(organizerId)` -- po organizatorze

### Users (users.api.ts)
- `getUsers(filters?)` -- lista z filtrami
- `getUserById(id)` -- po ID
- `getUserByEmail(email)` -- po emailu
- `createUser(data)` -- tworzenie
- `updateUser(id, data)` -- edycja
- `deleteUser(id)` -- usuwanie
- `updateUserRole(id, role)` -- zmiana roli
- `updateUserStatus(id, status)` -- blokowanie/odblokowanie
- `getParticipants()` -- tylko uczestnicy
- `getOrganizers()` -- tylko organizatorzy

### Auth (auth.api.ts)
- `login(credentials)` -- logowanie
- `logout()` -- wylogowanie
- `getCurrentUser()` -- aktualny user
- `register(data)` -- rejestracja
- `resetPassword(email)` -- reset hasla
- `changePassword(oldPassword, newPassword)` -- zmiana hasla

### Registrations (registrations.api.ts)
- `getRegistrations(filters?)` -- lista
- `getRegistrationsByEvent(eventId)` -- po wydarzeniu
- `getRegistrationsByUser(userId)` -- po uzytkowniku
- `createRegistration(data)` -- rejestracja na wydarzenie
- `updateRegistration(id, data)` -- edycja
- `cancelRegistration(id)` -- anulowanie
- `updatePaymentDetails(id, paymentDetails)` -- aktualizacja platnosci

### Results (results.api.ts)
- `getResults(filters?)` -- lista z filtrami
- `getResultsByEvent(eventId, distanceId?)` -- po wydarzeniu
- `getResultsByUser(userId)` -- po uzytkowniku
- `createResult(data)` -- dodawanie wyniku
- `updateResult(id, data)` -- edycja
- `deleteResult(id)` -- usuwanie
- `getPersonalRecords(userId)` -- rekordy osobiste
- `getTeamResults(eventId)` -- wyniki druzynowe
- `getResultDocuments(eventId)` -- dokumenty PDF
- `uploadResultDocument(data)` -- upload dokumentu

### Series (series.api.ts)
- `getSeries(filters?)` -- lista serii
- `getSeriesById(id)` -- po ID
- `getSeriesBySlug(slug)` -- po slug

### Shop (shop.api.ts)
- `getProducts(filters?)` -- produkty
- `getProductBySlug(slug)` -- po slug
- `getProductById(id)` -- po ID
- `getDeliveryMethods()` -- metody dostawy
- `getShopPaymentMethods()` -- metody platnosci
- `getOrders(userId?)` -- zamowienia
- `getOrderById(id)` -- po ID
- `createOrder(data)` -- tworzenie zamowienia
- `updateOrderStatus(id, status, trackingNumber?)` -- zmiana statusu

### Challenges (challenges.api.ts)
- `getChallenges()` -- lista wyzwan
- `getChallengeBySlug(slug)` -- po slug
- `getChallengeById(id)` -- po ID
- `getChallengeParticipations(challengeId?, userId?)` -- uczestnictwa
- `joinChallenge(challengeId)` -- dolaczenie
- `submitChallengeEntry(data)` -- zgloszenie
- `reviewChallengeEntry(entryId, status, reason?)` -- weryfikacja

### Messages (messages.api.ts)
- `getMessages(userId)` -- wiadomosci
- `getMessage(id)` -- po ID
- `sendMessage(data)` -- wyslanie
- `markAsRead(id)` -- przeczytanie

### Tickets (tickets.api.ts)
- `getTickets(userId)` -- bilety uzytkownika
- `getCertificates(userId)` -- certyfikaty

### Partners (partners.api.ts)
- `getPartners()` -- lista
- `getFeaturedPartners()` -- wyrozniowani

### Insurance (insurance.api.ts)
- `getGlobalInsuranceSettings()` -- globalne ustawienia
- `updateGlobalInsuranceSettings(data)` -- aktualizacja

### Admin (admin.api.ts)
- `getActivityLogs(filters?)` -- logi aktywnosci
- `getSecuritySettings()` -- ustawienia bezpieczenstwa
- `updateSecuritySettings(data)` -- aktualizacja
- `getOnlineSessions()` -- sesje online
- `getSalesStats()` -- statystyki sprzedazy

### CMS (cms.api.ts)
- `getInfoPages()` -- lista stron
- `getInfoPageBySlug(slug)` -- po slug
- `createInfoPage(data)` -- tworzenie
- `updateInfoPage(id, data)` -- edycja
- `deleteInfoPage(id)` -- usuwanie
- `reorderInfoPages(ids)` -- zmiana kolejnosci

### Virtual Results (virtual-results.api.ts)
- `getVirtualResultSubmissions(eventId?)` -- lista zgloszen
- `submitVirtualResult(data)` -- zgloszenie wyniku
- `reviewVirtualResult(id, status, reason?)` -- weryfikacja

### Calendar (calendar.api.ts)
- `getCalendarSettings()` -- ustawienia
- `updateCalendarSettings(data)` -- aktualizacja
- `addEventToCalendar(event)` -- dodanie wydarzenia

## Migracja importow

Po przeniesieniu danych do `src/api/mock/` i stworzeniu serwisow API, zaktualizujemy **wszystkie 55 plikow** ktore importuja z `src/data/mockData`:
- Zamiast `import { mockEvents } from '@/data/mockData'` -> `import { getEvents } from '@/api'`
- Komponenty synchroniczne (np. filtry, sidebar) moga uzywac wersji synchronicznej z `@/api/mock/labels` dla statycznych labeli
- Plik `src/data/mockData.ts` zostanie usuniety po migracji

**WAZNE**: Migracja importow NIE bedzie czescia pierwszego commitu. Najpierw tworzymy warstwe API + mock, a stary plik zachowujemy. Migracja krok po kroku w kolejnych iteracjach, zeby nie zepsuc 55 komponentow naraz.

## Faza 1 (ten commit)

1. Stworzyc `src/api/types.ts` z typami API
2. Stworzyc `src/api/client.ts` z bazowym klientem
3. Stworzyc `src/api/mock/*.mock.ts` -- dane mockowe przeniesione z `mockData.ts`
4. Stworzyc `src/api/mock/helpers.ts` -- funkcje pomocnicze
5. Stworzyc `src/api/mock/labels.ts` -- etykiety/labele
6. Stworzyc wszystkie pliki `src/api/*.api.ts` z funkcjami async
7. Stworzyc `src/api/index.ts` z barrel exportem
8. **Zachowac** `src/data/mockData.ts` -- re-exporty z nowych lokalizacji (backward compatibility)

## Szczegoly techniczne

### Konwencja nazewnictwa
- Pliki API: `{domena}.api.ts`
- Pliki mock: `{domena}.mock.ts`
- Funkcje: `get*`, `create*`, `update*`, `delete*` (REST semantyka)
- Typy odpowiedzi: `ApiResponse<T>`, `PaginatedResponse<T>`

### Zasady TypeScript
- Strict mode: zadnych `any`
- Readonly arrays w mockach: `as const` gdzie mozliwe
- Discriminated unions dla statusow
- Generic constraints na typach odpowiedzi
- Explicit return types na wszystkich funkcjach API

### Symulacja opoznienia
- Domyslnie 150-300ms (losowe, realistyczne)
- Konfigurowane przez `MOCK_DELAY_MS`
- Mozliwosc wylaczenia w testach

