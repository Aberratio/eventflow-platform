
# Design System — Refaktoryzacja

## Problem
Dziesiątki komponentów i stron zawierają zduplikowane klasy Tailwind opisujące te same wzorce wizualne — nagłówki stron (hero), divider, accent bar, stat pill, page section. Prowadzi to do niespójności i trudności w utrzymaniu.

## Plan

### 1. Nowe komponenty generyczne (`src/components/ui/`)

| Komponent | Zastępuje powtórzenie | Lokalizacje |
|---|---|---|
| `PageHero` | `border-b bg-gradient-to-br from-primary/10 via-background to-warning/5` + icon + h1 + description + opcjonalne stat pills | ShopPage, ChallengesListPage, SeriesListPage, CartPage, ParticipantDashboard, EventHeroBanner |
| `SectionHeading` | `mb-X flex items-center gap-3` + accent bar + title + optional badge | FeaturedEventsSection, RecentResultsSection, all admin tabs |
| `StatPill` | `flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5` + icon + text | ChallengesListPage, SeriesListPage, ShopPage, HomeHero |
| `GradientDivider` | `h-1 bg-gradient-to-r from-primary via-warning to-primary` | EventSidebar, ParticipantOverviewTab |
| `AccentBar` | `h-px w-10 bg-primary` / `h-1 w-12 rounded-full bg-warning` | HomeHero, CtaSection |
| `InfoBanner` | `flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground` | SendMessageDialog, BibNumberAssignment, OrderSuccessPage |
| `Eyebrow` | `inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary` | HeroSection, various hero areas |
| `PageSection` | `py-8 md:py-12` / `py-10 md:py-16` z opcjonalnym bg | StatsSection, CtaSection, HomeHero |

### 2. Aktualizacja `tokens.css` — nowe tokeny gradientowe

Dodanie zmiennych CSS:
- `--gradient-page-hero` — gradient tła hero sekcji
- `--gradient-accent-bar` — gradient divider/accent bar
- `--page-hero-py` — padding-y dla hero sekcji

### 3. Aktualizacja komponentów korzystających z nowych wzorców

Każda strona/komponent korzystający z powtarzalnego wzorca zostanie zrefaktoryzowana do użycia nowego komponentu generycznego.

### 4. Testy

Dodanie unit testów dla nowych komponentów design systemu.

### Co NIE wchodzi w zakres
- Spacing w unikalnych layoutach (np. formularze) — te są kontekstowe
- Kolory semantyczne w shadcn/ui — te już korzystają z tokenów
- Font size w Typography — każdy use case jest celowy
