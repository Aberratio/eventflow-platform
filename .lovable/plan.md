

# Plan: Urozmaicenie designu strony glownej + delikatny gradient globalny

## Cel
Dodanie wizualnego urozmaicenia strony glownej przy zachowaniu czytelnosci, minimalizmu i pelnej responsywnosci (mobile-first). Zmiany beda delikatne -- gradienty, subtelne tla sekcji, lekkie separatory -- bez naruszania struktury informacji.

## 1. Globalny gradient tla (index.css)

Dodanie delikatnego gradientu na `body` -- od lekko zielonkawego (primary) do bialego. Bedzie widoczny na calej apce jako subtelny akcent.

```css
body {
  background: linear-gradient(
    180deg, 
    hsl(var(--background)) 0%, 
    hsl(var(--primary) / 0.02) 50%, 
    hsl(var(--background)) 100%
  );
  background-attachment: fixed;
}
```

W dark mode gradient dostosowany do ciemniejszego tla.

## 2. Hero sekcja na stronie glownej (nowy komponent)

Dodanie lekkiego hero bannera na gorze strony glownej -- nie pelnoekranowego, a kompaktowego paska z gradientem i haslem. Bedzie wizualnym "otwarciem" strony zamiast nagiego naglowka "Nadchodzace wydarzenia".

- Gradient: od `primary/8` przez `transparent` do `secondary/5`
- Dekoracyjne kola/blury w tle (CSS, bez obrazkow)
- Krotkie haslo + 2 buttony CTA (Wydarzenia, Wyniki)
- Na mobile: kompaktowy, bez zbednych paddingw

**Nowy plik**: `src/components/home/HomeHero.tsx`

## 3. Sekcja "Nadchodzace wydarzenia" -- delikatne ulepszenie

- Lekki gradient separator miedzy hero a lista
- Drobny ornament: delikatna linia z gradientem primary jako separator sekcji

## 4. Sekcja LIVE -- wzmocnienie wizualne

Obecny `bg-destructive/5` jest ok, ale mozna dodac:
- Delikatny radialny gradient w tle (od center)
- Subtelna animacja gradientu (pulsowanie koloru)

## 5. Sekcja "Ostatnie wyniki" -- tlo z akcentem

- Dodanie lekkiego tla `bg-muted/20` z gradientem do przezroczystego
- Wizualne oddzielenie od sekcji LIVE

## 6. Sekcja "Partnerzy" -- bez zmian

Juz ma `bg-muted/30`, jest ok.

## 7. Dekoracyjne separatory miedzy sekcjami

Zamiast ostrych przejsc miedzy sekcjami -- delikatne gradienty jako separatory (linia o wysokosci 1-2px z gradientem primary -> transparent -> primary).

---

## Pliki do zmiany/utworzenia

| Plik | Operacja |
|------|----------|
| `src/index.css` | Edycja -- gradient tla body, dekoracyjne klasy CSS |
| `src/components/home/HomeHero.tsx` | Nowy -- kompaktowy hero z gradientem i CTA |
| `src/pages/Index.tsx` | Edycja -- dodanie HomeHero na gorze |
| `src/components/home/LiveResultsSection.tsx` | Edycja -- wzmocniony gradient tla |
| `src/components/home/RecentResultsSection.tsx` | Edycja -- lekkie tlo sekcji |
| `src/components/home/UpcomingEvents.tsx` | Edycja -- separator gradientowy |

## Zasady

- Zero zdjec, zero ciezkich assetow
- Wszystko w CSS/Tailwind -- gradienty, blury, opacity
- Mobile-first: na malych ekranach paddingi mniejsze, hero kompaktowy
- Czytelnosc: kontrast tekstu bez zmian, gradienty tylko dekoracyjne
- Dark mode: gradienty dostosowane automatycznie dzieki zmiennym CSS

