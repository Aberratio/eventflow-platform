

## Plan: Globalny system logowania akcji

### Cel
Stworzenie centralnego loggera, który rejestruje wszystkie ważne akcje w aplikacji (auth, CRUD, moderacja, zamówienia itp.) z dokładnymi timestampami, ID użytkowników i opisami po polsku. Docelowo logi będą wysyłane do API — teraz etap wysyłki zostanie zamockowany, ale reszta architektury będzie produkcyjna.

### Architektura

```text
┌─────────────────────────────────────────────┐
│  Komponenty / Konteksty / Hooki             │
│  → wywołują: appLogger.log(...)             │
└─────────────┬───────────────────────────────┘
              │
     ┌────────▼────────┐
     │  AppLogger       │  singleton, buforuje logi
     │  src/lib/logger  │  w pamięci + console.info
     └────────┬────────┘
              │ flush() co N sekund / na unload
     ┌────────▼────────┐
     │  LogTransport    │  interfejs: send(logs)
     │  MockTransport   │  console.table + in-memory
     │  (ApiTransport)  │  ← przyszłość: POST /logs
     └─────────────────┘
```

### Nowe pliki

**1. `src/lib/logger/types.ts`** — typy logów
- `LogLevel`: `'info' | 'warn' | 'error' | 'audit'`
- `LogCategory`: `'auth' | 'event' | 'registration' | 'result' | 'shop' | 'user' | 'moderation' | 'cms' | 'challenge' | 'email' | 'settings' | 'navigation' | 'system'`
- `LogEntry`: `{ id, timestamp (ISO), level, category, action (string), description (PL), userId?, userRole?, targetType?, targetId?, metadata? (Record<string,unknown>), sessionId }`
- `LogTransport`: interfejs `{ send(entries: LogEntry[]): Promise<void> }`

**2. `src/lib/logger/transports.ts`** — transporty
- `MockTransport`: loguje do `console.groupCollapsed` + przechowuje w tablicy in-memory (dostępne przez `getStoredLogs()`)
- Przygotowany slot na `ApiTransport` (komentarz + szablon)

**3. `src/lib/logger/logger.ts`** — klasa `AppLogger`
- Singleton (`appLogger`)
- Bufor logów (flush co 10s lub 50 wpisów)
- `log(level, category, action, description, meta?)` — główna metoda
- Skrócone metody: `auth()`, `event()`, `shop()`, `user()`, `moderation()`, `cms()`, `system()`
- Automatycznie pobiera `userId` i `userRole` z przekazanego kontekstu (setter `setCurrentUser`)
- Generuje `sessionId` (uuid) na starcie
- Nasłuchuje `beforeunload` → flush

**4. `src/lib/logger/index.ts`** — barrel export

**5. `src/hooks/useLogger.ts`** — hook React
- Pobiera user z `useAuthSafe()` i automatycznie ustawia `setCurrentUser` na loggerze
- Zwraca metody loggera z wstrzykniętym kontekstem użytkownika

### Integracja w istniejących plikach (~15 plików)

| Plik | Logowane akcje |
|------|---------------|
| `AuthContext.tsx` | `login`, `loginWithCredentials`, `logout`, sesja przywrócona z localStorage |
| `CartContext.tsx` | dodanie/usunięcie z koszyka, zmiana ilości |
| `LoginPage.tsx` | próba logowania (sukces/błąd) |
| `RegisterPage.tsx` | rejestracja konta |
| `EventSettingsTab.tsx` | zmiana statusu, usunięcie, prywatność |
| `AdminSettingsTab.tsx` | zapis ustawień ubezpieczeń, kalendarz |
| `AdminEventsTab.tsx` / `ModerationEventCard.tsx` | zatwierdzenie/odrzucenie wydarzenia |
| `UsersParticipantsTab.tsx` / `UsersOrganizersTab.tsx` | edycja/blokowanie użytkowników |
| `AdminOrdersTab.tsx` / `AdminOrderEditPage.tsx` | zmiana statusu zamówienia |
| `PageEditorPage.tsx` | tworzenie/edycja strony CMS |
| `PasswordChangeDialog.tsx` | zmiana hasła |
| `EventForm.tsx` (organizer) | tworzenie/edycja wydarzenia |
| `RegistrationForm.tsx` | rejestracja na wydarzenie |
| `ParticipantOrdersTab.tsx` | złożenie zamówienia |

### Szczegóły techniczne

- Logger NIE jest Reactowym kontekstem — to czysty TypeScript singleton, importowalny wszędzie (także poza komponentami)
- `useLogger()` to cienki hook synchronizujący `currentUser` z loggera
- Każdy log ma automatyczny `sessionId` (generowany raz per sesja przeglądarki)
- `MockTransport` formatuje logi czytelnie w konsoli: `[AUDIT:auth] 2026-04-09T12:00:00Z | Użytkownik jan@example.com zalogował się (rola: participant)`
- Opisy akcji po polsku, np. "Zalogowano użytkownika", "Dodano produkt do koszyka", "Zatwierdzono wydarzenie «Bieg Nocny»"

