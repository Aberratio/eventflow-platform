
# Plan: Akcenty kolorystyczne dla miesiecy i responsywnosc listy wydarzen

## Cel
Dodanie wyrazistego akcentu kolorystycznego do naglowkow miesiecy oraz poprawa wyswietlania listy na tabletach i urzadzeniach mobilnych.

## Zmiany wizualne

### 1. Naglowki miesiecy z akcentem kolorystycznym

Obecny wyglad:
```text
┌─────────────────────────────────────────────────────────────────┐
│  Styczeń 2026                                           (5)    │  <- neutralne tlo, brak akcentu
├─────────────────────────────────────────────────────────────────┤
```

Nowy wyglad z akcentem:
```text
┌─────────────────────────────────────────────────────────────────┐
│ ▌ Styczeń 2026                                          (5)    │  <- zielony pasek po lewej + lekkie tlo accent
├─────────────────────────────────────────────────────────────────┤
```

Elementy akcentu:
- Pionowy pasek w kolorze primary po lewej stronie naglowka (border-l-3 lub border-l-4)
- Delikatne tlo w kolorze accent (`bg-accent/50` lub `bg-primary/5`)
- Badge z liczba wydarzen w kolorze primary
- Lekko wiekszy padding dla lepszej czytelnosci

### 2. Responsywnosc - tablet i mobile

**Mobile (< 640px):**
- Data w jednej linii z nazwa (kompaktowo)
- Ukrycie licznika uczestnikow (juz zaimplementowane)
- Miasto wyswietlane pod nazwa wydarzenia
- Mniejszy padding wierszy

**Tablet (640px - 1024px):**
- Pelny wyglad jak na desktop
- Lekko zmniejszone paddingi
- Wszystkie elementy widoczne

### 3. Szczegolowe zmiany UI

#### ListContainer.tsx - ListGroup:

```typescript
<div className={cn(
  'flex items-center justify-between px-4 py-2.5',
  'bg-accent/40 border-l-4 border-l-primary',  // Akcent kolorystyczny
  'border-b border-border',
  sticky && 'sticky top-0 z-10'
)}>
  <h3 className="text-sm font-semibold text-foreground capitalize">{title}</h3>
  {count !== undefined && (
    <Badge className="text-xs px-2 py-0.5 bg-primary/15 text-primary border-0">
      {count}
    </Badge>
  )}
</div>
```

#### EventListRow.tsx - poprawa responsywnosci:

```typescript
// Responsywne paddingi i ukrywanie elementow
<Link className="group flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 ...">
  
  {/* Data - mniejsza szerokosc na mobile */}
  <div className="w-12 sm:w-14 shrink-0 text-center">
    <span className="text-xs sm:text-sm font-medium">{dateDisplay}</span>
  </div>
  
  {/* Separator - cienszy na mobile */}
  <div className="w-px self-stretch bg-border/40 shrink-0" />
  
  {/* Status badge - mniejszy na mobile */}
  <Badge className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
    {statusDisplay.label}
  </Badge>
</Link>
```

## Podsumowanie zmian

| Plik | Akcja | Opis |
|------|-------|------|
| `src/components/lists/ListContainer.tsx` | Modyfikacja | Dodanie akcentu kolorystycznego do ListGroup (border-l-4, bg-accent, Badge primary) |
| `src/components/lists/EventListRow.tsx` | Modyfikacja | Poprawa responsywnosci (mniejsze paddingi/fonty na mobile, lepsze breakpointy) |

## Efekt koncowy

```text
Desktop/Tablet:
┌─────────────────────────────────────────────────────────────────┐
│ ▌ Styczeń 2026                                          [5]    │  <- zielony akcent
├─────────────────────────────────────────────────────────────────┤
│  12 sty │ Bieg Zimowy Kraków • Kraków         [Otwarte] 450 → │
│         │ 10 km, 5 km                                          │
├─────────────────────────────────────────────────────────────────┤
│  18 sty │ Cross Górski • Zakopane             [Otwarte] 890 → │
│         │ 21 km, 10 km                                         │
└─────────────────────────────────────────────────────────────────┘

Mobile:
┌───────────────────────────────────────┐
│ ▌ Styczeń 2026                   [5] │
├───────────────────────────────────────┤
│ 12 sty │ Bieg Zimowy Kraków      → │
│        │ Kraków • 10 km, 5 km       │
├───────────────────────────────────────┤
│ 18 sty │ Cross Górski            → │
│        │ Zakopane • 21 km, 10 km    │
└───────────────────────────────────────┘
```
