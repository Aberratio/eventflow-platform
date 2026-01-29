
# Plan: Poprawa wyglądu listy wydarzeń na stronie /wydarzenia

## Cel
Przekształcenie listy wydarzeń w bardziej kompaktowy, zgrabny i czytelny format. Zmniejszenie wizualnego "ciężaru" każdego wiersza przy zachowaniu wszystkich istotnych informacji.

## Obecne problemy

1. **EventListRow** - każdy wiersz ma dużo paddingu (`p-4`), oddzielną ramkę i efekt uniesienia (`hover:-translate-y-0.5`)
2. **ListGroup** - nagłówki miesięcy są zbyt małe i mało wyraziste (uppercase, text-xs)
3. **Dystanse** - wyświetlane jako osobne badge'e zajmują dużo miejsca w pionie
4. **Brak wizualnej hierarchii** - wszystkie elementy mają podobną wagę wizualną

## Proponowane zmiany

### 1. Kompaktowy EventListRow

```text
PRZED (aktualny):
┌─────────────────────────────────────────────────────────────────┐
│  Bieg Górski Tatry 2026                      [Wirtualny]       │
│  📅 15 cze 2026  📍 Zakopane                                   │
│  [Ultra 80K] [Trasa 40K] [Trasa 21K]                          │
│                            [Zapisy otwarte] 1,234 / 2,000  →  │
└─────────────────────────────────────────────────────────────────┘
(każdy wiersz z border, border-radius, shadow on hover)

PO (nowy):
┌─────────────────────────────────────────────────────────────────┐
│  15 cze │ Bieg Górski Tatry 2026 • Zakopane    [Zapisy] 1,234→│
│         │ Ultra 80K, Trasa 40K, Trasa 21K                       │
└─────────────────────────────────────────────────────────────────┘
(wiersze w ramach miesiąca połączone, tylko border-b)
```

### 2. Wyraziste nagłówki miesięcy

```text
PRZED:                              PO:
STYCZEŃ 2026                        Styczeń 2026 (3)
(uppercase, text-xs, bg-muted)      (Capitalized, text-base, sticky header)
```

### 3. Struktura wizualna

```text
┌─────────────────────────────────────────────────────────────────┐
│  Styczeń 2026                                           (5)    │
├─────────────────────────────────────────────────────────────────┤
│  12 sty │ Bieg Zimowy Kraków • Kraków         [Otwarte] 450 → │
│         │ 10 km, 5 km                                          │
├─────────────────────────────────────────────────────────────────┤
│  18 sty │ Cross Górski Zakopane • Zakopane    [Otwarte] 890 → │
│         │ 21 km, 10 km                                         │
├─────────────────────────────────────────────────────────────────┤
│  25 sty │ Maraton Zimowy • Gdańsk             [Zamkn.]  1.2k → │
│         │ 42 km, 21 km                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Luty 2026                                              (8)    │
├─────────────────────────────────────────────────────────────────┤
...
```

## Zmiany w plikach

### 1. `src/components/lists/EventListRow.tsx`

**Kluczowe zmiany:**
- Zmniejszenie paddingu z `p-4` na `px-3 py-2.5`
- Usunięcie `border`, `rounded-lg`, `hover:-translate-y-0.5`
- Dodanie `border-b` jako separatora
- Przeniesienie daty na lewą stronę jako wydzielona kolumna
- Dystanse jako inline text (przecinkami) zamiast badge'ów
- Uproszczenie layoutu dla mobile
- Delikatniejszy hover (`hover:bg-muted/30`)

### 2. `src/components/lists/ListContainer.tsx`

**Kluczowe zmiany w ListGroup:**
- Zmiana nagłówka z uppercase text-xs na capitalized text-sm/base
- Dodanie licznika wydarzeń jako Badge
- Opcjonalny sticky header dla lepszej nawigacji
- Lekkie tło dla separacji wizualnej

### 3. `src/pages/EventsPage.tsx`

**Kluczowe zmiany:**
- Zmniejszenie space-y między grupami miesięcy
- Usunięcie zewnętrznej ramki Card (wiersze same tworzą strukturę)
- Dodanie scroll-margin dla nagłówków miesięcy

## Szczegóły techniczne

### EventListRow - nowy layout

```typescript
// Kompaktowy wiersz z datą po lewej
<Link className="group flex items-start gap-3 px-3 py-2.5 border-b hover:bg-muted/30 transition-colors">
  {/* Data - stała szerokość */}
  <div className="w-14 shrink-0 text-center pt-0.5">
    <span className="text-sm font-medium">{format(date, 'd MMM', { locale: pl })}</span>
  </div>
  
  {/* Separator */}
  <div className="w-px h-10 bg-border/50 shrink-0" />
  
  {/* Treść */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-medium truncate">{event.name}</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground text-sm">{event.city}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-0.5">
      {event.distances.map(d => d.name).join(', ')}
    </p>
  </div>
  
  {/* Status + licznik */}
  <div className="flex items-center gap-2 shrink-0">
    <Badge variant="..." className="text-xs px-1.5 py-0">{status}</Badge>
    <span className="text-xs text-muted-foreground">{count}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </div>
</Link>
```

### ListGroup - wyrazisty nagłówek

```typescript
<div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-background border-b">
  <h3 className="text-sm font-semibold capitalize">{title}</h3>
  <Badge variant="secondary" className="text-xs">{count}</Badge>
</div>
```

## Podsumowanie zmian

| Plik | Akcja | Opis |
|------|-------|------|
| `src/components/lists/EventListRow.tsx` | Modyfikacja | Kompaktowy layout z datą po lewej, dystanse inline, mniejsze paddingi |
| `src/components/lists/ListContainer.tsx` | Modyfikacja | Wyrazistsze nagłówki grup z licznikiem, sticky headers |
| `src/pages/EventsPage.tsx` | Modyfikacja | Dostosowanie struktury do nowego kompaktowego stylu |
