# Redesign ZmierzymyCzas – plan (propozycja, 2026-10-20)

Źródła: `docs/ux-audit.md` (PR #35), `docs/a11y-audit.md` (PR #31). Status: **odłożone (decyzja Joanny 2026-10-20)** – wracamy, gdy będą dostępne propozycje z Claude Design (zrobione na innym komputerze, z tej sesji niewidoczne).

## 0. Wejście – czego potrzebujemy przed startem

- **Propozycje z Claude Design** – z tego konta nie widać żadnych projektów Design ani Design System (mogą być w innej organizacji). Potrzebne linki albo eksport.
- **Zakres i akceptacja:** czy redesign wchodzi w umowę z klientem (dziś „wyglądem się nie zajmujemy”), kto akceptuje projekty, czy obowiązuje marka klienta (logo, kolory, fonty).
- **Priorytet ról:** proponuję kolejność gość → uczestnik → organizator → admin/moderator (ruch i przychód).

## 1. Fundament (przed jakimkolwiek ekranem)

Na bazie tokenów z PR #34 (kontrast) i ustaleń z audytów.

| Element | Reguła |
|---|---|
| Tokeny | kolory (jasny/ciemny), skala typografii (min. 12 px, bez wersalików z dużym trackingiem w treści), odstępy, promienie, cienie |
| Dotyk | cel min. 44 px na mobile (24 px to minimum WCAG, 44 px to nasz standard) |
| `PageHeader` | tytuł, okruszki/powrót, akcja główna – jeden wzorzec zamiast „Powrót do panelu” w każdej stronie |
| `ScrollTabs` | jeden komponent zakładek przewijanych (źródło większości overflowów) |
| `DataTable` | overflow, paginacja / „załaduj więcej” > 25 wierszy, widok kartowy na mobile (3 kluczowe pola) |
| `StatTile` | jeden wariant KPI, siatka 2×2 na mobile |
| Formularze | jedno pole (`FormField`) z jednym wzorcem błędu i wymagalności; natywna data |
| Dialogi | reguła: potwierdzenie = AlertDialog, edycja na mobile = pełny ekran / Drawer |
| Sticky CTA | na szczegółach wydarzenia, w zapisie i w kreatorze |

Produkt: Design System (artefakt Claude Design System albo strona `/dev/ui` w aplikacji) + komponenty w `src/components/ui`. Zabezpieczenia w CI: axe (już jest), test „brak poziomego scrolla na 360 px” na kluczowych trasach, wizualne baseline z PP.15 aktualizowane świadomie.

## 2. Architektura informacji i nawigacja

- **Mobile:** dolny pasek jako nawigacja główna (per rola), w panelach kontekstowy przewijany pasek sekcji, hamburger tylko na rzeczy rzadkie.
- **Uczestnik:** „Moje starty” (nadchodzące, do zapłaty, bilet/QR) jako ekran główny; dziś 10 zakładek – zostawić 4–5, resztę do profilu.
- **Organizator:** przestrzeń wydarzenia Przegląd → Zapisy → Wyniki → Ustawienia ze stałym statusem (wersja robocza/opublikowane); limit pakietu widoczny przed „Nowe wydarzenie”.
- **Admin/moderator:** jeden wzorzec nawigacji (zamiast Select „Pulpit”), deeplinki do sekcji.

## 3. Ekrany – kolejność migracji

Każdy etap = projekt (Claude Design) → akceptacja → PR-y per grupa ekranów, z zrzutami przed/po na 360 i 1280 px.

| Etap | Zakres | Najważniejsze zmiany | Rozmiar |
|---|---|---|---|
| A | Publiczne: strona główna, lista i szczegóły wydarzenia, wyniki, serie, wyzwania, sklep | sticky CTA zapisu, filtry w Drawer, karty wyników | M |
| B | Zapis na zawody (+ podopieczny, płatność) | 5 → 3 kroki (opcjonalne Drużyna/Rabat scalone), prefill z profilu, automatyczna kategoria | M |
| C | Panel uczestnika | „Moje starty”, bilet/QR, nieopłacone | S |
| D | Organizator: lista wydarzeń, kreator, zapisy, wyniki, eksport | kreator 11 → mniej podkroków, DataTable z paginacją, KPI 2×2 | L |
| E | Admin/moderator | wspólny layout paneli, DataTable, CMS | M |
| F | Embed, maile (szablony), strony błędów | spójność z systemem | S |

## 4. Sposób pracy

- Przed etapem A domknąć: a11y PR #31–#34, UX #35, R-16 (menu mobilne) – to część fundamentu.
- Wykonanie: Tech Lead + agenci Sonnet per grupa ekranów, każdy we własnym worktree, bez zmian kontraktu API (redesign = front). Wyjątki (np. paginacja po stronie API dla list > 100) jako osobne PR-y serwera.
- Zero zmian funkcjonalnych w PR-ach redesignu poza wypisanymi w tabeli – łatwiejszy review i QA.
- QA każdego etapu: vitest, axe, test overflow 360 px, ręczne przejście zadań z `docs/ux-audit.md` (b).

## 5. Decyzje dla Joanny

1. Linki do propozycji z Claude Design / kierunek wizualny.
2. Czy redesign idzie przez klienta (zakres, akceptacja, budżet).
3. Kolejność etapów (A → F) i czy fundament robimy jako Claude Design System.
