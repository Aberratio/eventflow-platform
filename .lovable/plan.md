

# Plan: Zmiana galerii na linki do albumow oraz rozbudowa mockow

## Cel

1. **Galeria** - zamiana wyswietlania zdjec na linki do zewnetrznych albumow (Google Photos, Flickr, Facebook itp.)
2. **Mock data** - znaczna rozbudowa danych testowych dla pelnego pokrycia edge case'ow:
   - Wiecej wynikow (results)
   - Wiecej zapisanych uczestnikow (registrations/start lists)
   - Rozne scenariusze wydarzen

---

## 1. Zmiany w typach i strukturze danych

### Nowy typ GalleryAlbum (src/types/index.ts)

Zamiast `gallery?: string[]` (lista URL zdjec), wprowadzamy:

```typescript
export interface GalleryAlbum {
  id: string;
  name: string;           // np. "Oficjalny album 2025"
  url: string;            // link zewnetrzny
  platform: 'google_photos' | 'flickr' | 'facebook' | 'instagram' | 'other';
  photographer?: string;  // opcjonalnie - autor
}
```

Zmiana w Event:
```typescript
// Przed:
gallery?: string[];

// Po:
galleryAlbums?: GalleryAlbum[];
```

---

## 2. Nowy komponent GalleryAlbumsList

Zamiast ImageGallery, tworzymy nowy komponent wyswietlajacy linki:

**Wyglad:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📷 Galeria i albumy                                             │
│ Przegladaj zdjecia z wydarzenia na zewnetrznych platformach    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Google Photos]  Oficjalny album 2025                    → │ │
│ │                  Fot. Jan Fotograf                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Flickr]  Zdjecia amatorskie                             → │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Facebook]  Album fanow                                  → │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

Kazdy wiersz:
- Ikona platformy (rozpoznawanie po typie)
- Nazwa albumu
- Opcjonalnie autor/fotograf
- Strzalka -> otwiera link w nowej karcie

---

## 3. Rozbudowa mockData

### 3.1 Wiecej uczestnikow (mockUsers)

Dodanie 20+ nowych uczestnikow z roznymi profilami:
- Rozne roczniki (1960-2005) - pokrycie kategorii wiekowych
- Rozne plci (M/K)
- Z klubem i bez
- Rozne miasta

### 3.2 Wiecej rejestracji (mockRegistrations)

Dla kazdego wydarzenia z otwartymi zapisami:
- 50-200 rejestracji na rozne dystanse
- Rozne statusy (confirmed, pending, cancelled)
- Z merchandise i bez
- Z kodami rabatowymi i bez

### 3.3 Wiecej wynikow (mockResults)

Dla kazdego zakonczonego wydarzenia:
- 30-100+ wynikow
- Rozne kategorie wiekowe i plciowe
- TOP 3 z medalami
- DNF i DSQ dla realizmu
- Rozne czasy

### 3.4 Edge case'y wydarzen

Dodanie wydarzen reprezentujacych wszystkie scenariusze:

| Scenariusz | Event ID | Opis |
|------------|----------|------|
| Brak galerii | e-no-gallery | Wydarzenie bez zadnych albumow |
| 1 album | e-one-album | Jeden link do Google Photos |
| Wiele albumow | e-multi-album | 4+ linki do roznych platform |
| Pelne zapisy | e-full | Limit osiagniety na wszystkich dystansach |
| Prawie pelne | e-almost-full | 95-99% zapelnienia |
| Wydarzenie archiwalne | e-archive-2024 | Stare wydarzenie z pelna historia |
| Brak wynikow | e-no-results | Zakonczone ale brak wynikow |
| Tylko PDF | e-pdf-only | Wyniki tylko w dokumentach |
| Duzo kategorii | e-many-cats | 20+ kategorii wiekowych |

---

## 4. Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie interfejsu GalleryAlbum, zmiana Event.gallery na galleryAlbums |
| `src/components/GalleryAlbumsList.tsx` | Nowy | Komponent wyswietlajacy linki do albumow |
| `src/pages/EventDetailsPage.tsx` | Modyfikacja | Podmiana ImageGallery na GalleryAlbumsList |
| `src/data/mockData.ts` | Modyfikacja | Rozbudowa: users, registrations, results, events z galleryAlbums |
| `src/components/ImageGallery.tsx` | Usuniecie | Komponent juz niepotrzebny (lub zachowany dla innych zastosowan) |

---

## 5. Przykladowe dane mockowe

### GalleryAlbums dla wydarzenia e11:

```typescript
galleryAlbums: [
  {
    id: 'ga1',
    name: 'Oficjalny album Tatry Ultra 2026',
    url: 'https://photos.google.com/share/tatry-ultra-2026',
    platform: 'google_photos',
    photographer: 'Studio Gorskie',
  },
  {
    id: 'ga2',
    name: 'Zdjecia amatorskie - Flickr',
    url: 'https://flickr.com/groups/tatry-ultra-2026',
    platform: 'flickr',
  },
  {
    id: 'ga3',
    name: 'Album na Facebooku',
    url: 'https://facebook.com/media/set/tatry-ultra',
    platform: 'facebook',
  },
]
```

### Nowi uczestnicy (przyklad):

```typescript
{ id: 'p10', name: 'Adam Biegacz', email: 'adam@example.com', role: 'participant', birthYear: 1995, gender: 'M', club: 'Runners Warsaw' },
{ id: 'p11', name: 'Beata Szybka', email: 'beata@example.com', role: 'participant', birthYear: 1988, gender: 'K' },
{ id: 'p12', name: 'Cezary Ultra', email: 'cezary@example.com', role: 'participant', birthYear: 1975, gender: 'M', club: 'Ultra Team PL' },
// ... 20+ wiecej
```

### Nowe rejestracje (przyklad dla e11):

```typescript
// Generowanie 100+ rejestracji
{ id: 'r-e11-001', eventId: 'e11', userId: 'p10', distanceId: 'd20', status: 'confirmed', bibNumber: '001', ... },
{ id: 'r-e11-002', eventId: 'e11', userId: 'p11', distanceId: 'd21', status: 'confirmed', bibNumber: '002', ... },
// ... itd
```

### Nowe wyniki (przyklad):

```typescript
// 50+ wynikow dla kazdego zakonczonego wydarzenia
{ id: 'res-e11-001', eventId: 'e11', userId: 'p10', position: 1, categoryPosition: 1, time: '7:23:45', status: 'finished', ... },
{ id: 'res-e11-002', eventId: 'e11', userId: 'p11', position: 2, categoryPosition: 1, time: '7:45:12', status: 'finished', ... },
{ id: 'res-e11-050', eventId: 'e11', userId: 'p50', position: 50, status: 'dnf', ... }, // DNF
```

---

## 6. Komponent GalleryAlbumsList - szczegoly

```typescript
// src/components/GalleryAlbumsList.tsx

interface GalleryAlbumsListProps {
  albums: GalleryAlbum[];
}

// Mapowanie platform na ikony i kolory
const platformConfig = {
  google_photos: { icon: Camera, label: 'Google Photos', color: 'text-red-500' },
  flickr: { icon: Camera, label: 'Flickr', color: 'text-pink-500' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-purple-500' },
  other: { icon: ExternalLink, label: 'Album', color: 'text-gray-500' },
};

export const GalleryAlbumsList = ({ albums }: GalleryAlbumsListProps) => {
  if (albums.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galeria i albumy</CardTitle>
        <p>Przegladaj zdjecia z wydarzenia</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {albums.map(album => (
            <a
              key={album.id}
              href={album.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <PlatformIcon platform={album.platform} />
              <div className="flex-1 min-w-0">
                <div className="font-medium group-hover:text-primary">{album.name}</div>
                {album.photographer && (
                  <div className="text-sm text-muted-foreground">Fot. {album.photographer}</div>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 7. Podsumowanie zmian

1. **Typ GalleryAlbum** - nowy interfejs z polami: id, name, url, platform, photographer
2. **Event.galleryAlbums** - zamiana string[] na GalleryAlbum[]
3. **GalleryAlbumsList** - nowy komponent renderujacy linki
4. **EventDetailsPage** - podmiana ImageGallery na GalleryAlbumsList
5. **mockData** - rozbudowa o:
   - 25+ nowych uczestnikow
   - 200+ nowych rejestracji (rozne statusy, dystanse)
   - 150+ nowych wynikow (z DNF/DSQ)
   - Rozne scenariusze albumow (0, 1, wiele)
   - Edge case wydarzenia

