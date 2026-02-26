
# Edycja produktow na pelnej stronie + podglad + zakladka Zamowienia

## Cel

1. **Edycja produktow na pelnej stronie** — zamiast modalu, edycja/dodawanie produktu otwiera dedykowana strone `/admin/shop/products/:id/edit` (i `/admin/shop/products/new`).
2. **Podglad produktu** — przycisk "Podglad" otwiera strone produktu tak jak ja widzi uzytkownik (`/shop/:slug`) w nowej karcie.
3. **Zakladka "Zamowienia" w sidebarze** — osobna pozycja w kategorii "Sklep" z pelnym widokiem zamowien: filtrowanie, sortowanie, eksport do CSV/XML.

## Co sie zmieni

### 1. Nowa strona: AdminProductEditPage

**Nowy plik:** `src/pages/admin/components/AdminProductEditPage.tsx`

Pelnostronicowy edytor produktu (przeniesiony z obecnego modalu w AdminShopTab):
- Naglowek z przyciskiem "Powrot do produktow" (`/admin` -> sekcja shop)
- Przycisk "Podglad w sklepie" otwierajacy `/shop/{slug}` w nowej karcie
- Formularz identyczny jak obecny modal, ale rozlozony na pelna szerokosc strony (wygodniejszy layout)
- Zapis przekierowuje z powrotem do listy produktow

### 2. Nowe route w App.tsx

```text
/admin/shop/products/new     -> AdminProductEditPage (tryb tworzenia)
/admin/shop/products/:id/edit -> AdminProductEditPage (tryb edycji)
```

### 3. Zmiany w AdminShopTab

- Usunac caly modal edycji produktu (Dialog) — ok. 350 linii kodu
- Usunac zwiazany state (`isProductDialogOpen`, `editingProduct`, `productForm`, `newSize`, `newColorName` itd.)
- Przycisk "Dodaj produkt" linkuje do `/admin/shop/products/new`
- Przycisk "Edytuj" (olowek) w tabeli linkuje do `/admin/shop/products/{id}/edit`
- Przycisk "Podglad" (oko) linkuje do `/shop/{slug}` (target=_blank)
- Usunac zakladke "Zamowienia" z Tabs (przeniesiona do osobnej sekcji w sidebarze)
- Zakladka zostaje z "Produkty" i "Kategorie"

### 4. Nowa zakladka "Zamowienia" w sidebarze AdminDashboard

**Plik:** `src/pages/admin/AdminDashboard.tsx`

W grupie "Sklep" dodac nowa pozycje:
```text
{ id: 'orders', label: 'Zamowienia', icon: ShoppingCart }
```

Renderowanie: `case 'orders': return <AdminOrdersTab />`

### 5. Nowy komponent: AdminOrdersTab

**Nowy plik:** `src/pages/admin/components/AdminOrdersTab.tsx`

Dedykowany widok zamowien (przeniesiony i rozbudowany z AdminShopTab):
- Naglowek "Zamowienia" z licznikami (wszystkie, oczekujace, oplacone)
- **Filtry**: szukaj (nr zamowienia, klient), status, zakres dat (od-do)
- **Sortowanie**: klikalne naglowki kolumn (data, kwota, status) z ikonami kierunku
- **Tabela**: nr zamowienia, klient (imie + email), data, produkty (skrocona lista), kwota, status, akcje
- **Dialog szczegolow** zamowienia (przeniesiony z AdminShopTab — bez zmian)
- **Eksport**:
  - Przycisk z DropdownMenu: "Eksportuj CSV" i "Eksportuj XML"
  - CSV: wykorzystuje istniejacy `exportToCSV` z `src/lib/exportUtils.ts`
  - XML: nowa funkcja `exportToXML` w `src/lib/exportUtils.ts`

### 6. Nowa funkcja exportToXML w exportUtils.ts

**Plik:** `src/lib/exportUtils.ts`

```text
exportToXML(data, rootName, itemName, filename)
```

Generuje plik XML:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <order>
    <orderNumber>ORD-001</orderNumber>
    <customer>Jan Kowalski</customer>
    <date>2026-01-15</date>
    <totalPrice>149.99</totalPrice>
    <status>paid</status>
    <items>
      <item>
        <name>Koszulka</name>
        <quantity>2</quantity>
        <price>49.99</price>
      </item>
    </items>
  </order>
</orders>
```

## Szczegoly techniczne

### Pliki do zmiany/utworzenia

| Plik | Zmiana |
|---|---|
| `src/pages/admin/components/AdminProductEditPage.tsx` | NOWY — pelnostronicowy edytor produktu |
| `src/pages/admin/components/AdminOrdersTab.tsx` | NOWY — dedykowana zakladka zamowien |
| `src/pages/admin/components/AdminShopTab.tsx` | Usunac modal edycji, usunac tab zamowien, dodac linki |
| `src/pages/admin/AdminDashboard.tsx` | Dodac "Zamowienia" do sidebar + renderContent |
| `src/App.tsx` | Nowe route: `/admin/shop/products/new` i `/admin/shop/products/:id/edit` |
| `src/lib/exportUtils.ts` | Nowa funkcja `exportToXML` |

### Kolejnosc implementacji

1. `exportUtils.ts` — dodac `exportToXML`
2. `AdminProductEditPage.tsx` — nowa strona edycji produktu
3. `AdminOrdersTab.tsx` — nowa zakladka zamowien z filtrami, sortowaniem i eksportem
4. `AdminShopTab.tsx` — usunac modal i tab zamowien, dodac linki do nowej strony
5. `AdminDashboard.tsx` — dodac "Zamowienia" do sidebara
6. `App.tsx` — nowe route
