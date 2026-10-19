# 08 api-contract (Sonnet, P1)
**Cel:** kontrakt publicznych endpointów API: statusy, kształt JSON, walidacja, paginacja, kody błędów.
**Plik:** `e2e-dev/api/contract-public.spec.ts`.
**Kontekst:** koperta sukcesu `{success:true, data, message?}`, paginacja `meta {total,page,pageSize,totalPages}` (`eventflow-server/src/Support/JsonResponder.php`), błąd `JsonResponder::error(code, message, status)`. Publiczne GET (`routes.php`): `/health`, `/events`, `/events/featured`, `/events/live`, `/events/slug/{slug}`, `/events/{id}`, `/events/{eventId}/results`, `/events/{eventId}/start-list`, `/events/{eventId}/form-fields/public`, `/series`, `/series/slug/{slug}`, `/series/{id}/ranking`, `/shop/products`, `/shop/products/slug/{slug}`, `/shop/categories`, `/shop/delivery-methods`, `/shop/payment-methods`, `/challenges`, `/challenges/slug/{slug}`, `/info-pages`, `/info-pages/slug/{slug}`, `/partners`, `/partners/featured`, `/event-backgrounds`, `/insurance/variants`.
**Kryteria akceptacji:**
- każdy endpoint (test data-driven): 200, `Content-Type: application/json`, `success === true`, `data` oczekiwanego typu, kluczowe pola obecne i poprawnego typu (np. event: `id, slug, name, date, publicationStatus`);
- publiczne eventy bez pól wrażliwych: `accessCode`, `bzOrganizationToken` puste/nieobecne, brak `usedBy` w rabatach (PP.55);
- paginacja `/events`: `page`/`pageSize` respektowane, `meta.total` spójne, strony się nie nakładają; skrajne wartości (`pageSize=0`, `-1`, `100000`, `page=abc`) → 200 z rozsądnym limitem albo 4xx z kopertą błędu, nigdy 500;
- nieistniejący slug/id → 404 z kopertą błędu; nieznana trasa → 404 JSON; zła metoda (np. `DELETE /health`) → 405 (zapisz, co zwraca);
- `POST /auth/login` z pustym ciałem, złym JSON, bez pól → 4xx z kopertą, nie 500 (maks. 3 żądania, adresy `qa-…@example.com`);
- czas każdej odpowiedzi w `test.info().annotations` (do raportu wydajności).
