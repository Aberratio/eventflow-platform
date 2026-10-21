# 16 a11y-axe, część publiczna (P1)
**Cel:** automatyczny audyt WCAG 2.2 AA (axe) tras publicznych i ich stanów. Panele zalogowanych dojdą po deployu (osobny brief).
**Plik:** `e2e-dev/a11y/axe-public.spec.ts`.
**Kontekst:** `scanA11y` z `e2e-dev/support/axe.ts`. Dark mode: `next-themes`; sprawdź w `src`, jak przełączyć (klasa `dark`, localStorage `theme` albo `page.emulateMedia({colorScheme:'dark'})`).
**Trasy:** `/`, `/events`, event detail (przyszłe i przeszłe z wynikami), `/events/:slug/register` (anonim), `/series`, seria, `/shop`, produkt, `/cart` (pusty i z produktem; koszyk jest lokalny, bez zamówienia), `/challenges`, wyzwanie, `/wyniki/live`, `/login`, `/register`, `/forgot-password`, `/info/<slug z /info-pages>`, 404.
**Stany:** jasny i ciemny motyw; widoczny cookie banner; `/login` i `/register` po pustym submit (błędy walidacji, nic nie idzie do API); otwarte menu mobilne (375 px).
**Kryteria akceptacji:**
- test per trasa × stan (data-driven); asercja `blocking` (critical + serious) == `[]`; pełna lista `all` jako attachment JSON;
- skanuj po widocznym h1 / zakończonym ładowaniu, żeby nie łapać artefaktów animacji;
- potwierdzone naruszenia jako `test.fail()` z opisem; w raporcie zbiorczo: reguła, liczba węzłów, przykładowy selektor, trasy.
