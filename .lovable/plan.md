

# Artefakty tras przy dystansach (mapki, GPX, zdjecia)

## Obecny stan

Obecnie wydarzenie ma **jedną trasę na poziomie całego eventu** (`routeMapUrl`, `routeGpxUrl`, `routeElevationProfile`), wyswietlaną w zakładce "Trasa". Dystanse (`Distance`) nie mają żadnych pól na artefakty tras.

## Zakres zmian

### 1. Rozszerzenie typu `Distance` o artefakty trasy

Dodanie opcjonalnych pól do interfejsu `Distance` w `src/types/index.ts`:

```typescript
export interface DistanceRouteFile {
  id: string;
  name: string;
  type: 'map' | 'elevation' | 'gpx' | 'image';
  url: string;
}

export interface Distance {
  // ... istniejące pola
  routeMapUrl?: string;
  routeElevationProfile?: string;
  routeGpxUrl?: string;
  routeFiles?: DistanceRouteFile[];  // dodatkowe pliki/zdjęcia
}
```

### 2. Formularz edycji dystansu — sekcja "Trasa" (`EventForm.tsx`)

W kroku 2, pod polami każdego dystansu (nazwa, długość, cena, limit), dodanie rozwijalnej sekcji "Trasa i mapy":

- **URL mapy trasy** — input tekstowy
- **URL profilu wysokościowego** — input tekstowy
- **URL pliku GPX** — input tekstowy
- **Dodatkowe pliki** — lista dynamiczna (nazwa + URL + typ), z przyciskiem "Dodaj plik"

Sekcja będzie w `Collapsible` aby nie zaśmiecać formularza gdy organizator nie chce dodawać artefaktów.

Rozszerzenie `DistanceForm` o nowe pola i `updateDistance` o ich obsługę.

### 3. Widok dystansów na stronie wydarzenia (`EventDetailsPage.tsx`)

W zakładce "Dystanse", pod każdym dystansem, jeśli ma artefakty trasy — wyświetlenie:
- Miniaturka mapy (klikalna → powiększenie w Dialog)
- Przycisk "Pobierz GPX" 
- Miniaturka profilu wysokościowego
- Lista dodatkowych plików jako linki

### 4. Podgląd trasy dystansu przy rejestracji

W `RegistrationForm.tsx`, po wybraniu dystansu, jeśli ma artefakty — pokazanie małego przycisku "Zobacz trasę" otwierającego Dialog z mapką i plikami.

### 5. Mock data

Dodanie przykładowych artefaktów do 2-3 dystansów w `mockData.ts`.

---

## Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/types/index.ts` | Dodanie `DistanceRouteFile`, rozszerzenie `Distance` |
| `src/pages/organizer/EventForm.tsx` | Sekcja "Trasa" w edycji dystansu (Collapsible) |
| `src/pages/EventDetailsPage.tsx` | Wyświetlenie artefaktów w zakładce Dystanse |
| `src/components/registration/RegistrationForm.tsx` | Przycisk "Zobacz trasę" po wybraniu dystansu |
| `src/data/mockData.ts` | Przykładowe dane tras dla dystansów |

## Kolejność implementacji

1. Typy (`types/index.ts`)
2. Mock data
3. EventForm — sekcja trasy w dystansie
4. EventDetailsPage — wyświetlanie artefaktów
5. RegistrationForm — podgląd trasy

