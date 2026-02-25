

# System kategorii wiekowych i specjalnych w edytorze dystansow

## Cel

Zamiana obecnego systemu kategorii (statyczne badge'e toggleowane z listy `defaultCategories`) na pelny konfigurator pozwalajacy:

1. **Kategorie wiekowe** — definiowanie kategorii z nazwa, plcia (K/M), zakresem dat urodzenia (rok od - rok do)
2. **Kategorie specjalne** — dodawanie dowolnych kategorii z nazwa i opisem (np. "Mieszkaniec Warszawy", "Weteran")
3. **Predefiniowane szablony** — szybkie dodanie standardowego zestawu kategorii jednym kliknieciem

## Zmiany w typach (`src/types/index.ts`)

Nowe interfejsy:

```text
AgeCategory {
  id: string
  name: string           // np. "K18-29"
  gender: 'K' | 'M'
  birthYearFrom: number  // np. 1995 (starsi — mniejszy rok)
  birthYearTo: number    // np. 2007 (mlodsi — wiekszy rok)
}

SpecialCategory {
  id: string
  name: string           // np. "Mieszkaniec Warszawy"
  description?: string   // np. "Kategoria dla osob zameldowanych w Warszawie"
}
```

Zmiany w `Distance`:
- Obecne pole `categories: string[]` zostaje (backward compat — bedzie generowane z `ageCategories`)
- Nowe pola: `ageCategories?: AgeCategory[]`, `specialCategories?: SpecialCategory[]`

Zmiany w `DistanceForm` (wewnatrz EventForm):
- Usunac `categories: string[]`
- Dodac `ageCategories: AgeCategory[]`, `specialCategories: SpecialCategory[]`

## Zmiany w EventForm.tsx — Step 2

### Usuniecie starego systemu

Usunac:
- Stala `defaultCategories`
- Sekcja "Kategorie wiekowe" z Badge toggleami
- Funkcja `toggleCategory`

### Nowa sekcja: Kategorie wiekowe

Pod polami dystansu (nazwa, dlugosc, cena, limit) pojawi sie rozbudowana sekcja:

**A) Kategorie wiekowe**

Przycisk "Dodaj szablon standardowy" — dodaje predefiniowany zestaw:
```text
K18-29 (K, 1997-2008), K30-39 (K, 1987-1996), K40-49 (K, 1977-1986),
K50-59 (K, 1967-1976), K60+ (K, 1925-1966),
M18-29 (M, 1997-2008), M30-39 (M, 1987-1996), M40-49 (M, 1977-1986),
M50-59 (M, 1967-1976), M60+ (M, 1925-1966)
```
(Lata beda wyliczone dynamicznie na podstawie roku wydarzenia)

Kazda kategoria wiekowa to wiersz z polami:
- Nazwa (Input, np. "K18-29")
- Plec (Select: K / M)
- Rok urodzenia OD (Input number)
- Rok urodzenia DO (Input number)
- Przycisk usuwania (Trash2 icon)

Przycisk "Dodaj kategorie wiekowa" na dole.

**B) Kategorie specjalne**

Pod kategoriami wiekowymi oddzielona sekcja:
- Przycisk "Dodaj kategorie specjalna"
- Kazda kategoria specjalna to wiersz:
  - Nazwa (Input, np. "Weteran")
  - Opis (Input, opcjonalny, np. "Uczestnicy powyzej 65 roku zycia")
  - Przycisk usuwania

### Generowanie `categories: string[]`

Przy zapisie/submit, pole `categories` w Distance bedzie generowane automatycznie z polaczenia nazw `ageCategories` i `specialCategories` — dla backward compatibility z reszta systemu (wyniki, rejestracje).

## Zmiany w mock data (`src/data/mockData.ts`)

Dodanie `ageCategories` i `specialCategories` do kilku wydarzen (e1, e3), zeby nowe pola mialy dane przy edycji. Istniejace `categories: string[]` pozostaje bez zmian.

Przykladowo dla e1 Maraton Warszawski, dystans "Maraton 42km":
```text
ageCategories: [
  { id: 'cat-1', name: 'K18-29', gender: 'K', birthYearFrom: 1996, birthYearTo: 2007 },
  { id: 'cat-2', name: 'K30-39', gender: 'K', birthYearFrom: 1986, birthYearTo: 1995 },
  ...
]
specialCategories: [
  { id: 'scat-1', name: 'Mieszkaniec Warszawy', description: 'Osoby zameldowane w Warszawie' }
]
```

## Zmiany w RegistrationForm.tsx

Przy wyborze kategorii w rejestracji — jesli dystans ma `ageCategories`, automatycznie przypisywac kategorie na podstawie roku urodzenia i plci uczestnika (z profilu). Kategorie specjalne wyswietlic jako dodatkowe checkboxy do samodzielnego zaznaczenia przez uczestnika.

## Szczegoly techniczne

### Kolejnosc implementacji

| Krok | Plik | Zmiana |
|---|---|---|
| 1 | `src/types/index.ts` | Nowe interfejsy `AgeCategory`, `SpecialCategory`; nowe pola w `Distance` |
| 2 | `src/data/mockData.ts` | Przykladowe dane kategorii w e1 i e3 |
| 3 | `src/pages/organizer/EventForm.tsx` | Nowy konfigurator kategorii w Step 2 |
| 4 | `src/components/registration/RegistrationForm.tsx` | Auto-przypisanie kategorii wiekowej + checkboxy specjalnych |

### UI kategorii wiekowych (w kazdym dystansie)

```text
+----------------------------------------------------------+
| Kategorie wiekowe                    [Dodaj szablon std.] |
+----------------------------------------------------------+
| Nazwa       | Plec | Rok od | Rok do |                   |
| [K18-29   ] | [K ] | [1997] | [2008] | [x]              |
| [K30-39   ] | [K ] | [1987] | [1996] | [x]              |
| [M18-29   ] | [M ] | [1997] | [2008] | [x]              |
| ...                                                       |
|                              [+ Dodaj kategorie wiekowa]  |
+----------------------------------------------------------+

+----------------------------------------------------------+
| Kategorie specjalne                                       |
+----------------------------------------------------------+
| Nazwa              | Opis                        |       |
| [Mieszkaniec Waw ] | [Zameldowani w Warszawie  ] | [x]  |
| [Weteran         ] | [                         ] | [x]  |
|                         [+ Dodaj kategorie specjalna]     |
+----------------------------------------------------------+
```

### Dynamiczne lata szablonu

Standardowy szablon wylicza lata na podstawie roku wydarzenia:
```text
eventYear = parseInt(date.substring(0,4)) || new Date().getFullYear()
K18-29: birthYearFrom = eventYear - 29, birthYearTo = eventYear - 18
K30-39: birthYearFrom = eventYear - 39, birthYearTo = eventYear - 30
...
K60+:   birthYearFrom = eventYear - 100, birthYearTo = eventYear - 60
```

