

# Filtrowanie uczestnikow po statusie (aktywny/zablokowany)

## Problem
Filtr statusu juz istnieje w UI (select z opcjami Wszyscy/Aktywni/Zablokowani), ale nie dziala -- `statusFilter` nie jest uzywany w logice filtrowania. Dodatkowo typ `User` nie ma pola `status`, wiec wszyscy uczestnicy sa zawsze wyswietlani jako "Aktywny".

## Zmiany

### 1. Dodac pole `status` do interfejsu `User` (`src/types/index.ts`)
Nowe opcjonalne pole: `status?: 'active' | 'blocked'` (domyslnie traktowane jako `'active'`).

### 2. Sledzic zablokowanych uzytkownikow lokalnie (`UsersParticipantsTab.tsx`)
Dodac stan `blockedUsers` (Set z ID) -- po kliknieciu "Zablokuj" ID trafia do setu, po odblokowaniu jest usuwane. Pozwoli to na dzialanie filtra bez backendu.

### 3. Podlaczyc filtr statusu do logiki filtrowania
W `filteredParticipants` uwzglednic `statusFilter`:
- `all` -- bez filtrowania
- `active` -- tylko uzytkownicy spoza `blockedUsers`
- `blocked` -- tylko uzytkownicy z `blockedUsers`

### 4. Dynamiczny badge statusu w tabeli
Zamiast zawsze "Aktywny" (zielony), wyswietlac "Zablokowany" (czerwony) dla uzytkownikow w `blockedUsers`.

### 5. Zmiana akcji "Zablokuj" na "Zablokuj/Odblokuj"
- Jesli uzytkownik aktywny: opcja "Zablokuj" (Ban) -- dodaje do `blockedUsers`
- Jesli uzytkownik zablokowany: opcja "Odblokuj" (RefreshCw/CheckCircle) -- usuwa z `blockedUsers`

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/types/index.ts` | Dodanie `status?: 'active' \| 'blocked'` do interfejsu `User` |
| `src/pages/admin/components/UsersParticipantsTab.tsx` | Stan `blockedUsers`, filtrowanie po statusie, dynamiczny badge, toggle blokuj/odblokuj |

## Szczegoly techniczne

### Nowy stan:
```
const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
```

### Filtrowanie:
```
const isBlocked = (userId: string) => blockedUsers.has(userId);

const filteredParticipants = participants.filter((user) => {
  const matchesSearch = ...;
  const matchesStatus =
    statusFilter === 'all' ||
    (statusFilter === 'active' && !isBlocked(user.id)) ||
    (statusFilter === 'blocked' && isBlocked(user.id));
  return matchesSearch && matchesStatus;
});
```

### Badge w tabeli:
```
{isBlocked(user.id)
  ? <Badge variant="outline" className="bg-destructive/10 text-destructive ...">Zablokowany</Badge>
  : <Badge variant="outline" className="bg-primary/10 text-primary ...">Aktywny</Badge>}
```

### Akcja blokuj/odblokuj w dropdown:
Dynamicznie zmieniac tekst i ikone w zaleznosci od statusu uzytkownika. Alert dialog rowniez dostosowany do kontekstu (blokowanie vs odblokowanie).

