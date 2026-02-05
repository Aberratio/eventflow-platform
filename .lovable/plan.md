
# Plan: Nowa rola "Moderator" (ograniczony admin dla pracowników)

## Koncepcja

Dodam nową rolę **"moderator"** (mini-admin) dla pracowników, którzy potrzebują dostępu do panelu administracyjnego, ale z ograniczonymi uprawnieniami. To zapobiegnie przypadkowym uszkodzeniom danych lub zmianom krytycznych ustawień.

## Podział ról

| Funkcjonalność | Super Admin | Moderator |
|----------------|:-----------:|:---------:|
| **Pulpit (Overview)** | Pełny | Ograniczony (bez przychodów) |
| **Moderacja wydarzeń** | Tak | Tak |
| **Uczestnicy (lista)** | Tak | Tylko podgląd |
| **Uczestnicy (edycja/blokada)** | Tak | Nie |
| **Organizatorzy (lista)** | Tak | Tylko podgląd |
| **Organizatorzy (edycja)** | Tak | Nie |
| **Wydarzenia** | Tak | Tylko podgląd |
| **Sklep - Produkty** | Tak | Nie |
| **Sklep - Zamówienia** | Tak | Tylko zmiana statusu |
| **Partnerzy** | Tak | Nie |
| **Strony CMS** | Tak | Nie |
| **Profil własny** | Tak | Tak (bez ustawień bezpieczeństwa) |

## Co Moderator MOŻE robić:
- Przeglądać pulpit (bez danych finansowych)
- Moderować wydarzenia (zatwierdzać/odrzucać)
- Przeglądać listy użytkowników i organizatorów
- Przeglądać wydarzenia
- Aktualizować statusy zamówień w sklepie
- Edytować swój profil

## Czego Moderator NIE MOŻE robić:
- Blokować/usuwać użytkowników
- Edytować organizatorów
- Zarządzać produktami w sklepie
- Edytować partnerów i stron CMS
- Zmieniać ustawień bezpieczeństwa
- Widzieć danych finansowych (przychody)

## Zmiany techniczne

### 1. Rozszerzenie typu UserRole

```typescript
// src/types/index.ts
export type UserRole = 'participant' | 'organizer' | 'moderator' | 'admin';
```

### 2. Dodanie mockowego moderatora

```typescript
// src/data/mockData.ts
{ 
  id: 'm1', 
  name: 'Monika Moderator', 
  email: 'monika@sporttime.pl', 
  role: 'moderator', 
  phone: '+48 500 200 300' 
},
```

### 3. Aktualizacja strony logowania

Nowa karta z ikoną `UserCheck` i kolorem pomarańczowym:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Uczestnik  │  │ Organizator │  │  Moderator  │  │ Super Admin │        │
│   │     👤      │  │     💼      │  │     ✓      │  │     🛡️     │        │
│   │             │  │             │  │  (nowy!)    │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4. Nowy dashboard dla Moderatora

Stworzę dedykowany `ModeratorDashboard.tsx` z ograniczonymi zakładkami:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Panel Moderatora                                                            │
│ Witaj, Monika! (ograniczony dostęp)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Pulpit] [Moderacja] [Uczestnicy] [Organizatorzy] [Zamówienia] [Profil]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   • Pulpit: statystyki bez danych finansowych                              │
│   • Moderacja: zatwierdzanie/odrzucanie wydarzeń                           │
│   • Uczestnicy: tylko podgląd (bez akcji)                                  │
│   • Organizatorzy: tylko podgląd (bez akcji)                               │
│   • Zamówienia: zmiana statusów (bez cen)                                  │
│   • Profil: własne dane (bez bezpieczeństwa)                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Komponenty z ograniczeniami

Stworzę wersje "read-only" niektórych zakładek lub dodam prop `readOnly`:

```typescript
// Przykład - UsersParticipantsTab z ograniczeniami
interface Props {
  readOnly?: boolean;
}

// Gdy readOnly=true:
// - Brak przycisków "Zablokuj", "Usuń", "Resetuj hasło"
// - Tylko podgląd danych
```

### 6. Osobna zakładka zamówień dla moderatora

Moderator widzi zamówienia, ale:
- Bez szczegółów cenowych/finansowych
- Może tylko zmieniać statusy (np. "Wysłane", "Dostarczone")
- Nie może anulować ani modyfikować produktów

### 7. Pulpit bez danych finansowych

Dla moderatora:
- Ukryty wykres przychodów
- Ukryta karta "Najpopularniejsze produkty" (z kwotami)
- Widoczne: liczba wydarzeń, użytkowników, rejestracji, do moderacji

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | Dodanie `'moderator'` do `UserRole` |
| `src/data/mockData.ts` | Modyfikacja | Dodanie użytkownika moderatora |
| `src/pages/LoginPage.tsx` | Modyfikacja | Dodanie 4. karty logowania (Moderator) |
| `src/pages/moderator/ModeratorDashboard.tsx` | Nowy | Dashboard dla moderatora |
| `src/pages/moderator/components/ModeratorOverviewTab.tsx` | Nowy | Pulpit bez danych finansowych |
| `src/pages/moderator/components/ModeratorOrdersTab.tsx` | Nowy | Zamówienia (tylko statusy) |
| `src/pages/moderator/components/UsersReadOnlyTab.tsx` | Nowy | Uczestnicy/Organizatorzy bez akcji |
| `src/pages/moderator/components/ModeratorProfileTab.tsx` | Nowy | Profil bez bezpieczeństwa |
| `src/contexts/AuthContext.tsx` | Modyfikacja | Obsługa nowej roli |
| `src/components/layout/BottomNav.tsx` | Modyfikacja | Przekierowanie moderatora na `/moderator` |
| `src/App.tsx` | Modyfikacja | Dodanie tras `/moderator/*` |

## Wygląd strony logowania

Rozszerzę siatkę do 4 kolumn (lub 2x2 na mobile):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Zaloguj się do SportTime                                │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │   Uczestnik   │ │  Organizator  │ │   Moderator   │ │  Super Admin  │   │
│  │      👤       │ │      💼       │ │      ✓       │ │      🛡️      │   │
│  │               │ │               │ │   (mini-     │ │   (pełen      │   │
│  │  Przeglądaj   │ │ Twórz zawody  │ │    admin)    │ │   dostęp)     │   │
│  │   zawody      │ │  i wyniki     │ │              │ │               │   │
│  │               │ │               │ │  Moderuj     │ │  Wszystkie    │   │
│  │  [Zaloguj]    │ │  [Zaloguj]    │ │  wydarzenia  │ │  funkcje      │   │
│  │               │ │               │ │              │ │               │   │
│  └───────────────┘ └───────────────┘ │  [Zaloguj]   │ │  [Zaloguj]    │   │
│                                      └───────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Badge w dashboardzie

Moderator zobaczy badge informujący o ograniczeniach:

```tsx
<Badge variant="secondary" className="gap-1">
  <Lock className="h-3 w-3" />
  Dostęp ograniczony
</Badge>
```

## Bezpieczeństwo

- Moderator nie ma dostępu do ustawień bezpieczeństwa konta (2FA, hasła innych)
- Nie widzi przychodów ani danych finansowych
- Nie może modyfikować krytycznych danych (użytkownicy, produkty, strony)
- Może tylko wykonywać "bezpieczne" operacje (moderacja, statusy zamówień)
