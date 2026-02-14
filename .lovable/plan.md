
# Plan: Implementacja akcji menu w zakladce Uczestnicy

## Problem
W zakladce "Uczestnicy" w panelu admina opcje menu (Podglad profilu, Resetuj haslo, Zablokuj, Usun) wywoluja tylko toasty bez dialogow potwierdzenia ani podgladu danych.

## Zmiany w pliku `src/pages/admin/components/UsersParticipantsTab.tsx`

### 1. "Podglad profilu" -- dialog z danymi uczestnika
Dialog wyswietlajacy dane uczestnika: imie, email, telefon, rok urodzenia, plec, klub. Dane pobierane z obiektu `User`.

### 2. "Zmien role" -- dialog z wyborem roli (nowa opcja)
Analogicznie do organizatorow -- dialog z selectem do wyboru nowej roli + przycisk potwierdzenia. Dodanie nowej pozycji w dropdown menu.

### 3. "Resetuj haslo" -- dialog potwierdzenia
`AlertDialog` z pytaniem "Czy na pewno chcesz wyslac link do resetowania hasla?" zamiast natychmiastowego toasta.

### 4. "Zablokuj" -- dialog potwierdzenia
`AlertDialog` z pytaniem "Czy na pewno chcesz zablokowac uczestnika?"

### 5. "Usun" -- dialog potwierdzenia
`AlertDialog` z ostrzezeniem o nieodwracalnosci operacji.

## Szczegoly techniczne

Nowe stany:
- `selectedUser` (User | null)
- `profileDialogOpen`, `roleDialogOpen`, `resetPasswordDialogOpen`, `blockDialogOpen`, `deleteDialogOpen` (boolean)
- `selectedRole` (UserRole)

Nowe importy:
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`
- `Label`, `Separator`
- `UserCog` (ikona dla zmiany roli)
- `User`, `UserRole` z `@/types`

Funkcja pomocnicza `openAction` -- identyczna jak w UsersOrganizersTab -- ustawia `selectedUser` i otwiera odpowiedni dialog.

### Profil uczestnika -- zawartosc dialogu:
- Imie i nazwisko
- Email
- Telefon (jesli dostepny)
- Rok urodzenia (jesli dostepny)
- Plec (jesli dostepna, M/K)
- Klub (jesli dostepny)
- Liczba rejestracji

### Dropdown menu -- kolejnosc opcji:
1. Podglad profilu (Eye)
2. Zmien role (UserCog) -- nowa pozycja
3. Resetuj haslo (RefreshCw)
4. Zablokuj (Ban)
5. Usun (Trash2, destructive)
