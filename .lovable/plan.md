
# Redesign: Dark Enterprise UI z kontrolowanym czerwonym akcentem

## Filozofia zmiany

Obecna strona jest jasna (light mode) z ciemnym hero i lekko sportowym charakterem. Nowy design to **ciemny, warstwowy system** w stylu enterprise dashboard, gdzie:

- Czarny/grafit = baza (nie absolutne #000000)
- Szary = warstwy, karty, granice, tekst pomocniczy
- Czerwony = tylko akcenty, CTA, focus, aktywne elementy
- Bialy = tekst glowny (nie czysty #FFFFFF, lecz lagodny jasny szary)

## Nowa paleta kolorow

| Token | Wartosc HSL | Hex przyblizony | Rola |
|-------|-------------|-----------------|------|
| `--background` | `0 0% 7%` | #121212 | Glowne tlo aplikacji |
| `--foreground` | `0 0% 87%` | #DEDEDE | Tekst glowny (nie czysty bialy) |
| `--card` | `0 0% 10%` | #1A1A1A | Karty, panele |
| `--card-foreground` | `0 0% 87%` | #DEDEDE | Tekst na kartach |
| `--popover` | `0 0% 12%` | #1F1F1F | Dropdowny, popovery |
| `--primary` | `0 72% 45%` | #C53030 | Czerwony brand — CTA, focus |
| `--primary-foreground` | `0 0% 100%` | #FFFFFF | Tekst na czerwonym |
| `--secondary` | `0 0% 14%` | #242424 | Tla przyciskow drugorzednych |
| `--secondary-foreground` | `0 0% 80%` | #CCCCCC | Tekst secondary |
| `--muted` | `0 0% 14%` | #242424 | Tla wyciszone |
| `--muted-foreground` | `0 0% 50%` | #808080 | Tekst przygaszony |
| `--accent` | `0 0% 16%` | #292929 | Hover states |
| `--accent-foreground` | `0 0% 87%` | #DEDEDE | Tekst na hover |
| `--destructive` | `0 84% 56%` | #E53E3E | Bleedy, usuwanie (jasniejszy niz brand) |
| `--border` | `0 0% 16%` | #292929 | Granice subtlene |
| `--input` | `0 0% 16%` | #292929 | Inputy |
| `--ring` | `0 72% 45%` | #C53030 | Focus ring |

Sidebar: jeszcze ciemniejszy niz content (`0 0% 5%` = #0D0D0D).

## Kluczowa zasada: Czerwony NIE jest uzywany jako

- Tlo calych sekcji (nie ma `bg-primary` sekcji)
- Kolor duzych powierzchni
- Kolor tekstu systemowego
- Obramowanie tabel

Czerwony = przycisk CTA, ikona aktywna, focus ring, thin accent bar, badge krytyczny, hover underline.

## Zmieniane pliki

### 1. `src/styles/tokens.css` — pelna nowa paleta

Zmiana `:root` na ciemna palete jako domyslna (nie `.dark` class). Usuniecie light mode — cala aplikacja jest dark-first. Ewentualny `.light` class na przyszlosc.

Nowe tokeny:
- `--surface-elevated`: `0 0% 13%` — karty uniesione (modals, dialogs)
- `--surface-overlay`: `0 0% 8%` — overlay/backdrop
- `--border-subtle`: `0 0% 14%` — subtelne granice
- `--border-active`: `0 0% 22%` — aktywne/hover granice
- `--text-primary`: alias foreground
- `--text-secondary`: `0 0% 60%`
- `--text-muted`: `0 0% 42%`
- Gradient tokens: usuniete jasne gradienty, nowe ciemne

### 2. `src/styles/base.css` — ciemne style bazowe

- Body: `background: var(--background)` (ciemny grafit)
- Scrollbar: ciemne tlo, szary thumb
- Naglowki: `color: hsl(var(--foreground))` (jasny szary)
- Usunac gradient body (z light mode)
- Nowe utility classes:
  - `.surface-card` — tlo karty z subtlena granica
  - `.surface-elevated` — uniesiona karta (modal, dropdown)
  - `.row-hover` — subtelne rozjasnienie wiersza tabeli

### 3. `src/styles/typography.css` — bez zmian (fonty zostaja)

### 4. `src/index.css` — bez zmian (importy)

### 5. `tailwind.config.ts` — aktualizacja brand tokeny

Aktualizacja `brand.gray` na ciemniejsze wartosci pasujace do dark theme.

### 6. `src/components/layout/Header.tsx`

- Tlo: ciemny grafit (#121212) z subtlena granica dolna
- Logo: bialy tekst, "Time" w czerwonym
- Nawigacja: szary tekst, aktywny = bialy tekst (nie czerwone tlo!)
- Aktywny link: dolny cienki czerwony pasek (2px border-bottom), nie zmiana tla
- Cart icon badge: czerwony
- Mobilne menu: ciemne tlo, szare teksty

### 7. `src/components/layout/Footer.tsx`

- Tlo: najciemniejszy (#0D0D0D)
- Teksty: szare, linki na hover jasniejsze (nie czerwone)
- Separator gory: subtleny szary, nie gradient
- Social icons: szare, hover = jasniejsze

### 8. `src/components/home/HomeHero.tsx`

- Tlo: gradient od `#0D0D0D` do `#161616`
- Usunac czerwone poswiety i grid pattern (zbyt gamingowe)
- Tekst: jasny szary, bez czerwonego slowa
- CTA button: czerwony (jedyny czerwony element)
- Secondary button: szary outline
- Stats row: szare z subtlena granica

### 9. `src/components/ui/card.tsx` — bez zmian kodu

Automatycznie zmieni sie dzieki nowym tokenenom `--card` i `--border`.

### 10. `src/components/ui/button.tsx` — bez zmian kodu

Automatycznie: `bg-primary` bedzie czerwony, `bg-secondary` szary.

### 11. `src/components/ui/badge.tsx` — dodanie nowych wariantow

Nowy wariant `muted` (szary badge) i `accent` (czerwony ale subtleny — czerwone tlo/10, czerwony tekst). Obecne warianty zaczytalja dzialac automatycznie.

### 12. `src/components/ui/table.tsx` — naprzemienne wiersze

Dodanie `even:bg-muted/30` do `TableRow` i `hover:bg-accent/50` zamiast `hover:bg-muted/50`.

### 13. `src/components/ui/input.tsx` — bez zmian kodu

Automatycznie ciemne tlo + szara granica.

### 14. `src/components/ui/tabs.tsx` — aktualizacja stylow

TabsList: ciemniejsze tlo (`bg-secondary`). TabsTrigger active: nie bialy shadow, lecz subtleny bottom border czerwony + jasny tekst.

### 15. `src/components/lists/EventListRow.tsx`

- Usunac `hover:bg-muted/40` na `hover:bg-accent/40`
- Czerwony accent bar po lewej — zostawic (pasuje)
- Date column: szare tlo, bez bordera z prawej (zbyt kliniczne)
- Hover: delikatne rozjasnienie calego wiersza

### 16. `src/components/lists/ListContainer.tsx`

- Card: ciemne tlo z subtlena granica
- ListGroup header: ciemniejsze tlo, cienki czerwony border-left

### 17. `src/components/home/UpcomingEvents.tsx`

- Section: brak tla (transparentne — dziedziczy dark background)
- Naglowek: szary tekst, czerwony accent bar (zostawic)

### 18. `src/components/home/LiveResultsSection.tsx`

- Usunac `bg-destructive/5` sekcji (naruszona zasada — nie uzywac czerwonego jako tla sekcji)
- Live indicator: malutka czerwona kropka + tekst "LIVE" w czerwonym — OK
- Karta: ciemna z subtlena granica, nie `border-destructive`

### 19. `src/components/home/RecentResultsSection.tsx`

- Usunac `bg-muted/30` — uzyc transparentnego tla
- Ikona Trophy: szara, nie czerwona (to nie akcja)
- Hover karty: rozjasnienie tla

### 20. `src/components/home/PartnersSection.tsx`

- Ciemne tlo
- Logo partnerow: szare (opacity), na hover jasniejsze
- Usunac `hover:border-primary` — zastapic `hover:border-border-active`

### 21. `src/pages/admin/AdminDashboard.tsx`

- Sidebar: najciemniejsze tlo (#0D0D0D)
- Aktywna pozycja: cienki czerwony pasek po lewej (3px) + jasny tekst, NIE zmiana tla
- Nieaktywne: szary tekst
- Content area: standardowe ciemne tlo
- Grupy: separatory jako cienkie szare linie

### 22. `src/pages/moderator/ModeratorDashboard.tsx`

Identyczne zmiany jak AdminDashboard — ten sam sidebar pattern.

### 23. `src/pages/organizer/EventManage.tsx`

- Tabs: ciemniejsze tlo, aktywna zakladka z dolnym czerwonym paskiem
- Content area: standardowe ciemne tlo

### 24. `src/components/layout/BottomNav.tsx`

- Tlo: ciemne (#121212) z gorna granica
- Aktywna ikona: czerwona
- Nieaktywna: szara

### 25. Hardcoded kolory do poprawienia

Pliki uzywajace `bg-green-*`, `text-green-*`, `bg-blue-*`, `text-blue-*`:
- `OnboardingDialog.tsx` — ikony `text-green-500` / `text-blue-500` → `text-muted-foreground` lub ikonka w czerwonym
- `EventOverviewTab.tsx` — `bg-green-500/10` → `bg-muted`
- `AthleteProfilePage.tsx` — `bg-green-600` badge → success token
- `ParticipantOrdersTab.tsx` — statusy kolorowe → uzywac `--success`, `--warning`, `--info`
- `ResultsTab.tsx` — `bg-green-500/10` → success token
- `RegistrationForm.tsx` — `bg-green-50` / `text-green-*` → success token
- `NotificationCenter.tsx` — kolorowe ikony → szare + czerwony dla waznych
- `SeriesDetailsPage.tsx` — kolorowe badze → szare warianty

### 26. `src/components/EventCard.tsx`

- Card: ciemne tlo, subtlena granica
- Hover: rozjasnienie granicy, nie `border-primary/30`
- Discipline icon: szara (nie czerwona na hover)

### 27. `src/components/CookieConsent.tsx`

- Ciemne tlo panelu
- Przyciski: szary "Tylko niezbedne", czerwony "Akceptuj"

## Streszczenie zasad uzycia czerwonego

```text
CZERWONY (--primary) UZYWAJ TYLKO DLA:
  [x] Przycisk CTA (primary button)
  [x] Focus ring
  [x] Aktywna pozycja nawigacji (cienki pasek, nie tlo)
  [x] Badge krytyczny / LIVE indicator
  [x] Link hover (underline lub kolor tekstu)
  [x] Thin accent bar (3px border-left)
  [x] Cart badge counter

CZERWONY NIE UZYWAJ DLA:
  [ ] Tlo calych sekcji
  [ ] Tlo sidebar
  [ ] Obramowanie tabel
  [ ] Tekst systemowy / informacyjny
  [ ] Ikony nieinteraktywne (np. Trophy, Calendar)
  [ ] Gradienty na duzych powierzchniach
```

## Kolejnosc implementacji

1. `src/styles/tokens.css` — nowa paleta (dark-first, usunac light `:root`)
2. `src/styles/base.css` — ciemne bazowe style, nowe utility classes
3. `tailwind.config.ts` — brand tokeny ciemne
4. `src/components/layout/Header.tsx` — ciemny header z aktywnymi stanami
5. `src/components/layout/Footer.tsx` — najciemniejszy footer
6. `src/components/home/HomeHero.tsx` — minimalistyczny ciemny hero
7. `src/components/ui/badge.tsx` — nowe warianty
8. `src/components/ui/table.tsx` — naprzemienne wiersze
9. `src/components/ui/tabs.tsx` — ciemne taby z czerwonym akcentem
10. `src/components/home/LiveResultsSection.tsx` — usunac czerwone tlo
11. `src/components/home/RecentResultsSection.tsx` — ciemne tlo
12. `src/components/home/UpcomingEvents.tsx` — ciemne tlo
13. `src/components/home/PartnersSection.tsx` — ciemne tlo
14. `src/components/lists/EventListRow.tsx` — ciemne wiersze
15. `src/components/lists/ListContainer.tsx` — ciemne kontenery
16. `src/pages/admin/AdminDashboard.tsx` — sidebar z czerwonym akcentem
17. `src/pages/moderator/ModeratorDashboard.tsx` — sidebar
18. `src/components/layout/BottomNav.tsx` — ciemna nawigacja
19. `src/components/EventCard.tsx` — ciemne karty
20. Poprawki hardcoded kolorow w ~10 plikach
