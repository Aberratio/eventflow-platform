

# Ceny VIP per kategoria (dystans) + UI poprawki + session storage

## Cel

Trzy zmiany w edytorze progow cenowych:

1. **Ceny VIP** — do kazdej kategorii (dystansu), niezaleznie od trybu date/participants, mozna dodac wiele cen specjalnych (VIP). Kazda ma nazwe, rabat od ceny bazowej, i opcjonalne pole dodatkowe (np. numer licencji niepelnosprawnego).
2. **Wizualne rozroznienie** — boxy z kategoriami (dystansami np. "Maraton 42km") maja zolty border, boxy progow cenowych maja bialy border.
3. **Session storage** — przy zmianie trybu progow (date/participants) poprzednia konfiguracja zapisuje sie w session storage i wraca gdy user zmieni tryb z powrotem.
4. **Info pod radio buttonami** — komunikat ze tylko jeden tryb moze byc aktywny.

## Kluczowa zmiana: VIP na kategorię, nie na próg

`vipPrices` jest w `Distance`, nie w `PriceTier`. Rabat VIP jest liczony od ceny bazowej dystansu, niezależnie od aktywnego progu cenowego.

