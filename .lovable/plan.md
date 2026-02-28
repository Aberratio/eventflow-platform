

# Zamkniete zapisy + automatyczne kategorie + przeglad flow rejestracji

## 1. Wyłączony przycisk "Zapisz się" gdy zapisy zamknięte

### EventDetailsPage.tsx (sidebar, linie 779-794)

Obecnie gdy zapisy zamknięte wyświetla się prosty tekst "Zapisy zamknięte". Zmiana:
- Przycisk "Zapisz się" pozostaje widoczny ale jest **wyłączony** (`disabled`)
- Pod przyciskiem wyświetla się komunikat z powodem:
  - "Zawody już się odbyły" — gdy `isPast`
  - "Termin zapisów minął (dd MMMM yyyy)" — gdy deadline minął
  - "Zapisy zamknięte przez organizatora" — gdy `registrationStatus === 'closed'`
  - "Wszystkie miejsca zajęte" — gdy wszystkie dystanse pełne

### EventRegistrationPage.tsx (linia 45-56)

Dodatkowe zabezpieczenie: gdy zapisy zamknięte, zamiast renderować formularz — przekierowanie z powrotem na stronę wydarzenia z toastem "Zapisy na te zawody są zamknięte".

---

## 2. Automatyczny wybór kategorii wiekowej

### RegistrationForm.tsx — Krok 2 (linie 627-733)

Zmiana logiki kategorii:
- **Kategorie wiekowe** — wybierane automatycznie na podstawie `user.birthYear` i `user.gender`. Użytkownik NIE widzi listy do wyboru — widzi tylko przypisaną kategorię (read-only).
- Jeśli profil niekompletny (brak `birthYear` lub `gender`), wtedy pokaz alert z info że trzeba uzupełnić profil i dopiero wtedy kategoria się przypisze.
- **Kategorie specjalne** — zostawione jako checkboxy do ręcznego wyboru (bez zmian).

Obecny kod już częściowo to robi (auto-assign z `setTimeout`), ale nadal pokazuje RadioGroup gdy nie ma matcha. Zmiana:
- Usunąć RadioGroup dla age categories — zawsze auto-assign
- Gdy brak matcha: wyświetlić komunikat "Nie znaleziono pasującej kategorii wiekowej dla Twoich danych (rok: X, płeć: Y). Sprawdź dane w profilu."
- `canProceed` dla step 2: wymaga tylko `birthYear` i `birthDay` i `birthMonth`. Kategoria wiekowa musi być automatycznie przypisana (lub brak kategorii wiekowych w wydarzeniu).

---

## 3. Przeglad calego flow rejestracji — brakujace elementy

Po przejrzeniu kodu EventDetailsPage i RegistrationForm zidentyfikowano:

### A) Brak informacji o ubezpieczeniu na stronie wydarzenia
Na stronie szczegółów wydarzenia (tab "Informacje") nie ma informacji o dostępności ubezpieczenia NNW. Dodać:
- Sekcja "Ubezpieczenie NNW dostępne" w tab "info" jeśli `event.insuranceOption?.enabled`

### B) Brak informacji o gadżetach na stronie wydarzenia
Jeśli wydarzenie ma `enableMerchandiseInRegistration && merchandise.length > 0`, dodać sekcję w tab "info":
- "Pakiet gadżetów" z listą dostępnych produktów i cenami

### C) Tab "Dystanse" — brakujące dane
Dystanse na stronie wydarzenia (linie 657-697) pokazują tylko `categories.join(', ')` — stary format. Powinny wyświetlać:
- Kategorie wiekowe (z `ageCategories`) zamiast starych string categories
- Progi cenowe (price tiers) jeśli są
- Info o VIP cenach jeśli są

### D) Walidacja VIP custom field
W step 1, jeśli wybrano VIP z `customFieldRequired === true`, `canProceed` nie sprawdza czy `vipCustomFieldValue` jest wypełnione. Dodać walidację.

### E) Zabezpieczenie przed zapisem na pełny dystans
W `handleSubmit` — dodać sprawdzenie czy wybrany dystans nie jest pełny (limit osiągnięty) w momencie wysyłki.

---

## Szczegoly techniczne

### Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `src/pages/EventDetailsPage.tsx` | Sidebar: disabled button z powodami, sekcje ubezpieczenia i gadżetów w info tab, dystanse z ageCategories i price tiers |
| `src/pages/EventRegistrationPage.tsx` | Redirect gdy zapisy zamknięte |
| `src/components/registration/RegistrationForm.tsx` | Auto-assign kategorii (usunięcie RadioGroup), walidacja VIP field, sprawdzenie pełności dystansu |

### Kolejnosc implementacji

1. EventDetailsPage — disabled button + powody zamknięcia zapisów
2. EventRegistrationPage — redirect zabezpieczenie
3. RegistrationForm — automatyczne kategorie wiekowe + walidacje
4. EventDetailsPage — dodatkowe sekcje info (ubezpieczenie, gadżety, lepsze dystanse)

