# Prompt: sesja naprawcza (funkcje, nie wygląd)

Wklej poniższą treść do nowej sesji Claude Code w `C:\Repos\zmierzymy-czas`. Model: Opus jako orkiestrator (inwentarz względem specyfikacji, review, decyzje), a poprawki wykonują subagenci Sonnet.

---

Jesteś Tech Leadem projektu ZmierzymyCzas (platforma wydarzeń sportowych: zapisy, wyniki, sklep, serie, wyzwania). Cel tej sesji: **wszystko, co jest w specyfikacji, ma być zaimplementowane i działać poprawnie**. Mailer i integracja z Biurem Zawodów mają być podłączone, a wszystkie linki mają działać. **Wyglądem (kontrasty, odstępy, rozmiary) się nie zajmujemy**, chyba że blokuje działanie funkcji. Odpowiadaj krótko, po polsku. Oszczędzaj kredyty: subagenci tylko Sonnet/Haiku, łącz drobne zadania, czytaj pliki fragmentami.

## Repozytoria (każde to osobne repo git)
- `eventflow-platform/`: frontend (Vite, React, TS, shadcn/ui). Testy: vitest, `e2e/` (lokalny backend), `e2e-dev/` (dev).
- `eventflow-server/`: API (PHP 8.2, Slim 4, MySQL, JWT). PHPUnit; zasady w `TESTING.md`, trasy w `src/Http/routes.php`.
- `central-mailer/`: wysyłka maili (klient w `eventflow-server/src/Domain/Mailer/CentralMailer/`, konfiguracja `CENTRAL_MAILER_BASE_URL`, `CENTRAL_MAILER_API_KEY`).
- `biuro_zawodow-api/`, `biuro_zawodow-client/`: Biuro Zawodów (BZ). Strona ZC: `BZ_WEBHOOK_BASE_URL`, `bz_organization_token`, `/events/{id}/bz/participants`, outbox webhooków (`BzWebhookOutboxService`). Wg `eventflow-server/.env.example` BZ nie ma jeszcze endpointu odbierającego webhooki.
- PHP lokalnie: `C:\xampp\php\php.exe`. Lokalna baza testowa: `zmierzymy_czas_test` (`ZC_TEST_DB_DATABASE=zmierzymy_czas_test`).

## Źródła prawdy
1. Specyfikacja (z umowy): `C:\Repos\tiller\brains\zmierzymy-czas-notes\specyfikacje\zmierzymy-czas\`. Zacznij od `map.md` i `plan-prac.md`, potem rozdziały `issues/01–23` (np. `12-kontrakt-integracji-z-biurem-zawodow.md`, `13-platnosci-i-rozliczenia.md`, `17-katalog-maili-i-kontrakt-z-mailerem.md`), a źródła są w `sources/` (`umowa-specyfikacja.md`, `macierz-uprawnien.md`, `specyfikacja-biuro-zawodow.md`, `kontrakt-central-mailer.md`). Kod odwołuje się do tych rozdziałów numerami (np. „spec 13 Zwroty”, „17 §1”) oraz ticketami (E…, PP…, TD…). Specyfikacji nie zmieniaj, tylko ją czytaj. Jeśli nie możesz jej odczytać (blokada dostępu), zatrzymaj się i powiedz mi o tym.
2. Wyniki QA: `eventflow-platform/docs/qa-plan.md` (sekcja 1.4), `eventflow-platform/docs/qa-manual-findings.md` (jeśli już istnieje), testy z `test.fail('QA-…')` w `eventflow-platform/e2e-dev/`.
3. Scenariusze: `eventflow-platform/docs/event-flow-manual-test-scenarios.md`.

## Faza 1: inwentarz (sam, bez zmian w kodzie)
Zapisz `eventflow-platform/docs/fix-backlog.md`:
- **Luki względem specyfikacji**: rozdział specyfikacji → stan (zrobione / częściowo / brak) → dowód (plik:linia, trasa, test). Weryfikuj w kodzie, nie zakładaj na podstawie nazw.
- **Defekty znane z QA** (zweryfikuj, czy nadal występują):
  - martwy link `/wyniki` (`src/pages/Index.tsx` ok. 582, `src/pages/LiveResultsPage.tsx` ok. 121), w routerze jest tylko `/wyniki/live`;
  - linki w stopce `/info/regulamin`, `/info/polityka-prywatnosci`, `/info/rodo` dają 404 (brak stron info w danych albo zła ścieżka);
  - QA-API-01: trasy szczegółów (`/series/slug/{slug}`, `/series/{id}`, `/shop/products/slug/{slug}`, `/challenges/slug/{slug}`, `/challenges/{id}`, `/info-pages/slug/{slug}`, `/partners/{id}`, `/event-backgrounds/{id}`) zwracają 200 `data:null` zamiast 404;
  - strony list (`EventsPage`, `ShopPage`, `SeriesListPage`, `ChallengesListPage`) i `EventDetailsPage` ignorują `isError`: błąd 500 pokazuje „Nie znaleziono…”, a brak odpowiedzi daje nieskończone ładowanie (fetch bez timeoutu);
  - ceny renderowane jako `{product.price} zł` bez `formatMoney` (`ShopProductPage.tsx` ok. 180, `ProductCard.tsx` ok. 67);
  - CORS `Access-Control-Allow-Methods` bez `PUT`, choć API ma trasy PUT (`CorsMiddleware.php`);
  - `/athlete/:userId` pobiera `pageSize: 1000`, a API tnie do 100, więc historia zawodnika gubi wydarzenia;
  - `/series/:slug` liczy klasyfikację po stronie klienta z 25 wydarzeń zamiast z `GET /series/{id}/ranking`;
  - `SeriesStandingsTable` linkuje `/events/${event.id}`, a trasa oczekuje sluga;
  - anonim na `/challenges/:slug` nie dostaje CTA logowania;
  - SEO na dev: `robots.txt` pozwala na indeksowanie, `/sitemap.xml` zwraca HTML aplikacji, nieistniejące adresy dają HTTP 200 (soft 404). Na teraz napraw tylko `noindex` dla dev (PP.28); reszta SEO później.
- **Mailer**: lista typów maili ze specyfikacji → czy jest wysyłany (miejsce w kodzie) → czy ma szablon → czy przechodzi przez outbox → co trzeba ustawić w `.env` dev. Sprawdź end-to-end lokalnie: `central-mailer` uruchomiony lokalnie, ZC wysyła, mail ląduje w outboxie/logu.
- **Biuro Zawodów**: kontrakt ZC↔BZ (testy `tests/e2e/bz`, `BzParticipantsContractTest`, `BzParticipantSyncContractTest`, PP.43), czego brakuje po stronie BZ (endpoint odbierający webhooki), czego po stronie ZC, co trzeba skonfigurować na dev.
- **Linki**: crawler po wszystkich trasach z `src/App.tsx` i wszystkich `to=`/`href=` w `src` (grep), lista linków bez pasującej trasy.
- Każda pozycja ma: priorytet (P0 blokuje funkcję ze specyfikacji, P1 błąd funkcji, P2 reszta), repo, szacunek (S/M/L).

**Pokaż mi backlog i poczekaj na akceptację** przed zmianami w kodzie. Zapytaj tylko o to, czego nie da się ustalić z repo (np. brak specyfikacji, dostęp do dev `.env`, decyzje biznesowe).

## Faza 2: naprawy
- Kolejność: P0, potem P1, potem P2. Najpierw backend i kontrakt, potem front.
- Każda poprawka test-first, zgodnie z konwencjami repo (`TESTING.md`, `docs/testing-strategy.md`): test na zły stan (czerwony), poprawka, test zielony. Zmiana kontraktu API = zmiana typu/adaptera w `src/api` + test adaptera (Contract Rule).
- Gdy poprawka naprawia test z `test.fail('QA-…')` w `e2e-dev/`, usuń `test.fail` w tym samym PR.
- Bramki przed commitem:
  - front: `npm run typecheck && npm run lint:warn && npm run test`;
  - server: `composer lint`, `composer stan`, testy Unit i właściwe Integration na `zmierzymy_czas_test`.
- Git: jedna gałąź i jeden draft PR na logiczną poprawkę albo małą grupę powiązanych poprawek, w każdym repo osobno. Nie merguj i nie pushuj na `master` bez mojej zgody (push na `master` serwera wdraża na staging).
- Sekrety (klucze mailera, tokeny BZ, `.env` dev) tylko przez zmienne środowiskowe; nigdy w repo, w PR ani w czacie. Jeśli coś wymaga zmiany `.env` na dev, dopisz to do listy dla osoby wdrażającej (Lesław), zamiast robić to samemu.
- Nie zmieniaj wyglądu poza tym, co konieczne dla działania funkcji.

## Faza 3: domknięcie
- Zaktualizuj `fix-backlog.md`: zrobione / PR / co zostało i dlaczego.
- Lista dla wdrożenia na dev: kolejność merge PR-ów, migracje, zmiany `.env` (nazwy zmiennych, bez wartości), kroki weryfikacji po wdrożeniu.
- Podsumowanie w 3–5 zdaniach: co działa, czego brakuje do pełnej zgodności ze specyfikacją.
