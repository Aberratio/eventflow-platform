# 15 info-leak-ratelimit-rodo (P1, bez kont)
**Cel:** brak wycieku informacji, enumeracji kont, otwartych endpointów dev/webhook; cookies/RODO dla anonima.
**Plik:** `e2e-dev/security/info-leak.spec.ts`.
**Kontekst:** `routes.php`: `/auth/password/reset` (ok. linii 691, cooldown per user 60 s), `/auth/register`, `/auth/login`, `/dev/seed-event` (ok. 3709), `/webhooks/tpay`, `/webhooks/paynow`, `/uploads/{path}`. Front: `src/components/CookieConsent.tsx`. Uwaga z rozpoznania: `POST /auth/login` dostał 429 szybciej niż inne trasy, możliwe, że hosting ma na nim osobny limit.
**Kryteria akceptacji:**
- błędy (404, 405, zły JSON, bardzo długi parametr) bez stack trace, ścieżek plików, klas PHP, SQL, wersji (`APP_DEBUG` musi być wyłączony);
- reset hasła: status i treść identyczne dla `jan@example.com` i `qa-nobody-<ts>@example.com`; maks. 1 żądanie na adres;
- rejestracja na zajęty e-mail: nie twórz konta. Wyślij hasło `short` (odrzuci walidacja) dla `jan@example.com` i dla nowego adresu; zapisz, czy odpowiedzi się różnią (409 `email_taken` = enumeracja, ryzyko minor);
- rate limit logowania: maks. 8 nieudanych prób sekwencyjnie na `qa-ratelimit-<ts>@example.com`; zapisz, czy i od której próby pojawia się 429 (aplikacja nie ma limitu; hosting może mieć). Żadnych prób na prawdziwe konta. Ten test oznacz `test.describe.configure({ mode: 'serial' })` i uruchamiaj na końcu, bo może zablokować host na 5 min;
- `/dev/seed-event` bez tokenu i ze śmieciowym tokenem → 401/403, nic nie tworzy;
- webhooki tpay/paynow bez podpisu i z pustym ciałem → 4xx, bez 500;
- path traversal na `/uploads/` (3–4 warianty, np. `..%2f..%2f.env`) → 404, nigdy treść pliku;
- cookies: przed zgodą brak cookies analitycznych/marketingowych (`context.cookies()`, żądania do domen trackingowych); odrzucenie działa; banner ma link do polityki prywatności;
- publiczne odpowiedzi (`/events`, wyniki, start-list, rankingi) bez e-maili/telefonów/dat urodzenia uczestników (regex po JSON; kontakt organizatora dopuszczalny, odnotuj).
