

# Reorganizacja dropdown menu uczestnika w nawigacji

## Obecny stan

Dropdown po kliknieciu w avatar uczestnika:
1. Panel --> /participant
2. Moje zawody --> /participant?tab=registrations (problematyczny link)
3. Moj profil --> /profile
4. Wyloguj

"Moje zawody" kieruje na zakladke "Moje starty" w dashboardzie, ale uzytkownik nie odczuwa tego jako dzialajacy link (jest juz na /participant, wiec klik nie daje widocznego efektu).

## Proponowana struktura

```
+-----------------------------------+
| Pulpit                    (ikona) |  --> /participant
| Nadchodzace starty        (ikona) |  --> /participant?tab=registrations
| Archiwum startow          (ikona) |  --> /participant?tab=history
| Zamowienia                (ikona) |  --> /participant?tab=orders
|-----------------------------------|
| Moj profil                (ikona) |  --> /profile
|-----------------------------------|
| Wyloguj                   (ikona) |
+-----------------------------------+
```

### Uzasadnienie:

- **Pulpit** -- zostaje, to glowny punkt wejscia do dashboardu (zakladka overview)
- **Nadchodzace starty** -- zastepuje "Moje zawody", kieruje na zakladke registrations (przyszle zapisy)
- **Archiwum startow** -- nowy skrot do zakladki history (przeszle wyniki i certyfikaty)
- **Zamowienia** -- nowy skrot do zakladki orders (zamowienia ze sklepu)
- **Moj profil** i **Wyloguj** -- bez zmian

Pozostale zakladki (Bilety, Rekordy, Wyzwania, Wiadomosci) sa dostepne z poziomu dashboardu -- nie trzeba ich wszystkich ladowac do dropdown, bo byloby za duzo opcji.

## Zmiany techniczne

### Plik: `src/components/layout/Header.tsx`

Zastapienie bloku "Moje zawody" (linie 183-194) trzema nowymi pozycjami:

1. **Nadchodzace starty** (ikona: `Calendar`) --> nawigacja do `/participant?tab=registrations` z wymuszeniem ustawienia aktywnej zakladki
2. **Archiwum startow** (ikona: `History`) --> nawigacja do `/participant?tab=history`
3. **Zamowienia** (ikona: `Package`) --> nawigacja do `/participant?tab=orders`

Kazdy link bedzie:
- Jesli uzytkownik juz jest na `/participant`, ustawiac parametr `tab` w URL i wymuszac zmiane zakladki
- Jesli uzytkownik jest na innej stronie, nawigowac do `/participant?tab=...`

Dodatkowe importy: `History`, `Package` z `lucide-react`.

### Plik: `src/pages/participant/ParticipantDashboard.tsx`

Drobna zmiana -- synchronizacja `activeTab` z parametrem URL `tab` przy zmianie `searchParams`, aby klikniecie z dropdown faktycznie przelaczalo zakladke nawet gdy uzytkownik jest juz na `/participant`. Wymaga dodania `useEffect` sledzacego zmiany `searchParams`.

