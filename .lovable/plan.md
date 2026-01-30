
# Plan: Poprawa strony wynikow analogicznie do strony wydarzen

## Obecny stan

Strona `/wyniki` (ResultsCalendarPage) wyswietla kalendarz wynikow zakoczonych zawodow z grupowaniem po miesiacach. Obecny wyglad uzywa Card dla kazdego wydarzenia z badge'ami dla dystansow - co jest niespojne ze zaktualizowana strona wydarzen.

## Proponowane zmiany

### 1. Nowy komponent ResultEventListRow

Analogiczny do `EventListRow`, ale dla zakoczonych wydarzen z wynikami:

```text
┌─────────────────────────────────────────────────────────────────┐
│  12 sty ▎ Polmaraton Warszawski • Warszawa  [Bieg] [3 dyst.] → │
│         │ 21 km, 10 km, 5 km                                   │
└─────────────────────────────────────────────────────────────────┘
```

Elementy:
- Data po lewej z kolorowym akcentem (border-r-2 border-primary/20)
- Nazwa wydarzenia + miasto
- Badge z dyscyplina
- Ilosc dystansow lub lista dystansow inline
- Strzalka do przejscia do wynikow

### 2. Filtry wynikow (ResultsFiltersSidebar)

Nowy komponent analogiczny do `EventFiltersSidebar`:

**Desktop**: Sidebar po lewej (hidden lg:flex)
**Mobile/Tablet**: Drawer z przyciskiem w naglowku

Filtry:
- Wyszukiwarka (po nazwie wydarzenia lub miescie)
- Dyscyplina (bieg, kolarstwo, triathlon, multisport)
- Miasto
- Dystans (przedzialy: do 5km, 5-10km, 10-21km, 21-42km, 42+km)
- Seria

### 3. Struktura strony

```text
Desktop:
┌──────────────────────────────────────────────────────────────────────┐
│ [Sidebar Filtry]  │  Kalendarz wynikow                               │
│                   │  Przegladaj wyniki zakoczonych zawodow           │
│                   ├──────────────────────────────────────────────────│
│                   │  [2025] [2026] [2027]                            │
│                   ├──────────────────────────────────────────────────│
│                   │  ▌ Styczen 2026                            [5]   │
│                   ├──────────────────────────────────────────────────│
│                   │  12 sty ▎ Polmaraton Warszawski • Warszawa  →   │
│                   │         │ 21 km, 10 km                          │
│                   ├──────────────────────────────────────────────────│
│                   │  18 sty ▎ Cross Gorski • Zakopane           →   │
│                   │         │ 15 km, 7 km                           │
└──────────────────────────────────────────────────────────────────────┘

Mobile/Tablet:
┌─────────────────────────────────────┐
│ Kalendarz wynikow     [Filtry]     │
│ Przegladaj wyniki zakoczonych      │
├─────────────────────────────────────┤
│ [2025] [2026] [2027]               │
├─────────────────────────────────────┤
│ ▌ Styczen 2026                 [5] │
├─────────────────────────────────────┤
│ 12 sty ▎ Polmaraton Warsz.     →  │
│         Warszawa • 21 km, 10 km    │
└─────────────────────────────────────┘
```

### 4. Hook useResultsFilters

Analogiczny do `useEventFilters`:

```typescript
interface ResultsFiltersState {
  search: string;
  disciplines: SportDiscipline[];
  cities: string[];
  distanceRanges: string[];
  seriesId: string | null;
  selectedYear: number;
}
```

Z zapisem do localStorage (klucz 'results-page-filters').

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/components/lists/ResultEventListRow.tsx` | Nowy | Kompaktowy wiersz wydarzenia z wynikami (analogiczny do EventListRow) |
| `src/components/filters/ResultsFiltersSidebar.tsx` | Nowy | Filtry dla strony wynikow (sidebar + drawer) |
| `src/hooks/useResultsFilters.ts` | Nowy | Hook do zarzadzania filtrami wynikow |
| `src/pages/ResultsCalendarPage.tsx` | Modyfikacja | Integracja nowych komponentow, layout z sidebar |
| `src/components/lists/index.ts` | Modyfikacja | Eksport nowego ResultEventListRow |

## Szczegoly techniczne

### ResultEventListRow.tsx

```typescript
interface ResultEventListRowProps {
  event: Event;
}

export const ResultEventListRow = ({ event }: ResultEventListRowProps) => {
  const dateDisplay = format(new Date(event.date), 'd MMM', { locale: pl });
  const distancesText = event.distances.map(d => d.name).join(', ');
  
  return (
    <Link 
      to={`/events/${event.slug}?tab=results`}
      className="group flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
    >
      {/* Data z kolorowym akcentem */}
      <div className="w-12 sm:w-14 shrink-0 text-center pt-0.5 pr-2 sm:pr-3 border-r-2 border-primary/20">
        <span className="text-xs sm:text-sm font-medium text-foreground">{dateDisplay}</span>
      </div>
      
      {/* Tresc */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
            {event.name}
          </span>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">{event.city}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          <span className="sm:hidden">{event.city} • </span>
          <span className="truncate">{distancesText}</span>
        </div>
      </div>
      
      {/* Badge dyscypliny + strzalka */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
          <Trophy className="h-2 sm:h-2.5 w-2 sm:w-2.5 mr-0.5" />
          Wyniki
        </Badge>
        <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
      </div>
    </Link>
  );
};
```

### ResultsFiltersSidebar.tsx

Struktura analogiczna do EventFiltersSidebar:
- `ResultsFiltersSidebar` - sidebar na desktop
- `ResultsFiltersDrawerTrigger` - drawer na mobile/tablet

Filtry:
- Wyszukiwarka
- Dyscyplina (checkboxy)
- Miasto (checkboxy)
- Dystans (przedzialy jak w EventFiltersSidebar)
- Seria (checkboxy)

### useResultsFilters.ts

```typescript
const STORAGE_KEY = 'results-page-filters';

interface ResultsFiltersState {
  search: string;
  disciplines: SportDiscipline[];
  cities: string[];
  distanceRanges: string[];
  seriesId: string | null;
  selectedYear: number;
}
```

### ResultsCalendarPage.tsx - zmiany

1. Import i uzycie useResultsFilters
2. Layout z flex i overflow-x-hidden (analogicznie do EventsPage)
3. ResultsFiltersSidebar na desktop
4. Przycisk filtrow w naglowku na mobile
5. Uzycie ListContainer i ListGroup z akcentami kolorystycznymi
6. Uzycie ResultEventListRow zamiast Card

## Wyglad koncowy

```text
Desktop:
┌──────────────────────────────────────────────────────────────────────┐
│ [Filtry         ]  │  Kalendarz wynikow                              │
│ [Wyszukaj...   ]  │  Przegladaj wyniki zakoczonych zawodow          │
│                    │                                                  │
│ Dyscyplina         │  [◀ 2025]  [2026]  [2027 ▶]                     │
│ ☐ Bieg             │                                                  │
│ ☐ Kolarstwo        │  ▌ Styczen 2026                            [5]  │
│ ☐ Triathlon        │  ─────────────────────────────────────────────  │
│                    │  12 sty ▎ Polmaraton Warszawski • Warsz.   →   │
│ Miasto             │         │ 21 km, 10 km                         │
│ ☐ Warszawa         │  ─────────────────────────────────────────────  │
│ ☐ Krakow           │  18 sty ▎ Cross Gorski • Zakopane          →   │
│ ☐ Gdansk           │         │ 15 km, 7 km                          │
│                    │                                                  │
│ Dystans            │  ▌ Luty 2026                               [3]  │
│ ☐ do 5 km          │  ─────────────────────────────────────────────  │
│ ☐ 5-10 km          │  ...                                            │
│ ☐ 10-21 km         │                                                  │
└──────────────────────────────────────────────────────────────────────┘
```
