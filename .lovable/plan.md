
# Plan: Naprawa poziomego scrollowania i poprawa wizualna listy wydarzeń

## Zidentyfikowane problemy

### 1. Poziomy scroll na tablet/mobile
- Button filtrów (`lg:hidden`) jest w osobnym div, który nie jest zintegrowany z głównym layoutem strony
- Na mniejszych ekranach elementy w `EventListRow` mogą przekraczać szerokość kontenera
- Brak `overflow-x-hidden` na głównym kontenerze

### 2. Szary separator (border) przy mieście
- Pionowy separator `w-px self-stretch bg-border/40` pomiędzy datą a treścią wygląda "biednie"
- Użytkownik chce bardziej estetycznego rozwiązania

## Proponowane zmiany

### 1. EventsPage.tsx - Integracja przycisku filtrów

**Obecny układ:**
```
<Layout>
  <div flex>
    <EventFiltersSidebar /> ← zawiera osobny div z przyciskiem
    <div main-content>
      <header>
      <year-nav>
      <list>
    </div>
  </div>
</Layout>
```

**Nowy układ:**
```
<Layout>
  <div flex overflow-x-hidden>
    <EventFiltersSidebar /> ← tylko desktop sidebar + Drawer (bez trigger)
    <div main-content overflow-hidden>
      <header + filter button inline> ← przycisk w nagłówku na mobile
      <year-nav>
      <list>
    </div>
  </div>
</Layout>
```

Zmiana: Przycisk filtrów zostanie przeniesiony do nagłówka strony (obok "Wydarzenia sportowe") na mobile/tablet, co pozwoli lepiej kontrolować szerokość.

### 2. EventFiltersSidebar.tsx - Rozdzielenie triggera od Drawera

Obecnie komponent zawiera zarówno sidebar, trigger button jak i drawer. Propozycja:
- Eksport osobnego `FilterDrawerTrigger` i `FilterDrawer` lub
- Przekazanie triggera jako prop, aby można go było umieścić w dowolnym miejscu

### 3. EventListRow.tsx - Poprawa separatora i responsywności

**Obecny separator:**
```tsx
<div className="w-px self-stretch bg-border/40 shrink-0" />
```

**Propozycja 1: Subtelny gradient zamiast szarej linii**
```tsx
<div className="w-0.5 self-stretch bg-gradient-to-b from-transparent via-primary/20 to-transparent shrink-0" />
```

**Propozycja 2: Usunięcie separatora, dodanie akcentu w kolumnie daty**
```tsx
{/* Data z akcentem kolorystycznym */}
<div className="w-12 sm:w-14 shrink-0 text-center py-0.5 border-r-2 border-primary/30">
  <span className="text-xs sm:text-sm font-medium">{dateDisplay}</span>
</div>
```

**Propozycja 3 (Minimalistyczna): Usunięcie separatora całkowicie**
```tsx
{/* Data bez separatora - wykorzystanie większego gap */}
<div className="w-12 sm:w-14 shrink-0 text-center pt-0.5">
  <span className="text-xs sm:text-sm font-medium text-primary/80">{dateDisplay}</span>
</div>
{/* Brak separatora, treść zaczyna się bezpośrednio */}
```

Rekomendacja: **Propozycja 2** - subtelny kolorowy border na kolumnie daty zamiast szarej linii, co pasuje do akcentu kolorystycznego w nagłówkach miesięcy.

### 4. Dodanie overflow-hidden do kontenerów

```tsx
// EventsPage.tsx
<div className="flex min-h-[calc(100vh-4rem)] overflow-x-hidden">

// Main content
<div className="flex-1 py-8 px-4 lg:px-8 min-w-0 overflow-hidden">
```

## Szczegółowe zmiany w plikach

### EventsPage.tsx

```tsx
// Zmiana 1: overflow-x-hidden na głównym kontenerze
<div className="flex min-h-[calc(100vh-4rem)] overflow-x-hidden">

// Zmiana 2: min-w-0 i overflow-hidden na main content
<div className="flex-1 py-8 px-4 lg:px-8 min-w-0 overflow-hidden">

// Zmiana 3: Przycisk filtrów w nagłówku na mobile
<div className="mb-6">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Wydarzenia sportowe</h1>
      <p className="text-muted-foreground text-sm lg:text-base">
        Znajdź idealne zawody dla siebie
      </p>
    </div>
    {/* Filter button - mobile/tablet only */}
    <div className="lg:hidden shrink-0">
      <FilterDrawerTrigger ... />
    </div>
  </div>
</div>
```

### EventFiltersSidebar.tsx

```tsx
// Eksport DrawerTriggera jako osobny komponent lub prop
// Usunięcie div lg:hidden z pełną szerokością

// Opcja 1: Przekazanie children jako trigger
interface EventFiltersSidebarProps {
  // ... existing props
  renderTrigger?: (props: { activeFiltersCount: number }) => React.ReactNode;
}

// Opcja 2: Eksport osobnego komponentu
export const EventFiltersDrawerTrigger = ({ ... }) => (
  <DrawerTrigger asChild>
    <Button variant="outline" size="sm" className="shrink-0">
      <SlidersHorizontal className="h-4 w-4 mr-2" />
      Filtry
      {activeFiltersCount > 0 && (
        <span className="ml-2 text-xs bg-primary ...">
          {activeFiltersCount}
        </span>
      )}
    </Button>
  </DrawerTrigger>
);
```

### EventListRow.tsx

```tsx
// Zmiana separatora na kolorowy akcent przy dacie
<Link className="group flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 ...">
  {/* Data z kolorowym akcentem po prawej stronie */}
  <div className="w-12 sm:w-14 shrink-0 text-center pt-0.5 pr-2 sm:pr-3 border-r-2 border-primary/20">
    <span className="text-xs sm:text-sm font-medium text-foreground">{dateDisplay}</span>
  </div>
  
  {/* USUNIĘTY: stary szary separator */}
  {/* <div className="w-px self-stretch bg-border/40 shrink-0" /> */}
  
  {/* Main content - bez zmian */}
  <div className="flex-1 min-w-0">
    ...
  </div>
</Link>
```

## Podsumowanie zmian

| Plik | Zmiana | Cel |
|------|--------|-----|
| `EventsPage.tsx` | Dodanie `overflow-x-hidden`, `min-w-0`, przeniesienie przycisku filtrów do nagłówka | Eliminacja poziomego scrollowania |
| `EventFiltersSidebar.tsx` | Refaktor triggera drawera, usunięcie `w-full` | Lepsza kontrola szerokości przycisku |
| `EventListRow.tsx` | Zamiana szarego separatora na kolorowy border przy kolumnie daty | Poprawa estetyki |

## Efekt końcowy

**Desktop (bez zmian):**
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Sidebar Filtry]  │  Wydarzenia sportowe                             │
│                   │  Znajdź idealne zawody dla siebie                │
│                   ├──────────────────────────────────────────────────│
│                   │  ▌ Styczeń 2026                            [5]   │
│                   ├──────────────────────────────────────────────────│
│                   │  12 sty ▎ Bieg Zimowy • Kraków     [Otwarte] →  │
└──────────────────────────────────────────────────────────────────────┘
```

**Tablet/Mobile (poprawiony):**
```
┌─────────────────────────────────────┐
│ Wydarzenia sportowe    [🔧 Filtry] │  ← przycisk w nagłówku
│ Znajdź idealne zawody              │
├─────────────────────────────────────┤
│ ▌ Styczeń 2026                 [5] │
├─────────────────────────────────────┤
│ 12 sty ▎ Bieg Zimowy           →  │  ← kolorowy akcent zamiast szarego
│         Kraków • 10 km            │
├─────────────────────────────────────┤
│ 18 sty ▎ Cross Górski          →  │
│         Zakopane • 21 km          │
└─────────────────────────────────────┘
(bez poziomego scrollowania)
```
