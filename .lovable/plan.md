

# Plan: Naprawa nawigacji i brakujace strony

## Znalezione problemy

### 1. Martwy link: `/participant/events` (Header)
W dropdown menu dla uczestnikow jest link "Moje zawody" prowadzacy do `/participant/events`. Trasa `/participant/*` jest obslugiwana przez wildcard, ale `ParticipantDashboard` nie parsuje sub-routes - zawsze renderuje dashboard z domyslna zakladka. Klikniecie w ten link nie otwiera zakladki "Moje starty".

**Rozwiazanie**: Zmiana linku na `/participant` z automatycznym przejsciem do zakladki "registrations" (np. przez state lub URL param).

### 2. Placeholder linki w Footer: "Polityka prywatnosci" i "RODO"
Oba linki prowadza do `to="#"` - nie istnieja zadne strony.

**Rozwiazanie**: Utworzenie mockowych stron CMS w `mockData.ts` z slugami `polityka-prywatnosci` i `rodo`. Beda obslugiwane przez istniejaca trase `/info/:slug`.

### 3. Brak roli `moderator` w Header
`roleLabels` i `roleBadgeVariants` w Header.tsx nie zawieraja wpisu `moderator`. Zalogowany moderator widzi "Uczestnik" zamiast wlasciwej roli.

**Rozwiazanie**: Dodanie `moderator: 'Moderator'` do `roleLabels` i odpowiedniego wariantu do `roleBadgeVariants`.

### 4. Brak linkow do `/series` i `/athletes` w nawigacji
Strony istnieja, ale nie sa nigdzie linkowane z glownej nawigacji. Uzytkownik nie ma sposobu na dotarcie do nich bez wpisania URL.

**Rozwiazanie**: Dodanie linku "Serie i cykle" do dropdownu "Wyniki" oraz linku "Zawodnicy" do sekcji glownej nawigacji lub dropdownu "Informacje".

### 5. Brak linkow do moderatora w dropdown menu Header
Gdy zalogowany jest moderator, brakuje dedykowanego linku w dropdown (tak jak organizator ma "Zarzadzaj wydarzeniami").

**Rozwiazanie**: Dodanie opcji menu dla moderatora (np. "Panel moderacji").

---

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/components/layout/Header.tsx` | Dodanie moderator do roleLabels/roleBadgeVariants, naprawa linku participant/events, dodanie linkow do /series i /athletes, dodanie opcji menu dla moderatora |
| `src/components/layout/Footer.tsx` | Zmiana linkow # na /info/polityka-prywatnosci i /info/rodo |
| `src/data/mockData.ts` | Dodanie mockowych stron CMS: "Polityka prywatnosci" i "RODO" |

---

## Szczegoly techniczne

### Header.tsx - roleLabels i roleBadgeVariants

```typescript
const roleLabels = {
  participant: 'Uczestnik',
  organizer: 'Organizator',
  moderator: 'Moderator',
  admin: 'Administrator',
};

const roleBadgeVariants = {
  participant: 'secondary',
  organizer: 'default',
  moderator: 'outline',
  admin: 'destructive',
} as const;
```

### Header.tsx - getDashboardLink

Dodanie brakujacego case `moderator`:

```typescript
case 'moderator': return '/moderator';
```

### Header.tsx - link participant/events

Zmiana z:
```tsx
<Link to="/participant/events">Moje zawody</Link>
```
na:
```tsx
<Link to="/participant" onClick={() => { /* trigger registrations tab */ }}>Moje zawody</Link>
```
Lub alternatywnie: dodanie query param `?tab=registrations` i obsluga w ParticipantDashboard.

### Header.tsx - nowe linki w nawigacji

W dropdown "Wyniki" dodanie:
```tsx
<DropdownMenuItem asChild>
  <Link to="/series">Serie i cykle</Link>
</DropdownMenuItem>
```

Nowy link "Zawodnicy" w nawigacji desktopowej i mobilnej:
```tsx
<Link to="/athletes">Zawodnicy</Link>
```

### Footer.tsx - linki prawne

```tsx
<li><Link to="/info/polityka-prywatnosci">Polityka prywatności</Link></li>
<li><Link to="/info/rodo">RODO</Link></li>
```

### mockData.ts - nowe strony CMS

Dwie nowe strony w `mockInfoPages`:

1. **Polityka prywatnosci** (`slug: 'polityka-prywatnosci'`) - sekcje: hero, text z opisem przetwarzania danych, FAQ
2. **RODO** (`slug: 'rodo'`) - sekcje: hero, text z informacja o prawach uzytkownika, cards z prawami RODO

### ParticipantDashboard - obsluga query param tab

Dodanie odczytu `?tab=` z URL i ustawienie odpowiedniej zakladki:

```typescript
const [searchParams] = useSearchParams();
const initialTab = searchParams.get('tab') || 'overview';
const [activeTab, setActiveTab] = useState(initialTab);
```

