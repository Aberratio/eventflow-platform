

# Plan: Edytor stron CMS na osobnej stronie + podpowiedzi + poprawa mockow

## Problem

1. Edytor stron jest w modalu - niewygodny dla zlozonych operacji
2. Brak podpowiedzi dla osob nietechnicznych
3. Strony informacyjne z naglowka nie dzialaja (404) - prawdopodobnie problem z routingiem lub mockData

## Rozwiazanie

### 1. Nowa strona edytora: `/admin/pages/:pageId/edit`

Zamiast modalu, edycja odbedzie sie na dedykowanej stronie z pelnym interfejsem:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Wróć do listy stron                                                       │
│                                                                             │
│ Edytuj stronę: O nas                                                        │
│ Ostatnia edycja: 25 sty 2025, 16:00                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Podstawowe informacje ──────────────────────────────────────────────────┐│
│ │ ℹ️ Te dane określają jak strona będzie widoczna w nawigacji i w         ││
│ │    wynikach wyszukiwania (Google, Bing).                                 ││
│ │                                                                          ││
│ │ Tytuł strony *              Slug URL *                                   ││
│ │ [O nas                  ]   [o-nas                   ]                   ││
│ │                             Podgląd: sporttime.pl/info/o-nas             ││
│ │                                                                          ││
│ │ Ikona          Krótki opis (SEO)                                         ││
│ │ [Users ▼]      [Poznaj historię i zespół SportTime...             ]      ││
│ │                                                                          ││
│ │ 💡 Opis SEO pojawi się w wynikach wyszukiwania. Staraj się               ││
│ │    zmieścić w 160 znakach i zawrzeć najważniejsze informacje.            ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Widoczność ─────────────────────────────────────────────────────────────┐│
│ │ ℹ️ Określ gdzie strona będzie widoczna. Niepublikowane strony są        ││
│ │    dostępne tylko dla administratorów.                                   ││
│ │                                                                          ││
│ │ ☑ Opublikowana    ☑ Pokazuj w stopce    ☐ Pokazuj w nagłówku           ││
│ │   Strona jest        Link pojawi się       Bezpośredni link              ││
│ │   widoczna           w dolnej części       w górnym menu                 ││
│ │   publicznie         strony                                              ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ Sekcje treści                                                               │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ ℹ️ Sekcje to bloki treści, z których składa się strona. Możesz je         │
│    dowolnie dodawać, usuwać i zmieniać kolejność. Każdy typ sekcji         │
│    wyświetla treść w inny sposób.                                          │
│                                                                             │
│ ┌─ 1. Nagłówek (Hero) ─────────────────────────────────────────────────────┐│
│ │ 💡 Sekcja powitalna na górze strony. Przyciąga uwagę odwiedzających.    ││
│ │                                                                          ││
│ │ Tytuł:    [O nas                                                   ]     ││
│ │ Podtytuł: [Tworzymy technologię, która łączy sportowców           ]     ││
│ │                                                                          ││
│ │                                            [↑] [↓] [🗑️ Usuń sekcję]     ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ 2. Statystyki ──────────────────────────────────────────────────────────┐│
│ │ 💡 Wyświetla liczby w atrakcyjny sposób. Idealne do pokazania           ││
│ │    osiągnięć i statystyk.                                                ││
│ │                                                                          ││
│ │ Tytuł sekcji: [SportTime w liczbach                              ]       ││
│ │                                                                          ││
│ │ Elementy (4):                                        [+ Dodaj element]   ││
│ │ ┌─────────────────────────────────────────────────────────────────────┐  ││
│ │ │ Wartość: [500+        ]    Etykieta: [Wydarzeń     ]     [🗑️]      │  ││
│ │ └─────────────────────────────────────────────────────────────────────┘  ││
│ │ ┌─────────────────────────────────────────────────────────────────────┐  ││
│ │ │ Wartość: [150 000+    ]    Etykieta: [Uczestników  ]     [🗑️]      │  ││
│ │ └─────────────────────────────────────────────────────────────────────┘  ││
│ │ ...                                                                      ││
│ │                                            [↑] [↓] [🗑️ Usuń sekcję]     ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────────┐
│ │                         [+ Dodaj nową sekcję]                            ││
│ │                                                                          ││
│ │  [🖼 Hero]  [📝 Tekst]  [🃏 Karty]  [❓ FAQ]  [📊 Statystyki]            ││
│ │  [👥 Zespół]  [💰 Cennik]  [📣 CTA]                                     ││
│ └───────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│              [Anuluj]    [👁 Podgląd]    [💾 Zapisz zmiany]                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Komponenty callout/podpowiedzi

Nowy komponent `EditorHint` z trzema wariantami:

```typescript
// Warianty:
// info - niebieskie tlo, ikona Info - ogolne wyjasnienia
// tip - zolte tlo, ikona Lightbulb - praktyczne wskazowki
// warning - pomaranczowe tlo, ikona AlertTriangle - ostrzezenia

<EditorHint variant="info">
  Te dane określają jak strona będzie widoczna w nawigacji 
  i w wynikach wyszukiwania.
</EditorHint>

<EditorHint variant="tip">
  Opis SEO powinien mieścić się w 160 znakach i zawierać 
  najważniejsze słowa kluczowe.
</EditorHint>
```

### 3. Podpowiedzi dla poszczegolnych sekcji

Kazdy typ sekcji dostanie krotki opis co robi:

| Typ | Podpowiedz |
|-----|-----------|
| hero | Sekcja powitalna na gorze strony. Przyciaga uwage odwiedzajacych. |
| text | Blok tekstu. Mozesz uzyc Markdown do formatowania (pogrubienie, listy). |
| cards | Siatka kart z ikonami. Idealna do prezentacji uslug lub funkcji. |
| faq | Rozwijane pytania i odpowiedzi. Uzytkownicy klikaja aby zobaczyc odpowiedz. |
| stats | Wyswietla liczby w atrakcyjny sposob. Idealne do pokazania osiagniec. |
| team | Lista osob z awatarami. Pokazuje czlonkow zespolu. |
| pricing | Tabela z pakietami cenowymi. Srodkowy pakiet jest wyroziony. |
| cta | Wezwanie do dzialania. Zacheca uzytkownikow do kontaktu lub rejestracji. |

### 4. Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/pages/admin/components/PageEditorPage.tsx` | Nowy | Pelnostronicowy edytor z calloutami |
| `src/components/admin/EditorHint.tsx` | Nowy | Komponent podpowiedzi (info/tip/warning) |
| `src/pages/admin/components/SectionEditor.tsx` | Modyfikacja | Dodanie podpowiedzi do kazdego typu sekcji |
| `src/pages/admin/components/AdminPagesTab.tsx` | Modyfikacja | Zmiana linku "Edytuj" na navigate do nowej strony |
| `src/App.tsx` | Modyfikacja | Dodanie trasy `/admin/pages/:pageId/edit` |
| `src/data/mockData.ts` | Modyfikacja | Ustawienie wszystkich stron na `published: true` |

### 5. Poprawa mockInfoPages

Wszystkie strony z naglowka (kontakt, oferta, ubezpieczenia, o-nas) maja `published: true`, wiec powinny dzialac. Sprawdze czy problem jest w:

1. Ustawienie FAQ i Regulamin na `published: true` dla testow
2. Upewnienie sie ze tresc jest kompletna

```typescript
// Zmiana w mockData.ts dla FAQ:
published: true, // bylo: false

// Zmiana dla Regulamin:
published: true, // bylo: false
```

### 6. Struktura strony edytora

```typescript
// PageEditorPage.tsx - struktura

const PageEditorPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InfoPage | null>(null);

  // Zaladuj dane strony
  useEffect(() => {
    const page = mockInfoPages.find(p => p.id === pageId);
    if (!page) {
      // Nowa strona
      setFormData({
        id: `page-${Date.now()}`,
        title: '',
        slug: '',
        // ...
      });
    } else {
      setFormData(page);
    }
  }, [pageId]);

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Nawigacja powrotna */}
        <Button variant="ghost" onClick={() => navigate('/admin?tab=pages')}>
          <ArrowLeft /> Wróć do listy stron
        </Button>

        {/* Naglowek */}
        <h1>Edytuj stronę: {formData?.title || 'Nowa strona'}</h1>
        
        {/* Sekcja: Podstawowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorHint variant="info">
              Te dane określają jak strona będzie widoczna w nawigacji...
            </EditorHint>
            {/* Pola formularza */}
          </CardContent>
        </Card>

        {/* Sekcja: Widocznosc */}
        <Card>
          <CardHeader>
            <CardTitle>Widoczność</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorHint variant="info">
              Określ gdzie strona będzie widoczna...
            </EditorHint>
            {/* Checkboxy */}
          </CardContent>
        </Card>

        {/* Sekcja: Tresc */}
        <Card>
          <CardHeader>
            <CardTitle>Sekcje treści</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorHint variant="info">
              Sekcje to bloki treści, z których składa się strona...
            </EditorHint>
            {/* Lista sekcji */}
          </CardContent>
        </Card>

        {/* Przyciski akcji */}
        <div className="flex gap-3 sticky bottom-4">
          <Button variant="outline">Anuluj</Button>
          <Button variant="outline">
            <Eye /> Podgląd
          </Button>
          <Button>
            <Save /> Zapisz zmiany
          </Button>
        </div>
      </div>
    </Layout>
  );
};
```

### 7. Komponent EditorHint

```typescript
// src/components/admin/EditorHint.tsx

interface EditorHintProps {
  variant: 'info' | 'tip' | 'warning';
  children: React.ReactNode;
}

const variants = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  tip: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Lightbulb,
    iconColor: 'text-amber-500',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
  },
};

export const EditorHint = ({ variant, children }: EditorHintProps) => {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg border text-sm mb-4',
      config.bg,
      config.border
    )}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
};
```

### 8. Routing i nawigacja

```typescript
// App.tsx - nowa trasa
<Route path="/admin/pages/new" element={<PageEditorPage />} />
<Route path="/admin/pages/:pageId/edit" element={<PageEditorPage />} />

// AdminPagesTab.tsx - zmiana handlera
const handleEditPage = (page: InfoPage) => {
  navigate(`/admin/pages/${page.id}/edit`);
};

const handleCreatePage = () => {
  navigate('/admin/pages/new');
};
```

## Wyglad koncowy edytora

Edytor bedzie:
- Na pelnej stronie (nie w modalu)
- Z czytelnym podzialem na sekcje (karty)
- Z calloutami wyjasniajacymi kazda czesc
- Z podpowiedziami dla kazdego typu sekcji
- Z sticky footer z przyciskami akcji
- Z podgladem przed zapisaniem
- Responsywny i intuicyjny

