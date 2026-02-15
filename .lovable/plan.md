

# Dopracowanie konfiguracji produktow w sklepie

## Analiza obecnego stanu

### Co juz dziala w formularzu admina:
- Nazwa, slug, opis, marka
- Cena i cena oryginalna (przecena)
- Kategoria (select)
- Stan magazynowy
- URL obrazu (pojedynczy)
- Przelacznik: dostepny / usliga
- Pola uslugi: szczegoly, waznosc

### Czego BRAKUJE w formularzu admina:
1. **Rozmiary** -- typ `sizes: string[]` istnieje, ale brak UI do dodawania/usuwania
2. **Kolory** -- typ `colors: MerchandiseColor[]` istnieje, ale brak UI do zarzadzania
3. **Galeria zdjec** -- typ `images: string[]` istnieje, ale brak UI (jest tylko jedno pole imageUrl)
4. **Wyroznienie** -- typ `featured: boolean` istnieje, brak przelacznika
5. **Ocena/recenzje** -- pola `rating` i `reviewCount` sa w typie, brak wyswietlania w formularzu

### Co juz dziala po stronie uczestnika (ShopProductPage):
- Wyswietlanie rozmiarow jako przyciski
- Wyswietlanie kolorow jako kolka z hex
- Szczegoly uslug
- Oceny (gwiazdki)
- Galeria -- **BRAK**, wyswietla tylko jeden obraz

## Plan zmian

### 1. Formularz produktu w AdminShopTab -- rozszerzenie dialogu

#### a) Edytor rozmiarow
Pole tekstowe + przycisk "Dodaj". Rozmiary wyswietlane jako badge z "X" do usuwania. Wstepnie wypelniane presetami (np. XS-XXL dla odziezi, 36-46 dla obuwia) w zaleznosci od kategorii.

#### b) Edytor kolorow
Dla kazdego koloru: pole "Nazwa" + input `type="color"` (natywny color picker). Przycisk "Dodaj kolor", lista dodanych kolorow z podgladem i mozliwoscia usuniecia.

#### c) Galeria zdjec (dodatkowe URL-e)
Lista pol tekstowych na URL-e dodatkowych zdjec. Przycisk "Dodaj zdjecie" dodaje nowe pole. Mozliwosc usuwania.

#### d) Przelacznik "Wyrozniony produkt"
Switch analogiczny do "Dostepny w sprzedazy" i "To jest usluga".

#### e) Ocena i recenzje (tylko odczyt)
Przy edycji -- wyswietlanie aktualnej oceny i liczby recenzji (nieedytowalne, informacyjne).

### 2. ShopProductPage -- galeria zdjec

Jesli produkt ma tablice `images`, wyswietlic miniaturki pod glownym zdjeciem. Klikniecie w miniaturke zmienia glowne zdjecie. Obecny `imageUrl` jako domyslne zdjecie.

### 3. Mockowe dane -- uzupelnienie

Dodac pole `images` do kilku produktow (2-3 dodatkowe URL-e Unsplash), aby galeria miala co wyswietlic.

## Szczegoly techniczne

### Pliki do zmiany:

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/components/AdminShopTab.tsx` | Rozszerzenie dialogu produktu o edytory rozmiarow, kolorow, galerii, featured |
| `src/pages/ShopProductPage.tsx` | Galeria zdjec z miniaturkami |
| `src/data/mockData.ts` | Dodanie `images` do wybranych produktow |

### Edytor rozmiarow (AdminShopTab):
```
Stan: newSize (string)
UI: Input + Button "Dodaj" + lista Badge z X
Presety kategorii:
  apparel -> ['XS','S','M','L','XL','XXL']
  footwear -> ['36','37','38',...,'46']
```

### Edytor kolorow (AdminShopTab):
```
Stan: newColorName (string), newColorHex (string)
UI: Input[text] + Input[color] + Button "Dodaj"
Lista: kolorowe kolka + nazwa + przycisk usun
```

### Galeria (ShopProductPage):
```
Stan: selectedImage (string) -- domyslnie product.imageUrl
Miniaturki: flex row pod glownym zdjeciem
Klik na miniaturke -> zmiana selectedImage
```

### Nowe importy:
- AdminShopTab: `X` z lucide (juz moze byc), `Palette` ikona
- ShopProductPage: brak nowych importow

