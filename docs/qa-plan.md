# Plan testów QA – ZmierzymyCzas (dev)

> English summary: QA test plan for the dev environment (Polish text): scope, environments, test accounts, risk areas and the task breakdown in `docs/qa-tasks/`.

Wersja 1, 2026-10-19. Środowisko docelowe: dev.

- Frontend: `https://portal-dev.zmierzymyczas.kokot.it`
- API: `https://portal-api-dev.zmierzymyczas.kokot.it/api/v1` (APP_ENV=staging)

## 1. Stan wyjściowy (Faza 1)

### 1.1 Baseline

`npm run test:e2e:dev` (2026-10-19): **12 passed, 1 skipped** (logowanie pominięte, brak `E2E_DEV_*`), 4,2 s, 8 workerów.

### 1.2 Mapa aplikacji

- **Trasy frontu** (`src/App.tsx`, ok. 75): publiczne (`/`, `/events`, `/wydarzenia`, `/events/:slug[/:tab]`, `/events/:slug/register[/success]`, `/series[/:slug]`, `/shop[/:slug]`, `/sklep`, `/cart`, `/order-success`, `/challenges[/:slug]`, `/wyniki/live`, `/athlete/:userId`, `/info/:slug`), auth (`/login`, `/logowanie`, `/register`, `/rejestracja`, `/forgot-password`, `/reset-password`, `/verify-email`, `/confirm-email-change`), embed (`/embed/event/:id/register`, `/events/:slug/embed`), preview (`/events/:slug/preview[/:tab]`, `/events/:slug/register/preview`), panele (`/profile`, `/participant/*`, `/organizer/*`, `/moderator/*`, `/admin/*` – ok. 30 tras edycji), strony błędów (`/400`–`/504`, `*`).
- **Role**: anonim, participant, organizer, moderator, admin, superadmin. Grupy w API: `adminRoles` = admin, superadmin; `staffRoles` = + moderator; `eventManagerRoles` = + organizer; `publisherRoles` = admin, superadmin.
- **API** (`src/Http/routes.php`, ok. 200 tras): 137 chronionych `AuthMiddleware` (30 dowolna zalogowana rola, 41 eventManager, 29 admin, 20 staff, 10 inne listy, 5 z kontrolą w handlerze), reszta publiczna lub z `optionalAuth`. Kontrola własności w handlerach (`$authorizeRegistration`, `$canManageEvent`, `$canManageEventMoney`, `$isSelf`). Webhooki Tpay/PayNow, `/dev/seed-event` (aktywny na staging, czyli na dev).
- **Nagłówki**: front – CSP, HSTS, XFO SAMEORIGIN, nosniff, Referrer-Policy, Permissions-Policy (z `.htaccess` generowanego w buildzie); API – `default-src 'none'`, XFO DENY, HSTS. CORS bez `Allow-Credentials`, metody `GET, POST, PATCH, DELETE, OPTIONS`.
- **Rate limiting w aplikacji**: tylko cooldown per użytkownik na reset hasła (60 s, 5/h). Globalny limit logowania per IP nie istnieje.

### 1.3 Inwentarz istniejących testów

| Warstwa | Zakres | Uwagi |
|---|---|---|
| `e2e/` (21 plików, ok. 215 testów) | auth, panele ról, edytor wydarzeń, workflow moderacji, rejestracja, sklep, responsywność (3), wizualne (20), nagłówki (8), trasy PL | lokalny backend z seedem `001_demo.sql` (znane hasła); nie działa na dev |
| `e2e-dev/dev-smoke.spec.ts` (13) | health, seed, listy, detal, serie, sklep→koszyk, 404, błędne logowanie, opcjonalne logowanie | jedyny zestaw na dev |
| vitest (108 plików) | logika, adaptery API, komponenty, generator CSP | poza zakresem uruchomień na dev |
| PHPUnit (172 pliki) | kontrakty HTTP, siatka RBAC (`Rbac/RbacGrid.php`), widoczność, rejestracje, webhooki, sanityzacja | lokalna/CI baza testowa |

**Luki na dev**: brak testów zalogowanych, RBAC i IDOR na wdrożeniu, a11y (brak `@axe-core/playwright` w zależnościach), wydajność (brak Lighthouse/web-vitals), SEO, odporność, responsywność poza 3 przypadkami, nagłówki faktycznie serwowane przez LiteSpeed.

### 1.4 Obserwacje z rozpoznania (hipotezy, do potwierdzenia w Fazie 4)

- **H1. Throttling hostingu**: po ok. 40 żądaniach w kilka sekund cały host (front i API) zwraca `429 Too Many Requests`, `Retry-After: 300`. Blokuje to równoległe testy i jest ryzykiem także dla prawdziwych użytkowników (np. wielu uczestników za jednym NAT na zawodach).
- **H2. CORS bez `PUT`**: API ma trasy `PUT` (np. `form-fields/reorder`, `form-field-answers`, `condition-tree`, `mail-templates`), a `Access-Control-Allow-Methods` ich nie zawiera. Front jest na innym originie, więc preflight `PUT` może być odrzucany.
- **H3. Brak sitemapy**: `/sitemap.xml` zwraca 200 `text/html` (SPA fallback zamiast XML lub 404).
- **H4. Soft 404**: nieistniejące trasy SPA prawdopodobnie zwracają HTTP 200.

## 2. Zakres

**W zakresie**: frontend i API na dev, 10 obszarów z sekcji 4, wszystkie role, przeglądarki Chromium (główna), Firefox i WebKit (kompatybilność).

**Poza zakresem**: `biuro_zawodow-*`, `central-mailer` (poza sprawdzeniem, że akcje wysyłające maile nie dają 5xx), produkcja, bramki płatności online (tylko przelew; webhooki tylko negatywnie: brak podpisu → odrzucenie), dostarczalność maili, testy na urządzeniach fizycznych, pełny audyt WCAG z czytnikiem ekranu (tylko testy automatyczne + sprawdzenia w kodzie).

## 3. Założenia, ryzyka, zależności

### Założenia
- Dane seed (ok. 49 wydarzeń, serie, 21 produktów, zamówienia) są stabilne w trakcie testów; testy biorą slugi/ID z API, nie hardkodują.
- Dev jest współdzielony: testy tylko czytają albo tworzą dane z prefiksem `e2e-`/`qa-` i sprzątają po sobie.
- Hasła seed są zescrubowane; nie zgadujemy haseł, nie zakładamy kont na cudzych adresach.

### Zależności (blokujące)
| ID | Zależność | Blokuje |
|---|---|---|
| D1 | Konta z seeda (`jan@`, `anna@`, `piotr@`, `kasia@example.com`, `marek@timing.pl`, `ewa@runpoland.pl`, `tomasz@sportevents.pl`, `monika@`, `admin@`, `superadmin@zmierzymyczas.pl`) z hasłem `SEED_DEMO_PASSWORD` (ustawiane w `.env` serwera, potem `composer seed`); lokalnie tylko `E2E_DEV_PASSWORD` | wszystko zalogowane: rejestracja, panele, RBAC, IDOR, upload, część a11y/perf |
| D2 | Decyzja w sprawie 429 (H1): whitelist IP runnera lub podniesienie limitu na dev, albo akceptacja wolnego zestawu (1–2 workery, cache danych API) | czas całości, smoke ≤ 2 min, load test |
| D3 | Zgoda na tworzenie na dev: zapisów na wydarzenia, zamówień (przelew), uploadów; sposób sprzątania (anulowanie zapisu przez uczestnika, anulowanie zamówienia przez admina) | 03, 04, 14 |
| D4 | Zgoda na lekki load test API (≤ 20 równoległych, ≤ 60 s) | 23 |
| D5 | Dodanie devDependencies: `@axe-core/playwright` (i ew. `web-vitals`, `@lhci/cli`) | 16, 17, 22 |
| D6 | Wydarzenie testowe organizatora z otwartymi zapisami, kodem rabatowym, wariantem prywatnym i sztafetą – z seedu albo utworzone przez organizatora testowego (`e2e-` + flaga `is-test`) | 03 częściowo |

### Ryzyka
| Ryzyko | Wpływ | Mitygacja |
|---|---|---|
| Throttling 429 | flaky, fałszywe czerwone | worker-scoped cache API, `workers: 2`, retry tylko na 429 z backoffem w kliencie API, osobny projekt smoke |
| Dane współdzielone zmieniane przez innych | flaky | dane z API w runtime, asercje na strukturze, nie na liczbach |
| Wydarzenia „przyszłe" stają się przeszłe | flaky w czasie | wybór po dacie względem `today`, `test.skip` z powodem, gdy brak kandydata |
| Testy tworzące dane zostawiają śmieci | zaśmiecenie dev | prefiks, `afterAll` cleanup, raport pozostałości |
| Security testy uruchamiają blokady | konto testowe zablokowane | brak brute force; rate limit sprawdzany na nieistniejącym adresie `qa-ratelimit-…@example.com`, ≤ 15 prób |

## 4. Macierz testów

Legenda ról: A anonim, P participant, O organizer, M moderator, AD admin, SA superadmin. Priorytet: P0 krytyczny (blokuje pokaz), P1 wysoki, P2 średni, P3 niski.

| # | Obszar | Podobszar | Role | Typ | Prio | Task |
|---|---|---|---|---|---|---|
| 1 | Funkcjonalne | Lista wydarzeń: filtry, wyszukiwanie, widok kompaktowy, paginacja, `/wydarzenia` | A | E2E | P1 | 01 |
| 1 | Funkcjonalne | Szczegóły: zakładki, wyniki, galeria, regulamin, przeszłe/przyszłe/wyprzedane | A | E2E | P1 | 02 |
| 1 | Funkcjonalne | Rejestracja: formularz dynamiczny, dystanse, rabat, prywatne z kodem, sztafeta/drużyna, pojemność, okno płatności, sukces | A, P | E2E | P0 | 03 |
| 1 | Funkcjonalne | Sklep, koszyk, warianty, stany, dostawa, przelew, zamówienie | A, P | E2E | P0 | 04 |
| 1 | Funkcjonalne | Serie i klasyfikacje, wyzwania, wyniki live, profil zawodnika | A, P | E2E | P2 | 05 |
| 1 | Funkcjonalne | Panele ról: participant, organizer, moderator, admin (nawigacja, kluczowe widoki, odmowa dostępu cudzym rolom) | P, O, M, AD | E2E | P1 | 06 |
| 1 | Funkcjonalne | Embed `/embed/*`, `/events/:slug/embed` (iframe, nagłówki ramek) | A | E2E | P2 | 07 |
| 2 | API | Kontrakt publiczny: statusy, kształt JSON, walidacja, paginacja, kody błędów, 404/405 | A | API | P1 | 08 |
| 2 | API | RBAC: każda rola × każdy chroniony endpoint (macierz generowana z listy tras), idempotencja akcji statusowych | wszystkie | API | P0 | 09 |
| 3 | Security | Nagłówki front/API, CORS (w tym H2) | A | API | P1 | 10 |
| 3 | Security | Authn, JWT (alg none/HS↔RS, wygaśnięcie, podpis, manipulacja payload), token po wylogowaniu, eskalacja roli przez PATCH | A, P | API | P0 | 11 |
| 3 | Security | XSS (formularze, opisy HTML, parametry URL), SQLi na filtrach/wyszukiwaniu, CSRF (Bearer, brak cookies sesyjnych) | A, P, O | API+E2E | P0 | 12 |
| 3 | Security | IDOR: zapisy, zamówienia, profile, bilety, certyfikaty, wydarzenia innego organizatora | P, O | API | P0 | 13 |
| 3 | Security | Upload: typ, rozmiar, nazwa, double extension, SVG z JS, serwowany Content-Type | P, O | API | P1 | 14 |
| 3 | Security | Wyciek informacji, enumeracja kont przy resecie/rejestracji, rate limit logowania/resetu, `/dev/*`, webhooki bez podpisu, RODO (zgody, cookies, anonimizacja, dane w publicznych odpowiedziach) | A, P | API+E2E | P1 | 15 |
| 4 | A11y | axe (WCAG 2.2 AA) na kluczowych trasach i stanach: dark mode, modale, formularze z błędami, panele | A, P, O, AD | E2E | P1 | 16 |
| 4 | A11y | Klawiatura, focus trap, widoczny focus, landmarki, nagłówki, aria-live, reduced motion, zoom 200/400%, `lang="pl"`, alt | A, P | E2E | P1 | 17 |
| 5 | Użyteczność | Heurystyki Nielsena na rejestracji i zakupie, komunikaty błędów PL, stany puste/ładowania/błędu, back/refresh, utrata danych formularza, cookie banner | A, P | E2E + checklista | P2 | 18 |
| 5, 10 | Użyteczność / i18n | Martwe linki, spójność nazw, brak surowych kluczy/`undefined`/`null`/`NaN`, formaty walut i dat PL | A | E2E (crawler) | P2 | 19 |
| 6 | Responsywność | 320–1920 + landscape, brak poziomego scrolla, tap targets ≥ 24 px, menu mobilne, tabele/filtry | A, P | E2E | P1 | 20 |
| 6 | Responsywność | Regresja wizualna (Chromium; baseline z dev, maskowanie dat/dynamicznych treści) | A | Visual | P3 | 21 |
| 7 | Wydajność | Web Vitals (LCP, CLS, INP, TBT) home/events/detail/shop/cart, mobile + desktop | A | Perf | P2 | 22 |
| 7 | Wydajność | API p50/p95 list i detali, lekki load test (≤ 20 równoległych) | A | Perf | P2 | 23 |
| 7 | Wydajność | Bundle, liczba żądań, cache assetów, obrazy (rozmiar, lazy, formaty) | A | Perf | P2 | 24 |
| 8 | Kompatybilność | Chromium/Firefox/WebKit dla smoke, offline/throttling, mock 500/timeout przez `page.route` | A | E2E | P2 | 25 |
| 8 | Odporność | Pusta odpowiedź (mock pustej bazy), długie nazwy, Unicode/polskie znaki, strefy czasowe i formaty dat | A | E2E | P3 | 26 |
| 9 | SEO | title/description/og per strona, canonical, robots, sitemap (H3), status 404 (H4), deep links | A | E2E/API | P2 | 27 |

## 5. Kryteria wejścia i wyjścia

**Wejście (globalne)**: baseline zielony; helpery z tasku 00 zaakceptowane; zależności D1–D5 rozstrzygnięte albo świadomie oznaczone jako blokada (testy zależne `test.skip` z powodem, raportowane jako „nie zrobione").

**Wyjście (globalne)**: każdy task „done" (zielony 2× z rzędu na dev), defekty aplikacji odtworzone ręcznie i wpisane do rejestru, `npm run test:e2e:dev:smoke` ≤ 2 min, raport `qa-report.md`.

**Definicja „zielono" per obszar**

| Obszar | Zielono gdy |
|---|---|
| 1 Funkcjonalne | ścieżki P0/P1 przechodzą bez błędów konsoli i API 5xx; dane `e2e-` posprzątane |
| 2 API | każdy publiczny endpoint ma test statusu i kształtu; macierz RBAC bez niezgodności z oczekiwanym modelem (dokumentowanym w teście) |
| 3 Security | brak otwartego defektu critical/blocker; nagłówki zgodne z politykami z README |
| 4 A11y | 0 naruszeń axe `critical`/`serious` na trasach P1 (pozostałe jako znane defekty z ID); testy klawiatury zielone |
| 5 Użyteczność | brak martwych linków wewnętrznych i surowych kluczy; checklista heurystyk wypełniona |
| 6 Responsywność | brak poziomego scrolla i nachodzących elementów na wszystkich viewportach; tap targets ≥ 24 px |
| 7 Wydajność | progi raportowane względem „good" Core Web Vitals (LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms); API p95 lista ≤ 800 ms, detal ≤ 500 ms; przekroczenia jako defekty, nie fail testu (tryb pomiarowy) |
| 8 Kompatybilność | smoke zielony w 3 przeglądarkach; błędy API dają czytelny stan błędu, nie biały ekran |
| 9 SEO | unikalny title/description na stronach publicznych, poprawny robots/sitemap lub zgłoszony defekt |

## 6. Architektura zestawu

```
e2e-dev/
  dev-smoke.spec.ts          (istniejący, tag @smoke)
  support/                   task 00: api-client, auth (env), fixtures, problems collector, axe, viewports, rate-limit
  functional/  api/  security/  a11y/  responsive/  perf/  seo/  usability/  resilience/
```

- Konta: e-maile z seeda zapisane w `support/accounts.ts` (participant = `jan@`, participant2 = `anna@`, organizer = `marek@`, organizer2 = `ewa@`, moderator, admin, superadmin), jedno hasło z `E2E_DEV_PASSWORD`; opcjonalne nadpisanie e-maila `E2E_DEV_<ROLA>_EMAIL`. Zachowana zgodność z obecnym `E2E_DEV_EMAIL/ROLE`. Logowanie przez API raz na worker, token do `storageState` / nagłówka; hasło nigdy w repo ani raportach.
- Tagi: `@smoke`, `@a11y`, `@security`, `@perf`, `@responsive`, `@functional`, `@api`, `@seo`, `@usability`, `@resilience`; projekty Playwright per przeglądarka; reporter list + HTML + JUnit.
- Z powodu H1: domyślnie `workers: 2`, klient API z kolejką i backoffem na 429 (respektuje `Retry-After` do limitu), dane listowe cache'owane per worker.

## 7. Taski

Brief każdego tasku trafi do `docs/qa-tasks/<NN>-<slug>.md` (Faza 3).

| NN | Slug | Pliki | Model | Prio | Zależy od | Wymaga |
|---|---|---|---|---|---|---|
| 00 | foundation | `e2e-dev/support/*`, `playwright.dev.config.ts`, `package.json` (skrypty) | O | P0 | – | D2, D5 |
| 01 | events-browse | `functional/events-browse.spec.ts` | S | P1 | 00 | – |
| 02 | event-detail | `functional/event-detail.spec.ts` | S | P1 | 00 | – |
| 03 | registration | `functional/registration.spec.ts` | S | P0 | 00 | D1, D3, D6 |
| 04 | shop-order | `functional/shop-order.spec.ts` | S | P0 | 00 | D3 (zamówienie), D1 |
| 05 | series-challenges-live | `functional/series-challenges-live.spec.ts` | S | P2 | 00 | – |
| 06 | role-panels | `functional/role-panels.spec.ts` | S | P1 | 00 | D1 |
| 07 | embed | `functional/embed.spec.ts` | H | P2 | 00 | – |
| 08 | api-contract | `api/contract-public.spec.ts` | S | P1 | 00 | – |
| 09 | api-rbac | `api/rbac-matrix.spec.ts`, `api/rbac-routes.ts` | S | P0 | 00 | D1 |
| 10 | headers-cors | `security/headers-cors.spec.ts` | H | P1 | 00 | – |
| 11 | authn-jwt | `security/authn-jwt.spec.ts` | S | P0 | 00 | D1 |
| 12 | injection | `security/injection.spec.ts` | S | P0 | 00 | D1 (część) |
| 13 | idor | `security/idor.spec.ts` | S | P0 | 00 | D1 (2× P, 2× O) |
| 14 | upload | `security/upload.spec.ts` | S | P1 | 00 | D1, D3 |
| 15 | info-leak-ratelimit-rodo | `security/info-leak.spec.ts` | S | P1 | 00 | – (część D1) |
| 16 | a11y-axe | `a11y/axe-routes.spec.ts` | S | P1 | 00 | D5, D1 (panele) |
| 17 | a11y-keyboard | `a11y/keyboard-focus.spec.ts` | S | P1 | 00 | – |
| 18 | usability-flows | `usability/flows.spec.ts`, `docs/qa-heuristics.md` | S | P2 | 00 | D1 (część) |
| 19 | links-i18n | `usability/links-i18n.spec.ts` | H | P2 | 00 | – |
| 20 | responsive-matrix | `responsive/viewports.spec.ts` | H | P1 | 00 | – |
| 21 | visual-regression | `responsive/visual.spec.ts` (+ snapshots) | H | P3 | 20 | – |
| 22 | web-vitals | `perf/web-vitals.spec.ts` | S | P2 | 00 | D5 (opcjonalnie) |
| 23 | api-latency-load | `perf/api-latency.spec.ts` | S | P2 | 00 | D2, D4 |
| 24 | assets | `perf/assets.spec.ts` | H | P2 | 00 | – |
| 25 | resilience-network | `resilience/network-errors.spec.ts` | S | P2 | 00 | – |
| 26 | resilience-data | `resilience/data-edge.spec.ts` | S | P3 | 00 | – |
| 27 | seo-meta | `seo/meta.spec.ts` | H | P2 | 00 | – |
| 28 | integracja | `playwright.dev.config.ts`, `package.json` | O | P0 | wszystkie | – |

**Fale** (po akceptacji 00): fala 1 bez kont – 01, 02, 05, 07, 08, 10, 15, 17, 19, 20, 24, 25, 27 (równolegle, z uwagi na 429 uruchamiane z `--workers=1` przez każdego agenta); fala 2 po D1 – 03, 04, 06, 09, 11, 12, 13, 14, 16, 18; fala 3 – 21, 22, 23, 26; potem 28 i raport.
