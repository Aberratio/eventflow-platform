

# Plan: CMS dla stron informacyjnych w panelu admina

## Cel

Dodanie nowej zakładki "Strony" w panelu administratora, pozwalającej na:
- Przeglądanie istniejących stron informacyjnych
- Dodawanie nowych stron (np. FAQ, Regulamin, Polityka prywatności)
- Edycję treści i ustawień stron
- Ukrywanie/publikowanie stron
- Zarządzanie kolejnością wyświetlania w nawigacji

## Architektura rozwiązania

### 1. Nowy typ InfoPage

```typescript
interface InfoPage {
  id: string;
  title: string;              // Tytuł strony (np. "O nas")
  slug: string;               // URL slug (np. "o-nas")
  icon: string;               // Nazwa ikony z lucide-react
  description: string;        // Krótki opis (meta description)
  content: InfoPageSection[]; // Sekcje treści
  published: boolean;         // Czy widoczna publicznie
  showInFooter: boolean;      // Czy pokazywać w stopce
  showInHeader: boolean;      // Czy pokazywać w nagłówku
  order: number;              // Kolejność w nawigacji
  createdAt: string;
  updatedAt: string;
}

interface InfoPageSection {
  id: string;
  type: 'hero' | 'text' | 'cards' | 'faq' | 'cta' | 'stats' | 'team' | 'pricing';
  title?: string;
  content?: string;           // Markdown lub prosty tekst
  items?: InfoPageSectionItem[];
}

interface InfoPageSectionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  link?: string;
  image?: string;
}
```

### 2. Nowa zakładka w AdminDashboard

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ [Pulpit] [Moderacja] [Uczestnicy] [Organizatorzy] [Wydarzenia]          │
│ [Sklep] [Partnerzy] [Strony] [Profil]                                   │
│                          ^^^^^^                                         │
│                          NOWA ZAKLADKA                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Komponent AdminPagesTab

**Wyglad:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Strony informacyjne                               [+ Dodaj stronę]     │
│ Zarządzaj treścią stron publicznych                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Mail] Kontakt              /info/kontakt    [Opublikowana] [...]  │ │
│ │        Formularz kontaktowy i dane firmy     [Stopka] [Nagłówek]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Gift] Oferta               /info/oferta     [Opublikowana] [...]  │ │
│ │        Pakiety i cennik dla organizatorów    [Stopka] [Nagłówek]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Shield] Ubezpieczenia      /info/ubezp...   [Opublikowana] [...]  │ │
│ │          Ubezpieczenie NNW dla zawodników    [Stopka]              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Users] O nas               /info/o-nas      [Opublikowana] [...]  │ │
│ │         Historia i zespół SportTime          [Stopka] [Nagłówek]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [HelpCircle] FAQ            /info/faq        [Szkic] [...]         │ │
│ │              Najczęściej zadawane pytania                          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funkcjonalnosci:**
- Lista wszystkich stron z podgladem statusu
- Drag & drop do zmiany kolejnosci (opcjonalnie)
- Quick actions: Edytuj, Podglad, Publikuj/Ukryj, Usun
- Badge'e pokazujace gdzie strona jest widoczna (Stopka/Naglowek)

### 4. Dialog edycji/dodawania strony

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Edytuj stronę: O nas                                              [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Tytuł strony *                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ O nas                                                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Slug URL *                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ o-nas                                                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ Podgląd: sporttime.pl/info/o-nas                                       │
│                                                                         │
│ Ikona                                                                  │
│ ┌───────────────────────────┐                                          │
│ │ [Users] Users         ▼  │                                          │
│ └───────────────────────────┘                                          │
│                                                                         │
│ Krótki opis (SEO)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Poznaj historię SportTime i nasz zespół                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Ustawienia widoczności                                              │ │
│ │ ☑ Opublikowana                                                      │ │
│ │ ☑ Pokazuj w stopce                                                  │ │
│ │ ☐ Pokazuj w nagłówku                                                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ═══════════════════════════════════════════════════════════════════════ │
│ Sekcje treści                                      [+ Dodaj sekcję]    │
│ ═══════════════════════════════════════════════════════════════════════ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 1. [Hero] Nagłówek główny                              [↑] [↓] [X] │ │
│ │    Poznaj zespół SportTime...                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 2. [Stats] Statystyki                                  [↑] [↓] [X] │ │
│ │    4 elementy: 500+ wydarzeń, 150k uczestników...                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 3. [Text] Nasza historia                               [↑] [↓] [X] │ │
│ │    SportTime powstał w 2016 roku...                                 │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                    [Anuluj]    [Zapisz zmiany]         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. Dynamiczny renderer stron

Zamiast oddzielnych komponentow dla kazdej strony (AboutPage, OfferPage), tworzymy uniwersalny komponent `DynamicInfoPage` ktory:
- Pobiera dane strony po slug
- Renderuje sekcje dynamicznie na podstawie typu
- Obsluguje 404 dla nieistniejacych stron

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie InfoPage, InfoPageSection, InfoPageSectionItem |
| `src/data/mockData.ts` | Modyfikacja | Dodanie mockInfoPages z danymi 4 istniejacych stron + 2 nowe (FAQ, Regulamin jako szkice) |
| `src/pages/admin/components/AdminPagesTab.tsx` | Nowy | Glowna zakladka CMS z lista stron |
| `src/pages/admin/components/PageEditorDialog.tsx` | Nowy | Dialog edycji strony z edytorem sekcji |
| `src/pages/admin/components/SectionEditor.tsx` | Nowy | Edytor pojedynczej sekcji |
| `src/pages/admin/AdminDashboard.tsx` | Modyfikacja | Dodanie zakladki "Strony" |
| `src/components/info/DynamicInfoPage.tsx` | Nowy | Uniwersalny renderer stron informacyjnych |
| `src/components/info/sections/*.tsx` | Nowe | Komponenty dla typow sekcji (HeroSection, TextSection, StatsSection, FaqSection, etc.) |
| `src/App.tsx` | Modyfikacja | Dodanie dynamicznej trasy `/info/:slug` |
| `src/components/layout/Footer.tsx` | Modyfikacja | Dynamiczne linki na podstawie mockInfoPages |

## Mock data - przykladowe strony

```typescript
export const mockInfoPages: InfoPage[] = [
  {
    id: 'page-kontakt',
    title: 'Kontakt',
    slug: 'kontakt',
    icon: 'Mail',
    description: 'Skontaktuj się z zespołem SportTime',
    published: true,
    showInFooter: true,
    showInHeader: false,
    order: 1,
    content: [
      {
        id: 's1',
        type: 'hero',
        title: 'Kontakt',
        content: 'Masz pytania? Skontaktuj się z nami!',
      },
      {
        id: 's2',
        type: 'cards',
        title: 'Dane kontaktowe',
        items: [
          { id: 'c1', title: 'Email', description: 'kontakt@sporttime.pl', icon: 'Mail' },
          { id: 'c2', title: 'Telefon', description: '+48 123 456 789', icon: 'Phone' },
          { id: 'c3', title: 'Adres', description: 'ul. Sportowa 1, 00-001 Warszawa', icon: 'MapPin' },
        ],
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2025-01-15',
  },
  {
    id: 'page-faq',
    title: 'FAQ',
    slug: 'faq',
    icon: 'HelpCircle',
    description: 'Najczęściej zadawane pytania',
    published: false,  // szkic
    showInFooter: true,
    showInHeader: false,
    order: 5,
    content: [
      {
        id: 's1',
        type: 'hero',
        title: 'Często zadawane pytania',
        content: 'Znajdź odpowiedzi na najczęściej zadawane pytania',
      },
      {
        id: 's2',
        type: 'faq',
        items: [
          { id: 'f1', title: 'Jak się zarejestrować na zawody?', description: 'Wejdź na stronę wydarzenia...' },
          { id: 'f2', title: 'Jak sprawdzić swoje wyniki?', description: 'Po zakończeniu zawodów...' },
        ],
      },
    ],
    createdAt: '2025-01-20',
    updatedAt: '2025-01-20',
  },
  // ... pozostale strony (Oferta, Ubezpieczenia, O nas, Regulamin)
];
```

## Typy sekcji i ich renderowanie

| Typ sekcji | Opis | Przykladowe uzycie |
|------------|------|-------------------|
| `hero` | Naglowek z tytulem i opisem | Poczatek kazdej strony |
| `text` | Blok tekstu (markdown) | Opisy, artykuly |
| `cards` | Siatka kart z ikonami | Dane kontaktowe, funkcje |
| `faq` | Accordion z pytaniami | Sekcja FAQ |
| `stats` | Liczniki/statystyki | "500+ wydarzen" |
| `team` | Lista osob z avatarami | Zespol |
| `pricing` | Tabela cenowa | Pakiety uslug |
| `cta` | Call to action z przyciskiem | Zacheta do kontaktu |

## Przeplyw uzytkownika

1. Admin wchodzi do panelu -> zakladka "Strony"
2. Widzi liste wszystkich stron z ich statusem
3. Klika "Dodaj strone" -> otwiera sie dialog
4. Wypelnia podstawowe dane (tytul, slug, opis)
5. Dodaje sekcje tresci wybierajac typ
6. Dla kazdej sekcji wypelnia odpowiednie pola
7. Ustawia widocznosc (publikuj, stopka, naglowek)
8. Zapisuje -> strona pojawia sie w nawigacji

## Uwagi techniczne

- Slug musi byc unikalny - walidacja po stronie formularza
- Ikony z lucide-react - dropdown z najpopularniejszymi
- Kolejnosc sekcji przez drag & drop lub strzalki gora/dol
- Usuniecie strony wymaga potwierdzenia
- Mozliwosc podgladu przed publikacja

