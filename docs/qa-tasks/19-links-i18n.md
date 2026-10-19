# 19 links-i18n (Haiku, P2)
**Cel:** brak martwych linków wewnętrznych i surowych/niepoprawnych tekstów w UI.
**Plik:** `e2e-dev/usability/links-i18n.spec.ts`.
**Kryteria akceptacji:**
- crawler: start od `/`, `/events`, `/shop`, `/series`, `/challenges` i linków ze stopki; zbierz unikalne wewnętrzne `href` (bez `/admin|/organizer|/moderator|/participant|/profile`), maks. 40 stron, sekwencyjnie; każda strona renderuje się bez stanu 404/„Nie znaleziono" i bez page error. Linki zewnętrzne tylko zbierz (nie odwiedzaj) i sprawdź `rel="noopener"` przy `target="_blank"`;
- tekst `body` każdej odwiedzonej strony nie zawiera `undefined`, `null`, `NaN`, `[object Object]`, `Invalid Date` ani surowych kluczy i18n (regex `\b[a-z]+(\.[a-z_]+){2,}\b`; wyklucz domeny i e-maile, przejrzyj trafienia);
- ceny w formacie PL (`zł`, przecinek dziesiętny) na `/shop` i produkcie; daty wydarzeń po polsku (nazwy miesięcy PL albo `dd.mm.rrrr`), spójnie na liście i w detalu;
- niespójne nazewnictwo (np. „Wydarzenia/Zawody", „Zapisy/Rejestracja" w menu, nagłówkach, przyciskach) zapisz jako annotation, bez failowania testu.
