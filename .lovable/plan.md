

# Plan: Strona sukcesu po rejestracji z danymi do przelewu

## Cel
Utworzenie dedykowanej strony sukcesu (`/events/:slug/register/success`) wyświetlanej po zakończeniu rejestracji. Dla wydarzeń z płatnością przelewem bankowym strona będzie zawierać pełne dane do przelewu i instrukcje dla uczestnika.

## Lokalizacja i architektura

Utworzenie nowej strony `src/pages/RegistrationSuccessPage.tsx` wzorowanej na istniejącej `OrderSuccessPage.tsx`, z dodatkową logiką dla danych przelewu bankowego.

### Przepływ danych

```text
RegistrationForm 
    │
    ▼ onComplete(data)
EventRegistrationPage
    │
    ▼ navigate z state
RegistrationSuccessPage
    │
    ▼ odczyt state + event.paymentConfig
Wyświetlenie danych
```

## Wizualizacja UI

### Wariant A: Bramka płatnicza (automatyczna)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    ✓ (zielona ikona)                                │
│                                                                      │
│              Rejestracja zakończona!                                │
│                                                                      │
│  Zapisałeś się na wydarzenie Bieg Górski Tatry 2026                │
│  Dystans: Ultra 80K • Kategoria: M30-34                            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Szczegóły rejestracji                                              │
│  ─────────────────────────────────────────────────────────────────  │
│  Opłata startowa (Ultra 80K)                           450 zł      │
│  Ubezpieczenie NNW                                      15 zł      │
│  Koszulka techniczna (L) x1                            119 zł      │
│  ─────────────────────────────────────────────────────────────────  │
│  Razem zapłacono                                       584 zł      │
│                                                                      │
│  ✓ Płatność zrealizowana automatycznie                             │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📧 Na podany adres email wysłaliśmy potwierdzenie rejestracji     │
│                                                                      │
│  [Zobacz wydarzenie]         [Moje rejestracje]                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Wariant B: Przelew bankowy (ręczny)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    ✓ (zielona ikona)                                │
│                                                                      │
│              Rejestracja wstępna zakończona!                        │
│                                                                      │
│  Zapisałeś się na wydarzenie Bieg Górski Tatry 2026                │
│  Dystans: Ultra 80K • Kategoria: M30-34                            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Szczegóły zamówienia                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  Opłata startowa (Ultra 80K)                           450 zł      │
│  Ubezpieczenie NNW                                      15 zł      │
│  Koszulka techniczna (L) x1                            119 zł      │
│  ─────────────────────────────────────────────────────────────────  │
│  Do zapłaty                                            584 zł      │
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
│  │  584,00 PLN                                        [📋 Kopiuj]│  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ⚠️ Ważne informacje                                                │
│  • Wpłać dokładną kwotę na podane konto                            │
│  • Użyj podanego tytułu przelewu                                   │
│  • Twoja rejestracja zostanie potwierdzona po zaksięgowaniu wpłaty │
│  • Status płatności możesz sprawdzić w panelu uczestnika           │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📧 Na podany adres email wysłaliśmy potwierdzenie z danymi        │
│     do przelewu                                                     │
│                                                                      │
│  [Zobacz wydarzenie]         [Moje rejestracje]                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Zmiany w plikach

### 1. Nowy plik: `src/pages/RegistrationSuccessPage.tsx`

Nowa strona zawierająca:
- Nagłówek sukcesu z ikoną CheckCircle
- Szczegóły rejestracji (dystans, kategoria, kwoty)
- Warunkową sekcję danych do przelewu (dla `organizer_bank`)
- Funkcję kopiowania do schowka z toastem
- Instrukcje dla uczestnika
- Przyciski nawigacyjne

### 2. Modyfikacja: `src/pages/EventRegistrationPage.tsx`

Zmiana w `handleComplete`:
```typescript
const handleComplete = (data: RegistrationData) => {
  // Przekierowanie do strony sukcesu z danymi rejestracji
  navigate(`/events/${slug}/register/success`, { 
    state: { 
      registrationData: data,
      eventId: event.id,
      eventName: event.name,
      eventSlug: slug,
      eventDate: event.date,
      eventCity: event.city,
      paymentConfig: event.paymentConfig
    } 
  });
};
```

### 3. Modyfikacja: `src/App.tsx`

Dodanie nowej trasy:
```typescript
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';

// W Routes:
<Route path="/events/:slug/register/success" element={<RegistrationSuccessPage />} />
```

## Szczegóły techniczne

### Przekazywanie danych przez React Router state

Dane rejestracji przekazywane są przez `navigate()` z opcją `state`, co pozwala na:
- Brak potrzeby globalnego stanu/kontekstu
- Bezpieczne przekazanie wszystkich danych rejestracji
- Obsługę przypadku gdy użytkownik wejdzie bezpośrednio na URL (przekierowanie)

### Interfejs danych w state

```typescript
interface RegistrationSuccessState {
  registrationData: RegistrationData;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  eventCity: string;
  paymentConfig?: PaymentConfig;
}
```

### Obsługa błędu braku danych

Jeśli użytkownik wejdzie bezpośrednio na `/events/:slug/register/success` bez state:
- Wyświetlenie komunikatu o braku danych
- Przycisk powrotu do listy wydarzeń

### Funkcja kopiowania (ponowne użycie)

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

### Generowanie tytułu przelewu

Wykorzystanie tej samej logiki co w `RegistrationForm`:
```typescript
const generateTransferTitle = () => {
  const template = paymentConfig?.transferTitle || '{eventName} - {participantName}';
  return template
    .replace('{eventName}', eventName)
    .replace('{participantName}', user?.name || 'Uczestnik')
    .replace('{distanceName}', registrationData.distanceName);
};
```

## Podsumowanie zmian

| Plik | Akcja | Opis |
|------|-------|------|
| `src/pages/RegistrationSuccessPage.tsx` | Utworzenie | Nowa strona sukcesu z danymi do przelewu |
| `src/pages/EventRegistrationPage.tsx` | Modyfikacja | Zmiana przekierowania po rejestracji na stronę sukcesu |
| `src/App.tsx` | Modyfikacja | Dodanie trasy `/events/:slug/register/success` |

