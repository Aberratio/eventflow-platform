# 01 events-browse (Sonnet, P1)
**Cel:** przeglądanie listy wydarzeń jako anonim działa poprawnie.
**Plik:** `e2e-dev/functional/events-browse.spec.ts` (tylko ten).
**Kontekst:** trasy `/events` i `/wydarzenia` (`src/App.tsx`); strona listy i filtry: znajdź w `src/pages` (grep "Events"). API: `GET /events` (parametry: handler w `routes.php` ok. linii 1159; filtry, `page`, `pageSize`, wyszukiwanie), odpowiedź paginowana `meta`.
**Kryteria akceptacji:**
- lista pokazuje karty z linkami do `/events/:slug` zgodnymi z danymi API; `/wydarzenia` pokazuje tę samą listę;
- każdy filtr dostępny w UI (rok, miasto, dyscyplina, status zapisów, typ, dystans; tylko te, które istnieją) zawęża wyniki zgodnie z danymi (np. miasto z `seed.events`: wszystkie karty mają to miasto albo liczba zgadza się z API z tym samym filtrem);
- wyszukiwanie fragmentu nazwy realnego wydarzenia je znajduje; fraza bez trafień pokazuje stan pusty z komunikatem PL;
- widok kompaktowy (jeśli jest przełącznik) zmienia układ i zachowuje wyniki;
- paginacja/doładowanie (jeśli jest) pokazuje kolejne elementy bez duplikatów;
- filtry a URL: odświeżenie i „wstecz" zachowują albo sensownie resetują filtry (opisz zachowanie; defekt tylko gdy ewidentny);
- na liście nie ma wydarzeń prywatnych ani szkiców (pola `visibility`/`isPrivate`/`publicationStatus`).
