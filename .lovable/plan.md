

# Podglad zawodow draft + pelna edycja dla adminow i moderatorow

## Cel

1. **Podglad draft** — admini, moderatorzy i organizator danego wydarzenia moga ogladac strone wydarzenia w statusie `draft` lub `awaiting_approval`. Inni uzytkownicy widza 404.
2. **Latwy dostep z moderacji** — w kartach moderacji (AdminModerationTab, ModeratorModerationTab) dodac przycisk "Podglad wydarzenia" linkujacy do `/events/{slug}` oraz "Zarzadzaj" linkujacy do pelnego edytora.
3. **Pelna edycja** — admini i moderatorzy maja dostep do EventManage (ten sam co organizator) dla dowolnego wydarzenia — przez route `/admin/events/:id` i nowy `/moderator/events/:id`.

## Co sie zmieni

### 1. EventDetailsPage — dostep do draft/awaiting_approval

**Plik:** `src/pages/EventDetailsPage.tsx`

Obecnie strona filtruje eventy tylko po `slug` i nie sprawdza statusu — ale publiczna lista EventsPage filtruje do `published`/`completed`. Problem: jesli ktos ma link do draftu, widzi go.

Zmiany:
- Po znalezieniu eventu po slug, sprawdz jego `status`
- Jesli status to `draft`, `awaiting_approval` lub `rejected`:
  - Sprawdz czy zalogowany user to admin, moderator, lub organizator tego wydarzenia (`event.organizerId === user?.id`)
  - Jesli nie — pokaz "Wydarzenie nie zostalo znalezione" (jak teraz przy braku eventu)
  - Jesli tak — pokaz wydarzenie z banerem informacyjnym na gorze (np. "To wydarzenie jest w trybie roboczym i nie jest widoczne publicznie")
- Baner bedzie mial rozne warianty:
  - `draft`: "Szkic — wydarzenie nie jest widoczne publicznie"
  - `awaiting_approval`: "Oczekuje na akceptacje — wydarzenie nie jest jeszcze opublikowane"
  - `rejected`: "Odrzucone — wydarzenie wymaga poprawek" + powod odrzucenia

### 2. AdminModerationTab — przyciski podgladu i zarzadzania

**Plik:** `src/pages/admin/components/AdminModerationTab.tsx`

W kazdej karcie wydarzenia oczekujacego dodac:
- Przycisk **"Podglad"** — link do `/events/{event.slug}` (otwiera strone wydarzenia w trybie podgladu)
- Przycisk **"Zarzadzaj"** — link do `/admin/events/{event.id}` (otwiera pelny edytor EventManage)

W dialogu szczegolow rowniez dodac link "Otworz pelny podglad" i "Zarzadzaj wydarzeniem".

### 3. ModeratorModerationTab — przyciski podgladu i zarzadzania

**Plik:** `src/pages/moderator/components/ModeratorModerationTab.tsx`

Analogiczne zmiany jak w AdminModerationTab:
- Przycisk "Podglad" -> `/events/{event.slug}`
- Przycisk "Zarzadzaj" -> `/moderator/events/{event.id}`

### 4. Nowy route dla moderatora — zarzadzanie wydarzeniem

**Plik:** `src/App.tsx`

Dodac route:
```
<Route path="/moderator/events/:id" element={<EventManage />} />
```

### 5. EventManage — obsluga wielu rol

**Plik:** `src/pages/organizer/EventManage.tsx`

Zmiany:
- Zamiast hardkodowanego "Powrot do panelu" -> `/organizer`, dynamicznie ustalac sciezke powrotu na podstawie roli zalogowanego usera:
  - admin -> `/admin`
  - moderator -> `/moderator`
  - organizer -> `/organizer`
- Sprawdzic dostep: user musi byc adminem, moderatorem, lub organizatorem tego wydarzenia. Jesli nie — przekierowanie na 403.

### 6. EventsPage — bez zmian

Lista wydarzen dalej filtruje do `published`/`completed` — drafty nie pojawiaja sie na liscie publicznej. Dostep tylko przez bezposredni link.

## Szczegoly techniczne

### Logika dostepu do draftu

```text
canViewDraft(event, user) =
  user.role === 'admin' ||
  user.role === 'moderator' ||
  (user.role === 'organizer' && event.organizerId === user.id)
```

### Logika dostepu do EventManage

```text
canManageEvent(event, user) =
  user.role === 'admin' ||
  user.role === 'moderator' ||
  (user.role === 'organizer' && event.organizerId === user.id)
```

### Baner statusu draft (EventDetailsPage)

Komponent `DraftBanner` wyswietlany nad trescia wydarzenia:
- Zolte tlo dla `draft` i `awaiting_approval`
- Czerwone tlo dla `rejected`
- Zawiera tekst statusu i opcjonalnie powod odrzucenia
- Dla admina/moderatora: dodatkowe przyciski "Zatwierdz" / "Odrzuc" gdy status = `awaiting_approval`

### Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/pages/EventDetailsPage.tsx` | Kontrola dostepu do draftow + baner statusu |
| `src/pages/admin/components/AdminModerationTab.tsx` | Przyciski "Podglad" i "Zarzadzaj" |
| `src/pages/moderator/components/ModeratorModerationTab.tsx` | Przyciski "Podglad" i "Zarzadzaj" |
| `src/pages/organizer/EventManage.tsx` | Dynamiczny powrot + kontrola dostepu wielorolowego |
| `src/App.tsx` | Nowy route `/moderator/events/:id` |

### Kolejnosc implementacji

1. `EventDetailsPage.tsx` — kontrola dostepu + baner
2. `EventManage.tsx` — wielorolowy dostep i dynamiczny powrot
3. `App.tsx` — nowy route moderatora
4. `AdminModerationTab.tsx` — przyciski podgladu/zarzadzania
5. `ModeratorModerationTab.tsx` — przyciski podgladu/zarzadzania

