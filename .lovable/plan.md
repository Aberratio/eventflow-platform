

# Plan: Kody rabatowe per wydarzenie - dostep dla organizatorow, adminow i moderatorow

## Stan obecny

System kodow rabatowych juz istnieje i zawiera:
- Typ `DiscountCode` z polami: code, discountType (percent/fixed), discountValue, validFrom/To, maxUses, usedCount, distanceIds, active
- Komponent `DiscountCodesEditor` (dodawanie, usuwanie, kopiowanie, toggle aktywnosci)
- Walidacja kodow przy rejestracji (`validateDiscountCode`)
- Mockowe kody rabatowe dla kilku wydarzen

**Czego brakuje:**
- Sledzenie **kto** uzywal kodu (obecnie tylko `usedCount`, bez listy uzytkownikow)
- Dostep do edytora dla **organizatorow** i **moderatorow** (obecnie tylko admin)
- Widok szczegolowy uzycia kodu (dialog "kto skorzystal")

---

## Zmiany do wprowadzenia

### 1. Rozszerzenie typu DiscountCode

Dodanie pola `usedBy` z lista uzytkownikow, ktorzy skorzystali z kodu:

```typescript
export interface DiscountCodeUsage {
  userId: string;
  userName: string;
  usedAt: string;        // ISO date
  registrationId: string;
  distanceName: string;
}

export interface DiscountCode {
  // ... istniejace pola ...
  usedBy?: DiscountCodeUsage[];  // nowe pole
}
```

### 2. Rozbudowa DiscountCodesEditor

Dodanie przycisku "Szczegoly uzycia" przy kazdym kodzie, otwierajacego dialog z lista uzytkownikow:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Kod       │ Znizka │ Waznosc        │ Uzycia   │ Status   │ Akcje         │
├───────────┼────────┼────────────────┼──────────┼──────────┼───────────────│
│ ULTRA2026 │  15%   │ sty - mar 2026 │ 23 / 100 │ Aktywny  │ [👁] [⚙] [🗑] │
│ KLUB50    │  50 zl │ sty - cze 2026 │ 87 / 200 │ Aktywny  │ [👁] [⚙] [🗑] │
└─────────────────────────────────────────────────────────────────────────────┘

Dialog po kliknieciu [👁]:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Uzycia kodu ULTRA2026 (23 z 100)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Uzytkownik          │ Dystans        │ Data uzycia        │                │
│ Jan Kowalski        │ Ultra 80km     │ 15 sty 2026        │                │
│ Anna Nowak          │ Marathon 42km  │ 18 sty 2026        │                │
│ Piotr Wisniewski    │ Ultra 80km     │ 22 sty 2026        │                │
│ ...                 │ ...            │ ...                 │                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Dodanie edytora do panelu organizatora

W `EventManage.tsx` dodanie nowej zakladki "Kody rabatowe" (lub dodanie do istniejacych "Ustawien"):

```text
[Przeglad] [Uczestnicy] [Wyniki] [Kody rabatowe] [Ustawienia]
```

### 4. Dodanie widoku dla moderatora

Moderator widzi kody rabatowe w trybie tylko do odczytu (moze podejrzec uzycia, ale nie moze edytowac). Albo - jesli wolisz - z pelnym dostepem do edycji. Wedlug planu: moderator rowniez moze konfigurowac kody.

---

## Pliki do modyfikacji/utworzenia

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie `DiscountCodeUsage`, pole `usedBy` w `DiscountCode` |
| `src/data/mockData.ts` | Modyfikacja | Dodanie mockowych danych `usedBy` do istniejacych kodow |
| `src/pages/admin/components/DiscountCodesEditor.tsx` | Modyfikacja | Dodanie dialogu "kto skorzystal" |
| `src/pages/organizer/EventManage.tsx` | Modyfikacja | Dodanie zakladki z kodami rabatowymi |
| `src/pages/moderator/ModeratorDashboard.tsx` | Modyfikacja | Dodanie widoku kodow rabatowych per wydarzenie |

---

## Mockowe dane usedBy

```typescript
// Dla kodu ULTRA2026 (e11 Tatry Ultra)
usedBy: [
  { userId: 'u2', userName: 'Anna Biegaczka', usedAt: '2026-01-15T10:30:00Z', registrationId: 'r4', distanceName: 'Ultra 80km' },
  { userId: 'u5', userName: 'Piotr Wisniewski', usedAt: '2026-01-18T14:20:00Z', registrationId: 'r7', distanceName: 'Marathon 42km' },
  // ... wiecej przykladow
]
```

## Szczegoly techniczne

### Dialog uzycia kodu

Nowy komponent wewnatrz `DiscountCodesEditor`:

```tsx
const [usageDialogOpen, setUsageDialogOpen] = useState(false);
const [selectedCodeForUsage, setSelectedCodeForUsage] = useState<DiscountCode | null>(null);

// Przycisk w wierszu tabeli:
<Button variant="ghost" size="icon" onClick={() => { setSelectedCodeForUsage(code); setUsageDialogOpen(true); }}>
  <Eye className="h-4 w-4" />
</Button>

// Dialog:
<Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Uzycia kodu {selectedCodeForUsage?.code}</DialogTitle>
    </DialogHeader>
    <Table>
      {selectedCodeForUsage?.usedBy?.map(usage => (
        <TableRow key={usage.registrationId}>
          <TableCell>{usage.userName}</TableCell>
          <TableCell>{usage.distanceName}</TableCell>
          <TableCell>{format(new Date(usage.usedAt), 'd MMM yyyy', { locale: pl })}</TableCell>
        </TableRow>
      ))}
    </Table>
  </DialogContent>
</Dialog>
```

### Integracja z EventManage organizatora

Dodanie nowej zakladki "Kody rabatowe" z ikonka Tag:

```tsx
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import { Tag } from 'lucide-react';

// W TabsList:
<TabsTrigger value="discounts"><Tag className="h-4 w-4" /><span>Kody rabatowe</span></TabsTrigger>

// W TabsContent:
<TabsContent value="discounts">
  <DiscountCodesEditor
    discountCodes={discountCodes}
    distances={event.distances}
    onChange={setDiscountCodes}
  />
</TabsContent>
```

### Widok moderatora

Moderator uzyskuje dostep do kodow rabatowych poprzez widok wydarzen w swoim panelu. Dodam komponent umozliwiajacy wybor wydarzenia i podglad/edycje kodow rabatowych w zakladce moderacji lub jako nowa zakladka "Wydarzenia" w panelu moderatora.

