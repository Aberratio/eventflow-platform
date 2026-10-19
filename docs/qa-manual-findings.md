# Wyniki testów manualnych (dev) – zadanie 1

Środowisko: portal-dev.zmierzymyczas.kokot.it, Playwright (1 przeglądarka, bez obrazów/fontów, 10 s przerwy). Zrzuty: `test-results-dev/manual/`.

## Tabela (zadanie 1)

| # | Punkt | Wynik | Dowód |
|---|-------|-------|-------|
| 1 | `/wyniki` → 404 | POTWIERDZONE | `/wyniki` = strona „FALSTART! 404 … ta strona nie istnieje”, HTTP **200** (soft 404). `/wyniki/live` działa. Linki do `/wyniki` są na `/` (1 link) i w LiveResultsPage („Archiwum wyników”). `p1-wyniki.png` |
| 2 | Stopka `/info/regulamin`, `/info/polityka-prywatnosci`, `/info/rodo` → 404 | POTWIERDZONE | Wszystkie trzy: ekran 404 (HTTP 200). `GET /info-pages` zwraca tylko `o-nas`, `oferta`, `kontakt`. Stopka (Footer.tsx:79-95) ma te linki na sztywno. `p2-regulamin.png` |
| 3 | Format cen | POTWIERDZONE (częściowo) | Strona produktu: `699 zł`, `899 zł`, `200 zł` (surowa liczba, bez `,00`). Kod: `{product.price} zł` (ShopProductPage.tsx:180, ProductCard.tsx:67). Dla cen z groszami spodziewane `49.5 zł` – niezweryfikowane na danych (brak takiego produktu w seedzie; lista `/shop` nie dała odczytu tekstu cen). `p3-product.png` |
| 4 | Lista przy błędzie API | POTWIERDZONE | Mock 500 na `/events`, `/shop/products`, `/series`, `/challenges`: na `/events` „Nie znaleziono wydarzeń”, `/shop` „Nie znaleziono produktów”, `/series` „Nie znaleziono serii”; `/challenges` pusta lista bez komunikatu. Żaden nie pokazuje błędu. Brak odpowiedzi (route bez fulfill, ~20 s): bez spinnera, ten sam pusty stan („Znaleziono 0…”) – spinner bez końca NIE POTWIERDZONY. `p4-*.png` |
| 5 | Embed | POTWIERDZONE (częściowo) | Iframe z `qa-embed-host.example` ładuje `/events/lubi…/embed` (CSP `frame-ancestors *`), ale pokazuje tylko „To wydarzenie używa formularza Zmierzymy Czas. Przejdź do zapisów” + dolny pasek nawigacji aplikacji (Start/Kalendarz/Sklep/Zaloguj), bez danych wydarzenia. Zwykła `/events/<slug>` w iframe zablokowana (`X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`, chrome-error). Zweryfikowano tylko wydarzenie `lesny-bieg-testowy-2025`. `p5-embed.png` |
| 6 | Hosty zewnętrzne | NIE POTWIERDZONE | Na `/`, `/events`, wydarzeniu, `/shop` tylko `fonts.googleapis.com` i `fonts.gstatic.com`. Brak CDN/trackerów. Uwaga: fonty Google ładują się także przed zgodą na cookies (kwestia prywatności, minor). |
| 7 | Dostępność | CZĘŚCIOWO | Dwa `<main>` na `/`: POTWIERDZONE. Przyciski bez nazwy: NIE (0 na `/`). `Pokaż hasło` na `/login`: 16×16 px (<24): POTWIERDZONE. Skip link: brak, pierwszy Tab = logo: POTWIERDZONE. Menu mobilne 375 px: po Escape `aria-expanded` nadal `true`, focus na przycisku; zamknięcie wizualnie niezweryfikowane (prawdopodobnie NIE zamyka się). |
| 8 | Wyzwanie dla anonima | POTWIERDZONE (inna przyczyna) | `/challenges/wyzwanie-5-dych` pokazuje „Wyzwanie nie znalezione” i tylko „Wróć do listy”. Przyczyna: `GET /challenges/wyzwanie-5-dych` → `{"success":true,"data":null}`, a `GET /challenges/ch-5-dych` (id) zwraca dane. Brak CTA logowania, bo strona nie renderuje się. `p8-challenge.png` |

## Defekty

1. **Szczegóły wyzwania nie działają po slugu (major).** Kroki: `/challenges` → slug z listy → `/challenges/<slug>`. Oczekiwane: szczegóły wyzwania. Faktyczne: „Wyzwanie nie znalezione”; API zwraca `data:null` dla sluga, a dla id działa. Dowód j.w. (API; front używa `getChallengeBySlug`).
2. **Martwe linki prawne w stopce (major).** Regulamin, Polityka prywatności, RODO → 404 na każdej stronie; to treści prawne wymagane dla serwisu z zapisami i płatnościami. Dowód: pkt 2.
3. **`/wyniki` → 404 z linków na stronie głównej i „Archiwum wyników” (major).** Dowód: pkt 1.
4. **Soft 404 (minor).** Nieistniejące trasy: HTTP 200 z treścią 404 (dla SEO i monitoringu).
5. **Brak komunikatu błędu na listach przy awarii API (minor/major).** Błąd 500 wygląda jak „brak wyników”; `/challenges` bez żadnego komunikatu.
6. **Ceny jako surowe liczby (minor).** `699 zł` zamiast `699,00 zł`; ryzyko `49.5 zł`.
7. **Dostępność (minor):** dwa `<main>`, brak skip linka, `Pokaż hasło` 16×16 px, menu mobilne nie reaguje (prawdopodobnie) na Escape.
8. **Embed (minor):** w iframe widać dolną nawigację aplikacji; strona embed nie pokazuje danych wydarzenia (do potwierdzenia dla wydarzenia z otwartymi zapisami).
9. **Fonty Google przed zgodą na cookies (minor, prywatność).**

## Dane utworzone na dev

Brak. Wyłącznie odczyty; zapytania zamockowane w przeglądarce nie dotarły do API. Skrypt tymczasowy usunięty.

## Nie sprawdzono

- **Zadanie 2 (przepływy zalogowane) w całości** – host wielokrotnie zwracał 429 oraz odrzucał połączenia (po ~6 min przerwach); nie podjąłem zapisów na wydarzenia na współdzielonym dev. Do wykonania osobno.
- Pkt 3: dokładny tekst cen na liście `/shop` i cena z groszami.
- Pkt 7: wizualne zamknięcie menu mobilnego po Escape.
- Pkt 5: embed dla wydarzenia z otwartymi zapisami.
