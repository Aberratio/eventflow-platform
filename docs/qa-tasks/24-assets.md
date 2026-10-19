# 24 assets (Haiku, P2)
**Cel:** pomiar bundla, żądań, cache i obrazów. Tryb pomiarowy: wartości jako annotations, fail tylko przy rażących przekroczeniach.
**Plik:** `e2e-dev/perf/assets.spec.ts`.
**Kryteria akceptacji:**
- dla `/`, `/events`, event detail, `/shop`: liczba żądań, suma transferu JS/CSS/obrazów/fontów (`page.on('response')`, `content-length` albo długość `response.body()`), największy plik JS; attachment JSON + annotations;
- fail gdy: początkowy JS (skompresowany) > 1 MB na `/`, dowolny obraz > 1 MB, żądanie do domeny spoza frontu i API;
- assety z hashem: `Cache-Control` z `max-age >= 31536000` i/lub `immutable`; JS/CSS z `content-encoding` br/gzip;
- obrazy poniżej pierwszego ekranu mają `loading="lazy"`; zapisz udział webp/avif vs jpg/png; wypisz obrazy z `naturalWidth` > 2× szerokości renderowanej.
