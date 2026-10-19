# Testing Strategy

## Gates

- Fast PR gate: `npm run typecheck && npm run lint:warn && npm run test`
- Smoke E2E: `npm run test:e2e:smoke` (real backend, see below)
- Full E2E: `npm run test:e2e` (real backend, see below)

## Frontend Layers

- Use Vitest for pure logic, hooks, contexts, API adapter mapping, and components with meaningful branching.
- Use Testing Library assertions that describe user-visible behavior.
- Use Playwright for business workflows across routes and roles. Avoid assertions that only check that `body` is not empty.
- Shared Playwright helpers live in `e2e/helpers.ts` (login, dashboard navigation, wizard walk) and `e2e/api.ts` (tokens and seeded fixtures by ID). Network layout comes from `e2e/env.ts`.
- E2E always runs against the real PHP API with a freshly migrated and seeded database. There is no mock mode: the mock adapter was removed and `VITE_ENABLE_MOCKS` is no longer read by the app.

## E2E setup

`playwright.config.ts` starts two web servers: `e2e/start-backend.mjs` (runs `php bin/migrate.php`, `php bin/seed.php`, then `php -S <host>:<port> -t public router.php` in the server repo) and Vite on the configured port. The backend script does **not** create a fresh database: a fresh database is the caller's job, because the suite mutates state (moderation, orders, created drafts) and fixtures such as `e19` and `e2e-pending` assume a fresh seed.

The suite runs serially (`workers: 1`, `fullyParallel: false`) with `retries: 0`. `php -S` serves one request at a time and the specs share one seeded database, so parallel workers produce timeouts and a retry would hide real flakes.

Environment variables (defaults match CI):

| Variable                   | Default                        | Meaning                                                                   |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `PLAYWRIGHT_API_URL`       | `http://127.0.0.1:8081/api/v1` | API base URL; host and port are used for `php -S`                         |
| `PLAYWRIGHT_FRONTEND_PORT` | `5173`                         | Vite port (strict)                                                        |
| `PLAYWRIGHT_BASE_URL`      | derived from the port          | When set, no web server is started (run against an already running stack) |
| `PLAYWRIGHT_SERVER_DIR`    | `../zmierzymy_czas_server`     | Server repo checkout                                                      |

The server needs its own environment (read through `getenv`, no `.env` required): `APP_ENV=local` (the seed refuses production), `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `APP_URL`, and `APP_CORS_ORIGIN` listing the exact browser origin (`http://127.0.0.1:<frontend port>`).

Local recipe (any free ports, own database):

```powershell
$env:APP_ENV='local'; $env:DB_HOST='127.0.0.1'; $env:DB_PORT='3306'; $env:DB_DATABASE='my_e2e'; $env:DB_USERNAME='root'; $env:DB_PASSWORD=''
$env:JWT_SECRET='local-e2e-secret-at-least-32-bytes-long'
$env:APP_URL='http://127.0.0.1:8103'; $env:APP_CORS_ORIGIN='http://127.0.0.1:5203'
$env:PLAYWRIGHT_API_URL='http://127.0.0.1:8103/api/v1'; $env:PLAYWRIGHT_FRONTEND_PORT='5203'
mysql -uroot -e "DROP DATABASE IF EXISTS my_e2e; CREATE DATABASE my_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
npx playwright test            # or: npm run test:e2e:smoke
```

Reset the database before every run. After a run, make sure no `php.exe` is left listening on the API port.

## CI

The `Client Test` workflow has two jobs. `Frontend fast gate` runs typecheck, lint and Vitest. `Playwright smoke` checks out the client and the server repo (`Aberratio/eventflow-server`, `master`, read through the deploy-key secret `SERVER_REPO_SSH_KEY`), starts a MySQL 8.4 service, installs the server with Composer and runs `npm run test:e2e:smoke` (tests tagged `@smoke`). Playwright migrates and seeds the empty service database and starts the API itself. The job is therefore a contract check against the latest server `master`.

## Seed rules for specs

- Resolve seeded events by stable ID through the API (`seededEvent(request, 'e19')`), never by name or slug: `FixtureCalendar::retitleForYear` moves JSON fixtures to a window relative to the seed date and rewrites the year in names and slugs.
- Dashboards: admin and moderator use sidebar buttons (`openDashboardSection`), participant and organizer use real ARIA tabs.
- `u-organizer` starts with 0 package credits and more events than its limit; specs that create events call `ensureOrganizerCapacity` first.

## Known e2e failures

Every non-passing test of the full suite is listed here with a ticket, or the table says none.

| Test                                  | Ticket | Reason                                                                                                        |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `visual.spec.ts` "sklep — desktop"    | PP.58  | quarantined (`test.fixme`): the committed baseline differs from a fresh seed (product images, 22% of pixels)  |
| `visual.spec.ts` "wyzwania — desktop" | PP.58  | quarantined (`test.fixme`): the committed baseline differs from a fresh seed (challenge images, 6% of pixels) |

Skipped by design: `e2e/security-headers.spec.ts` (opt-in via `SECURITY_HEADERS_BASE_URL`, 8 tests).

## Contract Rule

Any API payload or response shape change should update the TypeScript type or adapter in `src/api`, plus at least one frontend adapter/component test that consumes the changed shape.
