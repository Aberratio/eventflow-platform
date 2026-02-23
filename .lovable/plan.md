

# Ceny VIP per prog cenowy + UI poprawki + session storage

## Cel

Trzy zmiany w edytorze progow cenowych:

1. **Ceny VIP** — do kazdego progu cenowego (niezaleznie od trybu date/participants) mozna dodac wiele cen specjalnych (VIP). Kazda ma nazwe, rabat, i opcjonalne pole dodatkowe (np. numer licencji niepelnosprawnego).
2. **Wizualne rozroznienie** — boxy z kategoriami (progami) maja zolty border, reszta bialy.
3. **Session storage** — przy zmianie trybu progow (date/participants) poprzednia konfiguracja zapisuje sie w session storage i wraca gdy user zmieni tryb z powrotem.
4. **Info pod radio buttonami** — komunikat ze tylko jeden tryb moze byc aktywny.

## Zmiany w plikach

### 1. Typy (`src/types/index.ts`)

Nowy interface `VipPrice` w `PriceTier`:

```
interface VipPrice {
  id: string;
  name: string;                    // np. "Osoba niepelnosprawna"
  discountType: PriceTierDiscountType;
  discountValue: number;
  customFieldLabel?: string;       // np. "Numer licencji"
  customFieldRequired?: boolean;
}

interface PriceTier {
  // ...istniejace pola
  vipPrices?: VipPrice[];
}
```

### 2. Edytor progow (`src/pages/admin/components/PriceTiersEditor.tsx`)

Duze zmiany:

- **Zolty border** na boxach progow (tier cards): `border-yellow-400` zamiast domyslnego `border`
- **Info pod radio buttonami**: tekst "Uwaga: Dla kazdego dystansu mozna wybrac tylko jeden tryb naliczania progow cenowych. Zmiana trybu spowoduje zapisanie poprzedniej konfiguracji."
- **Session storage**: Przy zmianie trybu (date -> participants lub odwrotnie), poprzednie `priceTiers` zapisuja sie w `sessionStorage` pod kluczem `price-tiers-{eventId}-{distanceId}-{mode}`. Gdy user wraca do tego trybu, tiers laduja sie z session storage.
- **Sekcja VIP w kazdym progu**: Pod polem "Opis" pojawia sie rozwijana sekcja "Ceny specjalne (VIP)". Kazda cena VIP ma:
  - Nazwe (np. "Osoba niepelnosprawna")
  - Typ rabatu (percent/fixed) + wartosc
  - Wyliczona cena (podglad)
  - Opcjonalne pole: checkbox "Dodaj pole dodatkowe" + label pola (np. "Nr licencji")
  - Przycisk usuwania
  - Przycisk "Dodaj cene VIP"

### 3. Mock data (`src/data/mockData.ts`)

Dodanie przykladowych VIP prices w kilku wydarzeniach:
- e1 (Maraton Warszawski): prog Early Bird ma VIP "Osoba niepelnosprawna" (50% znizki, pole "Nr orzeczenia")
- e3 (Gdynia Triathlon): prog "Pierwsze 500 osob" ma VIP "Czlonek klubu PZTri" (15% znizki, pole "Nr licencji PZTri")

### 4. Formularz rejestracji (`src/components/registration/RegistrationForm.tsx`)

W kroku wyboru dystansu, jesli aktywny prog ma VIP prices, wyswietlic je jako dodatkowe opcje cenowe pod standardowa cena. User moze wybrac cene VIP i wpisac wartosc pola dodatkowego.

## Szczegoly techniczne

### Session storage

Klucz: `priceTiers-{distanceId}-{mode}` (bez eventId bo distance.id jest unikatowe)

Przy zmianie trybu:
1. Zapisz aktualne tiers do `sessionStorage.setItem(key, JSON.stringify(currentTiers))`
2. Sprawdz czy istnieja zapisane tiers dla nowego trybu: `sessionStorage.getItem(newKey)`
3. Jesli tak — zaladuj je. Jesli nie — puste progi.

### Kolejnosc implementacji

| Krok | Plik | Zmiana |
|---|---|---|
| 1 | `src/types/index.ts` | Dodanie `VipPrice` interface i pola `vipPrices` w `PriceTier` |
| 2 | `src/data/mockData.ts` | VIP prices w e1 i e3 |
| 3 | `src/pages/admin/components/PriceTiersEditor.tsx` | Zolty border, info text, session storage, sekcja VIP |
| 4 | `src/api/mock/helpers.ts` | Eksport `applyDiscount` juz jest — bez zmian |
| 5 | `src/components/registration/RegistrationForm.tsx` | Wyswietlanie VIP cen w kroku wyboru dystansu |

### UI: boxy z progami

```
Obecny stan:  border rounded-lg (bialy/szary border)
Nowy stan:    border-2 border-yellow-400 rounded-lg (zolty border na progach)
Reszta:       border rounded-lg (bez zmian — bialy border)
```

