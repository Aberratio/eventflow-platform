

# Plan: Strona /organizer/events + edycja kodow rabatowych

## 1. Nowa trasa /organizer/events

Obecnie brakuje trasy `/organizer/events` w routerze. Uzytkownik trafia na 404.

### Rozwiazanie

Dodanie trasy w `App.tsx` ktora renderuje dedykowana strone z lista wydarzen organizatora - podobna do zakladki "Moje wydarzenia" w dashboardzie, ale jako osobna strona.

### Nowa strona: `src/pages/organizer/OrganizerEventsPage.tsx`

Strona wyswietli:
- Naglowek "Moje wydarzenia" z przyciskiem "Nowe wydarzenie"
- Filtry statusu (Wszystkie / Aktywne / Szkice / Zakonczone)
- Lista wydarzen z ikonami dyscyplin, datami, liczbami uczestnikow, statusami
- Przycisk "Zarzadzaj" prowadzacy do `/organizer/events/:id`

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Powrot do panelu                                                          │
│                                                                             │
│ Moje wydarzenia                                    [+ Nowe wydarzenie]     │
│                                                                             │
│ [Wszystkie] [Aktywne] [Szkice] [Zakonczone]                                │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 🏃 Maraton Warszawski                                                   ││
│ │    Warszawa • 15 wrz 2026 • 450 uczestnikow            Aktywne [Zarzadzaj]│
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ 🚴 Wyscig Kolarski                                                      ││
│ │    Krakow • 20 paz 2026 • 120 uczestnikow              Szkic  [Zarzadzaj]│
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Edycja istniejacych kodow rabatowych

Obecnie `DiscountCodesEditor` pozwala tylko dodawac, usuwac i przelaczac aktywnosc kodow. Brakuje mozliwosci edycji wartosci znizki, dat waznosci i limitu uzyc.

### Rozwiazanie

Dodanie przycisku "Edytuj" (ikona olowka) w wierszu tabeli, otwierajacego dialog edycji z pre-wypelnionymi danymi kodu.

### Zmiany w `DiscountCodesEditor.tsx`

- Nowy state: `editDialogOpen`, `editingCode`
- Przycisk edycji w kolumnie "Akcje" (ikona `Pencil`)
- Dialog edycji z polami: typ znizki, wartosc, daty waznosci, limit uzyc, dystanse
- Kod (nazwa) jest tylko do odczytu w trybie edycji
- Handler `handleEditCode` aktualizujacy kod w liscie

```text
Kolumna Akcje (nowy uklad):
[👁 Uzycia] [✏️ Edytuj] [🔄 Wl/Wyl] [🗑️ Usun]
```

Dialog edycji:
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Edytuj kod rabatowy: ULTRA2026                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Typ znizki:    [Procentowa ▼]     Wartosc: [15]                            │
│                                                                             │
│ Wazny od:      [2026-01-01]       Wazny do: [2026-03-31]                   │
│                                                                             │
│ Limit uzyc:    [100]                                                        │
│                                                                             │
│ Dystanse:      [Ultra 80km] [Marathon 42km]                                │
│                                                                             │
│                              [Anuluj] [Zapisz zmiany]                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pliki do modyfikacji/utworzenia

| Plik | Akcja | Opis |
|------|-------|------|
| `src/pages/organizer/OrganizerEventsPage.tsx` | Nowy | Dedykowana strona listy wydarzen organizatora z filtrami statusu |
| `src/App.tsx` | Modyfikacja | Dodanie trasy `/organizer/events` |
| `src/pages/admin/components/DiscountCodesEditor.tsx` | Modyfikacja | Dodanie dialogu edycji kodu (wartosci, dat, limitu) |

## Szczegoly techniczne

### OrganizerEventsPage - filtry statusu

```typescript
type StatusFilter = 'all' | 'published' | 'draft' | 'completed';
const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

const filteredEvents = myEvents.filter(e => {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'completed') return e.status === 'completed';
  if (statusFilter === 'draft') return ['draft', 'awaiting_approval'].includes(e.status);
  return e.status === 'published';
});
```

### DiscountCodesEditor - edycja

```typescript
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingCode, setEditingCode] = useState<Partial<DiscountCode> & { id: string } | null>(null);

const handleStartEdit = (code: DiscountCode) => {
  setEditingCode({
    ...code,
    validFrom: code.validFrom || '',
    validTo: code.validTo || '',
  });
  setEditDialogOpen(true);
};

const handleSaveEdit = () => {
  if (!editingCode) return;
  const updated = discountCodes.map(dc =>
    dc.id === editingCode.id
      ? {
          ...dc,
          discountType: editingCode.discountType || dc.discountType,
          discountValue: editingCode.discountValue ?? dc.discountValue,
          validFrom: editingCode.validFrom || undefined,
          validTo: editingCode.validTo || undefined,
          maxUses: editingCode.maxUses || undefined,
          distanceIds: editingCode.distanceIds,
        }
      : dc
  );
  onChange(updated);
  setEditDialogOpen(false);
  toast.success('Kod rabatowy zaktualizowany');
};
```
