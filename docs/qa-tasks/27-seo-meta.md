# 27 seo-meta (Haiku, P2)
**Cel:** podstawy SEO i meta.
**Plik:** `e2e-dev/seo/meta.spec.ts`.
**Kryteria akceptacji:**
- `/`, `/events`, event detail (przyszłe i przeszłe), `/series`, seria, `/shop`, produkt, `/challenges`, `/info/<slug>`: niepusty `<title>` (unikalny między stronami; na detalach zawiera nazwę wydarzenia/produktu), niepusty `meta[name=description]`, `og:title`, `og:description`, `og:image` (absolutny URL), `link[rel=canonical]` (absolutny, bez parametrów śledzących); każdy brak jako osobna asercja z czytelnym komunikatem (`expect.soft`);
- `/robots.txt`: 200, `text/plain`; dev powinien blokować indeksowanie (`Disallow: /`) albo mieć `X-Robots-Tag: noindex` / `meta robots noindex`; brak obu zgłoś (README: PP.28);
- `/sitemap.xml`: 200, `application/xml`/`text/xml`, `<urlset>` (podejrzenie H3: zwraca HTML SPA);
- nieistniejące trasy (`/events/qa-nonexistent-xyz`, `/qa-nonexistent-xyz`): status HTTP z `request.get` (podejrzenie H4: soft 404 = 200) i `meta robots noindex` na stronie 404;
- deep linki (`/events/<slug>/<tab>`, `/shop/<slug>`, `/series/<slug>`): `request.get` → 200 HTML (SPA fallback), w przeglądarce renderują treść.
