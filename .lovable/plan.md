
# Pelnostronicowa edycja zamowien i wyzwan + przeglad modali

## Podsumowanie

Trzy glowne zmiany:
1. **Zamowienia** — edycja na osobnej stronie z operacjami sklepowymi (zwroty, wymiany, korekty)
2. **Wyzwania** — edycja/tworzenie na osobnej stronie zamiast modalu
3. **Partnerzy** — edycja na osobnej stronie zamiast modalu
4. **Przeglad i poprawki UX** w pozostalych formularzach

---

## 1. Edycja zamowienia na pelnej stronie

### Nowa strona: `AdminOrderEditPage.tsx`

**Route:** `/admin/orders/:id/edit`

Pelnostronicowy widok zamowienia z nastepujacymi sekcjami:

**A) Naglowek**
- Przycisk "Powrot do zamowien" (wraca do `/admin` z aktywna zakladka orders)
- Numer zamowienia + data + aktualny status (Badge)

**B) Dane klienta i dostawy** (read-only, w kartach)
- Klient (imie, email)
- Adres dostawy (ulica, miasto, kod, telefon, paczkomat)
- Dane do faktury (jesli sa)
- Notatki klienta

**C) Produkty w zamowieniu** (edytowalna tabela)
- Kazdy wiersz: nazwa, rozmiar, kolor, ilosc (edytowalna), cena jednostkowa, suma
- Przycisk usuwania pozycji (np. produkt niedostepny)
- Mozliwosc dodania nowej pozycji (zamiana produktu)
- Automatyczne przeliczanie sumy

**D) Operacje sklepowe** (nowa sekcja)
- **Zmiana statusu** — Select z opcjami: Oczekujace, Oplacone, Wysłane, Dostarczone, Anulowane + nowy status `refunded` (Zwrocone)
- **Numer przesylki** — Input
- **Notatka admina** — Textarea (wewnetrzna notatka, np. "Klient prosil o zamiane rozmiaru")
- **Powod anulowania/zwrotu** — widoczny gdy status = cancelled lub refunded

**E) Podsumowanie finansowe**
- Produkty (przeliczone po edycji)
- Dostawa
- Doplata za platnosc
- Korekta reczna (Input number, np. -20 zl za reklamacje)
- SUMA (przeliczona)

**F) Historia zmian** (przyszlosciowo, na razie placeholder)

### Zmiany w typach

```text
ShopOrder.status: dodac 'refunded'
ShopOrder.adminNotes?: string
ShopOrder.cancelReason?: string
ShopOrder.priceAdjustment?: number
```

### Zmiany w AdminOrdersTab

- Usunac Dialog szczegolow zamowienia (linie 284-389)
- Przycisk Eye/Pencil kieruje do `/admin/orders/:id/edit`
- Lista zamowien zostaje bez zmian (filtry, sortowanie, eksport)

---

## 2. Edycja wyzwan na pelnej stronie

### Nowa strona: `AdminChallengeEditPage.tsx`

**Route:** `/admin/challenges/new` i `/admin/challenges/:id/edit`

Przeniesienie ChallengeFormDialog (linie 61-242) na pelna strone:

**A) Naglowek**
- "Powrot do wyzwan"
- Tytul: "Nowe wyzwanie" lub "Edytuj: {nazwa}"

**B) Formularz** (rozlozony na pelna szerokosc, dwukolumnowy layout)
- **Podstawowe**: nazwa, slug, opis (Textarea), URL obrazka
- **Seria i daty**: powiazanie z seria + przycisk "Zaladuj biegi", data startu/konca
- **Regula**: min. biegow do zaliczenia, limit czasu
- **Wydarzenia**: tabela z nazwa biegu i data, dodawanie/usuwanie
- **Nagrody**: karty z nazwa, typ (darmowa/platna), cena, rozmiary, opis

**C) Walidacja**
- Nazwa wymagana (min 3 znaki)
- Slug auto-generowany, ale edytowalny
- Min. biegow >= 1
- Data konca >= data startu
- Nagroda musi miec nazwe

### Zmiany w AdminChallengesTab

- Usunac ChallengeFormDialog (linie 61-242)
- Przycisk "Nowe wyzwanie" linkuje do `/admin/challenges/new`
- Przycisk edycji (olowek) linkuje do `/admin/challenges/:id/edit`

---

## 3. Partnerzy — edycja na osobnej stronie

### Nowa strona: `AdminPartnerEditPage.tsx`

**Route:** `/admin/partners/new` i `/admin/partners/:id/edit`

Prosty formularz (4 pola) rozlozony na pelna strone:
- Nazwa partnera (wymagana)
- URL logotypu (wymagany, walidacja URL)
- Strona internetowa (opcjonalna, walidacja URL)
- Wyswietlaj na stronie glownej (Switch)
- Podglad logotypu (jesli URL podany)

### Zmiany w AdminPartnersTab

- Usunac oba Dialogi (dodawanie i edycja)
- Przycisk "Dodaj partnera" linkuje do `/admin/partners/new`
- Przycisk "Edytuj" linkuje do `/admin/partners/:id/edit`

---

## 4. Przeglad UX i walidacji

Formularze ktore pozostaja w modalach (bo sa male/kontekstowe i to jest OK):
- **DiscountCodesEditor** — inline w EventForm, krotki formularz, modal jest uzasadniony
- **MerchandiseEditor** — inline w EventForm, j.w.
- **UsersOrganizersTab** — "Dodaj organizatora" to wyszukiwanie + nadanie roli, modal pasuje
- **Role/Block/Delete dialogi** — to potwierdzenia akcji, modal jest poprawny

Poprawki UX we wszystkich formularzach:
- Dodanie `required` i `aria-describedby` do wymaganych pol
- Czytelne komunikaty bledow po polsku (np. "Nazwa jest wymagana", "Podaj poprawny adres URL")
- Placeholder'y opisujace format (np. "https://example.com/logo.png")

---

## Szczegoly techniczne

### Nowe pliki

| Plik | Opis |
|---|---|
| `src/pages/admin/components/AdminOrderEditPage.tsx` | Pelnostronicowy edytor zamowienia |
| `src/pages/admin/components/AdminChallengeEditPage.tsx` | Pelnostronicowy edytor wyzwania |
| `src/pages/admin/components/AdminPartnerEditPage.tsx` | Pelnostronicowy edytor partnera |

### Zmiany w istniejacych plikach

| Plik | Zmiana |
|---|---|
| `src/types/index.ts` | Nowe pola w ShopOrder (refunded, adminNotes, cancelReason, priceAdjustment) |
| `src/pages/admin/components/AdminOrdersTab.tsx` | Usunac Dialog, dodac linki do strony edycji |
| `src/pages/admin/components/AdminChallengesTab.tsx` | Usunac ChallengeFormDialog, dodac linki |
| `src/pages/admin/components/AdminPartnersTab.tsx` | Usunac Dialogi, dodac linki |
| `src/App.tsx` | Nowe route: orders/:id/edit, challenges/new, challenges/:id/edit, partners/new, partners/:id/edit |

### Kolejnosc implementacji

1. Typy — rozszerzyc ShopOrder
2. AdminOrderEditPage — nowa strona
3. AdminChallengeEditPage — nowa strona
4. AdminPartnerEditPage — nowa strona
5. Aktualizacja AdminOrdersTab, AdminChallengesTab, AdminPartnersTab — usuniecie modali
6. App.tsx — nowe route
7. Przeglad walidacji i UX we wszystkich formularzach
