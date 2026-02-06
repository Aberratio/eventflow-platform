
# Plan: Dodanie trzech pol rich text do wydarzen

## Cel

Dodanie trzech nowych pol HTML do interfejsu Event, ktore beda edytowalne przez organizatorow za pomoca edytora WYSIWYG:

1. **organizersHtml** - Informacje o organizatorach (moze byc wielu, z linkami, dlugie nazwy sponsorow)
2. **rulesHtml** - Regulamin zawodow (formatowany tekst z mozliwoscia linkowania do PDF-ow)
3. **finalAcceptanceHtml** - Opcjonalny tekst akceptacji koncowej wyswietlany przy rejestracji jako checkbox

## Wybor biblioteki WYSIWYG

Zainstaluje **@tiptap/react** z podstawowymi rozszerzeniami - lekki, nowoczesny edytor oparty na ProseMirror, ktory:
- Ma dobra integracje z React
- Wspiera linki (kluczowe dla organizatorow i regulaminow)
- Jest responsywny i dostepny
- Latwo sie stylizuje z Tailwind CSS

Pakiety do zainstalowania:
```
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-link
@tiptap/extension-underline
@tiptap/pm
```

## Zmiany w typach

```typescript
// src/types/index.ts - nowe pola w Event
export interface Event {
  // ... istniejace pola ...
  
  // Rich text fields
  organizersHtml?: string;          // HTML z informacjami o organizatorach
  rulesHtml?: string;               // HTML z regulaminem
  finalAcceptanceHtml?: string;     // HTML z tekstem akceptacji koncowej
  requireFinalAcceptance?: boolean; // Czy wyswietlac checkbox akceptacji
}
```

## Komponenty do stworzenia

### 1. RichTextEditor.tsx

Komponent edytora WYSIWYG z paskiem narzedzi:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [B] [I] [U] [S] | [Link] | [Lista] [Num] | [H2] [H3] | [Wyczysc]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LUKS "ROSPONDEK" przy PSP Zyrowa                                         │
│   STARTER Zdzieszowice                                                      │
│                                                                             │
│   (obszar edycji z formatowaniem)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Funkcje:
- Pogrubienie, kursywa, podkreslenie, przekreslenie
- Linki (dodawanie/usuwanie z dialogiem na URL)
- Listy punktowane i numerowane
- Naglowki H2, H3
- Czyszczenie formatowania

### 2. RichTextDisplay.tsx

Komponent do bezpiecznego wyswietlania HTML:

```tsx
<RichTextDisplay html={event.organizersHtml} />
```

- Renderuje HTML z odpowiednimi klasami Tailwind
- Stylizuje linki, listy, naglowki
- Zabezpiecza przed XSS (sanityzacja)

## Integracja z EventForm.tsx

Nowa sekcja w Kroku 1 (po sekcji platnosci):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📋 Dodatkowe informacje                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Organizatorzy                                                               │
│ Mozesz wpisac wielu organizatorow, sponsorow z linkami do ich stron.       │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [B] [I] [U] [Link] [Lista]                                              ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ LUKS "ROSPONDEK" przy PSP Zyrowa                                        ││
│ │ STARTER Zdzieszowice                                                     ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Regulamin                                                                   │
│ Wpisz tresc regulaminu lub dodaj linki do plikow PDF.                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [B] [I] [U] [Link] [Lista]                                              ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ Regulamin zawodow                                                        ││
│ │ (link do PDF)                                                            ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ [✓] Wymagaj dodatkowej akceptacji przy rejestracji                         │
│                                                                             │
│ Tekst akceptacji                                                            │
│ Ten tekst pojawi sie jako checkbox, ktory uczestnik musi zaakceptowac.     │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [B] [I] [U] [Link] [Lista]                                              ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ Akceptuje regulamin i oswiadczam...                                      ││
│ │ (klauzula RODO, dane kontaktowe administratora...)                       ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Wyswietlanie na stronie wydarzenia

### EventDetailsPage.tsx - zakladka "Informacje"

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ O wydarzeniu                                                                │
│ [opis wydarzenia...]                                                        │
│                                                                             │
│ Organizatorzy                                                               │
│ LUKS "ROSPONDEK" przy PSP Zyrowa                                           │
│ STARTER Zdzieszowice                                                        │
│ (linki klikalne, sformatowane)                                             │
│                                                                             │
│ Regulamin                                                                   │
│ Regulamin zawodow (link do PDF)                                            │
│ Regulamin RODO (link do PDF)                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Wyswietlanie przy rejestracji

### RegistrationForm.tsx - Krok 6 (Podsumowanie)

Jesli `requireFinalAcceptance` jest wlaczone:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [✓] Akceptuje regulamin zawodow oraz polityke prywatnosci...               │
│                                                                             │
│ [✓] Oswiadczam, ze zapoznalem sie z regulaminem i akceptuje:               │
│     1) administratorem danych osobowych jest LUKS "ROSPONDEK",             │
│     2) kontakt z osoba odpowiedzialna: kontakt@luksrospondek.pl,           │
│     3) dane beda przetwarzane w celu przeprowadzenia imprezy...            │
│     (pelny tekst z finalAcceptanceHtml)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Zmiany w plikach

| Plik | Akcja | Opis |
|------|-------|------|
| `package.json` | Modyfikacja | Dodanie @tiptap/* |
| `src/types/index.ts` | Modyfikacja | Nowe pola: organizersHtml, rulesHtml, finalAcceptanceHtml, requireFinalAcceptance |
| `src/components/ui/rich-text-editor.tsx` | Nowy | Komponent edytora WYSIWYG |
| `src/components/ui/rich-text-display.tsx` | Nowy | Komponent wyswietlania HTML |
| `src/pages/organizer/EventForm.tsx` | Modyfikacja | Nowa sekcja z trzema edytorami |
| `src/pages/EventDetailsPage.tsx` | Modyfikacja | Wyswietlanie organizersHtml i rulesHtml |
| `src/components/registration/RegistrationForm.tsx` | Modyfikacja | Opcjonalny checkbox finalAcceptance |
| `src/data/mockData.ts` | Modyfikacja | Przykladowe dane HTML dla kilku wydarzen |
| `src/index.css` | Modyfikacja | Style dla edytora i wyswietlanego HTML |

## Przykladowe dane mockowe

```typescript
// Dla eventu e1 (Maraton Krakowski)
organizersHtml: `
  <p><strong>Organizator glowny:</strong></p>
  <p><a href="https://krakowskabiegi.pl">Krakowska Fundacja Biegow</a></p>
  <p><strong>Wspolorganizatorzy:</strong></p>
  <ul>
    <li>Urzad Miasta Krakowa</li>
    <li><a href="https://sponsor.pl">Sponsor Tytularny SA</a></li>
  </ul>
`,
rulesHtml: `
  <p><a href="/regulamin-maraton-2025.pdf">📄 Regulamin zawodow (PDF)</a></p>
  <p><a href="/regulamin-rodo.pdf">📄 Klauzula informacyjna RODO (PDF)</a></p>
`,
finalAcceptanceHtml: `
  <p>Oswiadczam, ze:</p>
  <ol>
    <li>administratorem moich danych osobowych jest Krakowska Fundacja Biegow,</li>
    <li>kontakt z osoba odpowiedzialna za ochrone danych: <a href="mailto:rodo@krakow.pl">rodo@krakow.pl</a>,</li>
    <li>moje dane beda przetwarzane w celu przeprowadzenia imprezy sportowej,</li>
    <li>podanie danych jest dobrowolne, ale odmowa moze skutkowac odmowa uczestnictwa.</li>
  </ol>
`,
requireFinalAcceptance: true
```

## Szczegoly techniczne

### Konfiguracja TipTap

```tsx
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-primary underline' },
    }),
    Underline,
  ],
  content: initialValue,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});
```

### Pasek narzedzi edytora

```tsx
<div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
  <ToolbarButton 
    icon={Bold} 
    active={editor.isActive('bold')} 
    onClick={() => editor.chain().focus().toggleBold().run()} 
  />
  <ToolbarButton icon={Italic} ... />
  <ToolbarButton icon={Underline} ... />
  <ToolbarButton icon={Strikethrough} ... />
  <Separator orientation="vertical" className="h-6 mx-1" />
  <ToolbarButton icon={Link} onClick={handleAddLink} />
  <Separator orientation="vertical" className="h-6 mx-1" />
  <ToolbarButton icon={List} ... />
  <ToolbarButton icon={ListOrdered} ... />
  <Separator orientation="vertical" className="h-6 mx-1" />
  <ToolbarButton icon={Heading2} ... />
  <ToolbarButton icon={Heading3} ... />
</div>
```

### Style dla wyswietlania HTML

```css
.rich-text-content {
  @apply prose prose-sm dark:prose-invert max-w-none;
  
  a {
    @apply text-primary underline hover:no-underline;
  }
  
  ul, ol {
    @apply pl-5 my-2;
  }
  
  h2 {
    @apply text-lg font-semibold mt-4 mb-2;
  }
  
  h3 {
    @apply text-base font-semibold mt-3 mb-1;
  }
}
```

## Walidacja

W `EventForm.tsx` - validateStep1():
- Pola sa opcjonalne, wiec brak walidacji wymaganosci
- Sprawdzenie czy HTML nie przekracza limitu (np. 50000 znakow)

## Responsywnosc

- Pasek narzedzi lamiacy sie na mniejszych ekranach
- Edytor skalujacy sie do szerokosci kontenera
- Touch-friendly przyciski
