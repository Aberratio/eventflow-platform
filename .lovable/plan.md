
# Historia zmian zamowien w panelu admina

## Cel

Zastapienie placeholdera "Historia zmian bedzie dostepna wkrotce" pelnym logiem zmian zamowienia: kto, kiedy i co zmienil.

## Zmiany

### 1. Nowy typ `OrderHistoryEntry` w `src/types/index.ts`

```text
interface OrderHistoryEntry {
  id: string;
  orderId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'status_change' | 'items_edited' | 'price_adjustment' | 'tracking_updated' | 'notes_updated' | 'cancel_reason' | 'created';
  description: string;       // czytelny opis po polsku
  previousValue?: string;    // np. stary status
  newValue?: string;         // np. nowy status
}
```

Dodac pole `history?: OrderHistoryEntry[]` do interfejsu `ShopOrder`.

### 2. Mock data w `src/data/mockData.ts`

Dodac przykladowe wpisy historii do istniejacych zamowien, np.:
- "Zamowienie utworzone"
- "Status zmieniony z Oczekujace na Oplacone"
- "Dodano numer przesylki: INP-123456"

### 3. Logika śledzenia zmian w `AdminOrderEditPage.tsx`

W `handleSave`:
- Porownac aktualny stan z oryginalnym zamowieniem
- Dla kazdej wykrytej zmiany wygenerowac nowy `OrderHistoryEntry`:
  - Status zmieniony: "Status zmieniony z {stary} na {nowy}"
  - Produkty edytowane: "Zmieniono pozycje zamowienia (dodano/usunieto/zmieniono ilosc)"
  - Korekta cenowa: "Zastosowano korekce cenowa: {kwota} zl"
  - Numer przesylki: "Zaktualizowano numer przesylki: {numer}"
  - Notatka admina: "Zaktualizowano notatke admina"
  - Powod anulowania: "Dodano powod anulowania/zwrotu"
- Dodac wpisy do `history` zamowienia

### 4. Sekcja "Historia zmian" w `AdminOrderEditPage.tsx`

Zastapic placeholder timeline'em:
- Kazdy wpis: ikona akcji + data/godzina + imie osoby + opis zmiany
- Sortowanie chronologicznie (najnowsze na gorze)
- Ikony: statusy (RefreshCw), produkty (Package), korekta (DollarSign), przesylka (Truck), notatki (FileText)
- Styl: pionowa linia timeline z kropkami (Tailwind)

## Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/types/index.ts` | Nowy `OrderHistoryEntry`, pole `history` w `ShopOrder` |
| `src/data/mockData.ts` | Przykladowe wpisy historii |
| `src/pages/admin/components/AdminOrderEditPage.tsx` | Logika generowania wpisow + renderowanie timeline |

## Kolejnosc

1. Typy — `OrderHistoryEntry` + rozszerzenie `ShopOrder`
2. Mock data — przykladowe wpisy
3. `AdminOrderEditPage` — logika + UI timeline
