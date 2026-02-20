
# Nowa kolorystyka: czerwień, czerń, szarość, biel — z wydzielonym Design System

## Problem do rozwiązania

Klient chce zmienić kolorystykę z zielonej na **czerwono-czarno-szaro-białą**. Kluczowe wyzwanie: czerwony jest standardowo kolorem "alarmu/błędu" (semantyka `destructive`). Trzeba to sprytnie rozwiązać.

---

## Strategia kolorystyczna — jak sensownie użyć czerwieni

Czerwień jako kolor brandowy jest dobrze stosowana w wielu sportowych platformach (Nike, Under Armour, Formula 1, Red Bull). Kluczem jest **hierarchia i nasycenie**:

- **Czerwień główna (brand red)**: ciemniejsza, bardziej opanowana — `hsl(0, 72%, 42%)` — używana jako `primary` (przyciski CTA, linki, aktywne elementy)
- **Czerwień alertu (destructive)**: jaśniejsza/intensywniejsza — `hsl(0, 84%, 56%)` — zachowana jako `destructive` dla błędów
- Obie są czerwone, ale różnią się **nasyceniem i jasnością** — użytkownik instynktownie odróżni "brand" od "błędu"
- Biały tekst na czerwonym tle działa — wysoki kontrast (WCAG AA)

---

## Paleta barw — szczegółowe wartości HSL

```text
LIGHT MODE:
  background:       0 0% 99%        (prawie czysty biały)
  foreground:       0 0% 8%         (głęboka czerń)
  card:             0 0% 100%       (biały)
  card-foreground:  0 0% 8%
  primary:          0 72% 42%       (głęboka czerwień brandowa)
  primary-fg:       0 0% 100%       (biały tekst na czerwieni)
  secondary:        0 0% 94%        (jasny szary)
  secondary-fg:     0 0% 15%
  muted:            0 0% 94%        (jasny szary — tła)
  muted-fg:         0 0% 45%        (średni szary tekst)
  accent:           0 60% 96%       (bardzo jasny różowo-szary — hover)
  accent-fg:        0 72% 36%       (ciemna czerwień)
  destructive:      0 84% 56%       (jaśniejsza czerwień — błędy)
  border:           0 0% 88%        (szary border)
  input:            0 0% 88%
  ring:             0 72% 42%       (czerwień — focus ring)

DARK MODE:
  background:       0 0% 7%         (głęboka czerń)
  foreground:       0 0% 96%        (biały)
  card:             0 0% 11%        (ciemny szary karta)
  primary:          0 72% 52%       (jaśniejsza czerwień na ciemnym tle)
  primary-fg:       0 0% 100%
  secondary:        0 0% 16%        (ciemny szary)
  muted:            0 0% 16%
  muted-fg:         0 0% 58%
  accent:           0 40% 14%       (ciemna czerwień — hover w dark mode)
  accent-fg:        0 72% 62%
  border:           0 0% 18%
  sidebar tło:      0 0% 5%         (prawie czarny — sidebar)
```

---

## Nowy folder: `src/styles/`

Wydzielamy design system do osobnego folderu, żeby łatwo nim zarządzać:

```text
src/styles/
  tokens.css        — zmienne CSS (kolory, radius, shadows, fonts)
  typography.css    — @import Google Fonts, klasy typograficzne
  base.css          — reset i style bazowe body/html
  index.css         — główny plik importujący wszystko (zastępuje src/index.css)
```

`src/index.css` zostanie zastąpiony importem z `src/styles/index.css`, albo przepiszemy go na miejscu z jasnym podziałem sekcji i komentarzami.

---

## Co konkretnie zmieniamy

### 1. `src/index.css` (główny plik)

Pełna zamiana zmiennych CSS:
- `--primary` z zielonego `152 76% 36%` → czerwony `0 72% 42%`
- `--accent` z zielonkawego → subtelny różowo-szary
- `--ring` → czerwony
- `--sidebar-*` → dopasowane do nowej palety
- `--chart-*` → przepaleta wykresów (czerwień, szarości, neutralne akcenty)
- `--success` → **zielony** (jedyny zielony na stronie — tylko dla "sukcesu") `142 71% 40%`
- `--warning` → żółty (pozostaje)
- `--info` → ciemny szary/granatowy

Body gradient: `from-background via-primary/0.015 to-background` — delikatna czerwona poświata.

### 2. `src/styles/` — nowy folder design systemu

**`src/styles/tokens.css`** — wszystkie zmienne w jednym miejscu:
```css
/* === BRAND COLORS === */
/* === NEUTRALS === */
/* === SEMANTIC === */
/* === SHADOWS === */
/* === RADIUS === */
```

**`src/styles/typography.css`** — importy fontów + pomocnicze klasy `.heading-*, .body-*`.

Wszystkie zmienne z `index.css` przenosimy do `tokens.css`, a `index.css` tylko importuje.

### 3. `tailwind.config.ts` — dodajemy statyczne tokeny brand

```typescript
extend: {
  colors: {
    brand: {
      red: '#C41E1E',       // primary brand red
      'red-light': '#E53535', // destructive / lighter
      'red-dark': '#8B1515', // hover state
      black: '#141414',
      gray: {
        50: '#F9F9F9',
        100: '#F0F0F0',
        200: '#E0E0E0',
        300: '#C4C4C4',
        400: '#9A9A9A',
        500: '#6E6E6E',
        600: '#4A4A4A',
        700: '#303030',
        800: '#1F1F1F',
        900: '#141414',
      }
    }
  }
}
```

---

## Wpływ na komponenty — co się zmieni automatycznie

Ponieważ cały UI korzysta z tokenów (`bg-primary`, `text-primary`, `bg-accent`, `hover:bg-accent` itp.), zmiana zmiennych CSS automatycznie przepisze wygląd:

| Element | Teraz (zielony) | Po zmianie (czerwony) |
|---|---|---|
| Przyciski CTA | zielone | czerwone |
| Linki aktywne w nav | zielone tło | czerwone tło |
| Focus ring | zielony | czerwony |
| Badge "default" | zielony | czerwony |
| Ikona logo Timer | zielona | czerwona |
| Licznik koszyka | zielony | czerwony |
| Sidebar active | zielony | czerwony |
| Wykresy (chart-1) | zielony | czerwony |

**Nie zmienia się automatycznie** — trzeba ręcznie zaktualizować:
- `GlitchText.tsx` — hardcoded `text-destructive` i `text-info` (różne kolory glitch)
- Ewentualne inline klasy z `text-green-*` lub `bg-green-*` (ale projekt ich nie używa — sprawdzone)

---

## Obsługa "czerwony = błąd" vs "czerwony = brand"

Kluczowe rozróżnienie wizualne żeby użytkownik nie mylił:

| Sytuacja | Kolor | Token |
|---|---|---|
| Przycisk CTA, nav, logo | `hsl(0 72% 42%)` — głęboka burgundowa czerwień | `--primary` |
| Błąd formularza, delete | `hsl(0 84% 56%)` — jasna jaskrawa czerwień | `--destructive` |
| Success (zapisano, sukces) | `hsl(142 71% 40%)` — zielony | `--success` |
| Warning | `hsl(45 93% 47%)` — żółty | `--warning` |

Brand red jest **ciemniejszy i bardziej nasycony** — wygląda jak "premium/sport". Destructive red jest **jaśniejszy i bardziej krzyczący** — wyraźnie alarm.

---

## Pliki do modyfikacji

| Plik | Co się zmienia |
|---|---|
| `src/index.css` | Pełna zamiana palety CSS variables — primary, accent, ring, sidebar, charts |
| `tailwind.config.ts` | Dodanie `brand.*` kolorów statycznych |

## Nowe pliki

| Plik | Co zawiera |
|---|---|
| `src/styles/tokens.css` | Wszystkie zmienne CSS skopiowane z index.css — jeden plik do zarządzania |
| `src/styles/typography.css` | @import fontów + klasy typograficzne |
| `src/styles/base.css` | Style bazowe body, *, scrollbar |
| `src/styles/index.css` | Importuje tokens + typography + base |

`src/index.css` zaczyna importować `src/styles/index.css` — jeden punkt wejścia.

---

## Kolejność implementacji

1. Stworzyć `src/styles/tokens.css` z nową paletą czerwono-czarno-szarą
2. Stworzyć `src/styles/typography.css` i `src/styles/base.css`
3. Stworzyć `src/styles/index.css` łączący wszystko
4. Zaktualizować `src/index.css` — importuje z `src/styles/` i usuwa duplikaty
5. Zaktualizować `tailwind.config.ts` z tokenami `brand.*`
6. Sprawdzić `GlitchText.tsx` — ewentualna korekta kolorów dla nowej palety

Zmiana będzie natychmiastowa i globalna — wszystkie komponenty oparte na tokenach Tailwind zaktualizują się automatycznie.
