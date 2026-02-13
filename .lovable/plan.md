

# Plan: Uproszczenie nawigacji (navbar)

## Problem
Navbar ma za duzo elementow: Strona Glowna, Wydarzenia, Wyniki (dropdown), Informacje (dropdown), Zawodnicy, Wyzwania, Sklep, ikona koszyka, powiadomienia, dropdown uzytkownika. Na desktopie jest ciasno, na mobile lista jest dluga.

## Zmiany

### 1. Usunac "Strona Glowna"
Klikniecie w logo SportTime juz prowadzi na strone glowna -- oddzielny link jest zbedny.

### 2. Usunac "Informacje" dropdown
Wszystkie linki informacyjne (Kontakt, Oferta, Ubezpieczenia, O nas) sa juz w footerze. Nie ma potrzeby duplikowac ich w navbarze.

### 3. Wciagnac "Zawodnicy" do dropdown "Wyniki"
Zawodnicy sa tematycznie powiazani z wynikami. Dropdown "Wyniki" bedzie mial:
- Kalendarz wynikow
- Na zywo
- Serie i cykle
- Zawodnicy (nowa pozycja, z separatorem)

### 4. Wynik koncowy

**Desktop navbar (po zmianach):**
```text
[Logo SportTime]   Wydarzenia   Wyniki▼   Wyzwania   Sklep   🛒   🔔   [User▼]
```

Z 8 pozycji tekstowych do 4 -- znacznie czytelniej.

**Mobile menu (po zmianach):**
```text
Wydarzenia
Wyniki (collapsible)
  - Kalendarz wynikow
  - Na zywo
  - Serie i cykle
  - Zawodnicy
Wyzwania
Sklep
Koszyk
───
Panel / Zaloguj
Moj profil
Wyloguj
```

Usuniety "Strona Glowna" (logo), "Informacje" (footer), "Zawodnicy" przeniesiony do "Wyniki".

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/components/layout/Header.tsx` | Usunac link "Strona Glowna", usunac dropdown "Informacje", przeniesc "Zawodnicy" do dropdown "Wyniki", usunac stan `infoOpen`. Desktop + mobile. |

## Szczegoly techniczne

### Desktop -- dropdown "Wyniki" po zmianach:
```text
┌─────────────────────┐
│ Kalendarz wynikow   │
│ 🔴 Na zywo          │
│ Serie i cykle       │
│ ─────────────────── │
│ Zawodnicy           │
└─────────────────────┘
```

### Usuniete elementy:
- Link `Strona Glowna` (linie 79-87)
- Caly dropdown `Informacje` (linie 129-152)
- Link `Zawodnicy` (linie 154-162)
- Stan `infoOpen` i import `Collapsible` (jesli nie uzywany przez "Wyniki" w mobile)
- W mobile: link "Strona Glowna", collapsible "Informacje", link "Zawodnicy"
- Dodanie "Zawodnicy" jako `DropdownMenuItem` w dropdown "Wyniki" (desktop) i w `CollapsibleContent` (mobile)

### Weryfikacja per rola
Zmiany dotycza tylko czesci publicznej nawigacji -- identycznej dla wszystkich rol. Dropdown uzytkownika (Panel, Moj profil, Wyloguj) pozostaje bez zmian dla kazdej roli.

