
# Plan: Rozbudowa systemu rejestracji na wydarzenia

## Zakres zmian

Plan obejmuje trzy główne funkcjonalności:

1. **Automatyczne uzupełnianie danych z profilu** - jeśli użytkownik ma wypełnione dane w profilu (rok urodzenia, płeć), krok "Dane osobowe" jest pomijany lub wstępnie wypełniony
2. **Rozbudowa systemu drużyn** - możliwość tworzenia nowej drużyny lub dołączenia do istniejącej z walidacją nazw
3. **System ubezpieczeń z panelem admina** - kalkulator składek z konfigurowalnym tekstem i wartościami w panelu SuperAdmina

---

## 1. Automatyczne uzupełnianie danych z profilu

### Logika działania

```text
Zalogowany użytkownik z wypełnionym profilem:
- birthYear: 1985 (rok urodzenia)
- gender: 'M' lub 'K' (płeć)

↓

Formularz rejestracji automatycznie:
1. Wypełnia datę urodzenia (rok z profilu, miesiąc/dzień = styczeń 01)
2. Oblicza wiek i proponuje kategorie wiekowe
3. Wyświetla dane jako tylko do odczytu z możliwością edycji

Użytkownik BEZ wypełnionych danych:
↓
Wyświetla callout zachęcający do uzupełnienia profilu
```

### Interfejs w RegistrationForm

W kroku 2 (Dane osobowe) pojawi się jeden z dwóch widoków:

**Wariant A - Profil wypełniony:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✓ Dane zostały pobrane z Twojego profilu                                   │
│                                                                             │
│ Rok urodzenia: 1985 (wiek: 41 lat)                                         │
│ Płeć: Mężczyzna                                                            │
│                                                                             │
│ [Zmień dane]  ← opcjonalny link do edycji                                  │
│                                                                             │
│ Kategoria wiekowa: [M30-34] [M35-39] [M40-44] ← automatycznie wybrana      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Wariant B - Profil niekompletny:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Uzupełnij swój profil!                                         (callout) │
│                                                                             │
│ Wypełnij dane w profilu, aby automatycznie uzupełniać formularze           │
│ rejestracyjne na przyszłe wydarzenia.                                      │
│                                                                             │
│ [Przejdź do profilu →]                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│ Data urodzenia:  [Dzień] [Miesiąc] [Rok]   ← ręczne wypełnianie            │
│ Kategoria:       [ ] M30-34  [ ] M35-39  ...                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System drużyn - tworzenie i dołączanie

### Rozbudowa kroku "Drużyna" w RegistrationForm

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 Zapis drużynowy (opcjonalne)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [✓] Chcę zapisać się jako część drużyny                                    │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ○ Utwórz nową drużynę                                                   ││
│ │   Wpisz nazwę nowej drużyny (3-50 znaków)                              ││
│ │   [____________________________________________]                        ││
│ │                                                                         ││
│ │ ○ Dołącz do istniejącej drużyny                                        ││
│ │   Wybierz z listy drużyn zapisanych na te zawody:                      ││
│ │   [Wybierz drużynę... ▼]                                               ││
│ │     - Biegacze Wrocław (4 członków)                                    ││
│ │     - KB Górskie Wilki (2 członków)                                    ││
│ │     - Nocni Biegacze (5 członków)                                      ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ 💰 Zniżki grupowe                                                          │
│ 3+ osób: -10%  |  5+ osób: -15%  |  10+ osób: -20%                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Walidacja nazwy drużyny

```typescript
const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Nazwa musi mieć minimum 3 znaki' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Nazwa może mieć maksymalnie 50 znaków' };
  }
  
  // Tylko litery, cyfry, spacje, myślniki, apostrofy
  const validPattern = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s\-'\.]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Nazwa zawiera niedozwolone znaki' };
  }
  
  // Sprawdź czy nie zawiera wulgarnych słów (mockowa lista)
  const bannedWords = ['dupa', 'chuj', 'kurwa', 'pierdol'];
  const lowerName = trimmed.toLowerCase();
  if (bannedWords.some(word => lowerName.includes(word))) {
    return { valid: false, error: 'Nazwa zawiera niedozwolone słowa' };
  }
  
  return { valid: true };
};
```

### Helper do pobierania istniejących drużyn

```typescript
// W mockData.ts
export const getExistingTeamsForEvent = (eventId: string): Array<{
  name: string;
  memberCount: number;
}> => {
  const teamsMap = new Map<string, number>();
  
  mockRegistrations
    .filter(r => r.eventId === eventId && r.teamName && r.status !== 'cancelled')
    .forEach(r => {
      const count = teamsMap.get(r.teamName!) || 0;
      teamsMap.set(r.teamName!, count + 1);
    });
  
  return Array.from(teamsMap.entries())
    .map(([name, memberCount]) => ({ name, memberCount }))
    .sort((a, b) => b.memberCount - a.memberCount);
};
```

---

## 3. System ubezpieczeń z panelem admina

### Nowa zakładka w AdminDashboard

Dodam nową zakładkę "Ustawienia" (Settings) w panelu SuperAdmina z sekcją ubezpieczeń:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Panel Administratora                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Pulpit] [Moderacja] [Uczestnicy] ... [Ustawienia]                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ⚙️ Ustawienia platformy                                                    │
│                                                                             │
│ ╔═══════════════════════════════════════════════════════════════════════╗  │
│ ║ 🛡️ Ubezpieczenia NNW                                                   ║  │
│ ╠═══════════════════════════════════════════════════════════════════════╣  │
│ ║                                                                        ║  │
│ ║ Tekst informacyjny dla uczestników:                                   ║  │
│ ║ ┌──────────────────────────────────────────────────────────────────┐  ║  │
│ ║ │ [Edytor WYSIWYG - RichTextEditor]                                │  ║  │
│ ║ │ Ubezpieczenie NNW zapewnia ochronę podczas całych zawodów...     │  ║  │
│ ║ └──────────────────────────────────────────────────────────────────┘  ║  │
│ ║                                                                        ║  │
│ ║ Kalkulator składek:                                                   ║  │
│ ║                                                                        ║  │
│ ║ Opłata bazowa:        [___15___] zł                                   ║  │
│ ║ Mnożnik wiekowy:      [__0.50__] zł za każdy rok powyżej 18          ║  │
│ ║ Maksymalny wiek:      [___70___] lat                                  ║  │
│ ║                                                                        ║  │
│ ║ 📊 Przykładowe składki:                                               ║  │
│ ║ • Wiek 18-25: 15-19 zł                                                ║  │
│ ║ • Wiek 30: 21 zł                                                      ║  │
│ ║ • Wiek 40: 26 zł                                                      ║  │
│ ║ • Wiek 50: 31 zł                                                      ║  │
│ ║ • Wiek 60: 36 zł                                                      ║  │
│ ║                                                                        ║  │
│ ║               [Zapisz ustawienia ubezpieczeń]                         ║  │
│ ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Nowy typ w types/index.ts

```typescript
// Globalne ustawienia ubezpieczeń (edytowalne przez admina)
export interface GlobalInsuranceSettings {
  infoHtml: string;        // Tekst informacyjny HTML
  baseFee: number;         // Opłata bazowa (np. 15 zł)
  ageMultiplier: number;   // Mnożnik wiekowy (np. 0.5 zł/rok)
  maxAge: number;          // Maksymalny wiek (np. 70)
}
```

### Mockowe dane

```typescript
// W mockData.ts
export const mockGlobalInsuranceSettings: GlobalInsuranceSettings = {
  infoHtml: `
    <p><strong>Ubezpieczenie NNW dla sportowców</strong></p>
    <p>Ubezpieczenie od następstw nieszczęśliwych wypadków zapewnia:</p>
    <ul>
      <li>Ochronę podczas całych zawodów i rozgrzewki</li>
      <li>Pokrycie kosztów leczenia do 10 000 zł</li>
      <li>Świadczenie za trwały uszczerbek na zdrowiu</li>
      <li>Assistance medyczne</li>
    </ul>
    <p>Polisa jest ważna od momentu startu do zakończenia imprezy.</p>
    <p><a href="/info/ubezpieczenia">Szczegóły ubezpieczenia →</a></p>
  `,
  baseFee: 15,
  ageMultiplier: 0.5,
  maxAge: 70,
};
```

### Integracja z formularzem rejestracji

W kroku 3 (Ubezpieczenie) pobieramy globalne ustawienia i wyświetlamy:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Ubezpieczenie NNW (opcjonalne)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [Tekst z globalInsuranceSettings.infoHtml - RichTextDisplay]               │
│                                                                             │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                             │
│ [✓] Chcę wykupić ubezpieczenie NNW                                         │
│                                                                             │
│ Składka dla Twojego wieku (38 lat): 25 zł                                  │
│ (opłata bazowa 15 zł + dodatek wiekowy 10 zł)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Formuła kalkulacji

```typescript
const calculateInsurancePrice = (age: number, settings: GlobalInsuranceSettings): number => {
  if (age > settings.maxAge) {
    return 0; // Brak możliwości ubezpieczenia
  }
  
  const ageAddition = Math.max(0, age - 18) * settings.ageMultiplier;
  return Math.round(settings.baseFee + ageAddition);
};

// Przykłady:
// Wiek 18: 15 + 0 * 0.5 = 15 zł
// Wiek 25: 15 + 7 * 0.5 = 18.5 → 19 zł
// Wiek 40: 15 + 22 * 0.5 = 26 zł
// Wiek 60: 15 + 42 * 0.5 = 36 zł
```

---

## Struktura plików do modyfikacji/utworzenia

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie GlobalInsuranceSettings |
| `src/data/mockData.ts` | Modyfikacja | mockGlobalInsuranceSettings + getExistingTeamsForEvent + rejestracje z drużynami |
| `src/components/registration/RegistrationForm.tsx` | Modyfikacja | Logika profilu, rozbudowa drużyn, integracja ubezpieczeń |
| `src/pages/admin/AdminDashboard.tsx` | Modyfikacja | Dodanie zakładki "Ustawienia" |
| `src/pages/admin/components/AdminSettingsTab.tsx` | Nowy | Panel ustawień z sekcją ubezpieczeń |

---

## Szczegóły techniczne

### Wykrywanie kompletności profilu

```typescript
// W RegistrationForm.tsx
const { user } = useAuth();

const isProfileComplete = useMemo(() => {
  if (!user) return false;
  return !!(user.birthYear && user.gender);
}, [user]);

// Jeśli profil jest kompletny, wstępnie wypełnij datę:
useEffect(() => {
  if (isProfileComplete && user?.birthYear) {
    setBirthYear(String(user.birthYear));
    setBirthMonth('01');
    setBirthDay('01');
  }
}, [isProfileComplete, user]);
```

### Callout zachęcający do uzupełnienia profilu

```tsx
{!isProfileComplete && (
  <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
    <AlertTriangle className="h-4 w-4 text-amber-600" />
    <AlertTitle>Uzupełnij swój profil</AlertTitle>
    <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <span>
        Dodaj datę urodzenia i płeć w profilu, aby automatycznie uzupełniać formularze.
      </span>
      <Button variant="outline" size="sm" asChild>
        <Link to="/participant?tab=profile">Przejdź do profilu</Link>
      </Button>
    </AlertDescription>
  </Alert>
)}
```

### State dla trybu drużyny

```typescript
type TeamMode = 'none' | 'create' | 'join';

const [teamMode, setTeamMode] = useState<TeamMode>('none');
const [newTeamName, setNewTeamName] = useState('');
const [selectedExistingTeam, setSelectedExistingTeam] = useState('');
const [teamNameError, setTeamNameError] = useState('');

const existingTeams = useMemo(() => {
  return getExistingTeamsForEvent(event.id);
}, [event.id]);
```

---

## Mockowe dane drużyn

Dodam do istniejących rejestracji kilka z nazwami drużyn:

```typescript
// Modyfikacja istniejących rejestracji w mockRegistrations
{ 
  id: 'r4', 
  eventId: 'e9', 
  ...
  teamName: 'Biegacze Wrocław',  // Nowe pole
},
{ 
  id: 'r7', 
  eventId: 'e9', 
  ...
  teamName: 'Biegacze Wrocław',  // Ta sama drużyna
},

// Nowe rejestracje z drużynami dla wydarzenia e11 (Tatry Ultra)
{ 
  id: 'r-team-1', 
  eventId: 'e11', 
  teamName: 'KB Górskie Wilki',
  ...
},
{ 
  id: 'r-team-2', 
  eventId: 'e11', 
  teamName: 'KB Górskie Wilki',
  ...
},
{ 
  id: 'r-team-3', 
  eventId: 'e11', 
  teamName: 'Ultra Team PL',
  ...
},
```

---

## Podsumowanie zmian

1. **Profil** → automatyczne uzupełnianie danych + callout dla niekompletnych
2. **Drużyny** → tworzenie/dołączanie + walidacja nazw + lista istniejących
3. **Ubezpieczenia** → panel admina z edytorem tekstu + kalkulator składek

Wszystkie zmiany są w pełni zintegrowane z istniejącym systemem rejestracji i panelem administratora.
