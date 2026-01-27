
# Plan: Wyświetlanie danych do przelewu na stronie rejestracji

## Cel
Po zakończeniu rejestracji na wydarzenie z płatnością przelewem bankowym (`paymentConfig.type === 'organizer_bank'`), uczestnik powinien zobaczyć pełne dane do przelewu wraz z wygenerowanym tytułem.

## Lokalizacja zmian
Modyfikacja kroku 6 (Podsumowanie) w `src/components/registration/RegistrationForm.tsx` - dodanie sekcji z danymi do przelewu.

## Wizualizacja UI

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ✓ Podsumowanie zamówienia                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Bieg Górski Tatry 2026                                             │
│  15 czerwca 2026 • Zakopane                                         │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│  Ultra 80K (80 km)                                    450 zł        │
│  Kategoria: M30-34                                                   │
│  ─────────────────────────────────────────────────────────────────  │
│  Do zapłaty                                           450 zł        │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🏦 Dane do przelewu bankowego                                      │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Numer konta                                                   │  │
│  │  PL61 1090 1014 0000 0712 1981 2874                [📋 Kopiuj]│  │
│  │                                                                │  │
│  │  Odbiorca                                                      │  │
│  │  Timing Marek Kowalczyk                            [📋 Kopiuj]│  │
│  │                                                                │  │
│  │  Tytuł przelewu                                                │  │
│  │  Bieg Górski Tatry 2026 - Jan Kowalski             [📋 Kopiuj]│  │
│  │                                                                │  │
│  │  Kwota                                                         │  │
│  │  450,00 PLN                                        [📋 Kopiuj]│  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ⚠️ Płatność przelewem bankowym wymaga ręcznego potwierdzenia       │
│     przez organizatora. Twój zapis zostanie potwierdzony po         │
│     zaksięgowaniu wpłaty.                                           │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ☑ Akceptuję regulamin zawodów...                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Zmiany w pliku

### `src/components/registration/RegistrationForm.tsx`

**1. Import nowych ikon**

```typescript
import { 
  // ... istniejące
  Building2,
  Copy,
  AlertTriangle
} from 'lucide-react';
```

**2. Import useAuth i toast**

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
```

**3. Pobranie danych użytkownika**

Na początku komponentu:
```typescript
const { user } = useAuth();
```

**4. Funkcja generowania tytułu przelewu**

Funkcja zamieniająca placeholdery na rzeczywiste wartości:
```typescript
const generateTransferTitle = () => {
  if (!event.paymentConfig?.transferTitle) {
    return `${event.name} - ${user?.name || 'Uczestnik'}`;
  }
  
  return event.paymentConfig.transferTitle
    .replace('{eventName}', event.name)
    .replace('{participantName}', user?.name || 'Uczestnik')
    .replace('{distanceName}', selectedDistance?.name || '');
};
```

**5. Funkcja kopiowania do schowka**

```typescript
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast({
      title: 'Skopiowano',
      description: `${label} został skopiowany do schowka`,
    });
  });
};
```

**6. Sekcja danych do przelewu w kroku 6**

Po sekcji "Do zapłaty" i przed checkboxem z regulaminem, warunkowo wyświetlana sekcja:

```typescript
{event.paymentConfig?.type === 'organizer_bank' && (
  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
      <Building2 className="h-5 w-5" />
      <h4 className="font-semibold">Dane do przelewu bankowego</h4>
    </div>
    
    <div className="space-y-3 text-sm">
      {/* Numer konta */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-xs">Numer konta</p>
          <p className="font-mono font-medium">{event.paymentConfig.bankAccountNumber}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(event.paymentConfig.bankAccountNumber, 'Numer konta')}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Odbiorca */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-xs">Odbiorca</p>
          <p className="font-medium">{event.paymentConfig.bankAccountHolder}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(event.paymentConfig.bankAccountHolder, 'Odbiorca')}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tytuł */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-xs">Tytuł przelewu</p>
          <p className="font-medium">{generateTransferTitle()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generateTransferTitle(), 'Tytuł przelewu')}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Kwota */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-xs">Kwota</p>
          <p className="font-bold text-lg">{totalAmount.toFixed(2)} PLN</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${totalAmount.toFixed(2)}`, 'Kwota')}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    {/* Ostrzeżenie */}
    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 pt-2 border-t border-amber-200 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p>
        Płatność przelewem bankowym wymaga ręcznego potwierdzenia przez organizatora. 
        Twój zapis zostanie potwierdzony po zaksięgowaniu wpłaty.
      </p>
    </div>
  </div>
)}
```

**7. Zmiana tekstu przycisku dla przelewów bankowych**

Zmiana tekstu na przycisku końcowym:

```typescript
{isLastStep ? (
  <Button onClick={handleSubmit} disabled={!agreedToTerms} size="lg">
    {event.paymentConfig?.type === 'organizer_bank' 
      ? 'Zapisz się' 
      : `Płacę ${totalAmount} zł`}
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
) : (
  // ...
)}
```

## Szczegóły techniczne

### Generowanie tytułu przelewu

Funkcja `generateTransferTitle()` obsługuje placeholdery:
- `{eventName}` - nazwa wydarzenia
- `{participantName}` - imię i nazwisko uczestnika (z kontekstu auth)
- `{distanceName}` - nazwa wybranego dystansu

### Kopiowanie do schowka

Wykorzystanie Clipboard API (`navigator.clipboard.writeText`) z feedbackiem przez toast.

### Stylowanie

Sekcja danych do przelewu wyróżniona:
- Tło: `bg-amber-50` (light) / `bg-amber-950/20` (dark)
- Ramka: `border-amber-200` / `border-amber-800`
- Ikona banku (Building2) z odpowiednim kolorem

## Podsumowanie zmian

| Plik | Akcja | Opis |
|------|-------|------|
| `src/components/registration/RegistrationForm.tsx` | Modyfikacja | Dodanie sekcji z danymi do przelewu w kroku 6 (podsumowanie) dla wydarzeń z `paymentConfig.type === 'organizer_bank'` |
