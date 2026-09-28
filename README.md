# ZmierzymyCzas client

Frontend aplikacji ZmierzymyCzas zbudowany na Vite, React, TypeScript, shadcn/ui i Tailwind CSS.

## Uruchomienie

```sh
npm install
npm run dev
```

Domyslny serwer developerski dziala na porcie `8080`.

Frontend domyslnie laczy sie z lokalnym backendem pod adresem
`http://localhost:8081/api/v1`. Jesli backend dziala pod innym adresem, ustaw
w `.env.local`:

```sh
VITE_API_URL=http://localhost:8081/api/v1
```

Jesli backend zwraca 500 albo przegladarka pokazuje `connection refused`,
najpierw sprawdz:

```sh
curl http://localhost:8081/api/v1/health
curl http://localhost:8081/api/v1/events
```

Jesli `/health` dziala, ale `/events` zwraca blad SQL typu `Unknown column ...`,
lokalna baza ma stary schemat. W katalogu `zmierzymy_czas_server` uruchom:

```sh
composer migrate
```

Jesli `/health` tez nie odpowiada, backend nie jest uruchomiony. W katalogu
`zmierzymy_czas_server` odpal `composer serve` w osobnym terminalu i zostaw go
otwarty podczas pracy z frontendem.

Mock adapter zostal w kodzie tylko dla testow i nie jest domyslna sciezka aplikacji.

## Przydatne komendy

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## Security headers / .htaccess

`npm run build` / `npm run build:staging` / `npm run build:dev` generate
`dist/.htaccess` at build time, via `build/securityHeaders.ts` (the pure CSP
generator, unit-tested in `build/securityHeaders.test.ts`) and
`build/securityHeadersPlugin.ts` (the Vite `writeBundle` plugin that writes
it, plus a byte-identical `dist/embed.html` copy of `index.html`). It is not
a static file in `public/` — the API origin (`connect-src`, `img-src`) is
only known at build time, from `VITE_API_URL`.

The generated file sets a full Content-Security-Policy, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` (unset for the
embed routes), `Strict-Transport-Security` (staging/production only), the
SPA fallback rewrite (excluding `/api`, `/uploads` and `/assets`), and a
cache policy for immutable hashed assets. Embed routes (`/embed/*`,
`/events/:slug/embed`) are served `embed.html` instead of `index.html`
through a `<Files>` block, with `frame-ancestors *` and no `X-Frame-Options`,
so third-party sites can iframe them; every other route stays
`frame-ancestors 'self'`.

Build-time environment variables (set as GitHub Environment variables in
`deploy.yml`, empty means enforce mode with no extras):

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Already required. Absolute URL of the API for this environment; must be `https://` in staging/production. | `https://<staging-api-host>/api/v1` |
| `CSP_CONNECT_SRC_EXTRA` | Optional. Comma/whitespace-separated list of extra exact origins to allow in `connect-src` (no path, no wildcard; must be `https://` in staging/production). | `https://<extra-service-host>` |
| `CSP_REPORT_ONLY` | Optional. `true` switches the CSP to `Content-Security-Policy-Report-Only`, **except** `frame-ancestors`, which is always emitted as an enforced `Content-Security-Policy: frame-ancestors 'self'` (`*` on embed routes) — clickjacking protection is never report-only. Use this as a no-code escape hatch if a legitimate resource gets blocked. | `true` |

A build fails (with an English error naming the offending variable) if
`VITE_API_URL` (or a `CSP_CONNECT_SRC_EXTRA` entry) is relative, uses `http:`
in staging/production, or is otherwise malformed — this is intentional: a
misconfigured secret must not silently ship a broken or insecure policy.

Out of scope for now (tracked in later tickets): a dynamic per-event
`frame-ancestors` allowlist and `X-Robots-Tag: noindex` on staging (PP.28),
self-hosting Google Fonts (PP.29), and upload MIME hardening beyond what the
API already sends (PP.11).
