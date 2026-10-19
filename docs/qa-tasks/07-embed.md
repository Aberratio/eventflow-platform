# 07 embed (Haiku, P2)
**Cel:** widoki embed działają w iframe na obcej stronie, zwykłe strony nie.
**Plik:** `e2e-dev/functional/embed.spec.ts`.
**Kontekst:** trasy `/events/:slug/embed`, `/embed/event/:id/register`. README frontu: embed dostaje `embed.html`, `frame-ancestors *`, bez `X-Frame-Options`; reszta `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`. API: `GET /events/{id}/embed/public`.
**Kryteria akceptacji:**
- `request.get('/events/<slug>/embed')` (slug z `seed.upcoming`): 200, CSP zawiera `frame-ancestors *`, brak `X-Frame-Options`;
- `request.get('/events/<slug>')`: CSP `frame-ancestors 'self'`, `X-Frame-Options` obecny;
- `page.setContent('<iframe src="<FRONT>/events/<slug>/embed">')`: w iframe widać nazwę wydarzenia (`frameLocator`);
- to samo dla `/embed/event/<id>/register` (anonim: formularz albo komunikat o logowaniu, bez białego ekranu);
- iframe ze zwykłą `/events/<slug>` jest zablokowany (frame nie ładuje treści aplikacji).
