
# Plan: Naprawa stron informacyjnych z nawigacji + symulacja backendu

## Problem

Strony informacyjne z menu "Informacje" (Kontakt, Oferta, Ubezpieczenia, O nas) pokazują 404 ponieważ:
1. W App.tsx są zduplikowane trasy - dynamiczna `/info/:slug` i statyczne `/info/kontakt` itd.
2. Statyczne trasy nie przekazują parametru `slug` do komponentu
3. Komponent `DynamicInfoPage` szuka `slug` w `useParams()`, ale dla statycznych tras jest on `undefined`

## Rozwiazanie

### 1. Naprawa routingu w App.tsx

Usunac zduplikowane statyczne trasy (linie 68-71) i zostawic tylko dynamiczna:

```typescript
// Bylo:
<Route path="/info/:slug" element={<DynamicInfoPage />} />
<Route path="/info/kontakt" element={<DynamicInfoPage />} />  // USUNAC
<Route path="/info/oferta" element={<DynamicInfoPage />} />   // USUNAC
<Route path="/info/ubezpieczenia" element={<DynamicInfoPage />} /> // USUNAC
<Route path="/info/o-nas" element={<DynamicInfoPage />} />    // USUNAC

// Po zmianach:
<Route path="/info/:slug" element={<DynamicInfoPage />} />
```

### 2. Symulacja pobierania danych z backendu

Stworzenie hooka `useInfoPage` ktory symuluje fetch z API:

```typescript
// src/hooks/useInfoPage.ts

export interface InfoPageResponse {
  page: InfoPage | null;
  isLoading: boolean;
  error: string | null;
}

export const useInfoPage = (slug: string | undefined): InfoPageResponse => {
  const [page, setPage] = useState<InfoPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Symulacja opóźnienia sieciowego (300-500ms)
    const fetchPage = async () => {
      setIsLoading(true);
      setError(null);
      
      // Symulacja fetch z backendu
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      
      if (!slug) {
        setError('Brak adresu strony');
        setIsLoading(false);
        return;
      }
      
      // "Pobieranie" z mockData (symulacja backendu)
      const foundPage = mockInfoPages.find(p => p.slug === slug);
      
      if (!foundPage) {
        setError('Strona nie istnieje');
      } else if (!foundPage.published) {
        setError('Strona nie jest opublikowana');
      } else {
        setPage(foundPage);
      }
      
      setIsLoading(false);
    };

    fetchPage();
  }, [slug]);

  return { page, isLoading, error };
};
```

### 3. Rozbudowa DynamicInfoPage

Dodanie stanu ladowania i obslugi bledow:

```typescript
// src/components/info/DynamicInfoPage.tsx

export const DynamicInfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { page, isLoading, error } = useInfoPage(slug);

  // Stan ladowania
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Blad lub brak strony
  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  // Renderowanie strony
  return (
    <Layout>
      <div className="min-h-screen">
        {page.content.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </Layout>
  );
};
```

## Diagram przeplywu danych

```text
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Navigation     │     │  DynamicInfoPage│     │   useInfoPage    │
│   Header.tsx     │     │                 │     │      Hook        │
└────────┬─────────┘     └────────┬────────┘     └────────┬─────────┘
         │                        │                       │
         │  Klik: /info/kontakt   │                       │
         │───────────────────────>│                       │
         │                        │                       │
         │                        │  slug = "kontakt"     │
         │                        │──────────────────────>│
         │                        │                       │
         │                        │                       │ await 300-500ms
         │                        │                       │ (symulacja fetch)
         │                        │                       │
         │                        │                       │ znajdz w mockInfoPages
         │                        │                       │
         │                        │  { page, isLoading }  │
         │                        │<──────────────────────│
         │                        │                       │
         │                        │  Renderuj sekcje      │
         │                        │                       │
```

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/App.tsx` | Modyfikacja | Usuniecie zduplikowanych tras /info/kontakt, /info/oferta itd. |
| `src/hooks/useInfoPage.ts` | Nowy | Hook do symulacji pobierania danych strony z backendu |
| `src/components/info/DynamicInfoPage.tsx` | Modyfikacja | Uzycie hooka, dodanie stanu ladowania i obslugi bledow |

## Przyklad uzycia w przyszlosci z prawdziwym backendem

Hook jest przygotowany na latwa zamiane mockow na prawdziwe API:

```typescript
// Przyszla implementacja z Supabase:
export const useInfoPage = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['infoPage', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_pages')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};
```

## Stan ladowania - komponenty szkieletowe

Podczas ladowania strony uzytkownik zobaczy animowane szkielety:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ████████████████████████████████████                     │
│              (skeleton - tytul)                             │
│                                                             │
│         ████████████████████████                            │
│              (skeleton - opis)                              │
│                                                             │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│   │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │    │
│   │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │    │
│   │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │ │  ░░░░░░░░░░░  │    │
│   └───────────────┘ └───────────────┘ └───────────────┘    │
│           (skeleton - karty)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Podsumowanie

Po tych zmianach:

1. Wszystkie linki z nawigacji beda dzialac poprawnie
2. Strony beda wyswietlac stan ladowania (skeleton)
3. Bledy beda przekierowywac na 404
4. Kod jest przygotowany na przyszla integracje z backendem
5. Dane o strukturze stron sa pobierane dynamicznie (symulacja JSON z API)
