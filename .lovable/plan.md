

## Poprawa UX/UI stron CMS

### Problem
Strony generowane z CMS (polityka prywatności, RODO, regulamin itp.) wyglądają surowo - tekst jest monotonny, markdown (`**bold**`) nie jest renderowany, listy z `•` wyglądają jak zwykły tekst, a na mobile brakuje odpowiednich odstępów.

### Zmiany

**1. TextSection - pełna przebudowa renderowania treści**
- Parsowanie prostego markdowna: `**bold**` → `<strong>`, `•` listy → stylowane `<ul>/<li>` z ikonkami
- Dodanie subtelnego lewego borderu przy tytule sekcji (accent bar)
- Lepsze odstępy między paragrafami i sekcjami
- Na mobile: mniejsze paddingi, odpowiednie rozmiary tekstu

**2. HeroSection - bardziej elegancki wygląd**
- Subtelniejszy gradient, lepsze spacing na mobile (py-12 zamiast py-16)
- Breadcrumb lub badge z nazwą kategorii strony
- Mniejsze rozmiary nagłówka na mobile (text-2xl → text-4xl skalowanie)

**3. FaqSection - wizualne ulepszenia**
- Dodanie subtelnego tła lub karty wokół FAQ
- Lepsze padding i typography w odpowiedziach
- Ikona pytania przy nagłówku sekcji

**4. CardsSection - mobile-first poprawki**
- Lepsze padding w kartach na mobile
- Ikony z większym kontrastem

**5. StatsSection - responsywność**
- Na mobile: `grid-cols-2` z mniejszymi fontami dla liczb (text-3xl zamiast text-4xl)
- Dodanie separatorów wizualnych

**6. Globalne ulepszenia DynamicInfoPage**
- Dodanie separatorów między sekcjami (alternating backgrounds)
- Spójne vertical rhythm

### Pliki do edycji
- `src/components/info/sections/TextSection.tsx`
- `src/components/info/sections/HeroSection.tsx`
- `src/components/info/sections/FaqSection.tsx`
- `src/components/info/sections/CardsSection.tsx`
- `src/components/info/sections/StatsSection.tsx`
- `src/components/info/DynamicInfoPage.tsx`

