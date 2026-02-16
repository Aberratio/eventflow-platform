

# Rozbudowa zarzadzania uzytkownikami w panelu admina

## Zakres zmian

### 1. Rozbudowa dialogu "Dodaj organizatora" -- wybor z istniejacych lub nowy

Obecny dialog pozwala tylko na wpisanie nazwy i emaila (nowy user). Zmieniamy go na dwuetapowy:

**Tryb 1: Wybierz istniejacego uzytkownika**
- Pole wyszukiwania po emailu (autocomplete z listy mockUsers, filtrowane do userow z rola != organizer)
- Po wybraniu usera -- wyswietla sie jego imie i email
- Przycisk "Nadaj role organizatora" -- zmienia role wybranego usera

**Tryb 2: Dodaj nowego uzytkownika**
- Formularz jak dotychczas (imie, email) + opcjonalne pola: telefon, nazwa firmy, NIP
- Przelacznik miedzy trybami (Tabs lub przyciski radiowe)

### 2. Dialog edycji danych uzytkownika -- wspolny dla obu zakladek

Zamiast obecnego dialogu "Podglad profilu" (read-only), nowy dialog z dwoma trybami:
- **Tryb podgladu** (domyslny) -- jak dotychczas, dane w formie grid/label
- **Tryb edycji** -- po kliknieciu "Edytuj" pola zamieniaja sie na inputy

Pola do edycji:

| Pole | Typ | Dotyczy |
|------|-----|---------|
| Imie i nazwisko | Input text | wszyscy |
| Email | Input email | wszyscy |
| Telefon | Input tel | wszyscy |
| Rok urodzenia | Input number | uczestnik |
| Plec | Select M/K | uczestnik |
| Klub | Input text | uczestnik |
| Nazwa firmy | Input text | organizator |
| NIP | Input text | organizator |
| Strona www | Input url | organizator |
| Opis | Textarea | organizator |

Dialog automatycznie wyswietla odpowiednie pola w zaleznosci od roli usera.

### 3. Zmiana w dropdown menu -- "Podglad profilu" zamieniony na "Podglad / Edycja"

W obu zakladkach (Uczestnicy i Organizatorzy):
- Akcja "Podglad profilu" otwiera nowy dialog z trybem podglad/edycja
- Ikona zmieniona na `Pencil` (lub zostaje `Eye` + dodatkowa opcja `Pencil`)

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/components/UsersOrganizersTab.tsx` | Rozbudowa dialogu dodawania (nowy/istniejacy), dialog podgladu z trybem edycji |
| `src/pages/admin/components/UsersParticipantsTab.tsx` | Dialog podgladu z trybem edycji |

## Szczegoly techniczne

### Dialog dodawania organizatora (UsersOrganizersTab):

```
Stan:
  addMode: 'new' | 'existing' (domyslnie 'existing')
  searchEmail: string
  matchedUser: User | null

Logika wyszukiwania:
  const nonOrganizers = mockUsers.filter(u => u.role !== 'organizer');
  const matches = nonOrganizers.filter(u => u.email.includes(searchEmail));

UI:
  Tabs "Istniejacy uzytkownik" | "Nowy uzytkownik"
  - Istniejacy: Input email + lista podpowiedzi + przycisk "Nadaj role"
  - Nowy: formularz name/email/phone/company/nip
```

### Dialog podgladu/edycji (wspolny wzorzec dla obu zakladek):

```
Stan:
  isEditing: boolean (domyslnie false)
  editData: Partial<User>

UI podglad:
  Grid z label+value (jak dotychczas)
  Przycisk "Edytuj dane" w prawym gornym rogu

UI edycja:
  Pola zamienione na Input/Select/Textarea
  Dolne przyciski: "Anuluj" (wraca do podgladu) + "Zapisz zmiany" (toast + wraca do podgladu)

Pola warunkowe:
  if (user.role === 'participant') -> birthYear, gender, club
  if (user.role === 'organizer') -> companyName, nip, website, description
```

