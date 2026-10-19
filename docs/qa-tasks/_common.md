# Wspólne zasady dla tasków QA (dev)

Repo frontu: `C:\Repos\zmierzymy-czas\eventflow-platform` (Windows; Bash i PowerShell dostępne). API (tylko do czytania kodu): `C:\Repos\zmierzymy-czas\eventflow-server\src\Http\routes.php`.

## Środowisko
- Front: `https://portal-dev.zmierzymyczas.kokot.it`, API: `https://portal-api-dev.zmierzymyczas.kokot.it/api/v1` (współdzielony dev; tylko ten host).
- **Host throttluje**: zbyt szybki ruch daje `429` z `Retry-After: 300` na wszystko. Uruchamiaj zawsze z `--workers=1`. Gdy test rzuci `DEV_THROTTLED`, nie odpalaj ponownie od razu: poczekaj, aż `curl -s -o /dev/null -w "%{http_code}" https://portal-api-dev.zmierzymyczas.kokot.it/api/v1/health` da 200 (np. `until [ "$(curl ...)" = 200 ]; do sleep 30; done` z timeoutem 600000). 429 to problem środowiska, nie defekt.
- Bez logowania: te taski są tylko dla anonima. Nie loguj się, nie twórz danych, nie wysyłaj formularzy zapisujących dane (wyjątek: jawnie wskazany w briefie, np. błędne logowanie na nieistniejący adres `qa-…@example.com`).
- Zakaz: brute force, skanery, > 20 żądań równolegle, inne hosty, wysyłanie czegokolwiek do zewnętrznych usług.

## Helpery (task 00, nie edytuj ich; jeśli czegoś brakuje, opisz w raporcie)
- `e2e-dev/support/fixtures.ts`: `test`, `expect`, worker fixture `seed` (`events`, `upcoming`, `past`, `openForRegistration`, `series`, `products`, `challenges` z API), auto fixture `problems` (fail na page error / API 5xx; `problems.allow(/regex/)` gdy błąd jest celowy), `acceptCookies(page)`, `skipCookieBanner(page)`.
- `e2e-dev/support/api.ts`: `call(request, method, path, {params, data, headers, token})` (surowa odpowiedź, rzuca `DevThrottledError` na 429), `getData<T>(request, path)` (zwraca `data` z koperty `{success, data, meta?}`).
- `e2e-dev/support/env.ts`: `FRONT`, `API`, `today()`.
- `e2e-dev/support/axe.ts`: `scanA11y(page, {include?, exclude?})` -> `{all, blocking}` (WCAG 2.2 AA).
- `e2e-dev/support/viewports.ts`: `VIEWPORTS`, `LANDSCAPE`, `MIN_TAP_TARGET`.
- Wzorzec stylu: `e2e-dev/dev-smoke.spec.ts` i `e2e-dev/support/selfcheck.spec.ts`.

## Konwencje
- TypeScript, `import { test, expect } from '../support/fixtures'`.
- Selektory: role/label/text przed CSS. UI jest po polsku.
- Dane z API (`seed`), nigdy zahardkodowane slugi/ID. Gdy brak kandydata: `test.skip(true, 'powód')`.
- Zakaz `waitForTimeout`; web-first assertions (`toBeVisible`, `toHaveURL`, `toHaveCount`...). Asercje muszą coś weryfikować (nie `toBeTruthy` na wszystkim, nie „body niepuste").
- Testy niezależne, bez kolejności, bez współdzielonego stanu. Tag w nazwie describe (np. `@functional`, `@api`, `@security`, `@a11y`, `@responsive`, `@perf`, `@seo`, `@usability`, `@resilience`); 1–2 najważniejsze testy pliku dodatkowo `@smoke`.
- Defekt aplikacji ≠ błąd testu. Test, który wykrył prawdziwy defekt, zostaw czerwony z `test.fail()` **tylko** jeśli defekt potwierdziłeś ręcznie (curl/Playwright) i opisz go w raporcie; nie osłabiaj asercji, żeby było zielono.
- Edytujesz wyłącznie pliki wskazane w swoim briefie (plus pliki snapshotów, jeśli brief tak mówi). Nie ruszaj aplikacji, configu, `package.json`, helperów. Nie commituj.

## Uruchomienie i „done"
`npx playwright test -c playwright.dev.config.ts <twoje pliki> --workers=1`
Done = zielone (lub udokumentowane `test.fail()` dla potwierdzonych defektów) **2 razy z rzędu**. Flaky = nie done. Oszczędzaj: nie odpalaj całości więcej niż potrzeba, debuguj pojedynczy test (`-g`).

## Raport zwrotny (krótko)
1. Pliki utworzone.
2. Wynik obu uruchomień (passed/failed/skipped, czas).
3. Defekty aplikacji: tytuł, severity (blocker/critical/major/minor), kroki, oczekiwane vs faktyczne, dowód (test + komenda curl/odpowiedź). Defekty bezpieczeństwa bez szczegółów exploitu.
4. Czego nie zrobiono i dlaczego.
