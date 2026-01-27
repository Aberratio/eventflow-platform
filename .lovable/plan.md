
# Plan: Dodanie konfiguracji płatności w EventForm

## Cel
Dodanie nowej sekcji w formularzu tworzenia/edycji wydarzenia, która pozwoli organizatorowi wybrać metodę przyjmowania płatności:
- **Bramka płatnicza admina** (automatyczne płatności online)
- **Przelew na konto bankowe** (ręczne potwierdzanie przez organizatora)

## Lokalizacja w formularzu
Sekcja zostanie dodana w **Kroku 1 (Podstawowe informacje)**, po sekcji "Media wydarzenia", jako nowa karta "Konfiguracja płatności".

## Wizualizacja UI

```text
┌─────────────────────────────────────────────────────────────────────┐
│  💳 Konfiguracja płatności                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Wybierz sposób przyjmowania płatności od uczestników:             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ○ Bramka płatnicza (automatyczna)                           │    │
│  │   Płatności są przetwarzane automatycznie przez             │    │
│  │   bramkę płatniczą administratora serwisu.                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ● Przelew bankowy (ręczny)                                  │    │
│  │   Uczestnicy wpłacają na Twoje konto bankowe.               │    │
│  │   Musisz ręcznie potwierdzać otrzymane wpłaty.              │    │
│  │                                                              │    │
│  │   Numer konta: [PL __ ____ ____ ____ ____ ____ ____]        │    │
│  │   Właściciel:  [Nazwa firmy / Imię Nazwisko        ]        │    │
│  │   Tytuł:       [Opłata za {eventName} - {participant}]      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Zmiany w pliku

### `src/pages/organizer/EventForm.tsx`

**1. Nowe stany (linie ~56-58)**

```typescript
// Payment configuration
const [paymentConfigType, setPaymentConfigType] = useState<PaymentConfigType>(
  existingEvent?.paymentConfig?.type || 'admin_gateway'
);
const [bankAccountNumber, setBankAccountNumber] = useState(
  existingEvent?.paymentConfig?.bankAccountNumber || ''
);
const [bankAccountHolder, setBankAccountHolder] = useState(
  existingEvent?.paymentConfig?.bankAccountHolder || ''
);
const [transferTitle, setTransferTitle] = useState(
  existingEvent?.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}'
);
```

**2. Import nowych typów i komponentów**

```typescript
import { PaymentConfigType } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Building2 } from 'lucide-react';
```

**3. Nowa sekcja UI w Kroku 1 (po sekcji Media)**

- Karta z tytułem "Konfiguracja płatności"
- RadioGroup z dwoma opcjami:
  - `admin_gateway` - Bramka płatnicza (domyślna)
  - `organizer_bank` - Przelew bankowy
- Warunkowo pokazywane pola dla przelewu bankowego:
  - Numer konta (z walidacją IBAN)
  - Nazwa właściciela konta
  - Wzór tytułu przelewu (z placeholderami `{eventName}`, `{participantName}`)

**4. Walidacja w `validateStep1()`**

Dodanie sprawdzenia:
```typescript
if (paymentConfigType === 'organizer_bank') {
  if (!bankAccountNumber || !bankAccountHolder) {
    toast({ 
      title: 'Błąd', 
      description: 'Podaj numer konta i właściciela dla płatności przelewem', 
      variant: 'destructive' 
    });
    return false;
  }
}
```

**5. Aktualizacja podglądu w Kroku 3**

Dodanie wyświetlania wybranej metody płatności:
```typescript
<div>
  <p className="text-sm text-muted-foreground">Metoda płatności</p>
  <p className="font-medium">
    {paymentConfigType === 'admin_gateway' 
      ? '💳 Bramka płatnicza (automatyczna)' 
      : '🏦 Przelew bankowy (ręczny)'}
  </p>
</div>
```

## Szczegóły techniczne

### Walidacja numeru konta
- Podstawowa walidacja formatu IBAN (26 cyfr dla Polski)
- Formatowanie z odstępami co 4 cyfry dla czytelności

### Placeholdery w tytule przelewu
Organizator może używać zmiennych:
- `{eventName}` - nazwa wydarzenia
- `{participantName}` - imię i nazwisko uczestnika
- `{distanceName}` - nazwa dystansu

### Domyślne wartości
- Typ: `admin_gateway` (bramka admina)
- Tytuł przelewu: `"Opłata za {eventName} - {participantName}"`

## Podsumowanie zmian

| Plik | Akcja | Opis |
|------|-------|------|
| `src/pages/organizer/EventForm.tsx` | Modyfikacja | Dodanie sekcji konfiguracji płatności z RadioGroup i polami dla danych bankowych |
