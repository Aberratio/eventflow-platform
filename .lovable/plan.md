
# Poprawki nawigacji, przycisk edycji i pasek preview

## Podsumowanie

Trzy obszary zmian:
1. **Back button** — wszedzie uzyc `navigate(-1)` zamiast hardcodowanych sciezek
2. **Przycisk edycji** na stronie wydarzenia dla admina/moderatora/organizatora
3. **Zolty pasek preview** pod headerem dla nieopublikowanych wydarzen (zamiana obecnego Alert na pelnej szerokosci pasek)

---

## 1. Back button — navigate(-1)

Wszystkie back buttony w aplikacji prowadza do hardcodowanych sciezek (np. `/admin`, `/organizer`). Zmiana na `navigate(-1)` aby zawsze wracac na strone, z ktorej uzytkownik przyszedl.

### Pliki do zmiany

| Plik | Obecne zachowanie | Nowe |
|---|---|---|
| `EventDetailsPage.tsx` (linie 416, 444) | `Link to="/events"` | `onClick={() => navigate(-1)}` |
| `EventRegistrationPage.tsx` (linia 91) | `Link to={/events/${slug}}` | `onClick={() => navigate(-1)}` |
| `EventManage.tsx` (linia 55) | `navigate(backPath)` | `navigate(-1)` |
| `AdminEventManage.tsx` (linia 71) | `Link to="/admin"` | `onClick={() => navigate(-1)}` |
| `AdminOrderEditPage.tsx` (linia 143) | `navigate('/admin')` | `navigate(-1)` |
| `AdminChallengeEditPage.tsx` (linia 166) | `navigate('/admin')` | `navigate(-1)` |
| `AdminPartnerEditPage.tsx` (linia 81) | `navigate('/admin')` | `navigate(-1)` |
| `AdminProductEditPage.tsx` (linia 68) | `navigate('/admin')` | `navigate(-1)` |
| `OrganizerEventsPage.tsx` (linia 61) | `navigate('/organizer')` | `navigate(-1)` |
| `EventForm.tsx` (linia 319) | `navigate('/organizer')` | `navigate(-1)` |
| `PageEditorPage.tsx` (linia 187) | `navigate('/admin?tab=pages')` | `navigate(-1)` |

Fallback buttony w stanach bledow (np. "Wydarzenie nie znalezione") zostaja bez zmian — tam hardcodowane sciezki sa poprawne.

---

## 2. Przycisk edycji na stronie wydarzenia

Na stronie `EventDetailsPage.tsx`, w sidebarze (obok przycisku "Udostepnij"), dodac przycisk "Edytuj wydarzenie" widoczny tylko dla:
- Admina
- Moderatora
- Organizatora tego wydarzenia (`event.organizerId === user.id`)

Przycisk prowadzi do:
- Admin: `/admin/events/{event.id}`
- Moderator: `/moderator/events/{event.id}`
- Organizator: `/organizer/events/{event.id}`

Umieszczenie: w sidebarze, po sekcji z przyciskiem "Udostepnij", w osobnym `div` z `border-t`.

---

## 3. Zolty pasek preview pod headerem

Obecny `DraftBanner` to Alert wewnatrz kontenera. Zmiana na pelnej szerokosci zolty pasek pod headerem (przed banerem wydarzenia):

- Styl: `bg-warning text-warning-foreground` pelna szerokosc, kompaktowy (py-2)
- Tresc:
  - Szkic: "Podglad — wydarzenie nie jest widoczne publicznie"
  - Oczekuje na akceptacje: "Podglad — wydarzenie oczekuje na akceptacje"
  - Odrzucone: "Podglad — wydarzenie zostalo odrzucone" + powod
- Ikona po lewej (Eye), przycisk "Edytuj" po prawej (prowadzi do trybu edycji jak w pkt 2)
- Przyciski "Zatwierdz" i "Odrzuc" dla admina/moderatora przy statusie `awaiting_approval`

---

## Szczegoly techniczne

### Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/pages/EventDetailsPage.tsx` | DraftBanner na pelny pasek, back button na navigate(-1), przycisk edycji w sidebar |
| `src/pages/EventRegistrationPage.tsx` | Back button navigate(-1) |
| `src/pages/organizer/EventManage.tsx` | Back button navigate(-1) |
| `src/pages/organizer/EventForm.tsx` | Back button navigate(-1) |
| `src/pages/organizer/OrganizerEventsPage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/AdminEventManage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/AdminOrderEditPage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/AdminChallengeEditPage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/AdminPartnerEditPage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/AdminProductEditPage.tsx` | Back button navigate(-1) |
| `src/pages/admin/components/PageEditorPage.tsx` | Back button navigate(-1) |

### Kolejnosc implementacji

1. EventDetailsPage — DraftBanner, back button, przycisk edycji
2. Pozostale strony — back button navigate(-1)
