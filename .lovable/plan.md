

# Rozbudowa progow cenowych: rabaty, progi uczestnikow, UI

## Cel

Rozszerzenie systemu progow cenowych o trzy kluczowe zmiany:
1. **Typ progu** — organizator wybiera czy ceny zmieniaja sie po dacie (jak teraz) czy po liczbie uczestnikow (zapisanych lub oplaconych)
2. **Cena bazowa + rabaty** — zamiast wpisywac kwote bezposrednio, organizator ustala rabat (procentowy lub kwotowy) od ceny bazowej, a system automatycznie przelicza cene koncowa
3. **Lepszy UI** edytora progow i zamockowane rozne warianty

## Co sie zmieni

### 1. Nowy model danych (`src/types/index.ts`)

Obecny `PriceTier` ma pola: `id`, `name`, `price`, `endDate`, `description`.

Nowy model:

```
PriceTierMode = 'date' | 'participants'
ParticipantCountType = 'registered' | 'paid'
DiscountType = 'percent' | 'fixed'

PriceTier {
  id: string
  name: string
  discountType: DiscountType    // procentowy lub kwotowy
  discountValue: number         // np. 30 (=30%) lub 50 (=50 zl)
  endDate?: string              // tylko dla mode 'date'
  participantLimit?: number     // tylko dla mode 'participants' (np. 100 = "pierwsze 100 osob")
  description?: string
  // price — usuwamy, bo bedzie wyliczane dynamicznie z ceny bazowej
}

Distance {
  ... (bez zmian w polach)
  priceTierMode?: PriceTierMode               // domyslnie 'date'
  participantCountType?: ParticipantCountType  // domyslnie 'registered', uzywane gdy mode='participants'
  priceTiers?: PriceTier[]
}
```

Pole `price` z `PriceTier` zostaje usuniete — cena koncowa bedzie wyliczana dynamicznie jako `distance.price - rabat`.

### 2. Logika wyliczania ceny (`src/api/mock/helpers.ts`)

Funkcja `getCurrentPrice` zostanie rozszerzona:
- Przyjmie dodatkowy parametr `registeredCount` i `paidCount` (lub obiekt distance z tymi polami)
- Dla `mode === 'date'` — dziala jak dotychczas, ale wylicza cene z rabatu: `basePrice - discount`
- Dla `mode === 'participants'` — sprawdza ilosc uczestnikow i zwraca odpowiedni prog

Nowa sygnatura:
```
getCurrentPrice(distance: Distance, context?: { paidCount?: number }): {
  price: number;
  tierName: string;
  nextTier?: { name: string; price: number; threshold: string };
  discount?: { type: DiscountType; value: number };
}
```

Gdzie `price` to cena po rabacie, a `threshold` to np. "do 28.02.2026" lub "miejsca 101-200".

### 3. Przebudowany edytor progow (`src/pages/admin/components/PriceTiersEditor.tsx`)

Dla kazdego dystansu:
- **Wybor trybu** — RadioGroup: "Po dacie" vs "Po liczbie uczestnikow"
  - Jesli "Po liczbie uczestnikow" — dodatkowy wybor: "Zapisani" vs "Oplaceni"
- **Cena bazowa** — wyswietlona wyraznie na gorze (z `distance.price`)
- **Kazdy prog** zawiera:
  - Nazwe (np. "Early Bird")
  - Typ rabatu: Select "Procentowy" / "Kwotowy (PLN)"
  - Wartosc rabatu (np. 30)
  - **Wyliczona cena koncowa** — wyswietlona automatycznie jako podglad (np. "Cena po rabacie: 126 zl" jesli baza to 180 i rabat 30%)
  - W trybie "Po dacie": pole daty koncowej
  - W trybie "Po uczestnikach": pole "Do ilu uczestnikow" (np. 100)
  - Opis (opcjonalnie)
- **"Utworz domyslne progi"** — dostosowane do wybranego trybu (date: Early Bird/Regular/Last Minute, participants: 1-100/101-200/201+)

### 4. Mock data (`src/data/mockData.ts`)

Zamockowanie roznych wariantow w istniejacych wydarzeniach:

| Wydarzenie | Tryb | Opis |
|---|---|---|
| e1 (Maraton Warszawski) | `date` | Progi po dacie z rabatami procentowymi (30%, 0%, -20%) |
| e3 (Bieg Nocny Krakow) | `participants` + `registered` | Pierwsze 100 osob -25%, 101-250 -10%, reszta cena bazowa |
| e5 (Gorski Ultramaraton) | `participants` + `paid` | Progi po liczbie oplaconych uczestnikow |
| Reszta | `date` | Bez zmian (migracja istniejacych danych — przeliczenie `price` na `discountValue`) |

### 5. Aktualizacja RegistrationForm i EventDetailsPage

- `RegistrationForm.tsx` — uzywanie nowego `getCurrentPrice` z przekazaniem kontekstu uczestnikow
- Wyswietlenie informacji o aktualnym progu: "Cena Early Bird: 126 zl (rabat 30%)" + "Nastepny prog: Cena regularna od 01.03" lub "Nastepny prog: od 101 uczestnika"

## Szczegoly techniczne

### Migracja istniejacych PriceTier

Istniejace progi maja `price` ustawione wprost. Przy migracji:
- Jesli `tier.price < distance.price`: `discountType = 'fixed'`, `discountValue = distance.price - tier.price`
- Jesli `tier.price >= distance.price`: `discountType = 'percent'`, `discountValue = 0` (lub ujemny rabat jako doplata — `discountValue = -((tier.price - distance.price) / distance.price * 100)`)

W praktyce zaktualizujemy mock data recznie.

### Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/types/index.ts` | Nowe typy: `PriceTierMode`, `ParticipantCountType`; PriceTier: `discountType` + `discountValue` zamiast `price`; Distance: `priceTierMode` + `participantCountType` |
| `src/api/mock/helpers.ts` | Rozszerzenie `getCurrentPrice` o obsluge obu trybow i wyliczanie ceny z rabatu |
| `src/data/mockData.ts` | Aktualizacja istniejacych progow + nowe warianty (participants mode) + usuniety helper `getCurrentPrice` (duplikat) |
| `src/pages/admin/components/PriceTiersEditor.tsx` | Przebudowa UI: wybor trybu, rabaty zamiast cen, podglad wyliczonej ceny |
| `src/components/registration/RegistrationForm.tsx` | Przekazanie kontekstu uczestnikow do `getCurrentPrice` |
| `src/pages/organizer/EventForm.tsx` | Jesli progi sa tam edytowane — analogiczne zmiany |

### Kolejnosc implementacji

1. Typy w `src/types/index.ts`
2. Mock data w `src/data/mockData.ts` (nowe progi, rozne warianty)
3. Logika `getCurrentPrice` w `src/api/mock/helpers.ts`
4. Edytor `PriceTiersEditor.tsx` — nowy UI
5. `RegistrationForm.tsx` — integracja z nowym API
6. Weryfikacja wyswietlania cen na EventDetailsPage i listach

