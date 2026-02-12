
# Plan: Profil w navbar + reorganizacja paneli admin/moderator

## 1. Profil w dropdown navbar (wszystkie role)

Zamiast trzymac "Profil" jako tab w panelach, przeniesiony zostanie do dropdown menu w navbarze -- bezposrednio nad przyciskiem "Wyloguj". Dotyczy to wszystkich rol: uczestnik, organizator, moderator, admin.

### Dropdown menu -- nowa struktura:

```text
┌──────────────────────────┐
│ 📊 Panel                 │
│ 📅 Moje zawody*          │  (* role-specific)
│ ─────────────────────── │
│ 👤 Mój profil            │  <-- NOWY
│ ─────────────────────── │
│ 🔴 Wyloguj               │
└──────────────────────────┘
```

### Routing
- Nowa trasa `/profile` w `App.tsx` -- renderuje komponent profilowy odpowiedni dla roli uzytkownika (reuse istniejacych ProfileTab komponentow)
- Kazda rola kierowana na swoj formularz profilu

### Pliki do zmiany:
- `src/components/layout/Header.tsx` -- dodanie linku "Moj profil" w dropdown (desktop + mobile)
- `src/App.tsx` -- nowa trasa `/profile`
- Nowy plik: `src/pages/ProfilePage.tsx` -- wrapper ktory renderuje odpowiedni ProfileTab na podstawie roli

### Usuwanie z paneli:
- `src/pages/participant/ParticipantDashboard.tsx` -- usunac tab "Profil"
- `src/pages/organizer/OrganizerDashboard.tsx` -- usunac tab "Profil"
- `src/pages/moderator/ModeratorDashboard.tsx` -- usunac tab "Profil"
- `src/pages/admin/AdminDashboard.tsx` -- usunac tab "Profil"

---

## 2. Reorganizacja panelu admina

Obecne 11 tabow jest za duzo. Podzielone zostana na logiczne grupy za pomoca **sidebar nawigacji** zamiast jednego rzedu tabow. Na mobile sidebar zamieni sie w dropdown/select lub hamburger.

### Nowa struktura (sidebar z grupami):

```text
PANEL
  ├ Pulpit

MODERACJA
  ├ Moderacja wydarzen
  ├ Uczestnicy
  ├ Organizatorzy

SKLEP
  ├ Produkty i zamowienia
  ├ Wyzwania

TRESCI
  ├ Wydarzenia
  ├ Partnerzy
  ├ Strony CMS

KONFIGURACJA
  ├ Ustawienia
```

### Implementacja:
- Zamiana `Tabs` na sidebar z `useState` i warunkowym renderowaniem
- Na desktop: lewy sidebar (240px) + content po prawej
- Na tablet: sidebar zwijany do ikon
- Na mobile: dropdown Select na gorze strony do wyboru sekcji

### Plik do zmiany:
- `src/pages/admin/AdminDashboard.tsx` -- pelna przebudowa layoutu

---

## 3. Reorganizacja panelu moderatora

Moderator ma 8 tabow -- mniej niz admin, ale tez duzo. Zastosowane zostanie to samo podejscie z sidebar.

### Nowa struktura:

```text
PANEL
  ├ Pulpit

MODERACJA
  ├ Moderacja wydarzen
  ├ Uczestnicy
  ├ Organizatorzy

SKLEP
  ├ Kody rabatowe
  ├ Zamowienia
  ├ Wyzwania
```

### Plik do zmiany:
- `src/pages/moderator/ModeratorDashboard.tsx` -- przebudowa layoutu (analogicznie do admina)

---

## Szczegoly techniczne

### ProfilePage.tsx (nowy plik)

```typescript
// Wrapper ktory na podstawie roli renderuje odpowiedni ProfileTab
const ProfilePage = () => {
  const { user } = useAuth();
  // Renderuje ParticipantProfileTab / OrganizerProfileTab / 
  // ModeratorProfileTab / AdminProfileTab w Layout
};
```

### AdminDashboard.tsx -- sidebar layout

```typescript
// Grupy nawigacji
const navGroups = [
  {
    label: 'Panel',
    items: [
      { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Moderacja',
    items: [
      { id: 'moderation', label: 'Moderacja', icon: ShieldCheck },
      { id: 'participants', label: 'Uczestnicy', icon: Users },
      { id: 'organizers', label: 'Organizatorzy', icon: Building2 },
    ]
  },
  {
    label: 'Sklep',
    items: [
      { id: 'shop', label: 'Produkty', icon: ShoppingBag },
      { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    ]
  },
  {
    label: 'Tresci',
    items: [
      { id: 'events', label: 'Wydarzenia', icon: Calendar },
      { id: 'partners', label: 'Partnerzy', icon: Handshake },
      { id: 'pages', label: 'Strony', icon: FileText },
    ]
  },
  {
    label: 'Konfiguracja',
    items: [
      { id: 'settings', label: 'Ustawienia', icon: Settings },
    ]
  },
];
```

**Desktop layout:**
```text
┌─────────────────────────────────────────────────────────┐
│ Panel Administratora                                     │
├──────────┬──────────────────────────────────────────────┤
│ PANEL    │                                              │
│  Pulpit  │    [Active section content]                  │
│          │                                              │
│ MODERACJA│                                              │
│  Moderac │                                              │
│  Uczestn │                                              │
│  Organiz │                                              │
│          │                                              │
│ SKLEP    │                                              │
│  Produkty│                                              │
│  Wyzwania│                                              │
│          │                                              │
│ TRESCI   │                                              │
│  Wydarzen│                                              │
│  Partnerz│                                              │
│  Strony  │                                              │
│          │                                              │
│ KONFIG   │                                              │
│  Ustawien│                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Mobile layout:**
```text
┌─────────────────────────────┐
│ Panel Administratora        │
│ [▼ Pulpit          ]        │  <-- Select dropdown
│                             │
│ [Active section content]    │
└─────────────────────────────┘
```

### Header.tsx -- zmiany w dropdown

Dodanie pozycji "Moj profil" z ikona `User` nad separatorem i "Wyloguj":

```typescript
<DropdownMenuSeparator />
<DropdownMenuItem onClick={() => navigate('/profile')}>
  <User className="h-4 w-4 mr-2" />
  Mój profil
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem onClick={handleLogout} className="text-destructive">
  <LogOut className="h-4 w-4 mr-2" />
  Wyloguj
</DropdownMenuItem>
```

Analogiczna zmiana w mobile menu -- dodanie linku "Moj profil" przed "Wyloguj".

---

## Lista plikow

| Plik | Operacja |
|------|----------|
| `src/pages/ProfilePage.tsx` | Nowy -- wrapper profilu per rola |
| `src/App.tsx` | Edycja -- trasa `/profile` |
| `src/components/layout/Header.tsx` | Edycja -- "Moj profil" w dropdown desktop + mobile |
| `src/pages/admin/AdminDashboard.tsx` | Edycja -- sidebar z grupami zamiast tabow |
| `src/pages/moderator/ModeratorDashboard.tsx` | Edycja -- sidebar z grupami zamiast tabow |
| `src/pages/organizer/OrganizerDashboard.tsx` | Edycja -- usunac tab "Profil" |
| `src/pages/participant/ParticipantDashboard.tsx` | Edycja -- usunac tab "Profil" |
