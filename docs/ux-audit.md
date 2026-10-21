# Audyt UX/UI (mobile-first) — ZmierzymyCzas

> English summary: mobile-first UX/UI audit (Polish text) covering horizontal overflow, touch targets, text size and task flows at three viewports.

Data: 2026-10-20. Środowisko: lokalne API + lokalna baza, front z `origin/main`. Viewporty 360×800, 390×844, 1280×800.
Metoda: Playwright, ~66 tras × 3 viewporty (poziomy overflow z winowajcą, cele dotyku <44 px, tekst <12 px, błędy JS) oraz przejścia zadań na 360 px (gość, rejestracja + zapis, uczestnik, organizator, moderator/admin). Zrzuty poza repo. Ograniczenia: płatność na fake gateway nie została zainicjowana lokalnie (zapis kończy się na ekranie „płatność nie została zrealizowana"), konto organizatora z seeda ma wyczerpany limit wydarzeń (22 z 11), więc kreator został obejrzany, ale nie dokończony; moderator/admin przejrzani wyłącznie na pulpitach (dalsze sekcje nie mają własnych tras — patrz UX-18). Automatyczne liczniki celów dotyku zawierają baner cookies (klucz zgody w skrypcie początkowo był błędny), więc traktować je orientacyjnie.

## (a) Top 10 problemów

1. Zakładka „Bilety" uczestnika wywala całą stronę (RangeError „Invalid time value", ekran 500), gdy bilet z API nie ma `eventDate` — blokuje bilet/QR (poprawione defensywnie).
2. Panel organizatora: paski zakładek (Lista uczestników / Wyniki / filtr wydarzeń) wypychały całą stronę w poziomie na 360 px (poprawione).
3. Admin: Pulpit, Zamówienia, Strony — poziomy overflow strony na 360/390 (sr-only tabela, siatka 3 kolumn, wiersz ze znacznikami) (poprawione).
4. Lista uczestników organizatora renderuje wszystkie wiersze naraz (105 → strona 10 000 px; admin/uczestnicy: ~5000 elementów interaktywnych, 310 tys. znaków) — brak paginacji/wirtualizacji, a tabela przewija się w wąskim (244 px) oknie.
5. Zapis na zawody: 5 kroków, w tym puste, opcjonalne „Drużyna" i „Rabat" jako osobne ekrany; data urodzenia to 3 selecty, kategoria wybierana ręcznie mimo znanego wieku.
6. Szczegóły wydarzenia na mobile: główny CTA „Rozpocznij zapis" jest ~1950 px od góry strony (brak sticky CTA); zakładki szczegółów zawijają się do 2 rzędów zamiast przewijać.
7. Baner cookies zasłania treść i ma przyciski <44 px na każdej stronie przy pierwszej wizycie.
8. Kreator wydarzenia: 4 grupy + 11 podkroków, pionowa lista podkroków zajmuje ~250 px nad formularzem, nagłówek grup jest ucięty; komunikat o limicie („wykorzystano 22 z 11, dostępne 0") pojawia się dopiero po wejściu, a przycisk „Nowe wydarzenie" jest zablokowany bez wyjaśnienia.
9. Karta wydarzenia organizatora: 3 duże kafle statystyk + pusty blok przed listą; zakładki sekcji na mobile to same ikony (etykiety `hidden sm:inline`) — niska gęstość danych i słaba odkrywalność.
10. Niespójności komponentów i języka: brak polskich znaków („Glowny obraz", „Zielinska"), „Nieaktywny od 245694 min", wewnętrzne karty wystające poza kartę-rodzica, stepper rejestracji ucięty po prawej, przyciski ikon bez nazw dostępnych (kategorie, „Zobacz trasę").

## (b) Tabela problemów

| ID | Rola | Zadanie / ekran | Viewport | Problem | Wpływ | Sugestia |
|---|---|---|---|---|---|---|
| UX-01 | Uczestnik | Panel → Bilety / my-starts | wszystkie | `format(new Date(ticket.eventDate))` rzuca RangeError, gdy API nie zwraca `eventDate` (lokalne API nie zwraca też lokalizacji, nazwy uczestnika, kategorii) → ekran 500 | blokuje | POPRAWIONE (guard + test). Ujednolicić kontrakt `Ticket` z API; lokalny error boundary na zakładce |
| UX-02 | Organizator | Moje wydarzenia (filtr statusu) | 360 | `TabsList` 390 px > viewport; przycisk „Limit wyczerpany" poza krawędzią | blokuje | POPRAWIONE (overflow-x-auto, wrap) |
| UX-03 | Organizator | Uczestnicy / Wyniki — zakładki wewnętrzne | 360/390 | Strona szersza o 230–250 px (591/613 px) | blokuje | POPRAWIONE (overflow-x-auto na TabsList) |
| UX-04 | Admin | Pulpit | 360/390 | sr-only `<table>` i karta „Najpopularniejsze produkty" dają 518 px szerokości (siatka bez `grid-cols-1`) | blokuje | POPRAWIONE |
| UX-05 | Admin | Zamówienia | 360/390 | 3 kafle w `grid-cols-3` przekraczają szerokość | utrudnia | POPRAWIONE (1 kolumna <sm) |
| UX-06 | Admin | Strony (CMS) | 360/390 | Wiersz strony: znaczniki + menu poza ekranem (506 px) | blokuje (menu akcji niedostępne) | POPRAWIONE (flex-wrap) |
| UX-07 | Organizator / Admin | Lista uczestników | 360 | Brak paginacji: 105 wierszy = 10 375 px; admin/uczestnicy ~5000 kontrolek; tabela 1012 px w oknie 244 px | utrudnia | Paginacja/wirtualizacja + widok kartowy na mobile, akcje zbiorcze w jednym menu |
| UX-08 | Gość | Zapis na zawody | 360 | 5 kroków; „Drużyna" i „Rabat" to puste opcjonalne ekrany; 3 selecty daty urodzenia; kategoria ręcznie; brak prefillu mimo komunikatu „Uzupełnij swój profil" | utrudnia | Scalić kroki opcjonalne w „Podsumowanie", natywna data / prefill z profilu, automatyczna kategoria |
| UX-09 | Gość | Zapis — stepper | 360 | Pasek kroków przycięty, 5. etykieta „Podsumowanie" ucięta | kosmetyka | Skrócić etykiety lub przewijać pasek do aktywnego |
| UX-10 | Gość/Uczestnik | Po zapisie (nieopłacony) | 360 | Ekran „Rejestracja wstępna zakończona" nie ma przycisku „Zapłać teraz" (jest tylko w panelu) | utrudnia | CTA płatności i link do biletu na ekranie sukcesu |
| UX-11 | Gość | Szczegóły wydarzenia | 360 | CTA zapisu dopiero ~1950 px w dół; zakładki w 2 rzędach | utrudnia | Sticky CTA „Zapisz się", zakładki przewijane poziomo |
| UX-12 | Wszyscy | Pierwsza wizyta | 360 | Baner cookies: przyciski <44 px, zasłania treść | utrudnia | Zwarty baner w dolnym panelu, przyciski ≥44 px |
| UX-13 | Organizator | Kreator wydarzenia | 360 | 11 podkroków, pionowa lista ~250 px, nagłówek grup ucięty; limit ujawniony dopiero w środku | utrudnia | Pasek postępu „n z m", jeden poziom kroków, limit sprawdzany przed wejściem |
| UX-14 | Organizator | Karta wydarzenia | 360 | Zakładki sekcji tylko ikonami (<sm); 3 wielkie kafle + pusty blok nad listą | utrudnia | Etykiety lub nawigacja sekcji, kompaktowy pasek KPI |
| UX-15 | Organizator | Wyniki: import/edycja | 360 | Przełączniki Ręcznie / Import CSV / Eksport i długa tabela (330 małych celów) | utrudnia | Import w osobnym kroku, edycja w arkuszu/karcie |
| UX-16 | Wszyscy | Cele dotyku | 360 | Logo, hamburger (Header — poza zakresem tej gałęzi), ikonowe przyciski admina 32 px, strzałki ↑↓ w CMS 32 px | utrudnia | Minimalny cel 44 px w `Button size=icon` |
| UX-17 | Wszyscy | Czytelność | 360 | Nagłówki stopki 11 px; w sklepie plakietki <12 px (26 elementów); badge dystansów <12 px | kosmetyka | Minimum 12 px w tokenach typografii |
| UX-18 | Moderator | Panel | 360 | Sekcje wybierane selectem bez deeplinków (`/moderator/moderation` itd. pokazują pulpit); powitanie „Zielinska" bez ogonka (seed) | utrudnia | Routing per sekcja (Wstecz, linki) |
| UX-19 | Admin | Pulpit | 360 | Karty pracowników wystają poza kartę-rodzica; „Nieaktywny od 245694 min" | kosmetyka | Format względny, `min-w-0` |
| UX-20 | Wszyscy | Język | — | „Glowny obraz wydarzenia"; przyciski bez etykiet (kategorie, „Zobacz trasę") | kosmetyka | Przegląd tekstów, aria-label |
| UX-21 | Uczestnik | Rejestracje | 360 | ~11 pozycji bez filtrów/sortowania; nieopłacone wymieszane z potwierdzonymi | kosmetyka | Grupowanie wg statusu, filtr „Do zapłaty" |
| UX-22 | Gość | Wyniki wydarzenia | 360 | Tabela wyników przewija się w karcie (254/278 px), bez sticky kolumny | kosmetyka | Układ kartowy lub sticky pierwsza kolumna |

## (c) Inwentarz wzorców UI

- Layouty: `Layout` (nagłówek + stopka + dolna nawigacja 4 ikony) dla całej aplikacji; panele mają trzy różne wzorce nawigacji sekcji: zakładki z badge (uczestnik), Select „Pulpit" (admin/moderator), zakładki ikonowe (karta wydarzenia organizatora). Niespójne.
- Tabele: ~29 plików z `<Table>`; tylko ~22 plików z `overflow-x-auto`; brak wspólnego komponentu z paginacją/widokiem kartowym; listy uczestników i wyników renderują wszystko naraz.
- Karty: `glass-panel` (Card) z różnymi paddingami (p-4, p-5, p-6); kafle statystyk w 3 wariantach (duże pojedyncze na mobile, siatka 3 kolumn, kompaktowe).
- Formularze: kreator (organizator), wieloetapowy zapis (5 kroków), jednoekranowe (login/rejestracja ~1580 px na mobile), edytory admina (długie, bez zwijanych sekcji). Selecty Radix dla dat; walidacja i oznaczenia `*` niejednolite.
- Dialogi: Dialog/AlertDialog (Radix) dla potwierdzeń, Drawer (vaul) dla filtrów na mobile, Dropdown menu dla akcji wierszy; brak reguły co do pełnoekranowości.
- Nawigacja: dolny pasek 4 pozycji + hamburger; „Powrót do panelu"/„Wróć do wydarzenia" jako przyciski tekstowe w każdej stronie; breadcrumb tylko na szczegółach wydarzenia.
- Stany: skeletony istnieją, strony błędów 403/404/500/503 spójne; błąd danych w zakładce wywala całą stronę (UX-01).

## (d) Obserwacje dla redesignu

- Architektura informacji: rozdzielić „zadania" od „zarządzania": uczestnik — Moje starty (nadchodzące, do zapłaty, bilet); organizator — Wydarzenie (Przegląd → Zapisy → Wyniki → Ustawienia) ze stałym stanem (wersja robocza/opublikowane). Panel uczestnika ma 10 zakładek, większość rzadko używana.
- Nawigacja mobilna: dolny pasek jako nawigacja główna, kontekstowy przewijany pasek sekcji w panelach, sticky CTA na szczegółach wydarzenia i w kreatorze.
- Gęstość danych: kafle KPI 2×2 zamiast pełnoekranowych; tabele → karty z 3 kluczowymi polami; paginacja/„załaduj więcej" dla list >25.
- Formularze: scalić kroki opcjonalne, prefill z profilu, natywna data urodzenia, jeden wzorzec błędów i wymagalności, komunikaty o limitach przed wejściem.
- Fundament: jedna skala celów dotyku (44 px), minimum 12 px tekstu, jeden `DataTable` z overflow, jeden `PageHeader`, jeden komponent zakładek przewijanych (źródło większości overflowów: `TabsList` bez `overflow-x-auto`).
- CI: dodać test E2E „brak poziomego scrolla" na kluczowych trasach 360 px, aby UX-02…06 nie wracały.
