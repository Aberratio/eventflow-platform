# Scenariusze manualne: wydarzenia

> English summary: manual test scenarios (Polish text) for the whole event flow from the organizer, admin, moderator and participant perspectives. Demo accounts get their password from the `SEED_DEMO_PASSWORD` server setting.

Zakres: pelny przeplyw wydarzen z perspektywy organizatora, admina, moderatora i uczestnika. Testuj na danych demo oraz na nowo utworzonym wydarzeniu. Role demo: organizator `marek@timing.pl`, moderator `monika@zmierzymyczas.pl`, uczestnik `jan@example.com`; haslo kont demo jest ustawiane przez `SEED_DEMO_PASSWORD` w `.env` serwera (patrz `bin/seed.php` w `eventflow-server`); bez tej zmiennej konta demo nie maja uzywalnego hasla.

## 1. Organizator - tworzenie szkicu

1. Wejdz na `/login`, zaloguj sie jako organizator.
2. Wejdz w `/organizer/events/new`.
3. Kliknij `Dalej` na pustym formularzu.
4. Oczekiwane: komunikat walidacji, pozostajesz na kroku 1.
5. Uzupelnij minimum: nazwa, data wydarzenia, termin rejestracji, lokalizacja, miasto.
6. Edge cases kroku 1:
   - termin rejestracji pozniejszy niz data wydarzenia: blokada przejscia dalej;
   - wydarzenie wirtualne bez dat start/end: blokada;
   - wydarzenie wirtualne ze startDate > endDate: blokada;
   - platnosc przelewem bez numeru konta lub wlasciciela: blokada;
   - prywatne wydarzenie bez kodu dostepu: blokada;
   - puste lub bardzo dlugie opisy/URL-e: brak crasha, tresc nie nachodzi na layout.
7. Przejdz na krok dystansow.
8. Kliknij `Dalej` bez dystansu.
9. Oczekiwane: komunikat, wymagany co najmniej jeden dystans.
10. Dodaj dystans i sprawdz edge cases:
    - pusta nazwa/dlugosc/cena: blokada;
    - dlugosc `0` lub ujemna: blokada;
    - cena ujemna: blokada;
    - limit `0` lub ujemny: blokada;
    - limit pusty: dozwolony jako brak limitu;
    - wiele dystansow, usuniecie dystansu, przelaczenie jednostki km/m;
    - wylaczanie kategorii dla jednego dystansu nie powinno wylaczac ich globalnie.
11. Przejdz do podsumowania.
12. Kliknij `Utworz wydarzenie`.
13. Oczekiwane: wydarzenie zapisane jako `Szkic`, widoczne tylko w panelu organizatora, niewidoczne na publicznej liscie `/events`.

## 2. Organizator - edycja i poprawki

1. Otworz szkic w `/organizer/events/:id`.
2. Wejdz w `Ustawienia` i kliknij `Edytuj wydarzenie`.
3. Zmien podstawowe dane, dystans, kategorie, platnosci, prywatnosc, embed i opcje formularza.
4. Zapisz zmiany.
5. Oczekiwane: status nadal `Szkic`, zmiany widoczne w podgladzie.
6. Dla odrzuconego wydarzenia sprawdz, czy powod odrzucenia jest widoczny i czy po edycji mozna ponownie oddac do sprawdzenia.

## 3. Organizator - oddanie do sprawdzenia

1. Otworz szkic, np. `/organizer/events/e19?tab=settings`.
2. Kliknij `Oddaj do sprawdzenia`.
3. Oczekiwane: status `Do sprawdzenia`, brak przycisku publikacji, wydarzenie nadal niewidoczne publicznie poza uprawnionym podgladem.
4. Edge cases:
   - ponowne oddanie wydarzenia juz oczekujacego: akcja niedostepna lub zwraca blad;
   - edycja wydarzenia oczekujacego: sprawdz, czy system zachowuje status zgodnie z oczekiwanym modelem biznesowym;
   - podglad `/events/:slug/preview` dziala tylko dla organizatora wlasciciela, admina i moderatora.

## 4. Moderator/admin - moderacja

1. Zaloguj sie jako moderator lub admin.
2. Wejdz w zakladke `Moderacja`.
3. Otworz podglad wydarzenia oczekujacego.
4. Oczekiwane: podglad szkicu jest dostepny, publiczna strona bez preview nie powinna ujawniac nieopublikowanego wydarzenia.
5. Kliknij `Zatwierdz`.
6. Oczekiwane: status zmienia sie na `Zatwierdzone`, wydarzenie znika z listy `Do sprawdzenia`, organizator moze je opublikowac.
7. Powtorz dla odrzucenia:
   - kliknij `Odeslij`/`Odrzuc`;
   - wpisz komentarz;
   - anuluj prompt lub zostaw pusty komentarz: brak zmiany statusu;
   - zatwierdz komentarz: status wraca do `Szkic`, powod odrzucenia jest zapisany i widoczny dla organizatora.
8. Edge cases:
   - zatwierdzanie szkicu: niedozwolone;
   - odrzucanie szkicu/zatwierdzonego/opublikowanego: niedozwolone;
   - moderator ma podglad i moderacje, ale nie powinien miec pelnych uprawnien superadmina.

## 5. Organizator - publikowanie

1. Zaloguj sie jako organizator.
2. Otworz zatwierdzone wydarzenie, np. `/organizer/events/e21?tab=settings`.
3. Kliknij `Opublikuj`.
4. Oczekiwane: status `Aktywne`/`Opublikowane`, wydarzenie pojawia sie na `/events` i `/wydarzenia`, strona `/events/:slug` jest publiczna.
5. Edge cases:
   - publikacja szkicu: niedozwolona;
   - publikacja wydarzenia oczekujacego: niedozwolona;
   - ponowna publikacja aktywnego wydarzenia: akcja niedostepna lub blad;
   - wydarzenie prywatne po publikacji nie pojawia sie na publicznych listach, ale dziala z linkiem/kodem.

## 6. Organizator - po publikacji

1. Sprawdz zakladki zarzadzania: przeglad, uczestnicy, wyniki/weryfikacja, kody rabatowe, emaile, ustawienia.
2. Edge cases:
   - wydarzenie z zapisami nie moze byc usuniete;
   - przeszle wydarzenie mozna archiwizowac;
   - nadchodzace wydarzenie bez zapisow mozna usunac;
   - wydarzenie z platnoscia przelewem pokazuje dane do przelewu i wymaga recznego potwierdzania platnosci;
   - wydarzenie wirtualne pokazuje weryfikacje wynikow zamiast klasycznych wynikow.

## 7. Uczestnik - przegladanie wydarzen

1. Wejdz na `/events` i `/wydarzenia`.
2. Sprawdz filtrowanie po roku, miescie, dyscyplinie, statusie zapisow, typie wydarzenia i dystansie.
3. Otworz aktywne wydarzenie.
4. Oczekiwane: widoczne szczegoly, dystanse, status zapisow, przycisk zapisu jesli zapisy sa otwarte.
5. Edge cases:
   - szkic/oczekujace/zatwierdzone niewidoczne publicznie;
   - wydarzenie prywatne niewidoczne na listach;
   - wydarzenie przeszle pokazuje wyniki lub zamkniete zapisy;
   - wydarzenie wyprzedane pokazuje brak miejsc;
   - wydarzenie bez zapisow nie prowadzi do formularza.

## 8. Uczestnik - zapis na wydarzenie

1. Zaloguj sie jako uczestnik.
2. Wejdz w aktywne wydarzenie z otwartymi zapisami, np. `/events/triathlon-mazury-2026/register`.
3. Wybierz dystans.
4. Przejdz przez dane, druzyne, ubezpieczenie, gadzety, rabat i podsumowanie, zaleznie od konfiguracji wydarzenia.
5. Przed akceptacja regulaminu przycisk finalny ma byc nieaktywny.
6. Zaakceptuj wymagane zgody i wyslij zapis.
7. Oczekiwane: strona sukcesu, poprawna kwota, dystans, kategoria i instrukcje platnosci.
8. Edge cases:
   - niezalogowany uczestnik przekierowany do logowania;
   - brak wybranego dystansu: nie mozna przejsc dalej;
   - dystans pelny: opcja disabled i brak przejscia;
   - brak daty urodzenia/plci/profilu: formularz wymaga uzupelnienia danych;
   - wymagane pole VIP bez wartosci: blokada;
   - nieprawidlowy kod rabatowy: komunikat bledu, brak zmiany ceny;
   - poprawny kod rabatowy: cena obnizona;
   - ubezpieczenie niedostepne wiekowo: brak doliczenia;
   - platnosc przelewem pokazuje numer konta, odbiorce, tytul i kwote;
   - bramka platnicza pokazuje automatyczna platnosc;
   - direct access do `/register/success` bez state pokazuje brak danych rejestracji.

## 9. Uprawnienia i bezpieczenstwo

1. Uczestnik nie moze wejsc do `/organizer`, `/moderator`, `/admin`.
2. Organizator nie moze zarzadzac cudzym wydarzeniem.
3. Moderator moze podgladac i moderowac wydarzenia, ale nie powinien miec funkcji superadmina.
4. Admin moze moderowac, przegladac i zarzadzac wydarzeniami.
5. Anonimowy uzytkownik nie moze otworzyc podgladu szkicu ani formularza zapisu szkicu.

## 10. Checklist regresji

- Publiczne listy pokazuja tylko `active`, `past`, `archived` i nieprywatne.
- `draft`, `awaiting_approval`, `approved` sa dostepne tylko w panelach i preview dla uprawnionych.
- Kazda zmiana statusu odswieza panel, liste wydarzen i szczegoly.
- Komunikaty bledow sa widoczne i nie znikaja za szybko przy manualnym testowaniu.
- Widoki mobilne nie ucinaja tekstow w kartach, badge'ach, przyciskach i formularzach.
