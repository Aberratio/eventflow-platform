# Fix backlog – zgodność ze specyfikacją, mailer, BZ, linki

Stan na 2026-10-19: inwentarz z fazy 1, decyzje i – w sekcji „Faza 3” – stan po naprawach i lista wdrożeniowa. Źródła: specyfikacja `zmierzymy-czas-notes/specyfikacje/zmierzymy-czas` (rozdziały 06–23, umowa), `docs/qa-plan.md` §1.4, `docs/qa-manual-findings.md`, `test.fail('QA-…')` w `e2e-dev/`.

Skróty repo: **S** = eventflow-server, **F** = eventflow-platform, **CM** = central-mailer, **BZ** = biuro_zawodow-api.
Priorytety: **P0** blokuje funkcję ze specyfikacji (w umowie), **P1** błąd lub luka funkcji, **P2** reszta (w tym pozycje „poza umową”). Rozmiar: S/M/L.
Kolumna „Status” w fazie 3 dostanie: zrobione / PR / zostaje (dlaczego).

## Obraz ogólny

Kod jest znacznie dalej, niż zakłada `plan-prac.md`: migracje 001–067, model Zawodnik/Opieka, trzy osie wydarzenia, model cenowy z zamrożonym Rozliczeniem, Tpay/PayNow (kod), zwroty, wyniki z importem, rekordy, wyzwania z drzewem warunków, sklep z pakietami, scalanie profili, drużyny, 15 typów maili przez outbox, pełny kontrakt BZ po obu stronach. Główne luki to front w trzech miejscach umowy (konfiguracja formularza §5.17, edytor szablonów maili §5.19, bilet QR/PDF), egzekwowanie reguł zapisu na serwerze i pakiet defektów z QA.

## Faza 3 – stan po naprawach (2026-10-19)

Stan wdrożenia (2026-10-19, wieczór): CM #3/#4 zmergowane i wdrożone na staging. S #44 (`integration/fix-all`) zmergowany do master (7199124), ale **niewdrożony**: GitHub Actions w eventflow-server nie startują (billing konta – „recent account payments have failed or your spending limit needs to be increased”), a środowisko `staging` w GitHubie (i repo) ma **0 sekretów**, więc deploy pada na „Check deploy configuration”. Do uzupełnienia w environment `staging`: `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `BACKEND_REMOTE_DIR`, `BACKEND_ALLOWED_ROOT`, `BACKEND_BACKUP_DIR`, `API_URL`. F #6 i #24 celowo niezmergowane do czasu wdrożenia S. Weryfikacja po wdrożeniu (8 kroków niżej, `npm run test:e2e:dev`, ręczne QA zalogowanych) – czeka.

Tabele niżej (P0/P1/P2) to inwentarz z fazy 1 – stan każdej pozycji jest w tej sekcji.

### Runda 4 (2026-10-19) – domknięcie „Zostaje”

Decyzje właścicielki: robimy G-03 i B-02 w całości; **admin może przekazać własność opublikowanego wydarzenia** (PP.4 łagodzone tylko dla admin/superadmin, organizator nadal 409). Wszystkie PR-y draft; S na master, F na `integration/fix-all`.

| ID | Co | PR |
|---|---|---|
| G-06b | Zamówienie nagrody z Wyzwania stosuje regułę bramek sklepu (`card`/`blik` bez bramki → 422 `order_invalid_payment_method`, `bank` OK) | S #48 |
| G-10 / PP.4 | Admin i superadmin przekazują własność opublikowanego wydarzenia; wpis `event_ownership_transferred` w rejestrze aktywności; organizator 409, moderator 403. F bez zmian (formularz nie blokował) | S #50 |
| R-17 | Zmiana tytułu/daty/miejsca/miasta/sluga → zadanie `upsert` w outboxie; odwołanie/usunięcie → `delete` (404/410 = sukces, czyści ID wpisu); idempotentnie, tylko przy aktywnej integracji | S #46 (mig. 100) |
| G-03 | Korekta wyniku: czas netto, miejsce open i w kategorii (z historią z/do); ręczne miejsce trwałe (flagi `position_manual`, `category_position_manual`), `null` wraca do rankingu automatycznego | S #47 (mig. 101), F #26 |
| B-02 | `PATCH` pola formularza zmienia typ i warianty (409 `form_field_has_answers` / `form_field_option_in_use`) | S #45, F #25 |
| B-02 | `POST /registrations/quote` – wycena bez zapisu, wspólny `priceRegistration()` z create; podsumowanie w formularzu zapisu | S #49, F #27 |

Gałęzie integracyjne `integration/round4`: S = master + 6 PR (1 konflikt: lista `use (...)` w `PATCH /events/{id}`, #46×#50) – lint, stan, Unit 637/637, Integration 1449 (1 błąd lokalny, patrz QA-LOCAL-01); F = `integration/fix-all` + 3 PR, bez konfliktów – typecheck, eslint, vitest 1008/1008.

### Zrobione (PR)

Repo: **F** = eventflow-platform, **S** = eventflow-server, **CM** = central-mailer.

| ID | Co | PR |
|---|---|---|
| B-01, G-08 | Serwer egzekwuje „zapisy otwarte” (409 `registration_closed`); tryb testowy = dry-run bez zapisu w bazie; UI obu stanów | S #28, F #18 |
| B-02, B-07, R-12 (część) | Konfigurator formularza zapisów; formularz z konfiguracji; odpowiedzi i pola tożsamości w `POST /registrations`; ceny wariantów (także ujemne) w Rozliczeniu | S #35 (mig. 085), F #8, #9 |
| B-03 | Edytor szablonów maili na prawdziwych trasach + podgląd + dziennik wysyłek | S #36, F #16 |
| B-04, G-01, G-12 | QR = token `pqr_`, strona biletu do druku („Zapisz jako PDF”), bilet tylko dla opłaconego zapisu, pełny payload biletów, link `/my-starts` z maila #5 | S #38, F #14, #21 |
| B-05 | Baner „dokończ płatność” + „Zapłać teraz” także w trakcie okna płatności; `paymentExpiresAt` w DTO | S #43, F #17 |
| B-06, B-08 | Strony prawne (polityka prywatności i RODO z obecnej zmierzymyczas.pl, regulamin = placeholder); edytor CMS z formatowaniem (tiptap) + sanitizacja HTML na serwerze | S #32 (mig. 080), #40, F #19 |
| D-01, D-04, Z-01 | 404 dla nieistniejących szczegółów (10 tras), PUT w CORS, poprawione komentarze o webhooku BZ | S #29, F #10 |
| D-02 | Timeout zapytań (15 s / 120 s upload), stany błędu z „Spróbuj ponownie” na 9 stronach | F #10 |
| D-03, D-06, D-08 | Ceny przez `formatMoney`, klasyfikacja serii z `GET /series/{id}/ranking`, CTA logowania przy wyzwaniu | F #11 |
| D-05 | Pobieranie wszystkich stron zamiast `pageSize: 1000` (12 miejsc) | F #13 |
| D-07, L-01–L-04 | Martwe linki (`/wyniki`, `/results`, `/organizer/settings`, linki po id) + test strażnik tras | F #7 |
| D-09 | `noindex` + `robots.txt Disallow` poza produkcją (`VITE_ALLOW_INDEXING`) | F #12 |
| D-10 | Embed bez nawigacji aplikacji, z danymi wydarzenia | F #15 |
| G-02 | Postęp wyzwań przeliczany przy publikacji/korekcie wyników | S #31 |
| G-03 | Trwała historia korekt wyników + powód + UI | S #37 (mig. 075), F #22 |
| G-04 | Wymiana zawodnika w sztafecie (kapitan do terminu, organizator zawsze), rotacja `pqr_` | S #39 (mig. 090), F #23 |
| G-05, G-06, G-06b, G-07, G-10 | `/admin/sales-stats`, realne metody płatności sklepu, ostatnie logowanie adminów i moderatorów, przekazanie własności przez właściciela | S #33 (mig. 068), #42, F #21 |
| G-09 | Przełącznik anonimizacji (własny profil i podopieczni) | S #43, F #21 |
| G-11 | Eksport listy startowej XML | S #34, F #21 |
| M-01 | Reply-To = organizator dla maili wydarzenia | CM #4 (mig. 013), S #30 (mig. 069) |
| M-02, M-03 | Transport `log` w CM (tylko local/testing); lokalny e2e ZC → outbox → CM → `.eml` przeszedł (mail #1 i #4 z Reply-To) | CM #3 |
| R-17 | Kalendarz Google: ustawienia w panelu admina, wpis przy zatwierdzeniu przez outbox | S #41 (mig. 095), F #20 |
| Z-02 | e2e ZC↔BZ (PP.43) lokalnie zielony (67 asercji); testy BZ 170/170 | – (bez zmian w kodzie) |
| QA | Pakiet e2e-dev, plan i wyniki QA, ten backlog | F #6 |

Gałęzie integracyjne `integration/fix-all` (S i F) łączą wszystkie PR-y z rozwiązanymi konfliktami (8 konfliktów, w tym 2 merytoryczne: B-01×B-07 w `create()`, G-02×G-03 w `PATCH /results/{id}`). Wynik bramek na integracji: F – typecheck, eslint 0 błędów, vitest 989/989 (start: 795); S – lint, stan, Unit 635/635, Integration – patrz opis PR integracyjnego.

### Zostaje (i dlaczego)

| ID | Co | Dlaczego |
|---|---|---|
| R-17 (reszta) | Zmiana widoczności na prywatną nie usuwa wpisu z kalendarza; brak testu na prawdziwym Google | P2; brak dostępów klienta |
| G-03 (reszta) | Ręczne miejsce może się pokrywać z automatycznym (pozostali liczeni po czasie); brak miejsca wg płci (brak kolumny) | P2 |
| B-02 (reszta) | Embed (`EmbedEventRegistrationPage`) pokazuje lokalny podgląd ceny zamiast quote; quote nie sprawdza limitu miejsc ani zaproszenia do drużyny | P2 |
| QA-LOCAL-01 | `ResultImportRepositoryTest::testRealSampleCsvImportsDnfRowWithStatusAndNoRankingPosition` pada na master (`AgeCategoryResolver`: „kategoria nie jest dostępna na tym dystansie”) – test z grupy `requires-local-samples`, CI go pomija | Defekt P2: test lub dane próbki niezgodne z kategoriami liczonymi na serwerze (PP.79) |
| R-01–R-11, R-13–R-16, R-18, Z-03, Z-04, M-04, M-05 | Pozycje P2 / „poza umową” / warunkowe od klienta | Zgodnie z decyzją 6 – poza zakresem tej sesji |
| QA-SEO-01/03/04 | Meta per trasa, sitemap, soft 404 | Decyzja: SEO później |
| Płatności | Tpay/PayNow sprawdzone tylko na fake gateway | Brak kont sandbox (O-02) |

### Wdrożenie na dev (dla Lesława)

Push na `master` serwera wdraża na staging – merge dopiero po zgodzie Joanny.

**Kolejność merge**
1. **central-mailer:** #3 → #4 (stacked). Migracja: `php scripts/run-migrations.php` (013 `reply_to`). Restart workerów (`bin/worker.php`, `bin/technical-worker.php`).
2. **eventflow-server:** PR integracyjny `integration/fix-all` (zawiera #28–#43 z rozwiązanymi konfliktami; po jego merge pojedyncze PR-y zamkną się jako zmergowane). Alternatywa: pojedynczo w kolejności #29, #33, #42, #30, #28, #35, #31, #37, #32, #40, #34, #36, #38, #41, #39, #43 – wtedy konflikty w `routes.php` trzeba rozwiązać jak w gałęzi integracyjnej.
   Migracje (`composer migrate`, drugi przebieg ma nic nie robić): 068 `users.last_login_at`, 069 `outbox reply_to`, 075 `result_corrections`, 080 strony prawne, 085 pola adresowe `competitors`, 090 `relay_swap_deadline`, 095 Kalendarz Google.
3. **eventflow-platform:** #6 (pakiet QA) → PR integracyjny `integration/fix-all` (zawiera #7–#23). Front zakłada serwer z kroku 2 (nowe pola i trasy); działa też ze starym serwerem dla 404 szczegółów.

**Zmienne środowiskowe (tylko nazwy)**
- eventflow-server – nowe: `GOOGLE_CALENDAR_SERVICE_ACCOUNT_FILE` (opcjonalna; ścieżka do JSON klucza konta usługi poza katalogiem publicznym; instrukcja dla klienta: `docs/google-calendar.md`). Do sprawdzenia, że są ustawione: `APP_URL`, `CENTRAL_MAILER_BASE_URL`, `CENTRAL_MAILER_API_KEY`, `INCOMING_API_KEYS`, `BZ_WEBHOOK_BASE_URL`; bramki (gdy będą konta): `TPAY_CLIENT_ID`, `TPAY_CLIENT_SECRET`, `TPAY_MERCHANT_ID`, `TPAY_SANDBOX`, `TPAY_NOTIFICATION_URL`, `TPAY_SUCCESS_URL`, `TPAY_ERROR_URL`, `PAYNOW_API_KEY`, `PAYNOW_SIGNATURE_KEY`, `PAYNOW_SANDBOX`, `PAYNOW_CONTINUE_URL`.
- central-mailer – nowe: `MAIL_TRANSPORT`, `MAIL_LOG_DIR` – **na dev/staging/prod NIE ustawiać** (`log` jest odrzucany poza local/testing; domyślnie SMTP).
- Front (build): `VITE_ALLOW_INDEXING=true` **wyłącznie** w buildzie produkcyjnym (dodane w `.github/workflows/deploy.yml`, job „Build production”). Dev i staging bez tej zmiennej = `noindex`. Jeśli dev budowany jest innym mechanizmem niż `deploy.yml` – nic nie ustawiać.

**Infrastruktura**
- Cron na serwerze ZC: `php bin/scheduler.php` co 5 min (od niego zależą: wygasanie nieopłaconych zapisów, przypomnienia, maile wyników, ponowienia outboxu mail/BZ/kalendarz `calendar.outbox_retry`, auto-zakończenie wydarzeń). Sprawdzić `php bin/scheduler.php --status`.
- GitHub `Aberratio/eventflow-server`: sekret `BZ_API_REPO_SSH_KEY` (read-only deploy key repo BZ API) – bez niego CI `e2e-bz` pomija test i świeci na zielono.
- seohost: whitelist IP 83.168.79.141 (429 przy testach e2e-dev).
- PHP: rozszerzenie `zip` (eksport XLSX).

**Weryfikacja po wdrożeniu**
1. `GET /api/v1/health` = 200; `composer migrate` drugi raz = nic do zrobienia.
2. Stopka: `/info/regulamin`, `/info/polityka-prywatnosci`, `/info/rodo` otwierają się z formatowaniem; admin edytuje je w CMS (nagłówki, listy, linki) i zmiany widać publicznie.
3. `/wyniki`, `/results` → lista zakończonych wydarzeń; `/robots.txt` na dev = `Disallow: /`.
4. Zapis na wydarzenie z zamkniętymi zapisami → komunikat „Zapisy są zamknięte”; zapis na otwarte z polem własnym z ceną wariantu → pozycja w podsumowaniu; mail #4 przychodzi z `Reply-To` organizatora.
5. Panel uczestnika: nieopłacony zapis → baner „dokończ płatność”; bilet opłaconego zapisu ma QR `pqr_…` i stronę do druku.
6. Admin: Szablony maili (podgląd, dziennik), Ustawienia → Kalendarz Google (status „brak klucza” do czasu dostępów), lista adminów/moderatorów z „Ostatnie logowanie”.
7. Organizator: zakładka „Formularz zapisów”, eksport listy startowej CSV/XLSX/XML, edycja wyniku z powodem i historią korekt, wymiana zawodnika w sztafecie.
8. `npm run test:e2e:dev` (po whitelist): QA-API-01, CORS PUT, QA-SEO-02 mają być zielone (ich `test.fail` usunięte).

## P0 – blokuje funkcję z umowy

| ID | Pozycja | Spec | Dowód | Repo | Rozm. | Status |
|---|---|---|---|---|---|---|
| B-01 | Serwer przyjmuje Zapis niezależnie od stanu zapisów (zamknięte, `registration_status`, daty, nieopublikowane). Pilnuje tego tylko front. | 08, umowa §5.4 / §4.2.4 | `routes.php:2113` (komentarz „separate product rule”), w `Domain/Registrations` brak sprawdzenia `registration_status`; front `EventRegistrationPage.tsx:147` | S | M | |
| B-02 | Brak UI konfiguracji formularza zapisów (pola systemowe z trójstanem, pola własne, kolejność, poufne). Formularz zapisu nie renderuje się z konfiguracji. API jest kompletne. | 10, umowa §5.17 / §5.18 | F nie wywołuje `/events/{id}/form-fields*` (grep: tylko typy i `publicStartList`); S `routes.php:1855-2025`, `FormFieldRepositoryTest` | F | L | |
| B-03 | Edytor szablonów maili nie działa: front woła `/email-templates*`, `/email-send-logs`, a serwer ma `/admin/mail-templates` i `/events/{id}/mail-templates`. Brak podglądu (preview) po stronie S. | 17, umowa §4.4.12 / §5.19 | `http.adapter.ts:678-694`, `EmailTemplatesManager.tsx`; S `routes.php:4290-4342` | F (+S preview) | M | |
| B-04 | Bilet: QR koduje JSON `{ticketId,…}` zamiast tokenu `pqr_`; „Pobierz bilet” to atrapa (toast). Brak PDF karty startowej. | 11, umowa §4.1.3 | `EventTicket.tsx:19-33`; poprawny wzorzec `RegistrationListRow.tsx:209`; S bez endpointu PDF | F + S | M | |
| B-05 | Baner „dokończ płatność” dla nieopłaconych zapisów uczestnika i przycisk ponowienia płatności (endpoint jest, UI nie). | 13, umowa §5.16 | S `routes.php:2314` retry-payment; `retryPayment` w adapterze nieużywane; brak banera w panelu uczestnika | F | M | |
| B-07 | (wykryte przy B-02) Serwer nie przyjmuje odpowiedzi formularza ani pól tożsamości (telefon, klub, adres…) przy tworzeniu Zapisu, a ceny wariantów pól nie wchodzą do Rozliczenia (`modifierSettlementItems` zwraca `[]`). | 07 krok 2, 10 | `RegistrationRepository.php:4039`, `RegistrationCreatePolicy.php:20` | S (+F: przełączenie na payload create w PR #8) | M | |
| B-08 | (wykryte przy B-06, decyzja 1) Edytor stron CMS to zwykły `Textarea`, a `TextSection` renderuje czysty tekst, więc admin nie sformatuje regulaminu. Serwer nie sanitizuje treści `info_pages` przy POST/PATCH; renderowanie HTML bez tego = stored XSS. | decyzja 1 | `PageEditorPage`/`SectionEditor`, `DynamicInfoPage`/`TextSection`; S `routes.php` info-pages | S + F | M | |
| B-06 | Strony prawne w stopce `/info/regulamin`, `/info/polityka-prywatnosci`, `/info/rodo` → 404. Trasa działa, brak rekordów `info_pages`. | linki, RODO | `Footer.tsx:79-95`, `CookieConsent.tsx:105`; seed `001_demo.sql:227` ma tylko o-nas/oferta/kontakt. Uwaga: przy `show_in_footer=1` zdublują się linki (Footer.tsx:14-16). Treść prawna – patrz pytania. | S (migracja) | S | |

## P1 – błędy i luki funkcji

### Defekty z QA (wszystkie zweryfikowane w kodzie, nadal występują)

| ID | Pozycja | Dowód | Repo | Rozm. | Status |
|---|---|---|---|---|---|
| D-01 | QA-API-01: szczegóły zwracają 200 `data:null` zamiast 404 (`/series/slug/{slug}`, `/series/{id}`, `/shop/products/slug/{slug}`, `/challenges/slug/{slug}`, `/challenges/{id}`, `/info-pages/slug/{slug}`, `/partners/{id}`, `/event-backgrounds/{id}`). Zmiana kontraktu → adapter F + test adaptera. | `routes.php:2960,2961,3225,3292,3293,3493,3537` (`JsonResponder::ok(…find…)`); `e2e-dev/api/contract-public.spec.ts:238` | S + F | S | |
| D-02 | Listy (`EventsPage`, `ShopPage`, `SeriesListPage`, `ChallengesListPage`) i `EventDetailsPage` ignorują `isError`: 500 = „Nie znaleziono…”; klient HTTP bez timeoutu. | grep: tylko `isLoading`; `src/api/client.ts` bez `AbortController`/timeout; qa-manual pkt 4 | F | M | |
| D-03 | Ceny bez `formatMoney` (`699 zł`, ryzyko `49.5 zł`). | `ShopProductPage.tsx:180,187`, `ProductCard.tsx:67`, `EventInfoTab.tsx:721`, `PricingSection.tsx:24`, `RegistrationForm.tsx:351,1509` | F | S | |
| D-04 | CORS `Allow-Methods` bez `PUT`, a API ma trasy PUT (np. condition-tree, mail-templates, form-field-answers). | `CorsMiddleware.php:47`; `e2e-dev/security/headers-cors.spec.ts:108` | S | S | |
| D-05 | `pageSize: 1000` przy limicie API 100: dane obcinane po cichu w 10 miejscach, w tym listy użytkowników admina/moderatora, przegląd admina, historia zawodnika i uczestnika, filtry wydarzeń. | `Repository.php:147` (min 100); F: `AthleteProfilePage.tsx:26`, `ParticipantHistoryTab.tsx:28`, `ParticipantMessagesTab.tsx:21`, `EventFiltersSidebar.tsx:37`, `AdminOrdersTab.tsx:85`, `AdminOverviewTab.tsx:41`, `UsersAdminsTab.tsx:60`, `UsersParticipantsTab.tsx:77`, `ModeratorOrdersTab.tsx:82`, `ModeratorOverviewTab.tsx:18` (jest `src/api/allEvents.ts` do sprawdzenia jako wzorzec) | F | M | |
| D-06 | `/series/:slug` liczy klasyfikację z `getEvents()` (25 szt.) zamiast z `GET /series/{id}/ranking` (adapter `getSeriesRanking` istnieje). | `SeriesDetailsPage.tsx:1,67`; `http.adapter.ts:605` | F | S | |
| D-07 | `SeriesStandingsTable` linkuje `/events/${event.id}`, trasa czyta slug. | `series/SeriesStandingsTable.tsx:125` | F | S | |
| D-08 | Anonim na `/challenges/:slug` nie dostaje CTA logowania (przycisk tylko dla `role==='participant'`). Objaw „Wyzwanie nie znalezione” z dev: kod po slugu jest poprawny, prawdopodobnie 429 + D-02 → do potwierdzenia po D-02. | `ChallengeDetailsPage.tsx:277`; qa-manual pkt 8 | F | S | |
| D-09 | PP.28 / QA-SEO-02: dev pozwala na indeksowanie. Teraz tylko `noindex` dla dev; QA-SEO-01/03/04 (meta, sitemap, soft 404) później. | `public/robots.txt` = `Allow: /`; `e2e-dev/seo/meta.spec.ts:80` | F (+konfiguracja hosta) | S | |
| D-10 | Embed `/events/:slug/embed`: w ramce widać dolną nawigację aplikacji, brak danych wydarzenia (sprawdzone na 1 wydarzeniu). Iframe jest w umowie §5.3. | qa-manual pkt 5 | F | S–M | |

### Martwe linki (crawler statyczny po `App.tsx` i `to=`/`href=`/`navigate(`)

| ID | Link | Miejsce | Poprawka | Repo | Rozm. | Status |
|---|---|---|---|---|---|---|
| L-01 | `/wyniki` | `Index.tsx:582`, `LiveResultsPage.tsx:121` („Archiwum wyników”) | `/wyniki/live`; archiwum → `/events?…finished` (patrz pytania) | F | S | |
| L-02 | `/results` | `HomeHero.tsx:46`, `AthleteProfilePage.tsx:114,132`, `ParticipantOverviewTab.tsx:188` | jak L-01 | F | S | |
| L-03 | `/results?event=${id}` | `lists/ResultListRow.tsx:93` | `/events/${slug}/results` (wymaga sluga w modelu wyniku) | F | S | |
| L-04 | `/organizer/settings` | `EventFormOrganizerSection.tsx:236,348` | `/profile` | F | S | |
| L-05 | `/events/${event.id}` | = D-07 | | | | |

Nie sprawdzone statycznie (cele liczone dynamicznie): `getEditUrl`, `getDashboardLink`, `ListRow`/`event-table` z `href`. Po poprawkach sprawdzę je testem e2e (crawler Playwright po wyrenderowanych linkach na lokalnym backendzie).

### Luki względem specyfikacji (P1)

| ID | Pozycja | Spec | Dowód | Repo | Rozm. | Status |
|---|---|---|---|---|---|---|
| G-01 | Kod biletu widoczny tylko dla opłaconego/potwierdzonego Zapisu – brak dowodu i testu. | 11 pkt 4 | `ParticipantTicketsTab.tsx:12-21` filtruje tylko po dacie | F + S | S | |
| G-02 | Postęp Wyzwania nie przelicza się przy publikacji wyników, tylko przy `join` i przy odczycie, więc wyzwanie nie ukończy się samo. | 15 §3, umowa §5.12 | `ChallengeRepository.php:484,519,925` | S | S | |
| G-03 | Korekta wyniku po publikacji oficjalnej: jest wpis w rejestrze aktywności, brak historii poprzedniej wartości (kto, kiedy, z czego na co). | 14 pkt 6 | `routes.php:2673`, `ResultRepository::update:338` | S | M | |
| G-04 | Wymiana zawodnika w sztafecie i osobny termin graniczny wymiany – brak (sztafety §3.4 w umowie; mechanizm transferu z 20 też nie istnieje). | 23 §2, 20 | `TeamRepository.php:147` („E7.3 member-swap”), `RegistrationRepository.php:1876` | S + F | M | |
| G-05 | `GET /admin/sales-stats` nie istnieje, a używa go przegląd admina. | 03 / dryf kontraktu | `http.adapter.ts:657`, `AdminOverviewTab.tsx:32` | S | S | |
| G-06 | `/shop/payment-methods` zwraca na sztywno „Karta płatnicza” zamiast metod z konfiguracji bramek. | 16, umowa §3.10 | `routes.php:3056-3057` | S | S | |
| G-06b | `POST /shop/orders` przyjmuje `card`/`blik`, nawet gdy żadna bramka nie jest skonfigurowana (lista z G-06 już je ukrywa). | 16 | `OrderRepository::PAYMENT_METHODS` | S | S | |
| G-12 | (wykryte przy B-04) `GET /users/{id}/tickets` (`asTicket`) nie zwraca `eventDate`, `location`, `participantName`, kodu startowego ani statusu, które zakłada typ `Ticket`; zakładka biletów źle dzieli nadchodzące / archiwalne. | 11 | `RegistrationRepository::asTicket` ~:1663 | S | S | |
| G-07 | Ostatnie logowanie adminów i moderatorów (§5.8): jest tylko lista sesji online, brak trwałego `last_login_at`. | 09, umowa §5.8 | mig. 001, `OnlineStaffCard.tsx` | S + F | S | |
| G-08 | Tryb testowy (`is_test`) nie wpływa na zapisy: zapis na Szkicu w trybie testowym tworzy prawdziwy Zapis i płatność. | 08 | `is_test` nieobecne w `Domain/Registrations` | S | M | |
| G-09 | Anonimizacja: API jest, brak przełącznika w profilu na froncie. | 10 | `routes.php:4189`; F brak UI | F | S | |
| G-10 | Moderator jako Współzarządzający (§4.4.15): brak rozróżnienia Właściciel / Współzarządzający dla 4 operacji zastrzeżonych. | 09, umowa §4.4.15 | `routes.php:354-376` | S | M | |

## Mailer (spec 04, 17)

Wszystkie **15** typów z katalogu (spec ma 15, z #15 „Ustaw hasło”, PP.82) jest wysyłanych, idzie przez outbox (`CentralMailerOutboxService`, wiersz w DB przed HTTP), ma szablon w `MailTemplateRepository` z fallbackiem na globalny i deterministyczny `Idempotency-Key` `{encja}:{typ}:v{wersja}[:dyskryminator]` (`CriticalMailer.php:272`). QR jako `cid:` inline, nie załącznik.

| # | Typ | Wysyłka (miejsce) | Kolejka | Nadpisywalny per wydarzenie |
|---|---|---|---|---|
| 1 | Weryfikacja e-mail | `routes.php:634`, `:837` | technical | nie |
| 2 | Reset hasła | `routes.php:706` | technical | nie |
| 3 | Blokada konta | `routes.php:1137` | technical | nie |
| 4 | Potwierdzenie zapisu | `RegistrationRepository.php:1820` | normal | tak |
| 5 | Płatność / bilet z QR | `RegistrationRepository.php:3573` | normal | tak |
| 6 | Kod tożsamości | `routes.php:4135` | normal | tak |
| 7 | Przypomnienie o płatności | `RegistrationRepository.php:2268` (job) | normal | tak |
| 8 | Zmiana / odwołanie wydarzenia | `routes.php:159` | normal | tak |
| 9 | Moderacja | `routes.php:1458,1475` | normal | tak |
| 10 | Wyniki opublikowane | `ResultsPublicationNotifier.php:83` (odroczony) | normal | tak |
| 11 | Wynik wirtualny | `routes.php:2639` | normal | tak |
| 12 | Sklep | `routes.php:3160,3185` | normal | nie |
| 13 | Wyzwanie | `routes.php:204` | normal | tak |
| 14 | Zwrot | `RegistrationRepository.php:2635` | normal | tak |
| 15 | Ustaw hasło | `routes.php:991` | technical | nie |

Wysyłka z outboxu, ponowienia i uzgadnianie statusu: tylko `php bin/scheduler.php` z crona co 5 min (`mail.outbox_retry`, `mail.outbox_reconcile`, `mail.results_published`). Bez crona maile masowe (#10) nie wyjdą wcale.

| ID | Luka | Repo | Prio | Rozm. | Status |
|---|---|---|---|---|---|
| M-01 | Brak reply-to = organizator dla maili wydarzenia (spec 17 §4). `CentralMailerClient` nie ma pola, a CM ma tylko globalny reply-to. Wymaga rozszerzenia `POST /emails` w CM. | CM + S | P1 | M | |
| M-02 | CM nie ma transportu dev (log/null), SMTP wymusza TLS i auth, więc lokalnego e2e nie da się zrobić bez zewnętrznej skrzynki. Propozycja: transport `log` dla `APP_ENV=local`. | CM | P1 | S | |
| M-03 | Test e2e lokalnie (ZC → outbox → CM → log): **niewykonany w fazie 1**. Blokują go M-02 oraz lokalny `php.exe`, który wisi przy łączeniu z MySQL 8. Zrobię go po M-02. | – | P1 | S | |
| M-04 | Brak dedykowanego klienta `zmierzymy-czas` w `email_clients` CM (dziś `API_KEY_APP_A/B`). | CM | P2 | S | |
| M-05 | Do potwierdzenia: odbiorca maila o moderacji (#9) – sam organizator czy cały Zespół (Zespołu nie ma, patrz P2). | – | P2 | – | |

**Dev `.env` (nazwy, dla Lesława):** ZC: `CENTRAL_MAILER_BASE_URL`, `CENTRAL_MAILER_API_KEY`, `APP_URL`; CM: `API_KEY_APP_A`/`B` (lub wiersz w `email_clients`), `SMTP_*`, `GMAIL_SMTP_*` / `TECHNICAL_EMAIL_FALLBACK_TO_STANDARD`, `EMAIL_VALIDATE_RECIPIENT_MX`; cron `php bin/scheduler.php` co 5 min na ZC, workery CM (`bin/worker.php`, `bin/technical-worker.php`).

## Biuro Zawodów (spec 05, 12)

Kontrakt jest zbudowany po obu stronach. Komentarz w `eventflow-server/.env.example` („BZ has not built its receiving endpoint yet”) jest **nieaktualny**: BZ ma `POST /webhooks/critical-changes` (`biuro_zawodow-api/public/index.php:3861`, mig. 030).

| Element | ZC | BZ |
|---|---|---|
| Pull uczestników | `GET /events/{id}/bz/participants` (`routes.php:1713`, X-API-Key + X-BZ-Organization-Token) | `PlatformParticipantPullService`, cron `scripts/pull-platform-participants.php`, harmonogram 6 h / 1 h / 5 min |
| Klucz API per aplikacja | `INCOMING_API_KEYS` (fail-closed) | `BZ_PLATFORM_APP_KEY` |
| Push krytyczny (rezygnacja, zwrot) | outbox + `BzWebhookClient`, job `bz.outbox_retry` | odbiór webhooka, idempotencja, „Wycofany na platformie” |
| LWW ze śladem, odprawa wraca | `PATCH /events/{id}/bz/participants/{regId}` (`routes.php:1767`), `activity_log` | kolejka `platform_push_queue`, cron `scripts/push-platform-changes.php` |
| Token organizacji, `identity_code`, prefiksy, fix `ensureParticipantQrCode`, import z pliku | zrobione | zrobione (mig. 029, `index.php:1918, 9501, 7658+`) |

| ID | Luka | Repo | Prio | Rozm. | Status |
|---|---|---|---|---|---|
| Z-01 | Nieaktualne komentarze o braku endpointu BZ (`.env.example`, `BzWebhookConfig`, `RegistrationRepository.php:~3613`). | S | P1 | S | |
| Z-02 | e2e PP.43 (`tests/e2e/bz/run.php`, workflow `e2e-bz.yml`) w CI pomija się bez sekretu `BZ_API_REPO_SSH_KEY`. Uruchomię lokalnie i sprawdzę, czy sekret jest w GitHub. | S | P1 | S | |
| Z-02a | Testy kontraktu `BzParticipantsContractTest`, `BzParticipantSyncContractTest` – do uruchomienia na `zmierzymy_czas_test` w fazie 2. | S | P1 | S | |
| Z-03 | Push dla zmiany dystansu (spec 12 §1) – dziś tylko pull. | S | P2 | M | |
| Z-04 | Wydanie zamówienia sklepowego przy odprawie w BZ (odbiór w BZ, spec 16 §5) – brak zdarzenia. | S + BZ | P2 | M | |

**Dev `.env` (nazwy):** ZC: `INCOMING_API_KEYS`, `BZ_WEBHOOK_BASE_URL`; BZ: `BZ_PLATFORM_API_URL`, `BZ_PLATFORM_APP_KEY`, `BZ_PLATFORM_TOKEN_KEY`, `BZ_PLATFORM_TIMEOUT_SECONDS`, `BZ_PLATFORM_PULL_TIMEOUT_SECONDS`; crony BZ (pull */5, push co 1 min). Per wydarzenie: włączenie integracji + token organizacji BZ (UI).

## Operacje (bez zmian w kodzie, lista dla wdrożenia)

| ID | Pozycja | Prio |
|---|---|---|
| O-01 | Cron `php bin/scheduler.php` co 5 min na dev – od niego zależą: wygasanie nieopłaconych zapisów, przypomnienia, maile wyników, ponowienia outboxu mail i BZ, auto-zakończenie wydarzeń. Do potwierdzenia, że działa. | P0 |
| O-02 | Bramki Tpay / PayNow: kod jest, nigdy nie był sprawdzony na sandboksie. Zmienne: `TPAY_CLIENT_ID`, `TPAY_CLIENT_SECRET`, `TPAY_MERCHANT_ID`, `TPAY_SANDBOX`, `TPAY_NOTIFICATION_URL`, `TPAY_SUCCESS_URL`, `TPAY_ERROR_URL`, `PAYNOW_API_KEY`, `PAYNOW_SIGNATURE_KEY`, `PAYNOW_SANDBOX`, `PAYNOW_CONTINUE_URL`. | P0 (warunkowe: konta) |
| O-03 | Whitelist IP w seohost (429) – bez tego testy e2e-dev są niewiarygodne. | P1 |
| O-04 | Rozszerzenie PHP `zip` na hostingu (eksport XLSX zwraca `xlsx_not_supported` bez niego). | P1 |

## P2 – reszta (głównie „poza umową” lub do potwierdzenia przez Zamawiającego)

| ID | Pozycja | Spec | Repo | Rozm. |
|---|---|---|---|---|
| R-01 | Zespół wydarzenia (Właściciel + Współzarządzający) | 09 | S + F | L |
| R-02 | Życie zapisu: samoobsługowa rezygnacja z datą graniczną, zmiana dystansu z przeliczeniem salda, transfer przez organizatora | 20 | S + F | L |
| R-03 | Raport rozliczeniowy trasy A (do ręcznej wypłaty) | 13 | S + F | M |
| R-04 | Nadpisywanie formularza per Dystans (`distance_id` zawsze null) | 10 | S + F | M |
| R-05 | Joby retencji: odpowiedzi poufne, rejestr aktywności 12 mies. | 09, 10 | S | S |
| R-06 | `challenge_participations.user_id` → Zawodnik | 06, 15 | S | M |
| R-07 | Generator partii kodów rabatowych + eksport CSV | 07 | S + F | M |
| R-08 | Zgłoszenie duplikatu przez opiekuna/organizatora | 22 | S + F | S |
| R-09 | Etykieta anonima `Anonim #<kod>` zamiast stałej | 10 | S | S |
| R-10 | Dławienie logowania; usunięcie 2FA / trusted devices / rotacji haseł | 09 | S + F | M |
| R-11 | Martwy kod: moduł wiadomości w adapterze (`/messages*`, `/users/{id}/messages`) – brak w umowie | 03 | F | S |
| R-12 | Testy: ujemny modyfikator ceny i suma ≥ 0; współbieżność licznika miejsc | 07, 21 | S | S |
| R-13 | Zakresy numerów startowych per dystans (§5.1) – front ma `BibNumberAssignment.tsx`, serwera nie zweryfikowano | umowa §5.1 | S | ? |
| R-14 | SEO: QA-SEO-01/03/04 (meta per trasa, sitemap, soft 404) | PP.28 | F + host | M |
| R-15 | Fonty Google ładowane przed zgodą na cookies | RODO | F | S |
| R-16 | Menu mobilne nie zamyka się po Escape (funkcja, nie wygląd) | a11y | F | S |
| R-17 | Kalendarz Google (§5.9): brak po obu stronach (`/calendar/*` w adapterze bez tras) – **warunkowe od dostępów Zamawiającego** | umowa §5.9 | S + F | L |
| R-18 | Wyniki live – motyw zewnętrznego systemu (§3.5) – warunkowe od dostępów | 14 | F | ? |

Poza zakresem tej sesji (wygląd): kontrasty, odstępy, rozmiary, dwa `<main>`, skip link, rozmiar „Pokaż hasło” (QA a11y, `axe-public.spec.ts:78`).

## Decyzje (2026-10-19, odpowiedzi na pytania niżej)

1. Strony prawne: admin dodaje i edytuje je w CMS (z formatowaniem tekstu). Na start placeholder z treścią z obecnej zmierzymyczas.pl, wgrany migracją. B-06 obejmuje też sprawdzenie, czy edytor stron w CMS ma formatowanie.
2. Archiwum wyników → lista zakończonych wydarzeń.
3. Reply-to organizatora: rozszerzamy API central-mailera (M-01).
4. Transport `log` w CM dla `APP_ENV=local`: zgoda (M-02).
5. XML w eksporcie: jest w umowie, więc robimy (nowa pozycja G-11, S).
6. Pozycje „do potwierdzenia przez klienta” zostają P2; G-04 (sztafety) P1.
7. Kalendarz Google: brak dostępów; admin ma móc to włączyć i skonfigurować w panelu (R-17 → P1). Klucz konta usługi tylko w env, w panelu włącznik i ID kalendarza.

## Pytania do decyzji (nie da się ich ustalić z repo)

1. **Treść stron prawnych (B-06):** kto dostarcza regulamin, politykę prywatności i RODO? Do czasu dostarczenia mogę dodać strony z treścią zastępczą „w przygotowaniu”, ale strony prawne z placeholderem to decyzja biznesowa.
2. **Archiwum wyników (L-01/L-02):** nie ma strony archiwum. Czy kierować na `/wyniki/live`, czy na listę zakończonych wydarzeń (`/events` z filtrem)? Rekomendacja: lista zakończonych.
3. **Reply-to organizatora (M-01):** rozszerzyć API Central Mailera (zmiana w osobnym repo i wdrożenie CM), czy globalny reply-to na MVP? Rekomendacja: rozszerzyć.
4. **Transport dev w CM (M-02):** zgoda na dodanie transportu `log` (tylko `APP_ENV=local`) w central-mailer?
5. **XML w eksporcie (§4.2.4 „CSV/XML”):** jest CSV + XLSX. Czy XML jest faktycznie wymagany?
6. **Pozycje „do potwierdzenia przez Zamawiającego”** (Zespół wydarzenia, tryb testowy, ticket 20, anonimizacja wstecz): zostawiam jako P2, chyba że chcesz inaczej. Wyjątek: G-04 (wymiana w sztafecie) traktuję jako P1, bo sztafety są w umowie.
7. **Kalendarz Google (§5.9):** są dostępy od klienta? Jeśli nie – zostaje zablokowane.
