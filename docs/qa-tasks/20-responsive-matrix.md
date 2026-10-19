# 20 responsive-matrix (Haiku, P1)
**Cel:** układ działa na wszystkich viewportach z planu.
**Plik:** `e2e-dev/responsive/viewports.spec.ts`.
**Kontekst:** `VIEWPORTS`, `LANDSCAPE`, `MIN_TAP_TARGET` z `e2e-dev/support/viewports.ts`.
**Trasy:** `/`, `/events`, event detail (przyszłe), `/shop`, produkt, `/cart`, `/series`, `/login`.
**Kryteria akceptacji (test per trasa × viewport, data-driven):**
- brak poziomego scrolla: `document.documentElement.scrollWidth <= innerWidth + 1`; przy failu wypisz wystające elementy (selektor + `right`);
- tap targets: widoczne linki i przyciski w `header` i głównej treści mają min. 24×24 px albo odstęp zgodny z WCAG 2.5.8 (wyjątek: linki w tekście ciągłym); wypisz naruszenia;
- < 768 px: przycisk menu mobilnego widoczny, otwiera nawigację z linkiem do wydarzeń, zamyka się; ≥ 1024 px: nawigacja desktopowa widoczna;
- `/events` na 375 px: filtry dostępne i używalne; tabela wyników na detalu przeszłego wydarzenia przewija się w kontenerze, nie cała strona;
- teksty w kartach, badge'ach i przyciskach nie są ucięte (`scrollWidth > clientWidth` przy `overflow:hidden` bez `text-overflow: ellipsis` = naruszenie).
