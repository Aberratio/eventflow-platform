
# Plan: Kreatywne strony bledow z animacjami sportowymi

## Koncepcja

Stworze unikalne, animowane strony bledow nawiazujace do tematyki SportTime - mierzenia czasu i sportu. Kazda strona bedzie miala inny motyw i zabawne teksty po polsku.

## Strony do stworzenia

### 1. Strona 404 - "Falstart"

**Motyw:** Biegacz ktory wystartowak za wczesnie i zostal zdyskwalifikowany

**Animacje:**
- Animowany biegacz w pozycji startowej
- Czerwona flaga/swiatlo "FALSTART"
- Stoper pokazujacy czas "DNF" (Did Not Finish)
- Slady stop prowadzace... donikad

**Teksty:**
- "404 - FALSTART!"
- "Wybiegles poza trase... ta strona nie istnieje!"
- "Moze sprobuj jeszcze raz od linii startu?"

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🚩 FALSTART! 🚩                                │
│                                                             │
│         ┌─────────────────────────┐                        │
│         │   ⏱️  DNF               │ ← animowany stoper     │
│         │   --:--.---             │                        │
│         └─────────────────────────┘                        │
│                                                             │
│              🏃💨  ← animowany biegacz                     │
│         ═══════════════════════════                        │
│               (linia mety)                                  │
│                                                             │
│         "Wybiegłeś poza trasę!"                            │
│         "Ta strona nie istnieje..."                        │
│                                                             │
│              [🏠 Wróć na start]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Strona 500 - "Awaria sprzetu"

**Motyw:** Zepsuty stoper/system pomiaru czasu

**Animacje:**
- Stoper z glitchujacymi cyframi
- Iskry lecace z "zepsutego" urzadzenia
- Migajace "ERROR" na wyswietlaczu

**Teksty:**
- "500 - AWARIA SYSTEMU!"
- "Nasz stoper sie zacial... technik juz biegnie!"
- "Sprobuj odswiezyc za chwile"

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ┌─────────────────────────┐                        │
│         │   ⏱️  E̸R̵R̶O̷R̸            │                        │
│         │   8̷8̸:̵8̶8̷.̸8̵8̶8̷          │ ← glitchujace cyfry   │
│         │   ⚡💥⚡                 │ ← iskry               │
│         └─────────────────────────┘                        │
│                                                             │
│              🔧🏃 ← technik biegnie                        │
│                                                             │
│         "Nasz stoper się zaciął!"                          │
│         "Technik już biegnie na pomoc..."                  │
│                                                             │
│              [🔄 Spróbuj ponownie]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Strona 503 - "Przerwa techniczna"

**Motyw:** Zawody wstrzymane - przerwa na nawodnienie

**Animacje:**
- Animowany znak "STOP" z miga
- Butelka wody "pijaca"
- Countdown do wznowienia

**Teksty:**
- "503 - PRZERWA TECHNICZNA"
- "Zawody chwilowo wstrzymane"
- "Uzupelniamy plyny... wroć za chwile!"

### 4. Strona 403 - "Strefa VIP"

**Motyw:** Proba wejscia do strefy VIP bez akredytacji

**Animacje:**
- Animowana barierka/tasma
- Ochroniarz krecacy glowa "nie"
- Migajaca akredytacja

**Teksty:**
- "403 - BRAK AKREDYTACJI!"
- "Ta strefa jest tylko dla VIPow"
- "Potrzebujesz specjalnego wejscia"

## Wspolne elementy animacji

### CSS Keyframes (dodane do tailwind.config.ts):

```typescript
keyframes: {
  // Biegacz
  'runner': {
    '0%, 100%': { transform: 'translateX(0)' },
    '50%': { transform: 'translateX(20px)' },
  },
  // Glitch tekstu
  'glitch': {
    '0%, 100%': { transform: 'translate(0)' },
    '20%': { transform: 'translate(-2px, 2px)' },
    '40%': { transform: 'translate(2px, -2px)' },
    '60%': { transform: 'translate(-2px, -2px)' },
    '80%': { transform: 'translate(2px, 2px)' },
  },
  // Miganie
  'blink': {
    '0%, 50%, 100%': { opacity: '1' },
    '25%, 75%': { opacity: '0' },
  },
  // Pulsowanie stopera
  'stopwatch-pulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
  },
  // Skakanie cyfr
  'digit-flip': {
    '0%': { transform: 'rotateX(0deg)' },
    '50%': { transform: 'rotateX(90deg)' },
    '100%': { transform: 'rotateX(0deg)' },
  },
  // Iskry
  'spark': {
    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateY(-20px) scale(0)', opacity: '0' },
  },
  // Krecenie glowa
  'shake-head': {
    '0%, 100%': { transform: 'rotate(0deg)' },
    '25%': { transform: 'rotate(-15deg)' },
    '75%': { transform: 'rotate(15deg)' },
  },
}
```

## Komponenty do stworzenia

### 1. AnimatedStopwatch.tsx
Animowany stoper z możliwością wyswietlania roznych stanow (DNF, ERROR, czas)

### 2. RunnerAnimation.tsx
SVG animowanego biegacza

### 3. GlitchText.tsx
Tekst z efektem glitch

### 4. SparkEffect.tsx
Animowane iskry

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/pages/NotFound.tsx` | Modyfikacja | Nowa strona 404 z animacja "Falstart" |
| `src/pages/ServerError.tsx` | Nowy | Strona 500 z glitchujacym stoperem |
| `src/pages/ServiceUnavailable.tsx` | Nowy | Strona 503 z przerwa techniczna |
| `src/pages/Forbidden.tsx` | Nowy | Strona 403 z ochroniarzem |
| `src/components/errors/AnimatedStopwatch.tsx` | Nowy | Komponent animowanego stopera |
| `src/components/errors/RunnerAnimation.tsx` | Nowy | SVG animowanego biegacza |
| `src/components/errors/GlitchText.tsx` | Nowy | Tekst z efektem glitch |
| `tailwind.config.ts` | Modyfikacja | Dodanie nowych keyframes i animacji |
| `src/index.css` | Modyfikacja | Dodatkowe style dla animacji |

## Szczegoly animacji 404 - Falstart

```tsx
// NotFound.tsx - struktura
const NotFound = () => {
  const [showRunner, setShowRunner] = useState(false);
  
  useEffect(() => {
    // Animacja wejscia
    setTimeout(() => setShowRunner(true), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Czerwona flaga */}
        <div className="animate-bounce">
          🚩
        </div>
        
        {/* Stoper z DNF */}
        <AnimatedStopwatch status="dnf" />
        
        {/* Animowany biegacz */}
        <div className={cn(
          "transition-all duration-1000",
          showRunner ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}>
          <RunnerAnimation />
        </div>
        
        {/* Linia mety */}
        <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        {/* Teksty */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-destructive animate-pulse">
            404
          </h1>
          <p className="text-2xl font-semibold">FALSTART!</p>
          <p className="text-muted-foreground">
            Wybiegłeś poza trasę... ta strona nie istnieje!
          </p>
        </div>
        
        {/* Przycisk */}
        <Button asChild>
          <Link to="/">
            🏠 Wróć na start
          </Link>
        </Button>
      </div>
    </div>
  );
};
```

## Szczegoly animacji 500 - Awaria

```tsx
// ServerError.tsx - struktura
const ServerError = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-destructive/10 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Zepsuty stoper */}
        <div className="relative">
          <AnimatedStopwatch status="error" />
          {/* Iskry */}
          <SparkEffect />
        </div>
        
        {/* Glitchujacy tekst */}
        <GlitchText>500</GlitchText>
        
        {/* Technik */}
        <div className="text-4xl animate-bounce">
          🔧🏃
        </div>
        
        <div className="space-y-2">
          <p className="text-2xl font-semibold">AWARIA SYSTEMU!</p>
          <p className="text-muted-foreground">
            Nasz stoper się zaciął... technik już biegnie!
          </p>
        </div>
        
        <Button onClick={() => window.location.reload()}>
          🔄 Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
};
```

## Zabawne teksty

### 404 - Falstart
- "Wybiegłeś poza trasę... ta strona nie istnieje!"
- "Sędzia pokazał czerwoną flagę - zły adres!"
- "DNF - Did Not Find (nie znaleziono)"

### 500 - Awaria
- "Nasz stoper się zaciął... technik już biegnie!"
- "Houston, mamy problem z pomiarem czasu!"
- "Ktoś potknął się o kabel... przepraszamy!"

### 503 - Przerwa
- "Zawody chwilowo wstrzymane - uzupełniamy płyny!"
- "Nawet serwery potrzebują przerwy na wodę"
- "Wrócimy szybciej niż Usain Bolt!"

### 403 - VIP
- "Hej, tu strefa VIP! Gdzie Twoja akredytacja?"
- "Ochroniarz mówi NIE - brak uprawnień"
- "Ta strona jest tylko dla zwycięzców... zaloguj się!"

## Responsywnosc

Wszystkie animacje beda responsywne:
- Na mobile: mniejsze elementy, uproszczone animacje
- Na desktop: pelne animacje, wieksze SVG

## Dostepnosc

- Animacje z `prefers-reduced-motion` - wylaczone dla uzytkownikow preferujacych mniej ruchu
- Odpowiednie aria-labels
- Semantyczny HTML
