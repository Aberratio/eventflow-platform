

# Plan: Implementacja akcji menu organizatorow w panelu admina

## Problem
W zakladce "Organizatorzy" (`/admin`) kazdy wiersz ma dropdown menu z opcjami, ale "Podglad profilu" i "Zobacz wydarzenia" nie maja `onClick` -- sa nieaktywne. Dodatkowo "Zmien role", "Zablokuj" i "Usun" pokazuja tylko toast bez zadnej interakcji potwierdzajacej.

## Zmiany

### 1. "Podglad profilu" -- dialog z danymi organizatora
Otwarcie dialogu z informacjami o organizatorze (imie, email, firma, NIP, strona www, opis). Dane pobierane z obiektu `User`.

### 2. "Zobacz wydarzenia" -- dialog z lista wydarzen
Otwarcie dialogu z lista wydarzen organizatora (pobieranych z `mockEvents`). Kazde wydarzenie bedzie linkiem do `/events/:slug`.

### 3. "Zmien role" -- dialog z wyborem roli
Dialog z selectem do wyboru nowej roli (participant/organizer/moderator/admin) + przycisk potwierdzenia.

### 4. "Zablokuj" -- dialog potwierdzenia
`AlertDialog` z pytaniem "Czy na pewno chcesz zablokowac...?" + przycisk potwierdzenia.

### 5. "Usun" -- dialog potwierdzenia
`AlertDialog` z pytaniem "Czy na pewno chcesz usunac...?" + ostrzezenie o nieodwracalnosci + przycisk potwierdzenia.

## Plik do zmiany

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/components/UsersOrganizersTab.tsx` | Dodanie stanow dla dialogi, implementacja onClick dla kazdej opcji menu, 3 nowe dialogi (profil, wydarzenia, zmiana roli) + 2 alert dialogi (blokada, usuniecie) |

## Szczegoly techniczne

Nowe stany:
- `selectedUser` -- aktualnie wybrany organizator (User | null)
- `profileDialogOpen` -- dialog podgladu profilu
- `eventsDialogOpen` -- dialog wydarzen
- `roleDialogOpen` -- dialog zmiany roli
- `blockDialogOpen` -- alert dialog blokady
- `deleteDialogOpen` -- alert dialog usuniecia
- `selectedRole` -- wybrana nowa rola

Kazda opcja z dropdown ustawia `selectedUser` i otwiera odpowiedni dialog. Dialogi wyswietlaja dane z `selectedUser` i `mockEvents`.

