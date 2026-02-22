
# Rozdzielenie szablonow email: wydarzeniowe vs globalne (systemowe)

## Cel

Jasne rozdzielenie dwoch kategorii emaili:

1. **Emaile wydarzeniowe** (per event) — konfigurowane przez organizatora w zakladce "Emaile" danego wydarzenia. Triggery zwiazane z rejestracjami, platnosiciami, numerami startowymi itp.
2. **Emaile systemowe/globalne** (tylko admin) — dotycza konta uzytkownika: reset hasla, rejestracja konta, usuniecie konta, potwierdzenie emaila itp. Nie sa powiazane z zadnym wydarzeniem.

## Co sie zmieni

### 1. Nowe triggery systemowe (`src/types/email.ts`)

Dodanie nowych typow triggerow dla emaili globalnych (systemowych):
- `on_account_created` — Po utworzeniu konta
- `on_password_reset` — Po resecie hasla
- `on_account_deleted` — Po usunieciu konta
- `on_email_verified` — Po weryfikacji adresu email

Nowe zmienne szablonowe:
- `{{uzytkownik.imie}}` — Imie uzytkownika
- `{{uzytkownik.email}}` — Email uzytkownika
- `{{platforma.nazwa}}` — Nazwa platformy (SportTime)
- `{{platforma.link}}` — Link do strony glownej

Podzial triggerow na dwie grupy:
- `EVENT_TRIGGERS` — triggery dostepne przy tworzeniu szablonu per wydarzenie
- `SYSTEM_TRIGGERS` — triggery dostepne tylko w panelu admina (globalne)

### 2. Filtrowanie triggerow w edytorze (`src/components/email/EmailTemplateEditor.tsx`)

Edytor szablonu bedzie przyjmowal nowy prop `scope: 'event' | 'system'`:
- Jesli `scope === 'event'` — pokaze tylko triggery wydarzeniowe + sekcje filtrowania odbiorcow (dystanse, statusy, platnosci)
- Jesli `scope === 'system'` — pokaze tylko triggery systemowe, ukryje sekcje filtrowania odbiorcow (bo te maile ida do konkretnego usera, nie do grupy)

Sekcja zmiennych tez bedzie filtrowana — dla systemowych pokaze tylko zmienne `uzytkownik.*` i `platforma.*`, bez `wydarzenie.*` i `platnosc.*`.

### 3. Panel admina — dwie zakladki emaili (`src/pages/admin/AdminDashboard.tsx`)

W panelu admina sekcja "Emaile" bedzie renderowac `EmailTemplatesManager` z `scope="system"` — pokaze tylko globalne szablony systemowe (reset hasla, rejestracja konta itp.).

Organizatorzy dalej widza swoje szablony per wydarzenie w zakladce "Emaile" w EventManage — tam `scope="event"`.

### 4. Mock data (`src/api/mock/email-templates.mock.ts`)

Dodanie przykladowych szablonow systemowych:
- "Witamy na SportTime" (trigger: `on_account_created`)
- "Reset hasla" (trigger: `on_password_reset`)
- "Potwierdzenie usuniecia konta" (trigger: `on_account_deleted`)

Istniejace szablony z `eventId` zostana bez zmian.

### 5. API — filtrowanie po scope (`src/api/email-templates.api.ts`)

Funkcja `getEmailTemplates` bedzie rozrozniala:
- `eventId === null` — zwraca szablony systemowe (bez eventId, z triggerami systemowymi)
- `eventId === 'some-id'` — zwraca szablony tylko tego wydarzenia

### 6. Moderator — bez zmian

Moderator nie ma dostepu do konfiguracji emaili systemowych. Jego zakladka "Emaile" zostanie usunieta (lub ustawiona na `readonly` z widokiem logów).

## Szczegoly techniczne

### Nowe typy w `src/types/email.ts`

```
SystemTriggerType = 'on_account_created' | 'on_password_reset' | 'on_account_deleted' | 'on_email_verified'
EventTriggerType = (istniejace triggery)
EmailTriggerType = SystemTriggerType | EventTriggerType
```

Plus stale:
```
EVENT_TRIGGER_TYPES: EventTriggerType[]
SYSTEM_TRIGGER_TYPES: SystemTriggerType[]
```

### Zmiany w plikach

| Plik | Zmiana |
|---|---|
| `src/types/email.ts` | Nowe triggery systemowe, nowe zmienne, podzial na EVENT/SYSTEM |
| `src/components/email/EmailTemplateEditor.tsx` | Nowy prop `scope`, filtrowanie triggerow i zmiennych |
| `src/components/email/EmailTemplatesManager.tsx` | Nowy prop `scope`, przekazywanie do editora |
| `src/api/email-templates.api.ts` | Filtrowanie szablonow po scope |
| `src/api/mock/email-templates.mock.ts` | Nowe szablony systemowe |
| `src/pages/admin/AdminDashboard.tsx` | Przekazanie `scope="system"` do EmailTemplatesManager |
| `src/pages/organizer/EventManage.tsx` | Przekazanie `scope="event"` do EmailTemplatesManager |
| `src/pages/moderator/ModeratorDashboard.tsx` | Usuniecie zakladki Emaile lub ustawienie readonly |

### Kolejnosc implementacji

1. `src/types/email.ts` — typy, triggery, zmienne
2. `src/api/mock/email-templates.mock.ts` — szablony systemowe
3. `src/api/email-templates.api.ts` — filtrowanie
4. `src/components/email/EmailTemplateEditor.tsx` — scope prop
5. `src/components/email/EmailTemplatesManager.tsx` — scope prop
6. `src/pages/admin/AdminDashboard.tsx` — scope="system"
7. `src/pages/organizer/EventManage.tsx` — scope="event"
8. `src/pages/moderator/ModeratorDashboard.tsx` — cleanup
