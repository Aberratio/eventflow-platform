# 05 series-challenges-live (P2)
**Cel:** serie i klasyfikacje, wyzwania, wyniki live i profil zawodnika działają dla anonima.
**Plik:** `e2e-dev/functional/series-challenges-live.spec.ts`.
**Kontekst:** trasy `/series`, `/series/:slug`, `/challenges`, `/challenges/:slug`, `/wyniki/live`, `/athlete/:userId`. API: `GET /series`, `/series/slug/{slug}`, `/series/{id}/ranking`, `/challenges`, `/challenges/slug/{slug}`, `/challenges/{id}/ranking`, `/events/live`, `/users/{userId}/results`, `/users/{userId}/personal-records`.
**Kryteria akceptacji:**
- lista serii = serie z API; strona serii pokazuje jej wydarzenia i klasyfikację (gdy ranking w API niepusty, pierwsza pozycja widoczna w UI);
- lista wyzwań i strona wyzwania (opis, warunki, ranking jeśli jest); anonim widzi CTA logowania zamiast dołączenia;
- `/wyniki/live`: puste `/events/live` → czytelny stan pusty; niepuste → link do wydarzenia;
- profil zawodnika: `userId` z wyników przeszłego wydarzenia (API); strona pokazuje imię i wyniki; nieistniejący id → komunikat, nie biały ekran;
- profil zawodnika nie ujawnia e-maila, telefonu ani daty urodzenia; jeśli ujawnia, zgłoś jako defekt RODO.
