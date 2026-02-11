

# Plan: Ulepszenie weryfikacji wyzwan i pelny CRUD

## 1. Weryfikacja pogrupowana per wyzwanie

### Problem
Obecna zakladka "Weryfikacja" w panelu admina i moderatora pokazuje plaska liste wszystkich oczekujacych zgloszen ze wszystkich wyzwan w jednej tabeli. Przy wiekszej liczbie wyzwan jest to nieczytelne.

### Rozwiazanie
Zastapienie plaskej listy widokiem **per wyzwanie** - kazde wyzwanie jako osobna karta (Card) z:
- Naglowkiem: nazwa wyzwania + liczniki statusow (oczekujace/zatwierdzone/odrzucone)
- Tabela zgloszen z kolorami wierszy (zielony/zolty/czerwony)
- Przyciski zatwierdzania/odrzucania bezposrednio w wierszu
- Mozliwosc filtrowania: "Wszystkie" / "Oczekujace" / "Zatwierdzone" / "Odrzucone"
- Rozwijanie/zwijanie kart (domyslnie rozwiniety tylko te z oczekujacymi)

Uzytkownicy (uczesnicy w tym wypadku) beda pogrupowani wewnatrz kazdej karty wyzwania, z ich wpisami w podtabeli.

### Wizualizacja

```text
[Filtr: Wszystkie | Oczekujace (3) | Zatwierdzone | Odrzucone]

┌── Korona Polmaratonow 2026 ── ⏳ 2  ✅ 15  ❌ 1 ─── [Rozwin/Zwin] ──┐
│                                                                         │
│ Jan Kowalski (postep: 5/10)                                            │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ 🟢 Polmaraton Warszawski  01:42:13  #234  Link ✅                 │  │
│ │ 🟡 Polmaraton Poznanski   01:50:22  #278  Link  [Zatwierdz] [❌] │  │
│ │ 🔴 Polmaraton Lodzki      01:55:00  --    Link  (odrzucone)       │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ Anna Nowak (postep: 10/10 ✅ Ukonczone)                                │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ 🟢 Polmaraton Warszawski  01:55:30  #567  Link ✅                 │  │
│ │ ...                                                                │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

┌── Wyzwanie 5 Dych ── ⏳ 1  ✅ 3  ❌ 0 ─── [Rozwin/Zwin] ────────────┐
│ ...                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Pelny CRUD dla wyzwan (admin)

### Obecny stan
Formularz tworzenia jest minimalny - brakuje: edycji, usuwania, zarzadzania eventami i nagrodami, zmiany statusu.

### Nowe mozliwosci

**Tworzenie (rozbudowany dialog)**:
- Wszystkie pola z obecnego formularza
- Dynamiczne dodawanie/usuwanie wydarzen (nazwa + data)
- Automatyczne ladowanie wydarzen z wybranej serii
- Dynamiczne dodawanie/usuwanie nagrod (nazwa, typ, cena, rozmiary)
- Podglad slug generowany automatycznie z nazwy

**Edycja**:
- Ten sam formularz co tworzenie, wstepnie wypelniony danymi
- Przycisk "Edytuj" przy kazdym wyzwaniu na liscie

**Usuwanie**:
- AlertDialog z potwierdzeniem
- Przycisk "Usun" przy kazdym wyzwaniu

**Zmiana statusu**:
- Dropdown/Select: aktywne / nadchodzace / zakonczone
- Bezposrednio na liscie wyzwan

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/components/AdminChallengesTab.tsx` | Przebudowa weryfikacji per wyzwanie, rozbudowany CRUD (tworzenie, edycja, usuwanie, zmiana statusu) |
| `src/pages/moderator/components/ModeratorChallengesTab.tsx` | Przebudowa weryfikacji per wyzwanie (bez CRUD - tylko podglad i weryfikacja) |

## Szczegoly techniczne

### AdminChallengesTab.tsx - glowne zmiany

**Stan komponentu** - nowe zmienne:
- `editingChallenge: Challenge | null` - wyzwanie w trybie edycji
- `statusFilter: 'all' | 'pending' | 'approved' | 'rejected'` - filtr statusu zgloszen
- `expandedChallenges: Set<string>` - ktore karty sa rozwiniety
- `formData` - stan formularza (events array, rewards array)

**Zakladka "Wyzwania"** - CRUD:
- Kazde wyzwanie: wiersz z nazwa, statusem, licznikami + przyciski [Edytuj] [Usun] [Status dropdown]
- Dialog tworzenia/edycji z sekcjami:
  - Podstawowe (nazwa, slug auto-gen, opis, obrazek)
  - Powiazanie z seria + przycisk "Zaladuj biegi z serii"
  - Lista wydarzen - dynamiczne dodawanie/usuwanie wierszy (Input nazwa + Input data)
  - Regula (min biegow, opcjonalny limit czasu)
  - Nagrody - dynamiczne dodawanie/usuwanie (nazwa, typ select, cena, rozmiary input)
  - Daty (start/koniec)

**Zakladka "Weryfikacja"** - przebudowa:
- Filtr statusow na gorze (badge z licznikami)
- Collapsible Card per wyzwanie
- Wewnatrz: uczestnicy pogrupowani, kazdy z tabela swoich entries
- Kolorowe wiersze (green/yellow/red)
- Przyciski zatwierdz/odrzuc inline

### ModeratorChallengesTab.tsx - zmiany

Analogiczna przebudowa weryfikacji per wyzwanie (ta sama struktura kart), bez sekcji CRUD. Moderator widzi liste wyzwan jako read-only i moze jedynie weryfikowac zgloszenia.

### Generowanie slug

```typescript
const generateSlug = (name: string) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
```

