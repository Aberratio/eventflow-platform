

# Baner cookies z opcjami i zapisem w localStorage

## Opis

Nowy komponent `CookieConsent` wyswietlany na dole ekranu jako sticky baner. Uzytkownik moze:
- **Zaakceptowac wszystkie** cookies jednym kliknieciem
- **Odrzucic opcjonalne** (tylko niezbedne)
- **Dostosowac** -- rozwinac panel z checkboxami dla poszczegolnych kategorii

Wybor zapisywany w `localStorage` pod kluczem `cookie-consent`. Jesli klucz istnieje, baner sie nie pojawia.

## Kategorie cookies

| Kategoria | Domyslnie | Mozna wylaczyc? | Opis |
|-----------|-----------|-----------------|------|
| Niezbedne | wl. | Nie | Dzialanie strony, sesja, koszyk |
| Analityczne | wyl. | Tak | Statystyki odwiedzin, Google Analytics |
| Marketingowe | wyl. | Tak | Reklamy, remarketing |
| Funkcjonalne | wyl. | Tak | Personalizacja, preferencje wyswietlania |

## UI

Baner na dole ekranu (`fixed bottom-0`), z-index powyzej bottom nav. Zawiera:
- Krotki tekst informacyjny
- Przycisk "Dostosuj" -- rozwija checkboxy kategorii
- Przycisk "Tylko niezbedne" (outline)
- Przycisk "Akceptuj wszystkie" (primary)

Po rozwinieciu "Dostosuj" -- lista kategorii z opisami i switchami. "Niezbedne" zawsze wlaczone i zablokowane (disabled).

## Zapis w localStorage

```
klucz: "cookie-consent"
wartosc: JSON {
  necessary: true,
  analytics: boolean,
  marketing: boolean,
  functional: boolean,
  timestamp: string (ISO date)
}
```

Przy starcie aplikacji komponent sprawdza `localStorage.getItem('cookie-consent')` -- jesli istnieje, baner nie renderuje sie wcale.

## Szczegoly techniczne

### Nowy plik: `src/components/CookieConsent.tsx`

Komponent standalone:
- Stan `visible` -- na poczatku `!localStorage.getItem('cookie-consent')`
- Stan `showDetails` -- rozwijanie panelu dostosowania
- Stany checkboxow: `analytics`, `marketing`, `functional` (domyslnie `false`)
- Funkcja `saveConsent(options)` -- zapisuje do localStorage i ustawia `visible = false`
- "Akceptuj wszystkie" -> `saveConsent({ necessary: true, analytics: true, marketing: true, functional: true })`
- "Tylko niezbedne" -> `saveConsent({ necessary: true, analytics: false, marketing: false, functional: false })`
- "Zapisz preferencje" (w trybie dostosowania) -> `saveConsent({ necessary: true, analytics, marketing, functional })`

Uzywa komponentow: `Button`, `Switch`, `Card`.

### Zmiana w: `src/App.tsx`

Dodanie `<CookieConsent />` obok `<OnboardingDialog />` wewnatrz `BrowserRouter`, aby baner byl dostepny na kazdej stronie.

