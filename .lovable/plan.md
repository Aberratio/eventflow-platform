

# Wydarzenia prywatne — specjalny link dostepu

## Cel

Dodanie mozliwosci tworzenia wydarzen prywatnych. Wydarzenie prywatne:
- Nie pojawia sie nigdzie w publicznych listach, wynikach wyszukiwania, sekcjach na stronie glownej
- Dostepne wylacznie przez specjalny link z kodem dostepu: `/events/{slug}?access={accessCode}`
- Uzytkownik zapisany na takie wydarzenie widzi je normalnie w swoim profilu (rejestracje, historia)
- Organizator, admin i moderator widza je bez kodu dostepu (jak drafty)

## Co sie zmieni

### 1. Model danych (`src/types/index.ts`)

Nowe pola w interfejsie `Event`:

```
Event {
  ...
  isPrivate?: boolean;        // czy wydarzenie jest prywatne
  accessCode?: string;        // kod dostepu do prywatnego wydarzenia (np. "abc123xyz")
}
```

### 2. Mock data (`src/data/mockData.ts`)

- Jedno istniejace wydarzenie (np. e5 lub nowe) oznaczone jako `isPrivate: true` z `accessCode`
- Reszta wydarzen bez zmian (`isPrivate` undefined = publiczne)

### 3. Filtrowanie publicznych list

We wszystkich miejscach gdzie wyswietlaja sie wydarzenia publicznie, dodac filtr `!e.isPrivate`:

| Plik | Miejsce filtrowania |
|---|---|
| `src/pages/EventsPage.tsx` | Lista wydarzen — dodac `.filter(e => !e.isPrivate)` |
| `src/components/home/FeaturedEvents.tsx` | Sekcja polecanych |
| `src/components/home/FeaturedEventsSection.tsx` | Sekcja polecanych (wariant) |
| `src/components/home/OpenRegistrations.tsx` | Otwarte zapisy |
| `src/components/home/DisciplinesSection.tsx` | Statystyki dyscyplin |
| `src/components/home/UpcomingEvents.tsx` | Nadchodzace wydarzenia |
| `src/components/home/RecentResults.tsx` | Ostatnie wyniki |
| `src/components/home/LiveResultsBanner.tsx` | Baner live |
| `src/pages/admin/components/AdminFeaturedEventsTab.tsx` | Lista opublikowanych w adminie |
| `src/pages/ResultsCalendarPage.tsx` | Kalendarz wynikow |
| `src/api/events.api.ts` | Funkcja `getEvents` — filtr domyslny |

Wazne: `ParticipantRegistrationsTab` i `ParticipantHistoryTab` NIE filtruja po `isPrivate` — uzytkownik zapisany na prywatne wydarzenie widzi je w swoim profilu.

### 4. Dostep do strony wydarzenia (`src/pages/EventDetailsPage.tsx`)

Rozszerzenie logiki dostepu:

```
Jesli event.isPrivate:
  - Admin / Moderator / Organizator wydarzenia -> dostep bez kodu
  - Uzytkownik z ?access={accessCode} w URL -> dostep (kod zapisuje sie do sessionStorage)
  - Uzytkownik zapisany na wydarzenie (ma rejestracje) -> dostep
  - Inaczej -> "Wydarzenie nie znalezione" (identycznie jak brak eventu)
```

Po poprawnym wejsciu z kodem, kod zapisuje sie do `sessionStorage` pod kluczem `private-event-{eventId}`, zeby user nie musial go wpisywac ponownie w tej sesji.

Na gorze strony prywatnego wydarzenia wyswietli sie baner (analogiczny do DraftBanner):
- Ikona zamka + "Wydarzenie prywatne — dostepne tylko przez zaproszenie"

### 5. Formularz tworzenia/edycji wydarzenia (`src/pages/organizer/EventForm.tsx`)

W kroku 1 (Basic info), nowa sekcja:

- **Checkbox "Wydarzenie prywatne"** z opisem: "Prywatne wydarzenie nie bedzie widoczne publicznie. Uczestnicy moga dolaczyc tylko przez specjalny link."
- Gdy zaznaczone: wyswietl pole **"Kod dostepu"** (generowany automatycznie, mozna zmienic) + przycisk "Kopiuj link" (kopiuje pelny URL z kodem)

### 6. Ustawienia wydarzenia (`src/pages/organizer/components/EventSettingsTab.tsx`)

Nowa karta "Prywatnosc":
- Przelacznik prywatne/publiczne
- Wyswietlenie kodu dostepu i linku do kopiowania
- Przycisk "Wygeneruj nowy kod" (zmienia kod, stary przestaje dzialac)

### 7. API (`src/api/events.api.ts`)

Funkcja `getEvents` — dodac domyslny filtr `!e.isPrivate` (chyba ze jawnie przekazano `filters.includePrivate = true`).

Nowe pole w `EventFilters` (`src/api/types.ts`):
```
includePrivate?: boolean;
```

## Szczegoly techniczne

### Generowanie kodu dostepu

Prosta funkcja generujaca losowy kod 12 znakow (litery + cyfry):
```
generateAccessCode(): string => Math.random().toString(36).substring(2, 14)
```

### Pelny link prywatny

Format: `{baseUrl}/events/{slug}?access={accessCode}`

Kopiowanie do schowka przez `navigator.clipboard.writeText(url)`.

### Logika dostepu w EventDetailsPage

Pseudokod:
```
1. Znajdz event po slug
2. Jesli nie znaleziono -> 404
3. Jesli event.isPrivate:
   a. Jesli user to admin/moderator/organizator -> OK
   b. Jesli user ma rejestracje na to wydarzenie -> OK  
   c. Jesli URL ma ?access= i pasuje do event.accessCode -> OK, zapisz do sessionStorage
   d. Jesli sessionStorage ma zapisany kod -> OK
   e. Inaczej -> 404
4. Istniejaca logika draftu (bez zmian)
5. Wyswietl PrivateBanner jesli event.isPrivate
```

### Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/types/index.ts` | `isPrivate`, `accessCode` w Event |
| `src/api/types.ts` | `includePrivate` w EventFilters |
| `src/data/mockData.ts` | Jedno prywatne wydarzenie |
| `src/pages/EventDetailsPage.tsx` | Logika dostepu prywatnego + PrivateBanner |
| `src/pages/EventsPage.tsx` | Filtr `!isPrivate` |
| `src/components/home/FeaturedEvents.tsx` | Filtr `!isPrivate` |
| `src/components/home/FeaturedEventsSection.tsx` | Filtr `!isPrivate` |
| `src/components/home/OpenRegistrations.tsx` | Filtr `!isPrivate` |
| `src/components/home/DisciplinesSection.tsx` | Filtr `!isPrivate` |
| `src/pages/organizer/EventForm.tsx` | Checkbox + pole kodu dostepu |
| `src/pages/organizer/components/EventSettingsTab.tsx` | Karta prywatnosci |
| `src/api/events.api.ts` | Filtr domyslny |

### Kolejnosc implementacji

1. Typy (`types/index.ts`, `api/types.ts`)
2. Mock data (jedno prywatne wydarzenie)
3. Filtrowanie list publicznych (EventsPage, home sections)
4. Logika dostepu w EventDetailsPage + baner
5. EventForm — tworzenie prywatnego wydarzenia
6. EventSettingsTab — zarzadzanie prywatnoscia

