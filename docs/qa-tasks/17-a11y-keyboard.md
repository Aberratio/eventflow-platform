# 17 a11y-keyboard (Sonnet, P1)
**Cel:** kryteria WCAG wymagające interakcji, sprawdzane w kodzie testu.
**Plik:** `e2e-dev/a11y/keyboard-focus.spec.ts`.
**Kryteria akceptacji:**
- `<html lang="pl">`; każda strona publiczna ma dokładnie jeden `h1`, nagłówki bez przeskoków (h1 → h3), landmarki `main`, `nav`, `banner`, `contentinfo`;
- skip link (jeśli jest) przenosi focus do main; brak → minor;
- Tab po `/` i `/events`: każdy fokusowany element ma widoczny focus (porównaj `outline`/`box-shadow` przed i po przez `getComputedStyle`), kolejność logiczna, brak pułapki;
- dialogi (ustawienia cookies, menu mobilne 375 px, podgląd galerii, filtry w dialogu): focus wchodzi do dialogu, Tab z niego nie wychodzi, Escape zamyka, focus wraca do wyzwalacza;
- `img` mają `alt` (dekoracyjne `alt=""`); przyciski-ikony mają dostępną nazwę;
- `/login`, `/register`, `/forgot-password`: każde pole ma etykietę (`getByLabel`); błędy po pustym submit powiązane z polem (`aria-describedby`/`aria-invalid`) albo ogłaszane (`role=alert`/`aria-live`);
- `page.emulateMedia({ reducedMotion: 'reduce' })`: brak animacji > 0 s na karuzeli/hero (`animation-duration`/`transition-duration`);
- reflow (WCAG 1.4.10, odpowiednik zoomu 200% i 400%): viewport 640 i 320 px szerokości – brak poziomego scrolla na `/`, `/events`, event detail, `/login`.
