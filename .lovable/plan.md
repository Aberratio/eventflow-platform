
# Plan: System nadawania numerów startowych

## Cel

Dodanie funkcjonalności batch i pojedynczego nadawania numerów startowych dla organizatorów i administratorów wydarzeń, wraz z rozbudową mockowych danych o duże listy startowe.

## Zakres zmian

### 1. Rozbudowa mock danych (src/data/mockData.ts)

Dodanie ~100 rejestracji dla wybranych wydarzeń:

| Event ID | Nazwa | Liczba zapisanych | Z numerami | Bez numerów |
|----------|-------|-------------------|------------|-------------|
| e9 | Nocny Bieg Wrocławski | 100 | 65 | 35 |
| e11 | Tatry Ultra | 100 | 70 | 30 |
| e15 | Bieg po Parku | 80 | 40 | 40 |

Generowanie uczestników:
- Losowe imiona i nazwiska (pula polskich imion)
- Losowe kategorie wiekowe pasujące do dystansów
- Mix statusów: confirmed (70%), pending (25%), cancelled (5%)
- Niektórzy z już przydzielonymi numerami startowymi

### 2. Nowy komponent BibNumberAssignment

Lokalizacja: `src/components/organizer/BibNumberAssignment.tsx`

Funkcjonalności zgodnie z obrazkami referencyjnymi:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ NADAWANIE NUMERÓW STARTOWYCH                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│ │ Sortowanie:                      │  │ Numer początkowy:                │ │
│ │ [Po dacie zapisu (tylko opłac.)] │  │ [1              ]                │ │
│ └──────────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                             │
│ Uwzględnij dystanse:                                                        │
│ [✓] Bieg 10 km (15 bez numeru)                                             │
│ [✓] Bieg 5 km (20 bez numeru)                                              │
│ [ ] Bieg 21 km (0 bez numeru)                                              │
│                                                                             │
│ ┌────────────────────────────┐  ┌────────────────────────────────────────┐ │
│ │ 🔢 Nadaj numery startowe!  │  │ 🗑️ Usuń wszystkie numery startowe!  │ │
│ └────────────────────────────┘  └────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Opcje sortowania (Select):**
- Po dacie zapisu (tylko opłaceni) - domyślnie
- Po nazwisku i imieniu (tylko opłaceni)
- Po dacie zapisu (wszyscy)
- Po nazwisku i imieniu (wszyscy)

**Logika przydzielania:**
1. Filtruj uczestników bez numeru startowego
2. Filtruj według wybranych dystansów
3. Sortuj według wybranej opcji
4. Przydzielaj numery od "numeru początkowego" rosnąco
5. Pomijaj numery już zajęte (symulacja kolizji)

### 3. Rozbudowa dialogu pojedynczego przypisywania

Lokalizacja: `src/pages/organizer/components/ParticipantsTab.tsx`

Ulepszenia:
- Wyświetlanie listy wolnych numerów (np. "430-443, 445 i więcej")
- Walidacja - ostrzeżenie gdy numer jest już zajęty
- Sugestia następnego wolnego numeru

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Przydzielanie numeru                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Zawodnik: Jan Kowalski                                                      │
│ Dystans: Bieg 10 km                                                         │
│                                                                             │
│ Zmień na: [_________]                                                       │
│                                                                             │
│ Wolne numery: 430-443, 445 i więcej                                         │
│                                                                             │
│                        ┌─────────┐  ┌─────────┐                            │
│                        │ Zmień   │  │ Anuluj  │                            │
│                        └─────────┘  └─────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Integracja z ParticipantsTab

Dodanie sekcji "Narzędzia administracyjne" powyżej tabeli uczestników:
- Eksport listy (istniejący)
- Wiadomość grupowa (istniejący)
- **Nowy:** Panel nadawania numerów startowych

### 5. Struktura plików

| Plik | Akcja | Opis |
|------|-------|------|
| `src/data/mockData.ts` | Modyfikacja | Dodanie ~280 nowych rejestracji dla 3 wydarzeń |
| `src/components/organizer/BibNumberAssignment.tsx` | Nowy | Panel batch nadawania numerów |
| `src/pages/organizer/components/ParticipantsTab.tsx` | Modyfikacja | Integracja panelu, ulepszony dialog pojedynczy |

## Szczegóły techniczne

### Helper do wyliczania wolnych numerów

```typescript
const getAvailableNumbers = (registrations: Registration[], maxToShow = 5): string => {
  // Zbierz wszystkie zajęte numery
  const usedNumbers = registrations
    .filter(r => r.bibNumber)
    .map(r => parseInt(r.bibNumber!, 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  // Znajdź zakresy wolnych numerów (od 1 do max+10)
  // Zwróć np. "430-443, 445 i więcej"
};
```

### Symulacja kolizji numerów

Podczas batch assignment:
```typescript
const assignBibNumbers = () => {
  let currentNumber = startNumber;
  const usedNumbers = new Set(
    localRegistrations
      .filter(r => r.bibNumber)
      .map(r => parseInt(r.bibNumber!, 10))
  );
  
  eligibleParticipants.forEach(participant => {
    // Pomijaj zajęte numery
    while (usedNumbers.has(currentNumber)) {
      currentNumber++;
    }
    // Przydziel numer
    participant.bibNumber = String(currentNumber).padStart(3, '0');
    usedNumbers.add(currentNumber);
    currentNumber++;
  });
};
```

### Mock dane - przykład generowania

```typescript
// Generator polskich imion i nazwisk
const firstNamesMale = ['Adam', 'Bartek', 'Cezary', 'Damian', 'Emil', ...];
const firstNamesFemale = ['Anna', 'Beata', 'Celina', 'Dorota', 'Ewa', ...];
const lastNames = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', ...];

// Generowanie 100 rejestracji dla e9
const e9Registrations = Array.from({ length: 100 }, (_, i) => ({
  id: `r-e9-${String(i + 1).padStart(3, '0')}`,
  eventId: 'e9',
  eventName: 'Nocny Bieg Wrocławski',
  userId: `p-gen-${i}`,
  userName: `${randomFirstName()} ${randomLastName()}`,
  userEmail: `participant${i}@example.com`,
  distanceId: i % 3 === 0 ? 'd17' : 'd18', // 10km lub 5km
  distanceName: i % 3 === 0 ? '10km' : '5km',
  category: randomCategory(),
  registeredAt: randomDate(),
  status: randomStatus(), // confirmed/pending/cancelled
  bibNumber: i < 65 ? String(100 + i) : undefined, // 65 z numerami
  pricePaid: i % 3 === 0 ? 60 : 40,
}));
```

## Flow użytkownika

### Batch nadawanie:
1. Organizator otwiera zakładkę "Uczestnicy"
2. Widzi panel "Nadawanie numerów startowych"
3. Wybiera sortowanie (np. "Po dacie zapisu, tylko opłaceni")
4. Zaznacza dystanse do numeracji
5. Ustawia numer początkowy (np. 1, 100, 500)
6. Klika "Nadaj numery startowe!"
7. System przydziela numery omijając już zajęte
8. Toast: "Przydzielono numery 35 uczestnikom"

### Pojedyncze nadawanie:
1. Organizator klika ikonę # przy uczestniku
2. Otwiera się dialog z:
   - Imieniem i nazwiskiem
   - Aktualnym dystansem
   - Polem na numer
   - Listą wolnych numerów
3. Wpisuje numer, potwierdza
4. Walidacja (czy nie zajęty)
5. Toast sukcesu lub błędu

## Elementy UI

Wykorzystanie istniejących komponentów:
- Card, CardHeader, CardContent
- Select, SelectItem
- Checkbox
- Button (variant: default, destructive, outline)
- Dialog, DialogContent, DialogHeader
- Input
- Badge
- Toast
