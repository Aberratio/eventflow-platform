

# Plan: Wyzwania (Challenges) - produkty warunkowe

## Opis funkcjonalnosci

System "Wyzwan" pozwala adminom/moderatorom definiowac zestawy zawodow do ukonczenia (np. "Korona Polmaratonow - ukonicz 10 z 20 polmaratonow"), a uczestnicy sami zglaszaja swoje udzialy z dowodami (czas, miejsce, link do wynikow). Admini/moderatorzy weryfikuja zgloszenia i przyznaja nagrody (platne produkty lub darmowe certyfikaty).

## Architektura danych

### Nowe typy w `src/types/index.ts`

```typescript
// Status weryfikacji pojedynczego biegu w wyzwaniu
export type ChallengeEntryStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

// Regula wyzwania
export interface ChallengeRule {
  minCompleted: number;        // Ile biegow trzeba ukonczyc (np. 10)
  maxTime?: string;            // Opcjonalny limit czasu na kazdy bieg
}

// Nagroda za ukonczenie wyzwania
export interface ChallengeReward {
  id: string;
  name: string;               // np. "Medal Korony", "Dyplom"
  type: 'product' | 'free';   // platny produkt lub darmowa nagroda
  productId?: string;          // ID produktu ze sklepu (jesli type=product)
  price?: number;              // Cena (jesli type=product)
  sizes?: string[];            // Rozmiary (jesli fizyczny)
  description?: string;
}

// Wydarzenie w ramach wyzwania
export interface ChallengeEvent {
  eventId: string;
  eventName: string;
  eventDate: string;
}

// Definicja wyzwania (tworzona przez admina/moderatora)
export interface Challenge {
  id: string;
  name: string;                // np. "Korona Polmaratonow 2026"
  slug: string;
  description: string;
  imageUrl?: string;
  seriesId?: string;           // Opcjonalne powiazanie z seria
  events: ChallengeEvent[];    // Lista wydarzen do zaliczenia
  rule: ChallengeRule;
  rewards: ChallengeReward[];
  status: 'active' | 'completed' | 'upcoming';
  startDate?: string;
  endDate?: string;
  createdBy: string;
}

// Zgloszenie uczestnika do biegu w wyzwaniu
export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  eventId: string;
  status: ChallengeEntryStatus;
  submittedTime?: string;      // HH:MM:SS
  submittedPosition?: number;
  proofUrl?: string;           // Link do wynikow/Stravy
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Uczestnictwo gracza w wyzwaniu
export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  joinedAt: string;
  entries: ChallengeEntry[];
  completedCount: number;       // Ile zatwierdzonych
  isCompleted: boolean;         // Czy spelnil warunki
  rewardGranted: boolean;       // Czy nagroda przyznana
  rewardGrantedAt?: string;
  selectedRewards?: Array<{     // Wybrane nagrody
    rewardId: string;
    size?: string;
  }>;
  assignedNumber?: number;      // Nr nadania (jak "Nr Korony" ze screena)
}
```

## Nowe pliki

| Plik | Opis |
|------|------|
| `src/pages/ChallengesListPage.tsx` | Publiczna lista dostepnych wyzwan |
| `src/pages/ChallengeDetailsPage.tsx` | Strona szczegolowa wyzwania - lista biegow, postep, zglaszanie wynikow |
| `src/pages/participant/components/ParticipantChallengesTab.tsx` | Zakladka "Wyzwania" w panelu uczestnika |
| `src/pages/admin/components/AdminChallengesTab.tsx` | Zarzadzanie wyzwaniami (tworzenie, edycja, weryfikacja) |
| `src/pages/moderator/components/ModeratorChallengesTab.tsx` | Weryfikacja zgloszen (uproszczony widok admina) |

## Modyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `src/types/index.ts` | Nowe typy (powyzej) |
| `src/data/mockData.ts` | Mock danych: 2 wyzwania, uczestnictwa, zgloszenia |
| `src/App.tsx` | Trasy: `/challenges`, `/challenges/:slug` |
| `src/components/layout/Header.tsx` | Link "Wyzwania" w nawigacji |
| `src/pages/admin/AdminDashboard.tsx` | Nowa zakladka "Wyzwania" |
| `src/pages/moderator/ModeratorDashboard.tsx` | Nowa zakladka "Wyzwania" |
| `src/pages/participant/ParticipantDashboard.tsx` | Nowa zakladka "Wyzwania" |

## UI - widok uczestnika (ChallengeDetailsPage)

Inspiracja ze screenow - tabela z kolorami statusow:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Wyzwania                                                             │
│                                                                         │
│ Korona Polmaratonow 2026                                               │
│ Ukonicz 10 z 20 polmaratonow                                          │
│                                                                         │
│ Twoj postep: ████████░░ 8/10                    [Dolacz do wyzwania]   │
│                                                                         │
│ Nagrody: 🏅 Medal Korony (45 zl) | 📜 Dyplom (darmowy)               │
│                                                                         │
│ ┌─ Lista biegow ───────────────────────────────────────────────────┐   │
│ │ 🟢 Polmaraton Warszawski   2026-03-25  ✅  02:29:43  Miejsce 567│   │
│ │ 🟢 Polmaraton Krakowski    2026-04-15  ✅  02:38:01  Miejsce 399│   │
│ │ 🟡 Polmaraton Gdanski      2026-05-10  ⏳  02:36:47  Miejsce 900│   │
│ │ 🔴 Polmaraton Poznanski    2026-06-20  ☐   [Zglos wynik]        │   │
│ │ 🔴 Polmaraton Wroclawski   2026-07-15  ☐   [Zglos wynik]        │   │
│ │ ...                                                               │   │
│ └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

Kolory wierszy (jak na screenach):
- **Zielony** (`bg-green-50`): zatwierdzony przez admina/moderatora
- **Zolty** (`bg-yellow-50`): zgloszony, oczekuje na weryfikacje
- **Czerwony/rozowy** (`bg-red-50`): niezgloszony lub odrzucony

## UI - panel admina/moderatora (weryfikacja)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Weryfikacja zgloszen - Korona Polmaratonow 2026                        │
│                                                                         │
│ Oczekujace: 12    Zatwierdzone: 45    Odrzucone: 3                    │
│                                                                         │
│ ┌─ Uczestnik: Jan Kowalski ─────────────────────────────────────────┐ │
│ │ Postep: 8/10  |  Status: W trakcie                                │ │
│ │                                                                     │ │
│ │ 🟢 Polmaraton Warszawski  ✅ 02:29:43  #567                       │ │
│ │ 🟡 Polmaraton Gdanski     ⏳ 02:36:47  #900  [✅ Zatwierdz] [❌] │ │
│ │ 🔴 Polmaraton Poznanski   ☐  --                                    │ │
│ │                                                                     │ │
│ │ ☐ Nagroda przyznana   Nr nadania: [___]                            │ │
│ │ [Zapisz]                                                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## UI - tworzenie wyzwania (admin)

Dialog/formularz z polami:
- Nazwa, opis, slug
- Powiazanie z seria (opcjonalne - Select z lista serii)
- Lista wydarzen (reczny wybor z checkboxami LUB automatycznie z serii)
- Regula: ile biegow minimum do zaliczenia
- Nagrody: dodawanie nagrod (typ, nazwa, cena, rozmiary)
- Daty: start/koniec wyzwania

## Mock data

Dwa przykladowe wyzwania:

1. **Korona Polmaratonow 2026** - powiazana z seria, 20 biegow, zalicz 10, nagrody: medal (45 zl) + dyplom (darmowy)
2. **Wyzwanie 5 Dych** - niezalezne, 8 biegow 10km, zalicz 5, nagroda: koszulka okolicznosciowa (35 zl)

Mock uczestnictwa z roznymi statusami (zatwierdzony, oczekujacy, niezgloszony) dla demonstracji kolorow.

## Nawigacja

- Header: nowy link "Wyzwania" w glownej nawigacji (obok "Zawodnicy")
- Panel uczestnika: nowa zakladka z ikona Trophy
- Panel admina: nowa zakladka "Wyzwania" z ikona Award
- Panel moderatora: nowa zakladka "Wyzwania" z ikona Award

## Kolejnosc implementacji

1. Typy w `types/index.ts`
2. Mock data w `mockData.ts`
3. `ChallengesListPage.tsx` - publiczna lista wyzwan
4. `ChallengeDetailsPage.tsx` - strona szczegolowa z tabela biegow i zglaszaniem
5. `ParticipantChallengesTab.tsx` - zakladka w panelu uczestnika
6. `AdminChallengesTab.tsx` - tworzenie wyzwan + weryfikacja zgloszen
7. `ModeratorChallengesTab.tsx` - weryfikacja zgloszen (read-only tworzenie)
8. Routing w `App.tsx` i linki w `Header.tsx`
9. Zakladki w dashboardach (Admin, Moderator, Participant)

