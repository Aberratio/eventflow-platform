# 10 headers-cors (Haiku, P1)
**Cel:** nagłówki bezpieczeństwa i CORS na froncie i API zgodne z polityką.
**Plik:** `e2e-dev/security/headers-cors.spec.ts`.
**Kontekst:** README frontu (sekcja „Security headers"), `eventflow-server/src/Http/Middleware/SecurityHeadersMiddleware.php`, `CorsMiddleware.php`. API ma trasy PUT (np. `PUT /events/{id}/form-fields/reorder`).
**Kryteria akceptacji (tylko `request`, bez przeglądarki):**
- front `/`, `/events`, `/shop`: CSP z `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`, bez `unsafe-eval` i bez `unsafe-inline` w `script-src`; `Strict-Transport-Security` z `max-age >= 15552000`; `X-Content-Type-Options: nosniff`; `X-Frame-Options`; `Referrer-Policy`; `Permissions-Policy`; brak `X-Powered-By` i wersji serwera;
- assety `/assets/*.js` (wyciągnij jeden z HTML `/`): `Cache-Control` z `immutable` lub długim `max-age`; `index.html` z `no-cache`;
- API `/health`, `/events`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, CSP `default-src 'none'`, HSTS;
- CORS: preflight `OPTIONS` z `Origin: https://portal-dev.zmierzymyczas.kokot.it` dla GET/POST/PATCH/DELETE/PUT: dozwolone metody obejmują każdą metodę, której API używa. Osobny test dla PUT (podejrzenie H2: brak `PUT` w `Access-Control-Allow-Methods`); sprawdź też, czy front wysyła PUT (grep `'PUT'` w `src/api`);
- preflight z `Origin: https://evil.example`: brak `Access-Control-Allow-Origin` dla tego originu; nigdy `Access-Control-Allow-Credentials: true`.
