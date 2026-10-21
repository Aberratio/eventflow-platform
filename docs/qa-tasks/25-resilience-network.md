# 25 resilience-network (P2)
**Cel:** aplikacja zachowuje się sensownie przy błędach API, pustych danych i słabej sieci.
**Plik:** `e2e-dev/resilience/network-errors.spec.ts`.
**Kontekst:** mockuj przez `page.route('**/api/v1/...')`, bez obciążania dev. Fixture `problems` łapie page errors; gdy błąd jest celowy, użyj `problems.allow(/regex/)`.
**Kryteria akceptacji:**
- `/events`, event detail, `/shop`, `/series`: mock 500 dla głównego endpointu → widoczny komunikat błędu PL, brak białego ekranu i niezłapanego wyjątku; po zdjęciu mocka i ponowieniu dane się ładują;
- `route.abort('timedout')` / brak odpowiedzi → stan ładowania, potem błąd; zapisz czas; nieskończony spinner bez informacji = defekt;
- `{success:true,data:[]}` dla list → czytelny stan pusty (wydarzenia, sklep, serie, wyzwania);
- nazwa wydarzenia/produktu z 300 znakami, polskimi znakami i emoji → brak poziomego scrolla, nazwa zawinięta albo ucięta z wielokropkiem;
- `context.setOffline(true)` po załadowaniu `/events`, potem nawigacja do detalu → komunikat, nie crash;
- Slow 3G przez CDP `Network.emulateNetworkConditions` na `/` → h1 widoczny w < 15 s (zapisz czas);
- 401 z API na stronie publicznej nie powoduje pętli przekierowań anonima.
