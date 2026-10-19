# 02 event-detail (Sonnet, P1)
**Cel:** strona szczegółów wydarzenia działa dla wydarzeń przyszłych, przeszłych i różnych statusów zapisów.
**Plik:** `e2e-dev/functional/event-detail.spec.ts`.
**Kontekst:** trasy `/events/:slug`, `/events/:slug/:tab` (`src/App.tsx`); komponent: grep w `src/pages` ("EventDetail"). API: `GET /events/slug/{slug}`, `/events/{id}/results`, `/events/{id}/result-documents`, `/events/{eventId}/start-list`.
**Kryteria akceptacji:**
- h1 = nazwa z API; widoczna data i miejsce w formacie PL;
- każda zakładka z UI otwiera się kliknięciem i deep linkiem `/events/:slug/:tab` z treścią; nieznana zakładka nie daje białego ekranu;
- przeszłe wydarzenie z wynikami w API pokazuje tabelę wyników zgodną z API (liczba rekordów albo pierwsze nazwisko);
- galeria (jeśli są zdjęcia) otwiera podgląd i zamyka go Escape;
- regulamin (`rulesHtml`) wyrenderowany jako HTML, nie surowe tagi;
- wydarzenie z `seed.openForRegistration` ma przycisk zapisu do `/events/:slug/register` (anonim → przekierowanie do logowania jest OK; tylko sprawdź, nie wypełniaj);
- zamknięte zapisy: brak aktywnego przycisku zapisu;
- nieistniejący slug: stan 404 / komunikat PL, nie biały ekran.
