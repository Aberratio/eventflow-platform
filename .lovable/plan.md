
# Plan: Rozbudowa systemu płatności i weryfikacji dla organizatora

## 1. Kontekst i cele

Użytkownik chce rozbudować system o:

1. **Konfigurację płatności na poziomie wydarzenia** - organizator wybiera:
   - Przelew na swoje konto bankowe (musi podać numer)
   - Bramka płatnicza admina (automatyczne płatności)

2. **Ręczne potwierdzanie opłat** - dla wydarzeń z przelewem bankowym:
   - Osobno opłata startowa
   - Osobno każdy gadżet/merchandise
   - Osobno ubezpieczenie

3. **Weryfikacja wyników wirtualnych** - organizator ręcznie zatwierdza czasy zgłoszone przez uczestników

4. **Mockowanie różnych scenariuszy** - wydarzenia z różnymi kombinacjami ustawień

---

## 2. Rozszerzenie modelu danych

### Nowe pola w interfejsie `Event` (`src/types/index.ts`)

```typescript
interface Event {
  // ... istniejące pola
  
  // Konfiguracja płatności
  paymentConfig?: {
    type: 'organizer_bank' | 'admin_gateway';
    // Dla type === 'organizer_bank':
    bankAccountNumber?: string;  // np. "PL61 1090 1014 0000 0712 1981 2874"
    bankAccountHolder?: string;  // np. "Timing Marek Kowalczyk"
    transferTitle?: string;      // np. "Opłata startowa {eventName} - {participantName}"
  };
}
```

### Rozszerzenie interfejsu `Registration` (`src/types/index.ts`)

Dodanie szczegółowego śledzenia płatności:

```typescript
interface Registration {
  // ... istniejące pola
  
  // Szczegółowy status płatności (dla przelewów bankowych)
  paymentDetails?: {
    startFeePaid: boolean;
    startFeePaidAt?: string;
    insurancePaid: boolean;
    insurancePaidAt?: string;
    merchandisePayments: {
      merchandiseId: string;
      paid: boolean;
      paidAt?: string;
    }[];
  };
}
```

---

## 3. UI organizatora - zakładka Uczestnicy

### Rozbudowa `ParticipantsTab.tsx`

Dla wydarzeń z `paymentConfig.type === 'organizer_bank'` dodajemy rozszerzony widok:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  UCZESTNICY - Bieg z Przelewem Bankowym                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ⚠️ To wydarzenie przyjmuje płatności przelewem bankowym.                        │
│     Konto: PL61 1090 1014 0000 0712 1981 2874 (Timing Marek Kowalczyk)          │
│                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Tabela uczestników z kolumnami płatności:                                       │
│                                                                                   │
│  Nr │ Uczestnik       │ Dystans  │ Opłata  │ Ubezp. │ Gadżety           │ Akcje │
│  ───│─────────────────│──────────│─────────│────────│───────────────────│───────│
│  042│ Jan Kowalski    │ Ultra80K │ ☑ 450zł │ ☐ 15zł │ ☑ Koszulka (119zł)│ [...] │
│     │ jan@example.com │          │         │        │ ☐ Buff (59zł)     │       │
│     │                 │          │         │        │ ☐ Plecak (249zł)  │       │
│  ───│─────────────────│──────────│─────────│────────│───────────────────│───────│
│  156│ Anna Nowak      │ Maraton  │ ☐ 300zł │ ☑ 12zł │ (brak)            │ [...] │
│     │ anna@example.com│          │         │        │                   │       │
│  ───│─────────────────│──────────│─────────│────────│───────────────────│───────│
│  ...                                                                             │
│                                                                                   │
│  Podsumowanie:                                                                   │
│  • Opłaconych: 45/67  • Do zebrania: 8 450 zł  • Zebrano: 12 320 zł            │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Funkcjonalność:**
- Klikalne checkboxy przy każdej pozycji
- Po kliknięciu → zapisuje datę opłacenia
- Tooltips pokazują kiedy opłacono
- Filtr: "Pokaż tylko nieopłaconych"

---

## 4. Mockowane wydarzenia - różne scenariusze

### Scenariusz 1: Wydarzenie z bramką płatniczą admina (automatyczne)

Istniejące wydarzenia (e11, e12, e13, e14) już mają `paymentMethods` ale bez rozróżnienia. Dodamy jedno nowe:

```typescript
{
  id: 'e-gateway',
  name: 'Maraton Automatyczny 2026',
  paymentConfig: {
    type: 'admin_gateway'
  },
  // Płatności automatyczne - organizator nie musi nic ręcznie potwierdzać
}
```

### Scenariusz 2: Wydarzenie z przelewem na konto organizatora

```typescript
{
  id: 'e-bank-transfer',
  name: 'Bieg Lokalny z Przelewem 2026',
  paymentConfig: {
    type: 'organizer_bank',
    bankAccountNumber: 'PL61 1090 1014 0000 0712 1981 2874',
    bankAccountHolder: 'Timing Marek Kowalczyk',
    transferTitle: 'Bieg Lokalny - {participantName}'
  },
  enableMerchandiseInRegistration: true,
  merchandise: [...], // gadżety do kupienia
  insuranceOption: {...}, // ubezpieczenie
}
```

### Scenariusz 3: Wydarzenie wirtualne z weryfikacją czasów

Już istnieje `virtual-1`, rozszerzymy dane:

```typescript
{
  id: 'virtual-2',
  name: 'Wirtualny Maraton Wiosenny 2026',
  isVirtual: true,
  paymentConfig: {
    type: 'admin_gateway' // lub 'organizer_bank'
  },
  // Uczestnicy sami deklarują czasy
  // Organizator ręcznie weryfikuje w VirtualResultsVerificationTab
}
```

### Scenariusz 4: Wydarzenie mieszane (przelew + gadżety + wirtualne)

```typescript
{
  id: 'e-mixed',
  name: 'Hybrid Challenge 2026',
  isVirtual: true,
  paymentConfig: {
    type: 'organizer_bank',
    bankAccountNumber: 'PL27 1140 2004 0000 3002 0135 5387',
    bankAccountHolder: 'RunPoland S.A.',
  },
  enableMerchandiseInRegistration: true,
  merchandise: [...],
  // Organizator musi:
  // 1. Ręcznie potwierdzać opłaty (startowe + gadżety)
  // 2. Weryfikować zgłoszone czasy
}
```

---

## 5. Mockowane rejestracje z różnymi stanami płatności

```typescript
// Pełna opłata za wszystko
{
  id: 'r-bank-1',
  eventId: 'e-bank-transfer',
  status: 'confirmed',
  paymentDetails: {
    startFeePaid: true,
    startFeePaidAt: '2026-01-10T14:30:00Z',
    insurancePaid: true,
    insurancePaidAt: '2026-01-10T14:30:00Z',
    merchandisePayments: [
      { merchandiseId: 'merch1', paid: true, paidAt: '2026-01-10T14:30:00Z' }
    ]
  }
}

// Opłacony start, ale nie gadżety
{
  id: 'r-bank-2',
  eventId: 'e-bank-transfer',
  status: 'pending', // nadal pending bo nie wszystko opłacone
  paymentDetails: {
    startFeePaid: true,
    startFeePaidAt: '2026-01-12T09:00:00Z',
    insurancePaid: false,
    merchandisePayments: [
      { merchandiseId: 'merch1', paid: false },
      { merchandiseId: 'merch2', paid: true, paidAt: '2026-01-12T09:00:00Z' }
    ]
  }
}

// Nic nie opłacone
{
  id: 'r-bank-3',
  eventId: 'e-bank-transfer',
  status: 'pending',
  paymentDetails: {
    startFeePaid: false,
    insurancePaid: false,
    merchandisePayments: []
  }
}
```

---

## 6. Rozbudowa zakładki weryfikacji wirtualnych

### Już istniejąca `VirtualResultsVerificationTab.tsx`

Działa poprawnie, ale dodamy mockowane dane dla nowych wydarzeń wirtualnych:

```typescript
// Więcej mockVirtualResultSubmissions
{
  id: 'vrs-new-1',
  eventId: 'virtual-2',
  userId: 'p1',
  userName: 'Jan Kowalski',
  submittedTime: '3:45:22',
  submittedTimeInSeconds: 13522,
  proofUrl: 'https://strava.com/activities/123456',
  notes: 'Biegłem w Tatrach, świetna pogoda!',
  status: 'pending',
  submittedAt: '2026-03-15T18:30:00Z'
},
{
  id: 'vrs-new-2',
  eventId: 'virtual-2',
  userId: 'p2',
  userName: 'Anna Nowak',
  submittedTime: '4:12:05',
  submittedTimeInSeconds: 15125,
  proofUrl: 'https://strava.com/activities/789012',
  status: 'approved',
  submittedAt: '2026-03-14T10:00:00Z',
  reviewedAt: '2026-03-14T12:00:00Z',
  reviewedBy: 'o3'
},
{
  id: 'vrs-new-3',
  eventId: 'virtual-2',
  userId: 'p3',
  userName: 'Piotr Wiśniewski',
  submittedTime: '2:58:00',
  submittedTimeInSeconds: 10680,
  proofUrl: '',
  notes: 'Zegarek się rozładował, nie mam dowodu',
  status: 'rejected',
  rejectionReason: 'Brak dowodu ukończenia dystansu',
  submittedAt: '2026-03-13T16:00:00Z',
  reviewedAt: '2026-03-13T18:00:00Z',
  reviewedBy: 'o3'
}
```

---

## 7. Podsumowanie zmian w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie `PaymentConfig`, rozszerzenie `Registration.paymentDetails` |
| `src/data/mockData.ts` | Modyfikacja | Nowe wydarzenia (e-bank-transfer, e-gateway, virtual-2, e-mixed), nowe rejestracje z paymentDetails, więcej VirtualResultSubmissions |
| `src/pages/organizer/components/ParticipantsTab.tsx` | Modyfikacja | Dodanie widoku szczegółowych płatności dla wydarzeń z przelewem bankowym |

---

## 8. Diagram przepływu płatności

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KONFIGURACJA WYDARZENIA                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   BRAMKA ADMINA          │    │   PRZELEW BANKOWY        │
│   (admin_gateway)        │    │   (organizer_bank)       │
└──────────────────────────┘    └──────────────────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ Automatyczne potwierdzenie│    │ Uczestnik widzi dane    │
│ po płatności online       │    │ do przelewu:            │
│                          │    │ • Nr konta              │
│ Registration.status =    │    │ • Właściciel            │
│ 'confirmed'              │    │ • Tytuł przelewu        │
└──────────────────────────┘    └──────────────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────┐
                              │ Organizator ręcznie      │
                              │ oznacza opłaty:          │
                              │ ☑ Opłata startowa       │
                              │ ☑ Ubezpieczenie         │
                              │ ☑ Koszulka              │
                              │ ☑ Medal                 │
                              └──────────────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────┐
                              │ Wszystko opłacone?       │
                              │ → status = 'confirmed'   │
                              └──────────────────────────┘
```

---

## 9. UI widok szczegółowego zaznaczania płatności

Po kliknięciu na uczestnika lub ikonie "rozwiń" pojawi się panel:

```
┌─────────────────────────────────────────────────────────────────┐
│  Jan Kowalski - szczegóły płatności                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pozycja                       │ Kwota    │ Status              │
│  ─────────────────────────────│──────────│─────────────────────│
│  ☑ Opłata startowa (Ultra 80K) │ 450 zł   │ ✓ Opłacono 10.01   │
│  ☐ Ubezpieczenie NNW           │ 15 zł    │ Nieopłacone        │
│  ☑ Koszulka techniczna (L)     │ 119 zł   │ ✓ Opłacono 10.01   │
│  ☐ Buff górski (x2)            │ 118 zł   │ Nieopłacone        │
│  ☐ Plecak biegowy (L/XL)       │ 249 zł   │ Nieopłacone        │
│  ─────────────────────────────│──────────│─────────────────────│
│  RAZEM                         │ 951 zł   │ Opłacono: 569 zł   │
│                                            │ Brakuje: 382 zł    │
│                                                                  │
│  [Oznacz wszystko jako opłacone]  [Wyślij przypomnienie]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Część techniczna

### Zmiany w `src/types/index.ts`

```typescript
// Nowy typ konfiguracji płatności
export type PaymentConfigType = 'organizer_bank' | 'admin_gateway';

export interface PaymentConfig {
  type: PaymentConfigType;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  transferTitle?: string;
}

// Rozszerzenie Registration
export interface MerchandisePaymentStatus {
  merchandiseId: string;
  merchandiseName: string;
  paid: boolean;
  paidAt?: string;
  amount: number;
}

export interface PaymentDetails {
  startFeePaid: boolean;
  startFeePaidAt?: string;
  insurancePaid: boolean;
  insurancePaidAt?: string;
  merchandisePayments: MerchandisePaymentStatus[];
}

// W Event dodać:
paymentConfig?: PaymentConfig;

// W Registration dodać:
paymentDetails?: PaymentDetails;
```

### Logika w `ParticipantsTab.tsx`

```typescript
// Sprawdzenie czy wydarzenie wymaga ręcznego potwierdzania
const requiresManualPaymentConfirmation = 
  event.paymentConfig?.type === 'organizer_bank';

// Renderowanie dodatkowych kolumn
{requiresManualPaymentConfirmation && (
  <>
    <TableHead>Opłata startowa</TableHead>
    <TableHead>Ubezpieczenie</TableHead>
    <TableHead>Gadżety</TableHead>
  </>
)}
```
