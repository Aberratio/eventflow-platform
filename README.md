# EventFlow Platform (frontend)

Web frontend of ZmierzymyCzas, an event registration and timing platform for sports events. It covers the public event catalogue, registration and payment flows, live results, series and challenges, a shop, and the participant, organizer, moderator and admin panels. The UI is in Polish.

The backend lives in a separate repository (`eventflow-server`, PHP) and is consumed over a JSON REST API.

## Stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix UI)
- React Router, TanStack Query, React Hook Form
- Vitest and Testing Library (unit/component), Playwright (end-to-end)

## Architecture

- `src/pages/` - route-level screens, grouped by area (`organizer/`, `participant/`, `moderator/`, `admin/`, ...).
- `src/components/` - reusable UI and feature components; `components/ui/` holds the shadcn/ui primitives.
- `src/api/` - the API layer. `contract.ts` defines the contract the app depends on, `adapters/http.adapter.ts` implements it over `fetch`, and the per-domain modules (`events.api.ts`, `auth.api.ts`, ...) are thin facades used by pages and hooks. Request payloads are in `payloads.ts`, shared error handling in `errors.ts`.
- `src/contexts/`, `src/hooks/`, `src/lib/` - auth/cart state, data hooks and pure helpers (formatting, validation, domain rules).
- `src/types/` - domain types shared with the API layer.
- `build/` - Vite plugins, including the generator of security headers.
- `e2e/` (local stack) and `e2e-dev/` (hosted dev instance) - Playwright suites.

## Getting started

```sh
npm install
npm run dev
```

The dev server listens on port `8080` and talks to a backend at `http://localhost:8081/api/v1` by default. To use another backend, set `VITE_API_URL` in `.env.local` (git-ignored).

## Environments

Each environment has its own tracked `.env.<mode>` file. They are tracked on purpose and contain only public values (public API URLs, feature flags, the app name); no secrets. Anything secret must come from `.env.local` or CI secrets, and only `VITE_*` variables are exposed to the browser.

| Environment | File | Dev server | Build |
| --- | --- | --- | --- |
| local backend | `.env.development` | `npm run dev` | `npm run build:local` |
| hosted dev | `.env.dev` | `npm run dev:dev` | `npm run build:dev` |
| staging | `.env.staging` | `npm run dev:staging` | `npm run build:staging` |
| production | `.env.production` | `npm run dev:prod` | `npm run build` |

`.env.example` is a template for `.env.local`.

If the backend answers with 500 or the browser reports `connection refused`, check `curl http://localhost:8081/api/v1/health` first. If `/health` works but other routes fail with SQL errors such as `Unknown column`, the local database has an outdated schema: run the migrations in the server repository.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (local backend) |
| `npm run build` | Production build (`build:staging`, `build:dev`, `build:local` for other modes) |
| `npm run typecheck` | TypeScript check without emit |
| `npm run lint` | ESLint (`lint:warn` reports without failing, `lint:fix` autofixes) |
| `npm run test` | Vitest, single run (`test:watch`, `test:coverage` also available) |
| `npm run test:e2e` | Playwright against a local stack (`test:e2e:smoke` runs the `@smoke` subset) |
| `npm run test:e2e:dev` | Playwright suite against the hosted dev instance |
| `npm run validate` | typecheck, lint and tests in one go |

## Testing

Pure logic, hooks, API adapter mapping and branching components are covered by Vitest; business workflows across routes and roles by Playwright against a real backend with a freshly seeded database. See [docs/testing-strategy.md](docs/testing-strategy.md) for the gates, how to run the E2E stack and the list of quarantined tests.

Releases follow the process in [RELEASING.md](RELEASING.md); user-visible changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

Copyright (c) 2026 Joanna Kokot. All rights reserved. See [LICENSE](LICENSE).

## Security headers / .htaccess

`npm run build` / `npm run build:staging` / `npm run build:dev` / `npm run build:local` generate
`dist/.htaccess` at build time, via `build/securityHeaders.ts` (the pure CSP
generator, unit-tested in `build/securityHeaders.test.ts`) and
`build/securityHeadersPlugin.ts` (the Vite `writeBundle` plugin that writes
it, plus a byte-identical `dist/embed.html` copy of `index.html`). It is not
a static file in `public/` — the API origin (`connect-src`, `img-src`) is
only known at build time, from `VITE_API_URL`.

The generated file sets a full Content-Security-Policy, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` (unset for the
embed routes), `Strict-Transport-Security` (dev/staging/production only), the
SPA fallback rewrite (excluding `/api`, `/uploads` and `/assets`), and a
cache policy for immutable hashed assets. Embed routes (`/embed/*`,
`/events/:slug/embed`) are served `embed.html` instead of `index.html`
through a `<Files>` block, with `frame-ancestors *` and no `X-Frame-Options`,
so third-party sites can iframe them; every other route stays
`frame-ancestors 'self'`.

Build-time environment variables (set as GitHub Environment variables in
`deploy.yml`, empty means enforce mode with no extras):

| Variable                | Purpose                                                                                                                                                                                                                                                                                                                                            | Example                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `VITE_API_URL`          | Already required. Absolute URL of the API for this environment; must be `https://` in staging/production.                                                                                                                                                                                                                                          | `https://<staging-api-host>/api/v1` |
| `CSP_CONNECT_SRC_EXTRA` | Optional. Comma/whitespace-separated list of extra exact origins to allow in `connect-src` (no path, no wildcard; must be `https://` in staging/production).                                                                                                                                                                                       | `https://<extra-service-host>`      |
| `CSP_REPORT_ONLY`       | Optional. `true` switches the CSP to `Content-Security-Policy-Report-Only`, **except** `frame-ancestors`, which is always emitted as an enforced `Content-Security-Policy: frame-ancestors 'self'` (`*` on embed routes) — clickjacking protection is never report-only. Use this as a no-code escape hatch if a legitimate resource gets blocked. | `true`                              |

A build fails (with an English error naming the offending variable) if
`VITE_API_URL` (or a `CSP_CONNECT_SRC_EXTRA` entry) is relative, uses `http:`
in staging/production, or is otherwise malformed — this is intentional: a
misconfigured secret must not silently ship a broken or insecure policy.

**Verifying against Apache.** The HSTS directive is emitted only in staging and
production builds, so a development build does not exercise it. Any Apache
check (including `e2e/security-headers.spec.ts`) must also be run against a
**staging-mode** build, for example
`VITE_API_URL=https://<staging-api-host>/api/v1 npm run build:staging`, and
`/` must return 200. A directive line with a trailing `# comment` makes Apache
answer 500 on every path ("Header has too many arguments"); the generator
never emits one and `build/securityHeaders.test.ts` guards this.

Not covered yet: a dynamic per-event `frame-ancestors` allowlist, `X-Robots-Tag: noindex` on staging, self-hosting Google Fonts, and upload MIME hardening beyond what the API already sends.
