# Audyt dostępności WCAG 2.2 AA

Data: 2026-10-19/20. Zakres: front `eventflow-platform` na `origin/main` (13ffb02), API lokalne (`eventflow-server`, baza `zc_a11y`, seed demo).

## Metoda

- Stos lokalny: `php -S 127.0.0.1:8081` (kopia serwera z własnym `.env`, baza `zc_a11y`, `bin/migrate.php` + `bin/seed.php`) oraz `npm run dev` z `VITE_API_URL` na to API. Hosta dev nie używano.
- **axe-core** (`@axe-core/playwright`, tagi `wcag2a/2aa/21a/21aa/22aa`) na 68 ekranach x 2 viewporty (desktop 1280x800, mobile 360x800) = 136 przebiegów: publiczne (strona główna, wydarzenia, szczegóły, zapis, wyniki, serie, sklep, produkt, koszyk, wyzwania, live, logowanie, rejestracja, reset hasła, 404), uczestnik (10 zakładek, profil), organizator (panel, lista, formularz, 7 zakładek wydarzenia), moderator (10 sekcji), admin (14 sekcji + formularze nowych rekordów).
- Istniejący zestaw `e2e-dev/a11y` (struktura dokumentu, skip link, fokus klawiatury, dialogi, nazwy, formularze, reflow) uruchomiony na lokalnym stosie.
- Ręcznie/skryptowo: przejście Tab po stronie (widoczny fokus, kolejność, pułapki), Escape i powrót fokusu w dialogach, liczba `<main>` i `<h1>`, przeskoki poziomów nagłówków, nazwy przycisków/linków/pól, cele dotyku < 24 px, przepełnienie poziome na 360 px, kontrast (wartości z axe).
- Surowe wyniki (JSON) nie są w repo; skrypty audytu były pomocnicze.

## Wynik w liczbach

Przebiegi axe (reguła x ekran), baza `main` kontra wszystkie cztery gałęzie razem:

| Reguła axe | Przed | Po |
|---|---|---|
| color-contrast (serious) | 136 | 3 |
| button-name (critical) | 64 | 49 (długi ogon, A11Y-07/A11Y-22) |
| label (critical) | 8 | 4 |
| target-size (serious) | 4 | 0 |
| aria-progressbar-name, link-name, scrollable-region-focusable | 8 | 0 |
| aria-valid-attr-value, aria-hidden-focus, list | 6 | 6 (biblioteka, A11Y-20/21) |
| Ekrany z `<main>` != 1 | 12 | 4 (ekrany ładowania/zakładka biletów, A11Y-03) |

Priorytety: P1 = blokuje użycie (klawiatura, brak nazwy/etykiety, fokus, struktura, kontrast tekstu); P2 = poważny, ale z obejściem lub mniejszy zasięg.

## Tabela

PR: [L] `fix/a11y-landmarks-headings`, [F] `fix/a11y-forms-labels`, [K] `fix/a11y-keyboard-focus`, [C] `fix/a11y-contrast-targets`.

| ID | Ekran | WCAG | Opis | Pri | Status |
|---|---|---|---|---|---|
| A11Y-01 | Wszystkie | 2.4.1 | Brak linku "Przejdź do treści"; pierwszy Tab trafia w logo | P1 | Naprawione [L] (`Layout`: skip link + `main#main-content`) |
| A11Y-02 | Strona główna, Wydarzenia, Wyniki | 1.3.1, 4.1.2 | Dwa landmarki `<main>` (`Layout` + `EventsPage`, `PageContent`) | P1 | Naprawione [L] |
| A11Y-03 | 404/strony błędów; `/participant?tab=tickets`, `/my-starts` (stan ładowania) | 1.3.1 | Brak landmarku `<main>` | P2 | 404/błędy naprawione [L]; ekran ładowania zakładki biletów otwarte (skeleton bez `Layout`) |
| A11Y-04 | Prawie wszystkie | 1.3.1, 2.4.6 | Przeskoki poziomów nagłówków (h1 -> h3/h4/h5): `CardTitle` h3, nagłówki stopki h4, `AlertTitle` h5 | P2 | Naprawione [L] (CardTitle/stopka -> h2, AlertTitle -> p); zostają pojedyncze literalne `<h3>`/`<h5>` na panelu uczestnika |
| A11Y-05 | Logowanie, Rejestracja, Reset i Zapomniane hasło | 1.3.1, 3.3.2, 4.1.2 | `FormControl` opakowuje `div`, więc `id`/`aria-invalid`/`aria-describedby` nie trafiają na `<input>`; etykieta niepowiązana z polem (8 pól) | P1 | Naprawione [F] + test `getByLabelText` |
| A11Y-06 | Wydarzenia, Sklep, panele (ok. 85 `SelectTrigger`) | 4.1.2 | `combobox` bez nazwy dostępnej | P1 | Częściowo [F]: `SelectTrigger` bierze nazwę z placeholdera, filtry Rok/Dyscyplina/Sortuj opisane ręcznie; ogon w A11Y-22 |
| A11Y-07 | Strona główna (strzałki karuzeli), Profil (aparat), panele (akcje wiersza, usuń, zamknij, wyczyść), toast (zamknij), trigger filtrów (ikona) | 4.1.2, 2.4.4 | Przyciski/linki tylko z ikoną bez nazwy | P1 | Częściowo [F]: 20+ miejsc; reszta w A11Y-22 |
| A11Y-08 | Panel organizatora/wydarzenia (mobile) | 4.1.2 | Zakładki `TabsTrigger` z ukrytym tekstem (`hidden sm:inline`) bez nazwy | P1 | Naprawione [F] (`aria-label`) |
| A11Y-09 | Wyzwania (lista, szczegóły, panel uczestnika, admin) | 4.1.2 | `progressbar` bez nazwy | P2 | Naprawione [F] |
| A11Y-10 | Profil (adres profilu publicznego) | 4.1.2, 3.3.2 | Pole tylko do odczytu bez etykiety | P2 | Częściowo [F]; otwarte: kod embed w ustawieniach wydarzenia i część pól "Nowe wyzwanie" |
| A11Y-11 | Strona główna, Wydarzenia | 2.4.7 | Elementy bez widocznego wskaźnika fokusu (logo, "Zarejestruj", filtry, karty) | P1 | Naprawione [K] (`:focus-visible` w `base.css`; komponenty z własnym ringiem go nadpisują) |
| A11Y-12 | Strona główna (wyszukiwarka) | 2.4.7, 4.1.2 | Pole z `outline-none` bez zamiennika i bez nazwy | P1 | Naprawione [K] |
| A11Y-13 | Ustawienia cookies (stopka, "Dostosuj") | 2.4.3, 2.1.2, 4.1.2 | Panel bez roli dialog, bez pułapki fokusu/Escape, fokus nie wraca; przełączniki bez nazw | P1 | Naprawione [K] (modalny `Dialog`, `aria-labelledby` na przełącznikach, powrót fokusu; baner jako `region`) + testy |
| A11Y-14 | Wydarzenia, szuflada filtrów (375 px) | 2.4.3 | Po otwarciu fokus zostaje na wyzwalaczu (vaul) | P1 | Naprawione [K] (`DrawerContent` przenosi fokus do szuflady) |
| A11Y-15 | Panele z tabelami (admin/moderator/organizator) | 2.1.1 | Przewijalny kontener tabeli niedostępny z klawiatury | P2 | Naprawione [K] (`Table`: `tabIndex=0`, `role=group`, nazwa) |
| A11Y-16 | Wszystkie (136 ekranów) | 1.4.3 | `text-primary` (#2573DA) na ciemnych tłach 3.6-4.26:1 | P1 | Naprawione [C]: token `--primary-text` (= `--color-brand-navy-light`); `bg-primary` bez zmian; test kontrastu tokenów |
| A11Y-17 | Stopka, etykiety kart, placeholdery | 1.4.3 | `text-white/20..45` = 1.8-4.5:1 | P1 | Naprawione [C] (-> `/55`) |
| A11Y-18 | Admin (tabele), Wyniki, Wyzwania, 404, Sklep | 1.4.3 | `--text-muted` 4.1-4.4:1; biały tekst na `bg-destructive` 3.77:1; ciemny tekst ostrzeżenia na ciemnym tle 1.3:1; czerwony tekst na czerwonym tle 4.24:1 | P1 | Naprawione [C]: jaśniejszy `--text-muted` i `--color-danger`, osobny `--destructive-solid` dla tła, `text-warning` w badge'ach |
| A11Y-19 | Logowanie, Rejestracja, Reset | 2.5.8 | Przycisk "Pokaż hasło" 16x16 px | P2 | Naprawione [F] (cel 32x32) |
| A11Y-20 | Zapis na wydarzenie (po toaście) | 1.3.1, 4.1.2 | Radix `ToastViewport`: `<ol>` z dziećmi `role=status`, `span[aria-hidden][tabindex=0]` | P2 | Otwarte (zachowanie biblioteki; wymaga zmiany komponentu toast) |
| A11Y-21 | Organizator, lista wydarzeń | 4.1.2 | `aria-controls` zakładki wskazuje nieistniejący panel (`-content-all`, leniwe renderowanie) | P2 | Otwarte |
| A11Y-22 | Admin/organizator/moderator formularze i tabele | 4.1.2, 1.3.1 | Długi ogon: ok. 100 kontrolek (`SelectTrigger`, `Checkbox` zaznaczania wierszy, `Switch`, `Input`/`Textarea`) bez programowej nazwy na ok. 45 ekranach | P2 | Otwarte; kandydatów daje skan AST (`Checkbox/Switch/Input/SelectTrigger` bez `aria-label`/`id`/placeholdera) |
| A11Y-23 | Wydarzenia (lista) | 2.4.3 | Kolejność fokusu skacze w górę strony (filtry/karuzele w DOM po treści) | P2 | Otwarte; wymaga zmiany układu DOM (etap UX) |
| A11Y-24 | Wydarzenia, Wyniki, szczegóły wydarzenia | 2.5.8 | Checkboxy 16x16 i linki/przyciski tekstowe 16-20 px wysokości | P2 | Otwarte; axe nie flaguje (wyjątek odstępów/inline) |
| A11Y-25 | Menu mobilne (375 px) | 2.4.3, 2.1.2 | Fokus nie wchodzi do menu, brak pułapki (ten sam objaw co A11Y-14) | P1 | Poza zakresem (R-15, inny agent); test `mobile menu` nadal czerwony |

Razem 25 pozycji: P1 = 14, P2 = 11. Status: naprawione 14, częściowo 5 (A11Y-03/04/06/07/10), otwarte 5 (A11Y-20..24), poza zakresem 1 (A11Y-25).

## Sprawdzone bez zastrzeżeń

- `lang`, jeden widoczny `h1` na ekran (drugi `h1` w `EventsPage` ma `display:none`, nie wchodzi do drzewa dostępności).
- Reflow 360 px: brak poziomego przewijania strony na ekranach publicznych i uczestnika.
- Obrazy mają `alt`; linki i przyciski tekstowe mają nazwy.
- Dark mode jest jedynym zaimplementowanym motywem (`theme-light.css` jest pusty).

## Do etapu UX (poza WCAG)

- Poziome przewijanie całej strony na 360 px: lista wydarzeń organizatora, uczestnicy i wyniki wydarzenia, przegląd/administratorzy/zamówienia/strony w adminie (szerokie tabele).
- Cele dotyku poniżej 44 px (zalecenie, nie wymóg AA): przyciski tekstowe 20 px, checkboxy 16 px, "Zapomniałeś hasła?" 16 px.
- Teksty 10-11 px wersalikami z dużym trackingiem (stopka, etykiety kart).
- Kolejność kafelków/filtrów na liście wydarzeń (A11Y-23).

## Uwagi do scalania

- `fix/a11y-keyboard-focus`, `fix/a11y-contrast-targets` i `fix/a11y-forms-labels` dotykają tych samych linii w `Footer.tsx` i `Index.tsx` (Prettier z wtyczką Tailwind przestawia klasy); konflikty są mechaniczne: wziąć nagłówki `h2`, `aria-label` oraz `text-white/55`.
- Test `ParticipantTicketsTab (G-12)` jest czerwony po północy czasu lokalnego (względne daty w fixture vs UTC); niezwiązany z tą pracą.
