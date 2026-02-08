
# Plan: Funkcje admina - online status i integracja Google Calendar

## Zakres zmian

Plan obejmuje dwie funkcjonalności dla administratora:

1. **Lista aktualnie zalogowanych adminow i moderatorow** - panel w AdminOverviewTab pokazujacy kto jest online
2. **Integracja Google Calendar** - automatyczne dodawanie wydarzen do kalendarza po zatwierdzeniu przez admina

---

## 1. Lista zalogowanych administratorow i moderatorow

### Architektura

Poniewaz jest to mockowany system bez backendowej bazy danych, zasymulujemy sesje online poprzez:

1. **Kontekst OnlinePresence** - globalny kontekst sledzacy aktywnych uzytkownikow
2. **Mockowe sesje** - losowo wygenerowane "aktywne" sesje dla kilku adminow/moderatorow
3. **Symulacja heartbeat** - aktualizacja "ostatniej aktywnosci" co 30 sekund

### Nowy typ w types/index.ts

```typescript
export interface OnlineSession {
  userId: string;
  userName: string;
  role: 'admin' | 'moderator';
  loginAt: string;           // ISO date
  lastActiveAt: string;      // ISO date
  ipAddress?: string;
  browser?: string;
  location?: string;
}
```

### Mockowe dane sesji

```typescript
// W mockData.ts
export const mockOnlineSessions: OnlineSession[] = [
  {
    userId: 'a1',
    userName: 'Admin Platformy',
    role: 'admin',
    loginAt: new Date(Date.now() - 3600000).toISOString(), // 1h temu
    lastActiveAt: new Date().toISOString(),
    browser: 'Chrome 120',
    location: 'Warszawa, PL',
  },
  {
    userId: 'mod1',
    userName: 'Monika Moderator',
    role: 'moderator',
    loginAt: new Date(Date.now() - 7200000).toISOString(), // 2h temu
    lastActiveAt: new Date(Date.now() - 300000).toISOString(), // 5 min temu
    browser: 'Firefox 121',
    location: 'Krakow, PL',
  },
  // Dodatkowy admin dla demonstracji
  {
    userId: 'a2',
    userName: 'Jan Administrator',
    role: 'admin',
    loginAt: new Date(Date.now() - 1800000).toISOString(), // 30 min temu
    lastActiveAt: new Date(Date.now() - 120000).toISOString(), // 2 min temu
    browser: 'Safari 17',
    location: 'Gdansk, PL',
  },
];
```

### Nowa karta w AdminOverviewTab

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 Aktualnie zalogowani administratorzy i moderatorzy                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [🟢] Admin Platformy (admin)                                           ││
│ │     📍 Warszawa, PL • Chrome 120                                       ││
│ │     ⏱️ Aktywny teraz                                                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [🟡] Monika Moderator (moderator)                                      ││
│ │     📍 Krakow, PL • Firefox 121                                        ││
│ │     ⏱️ Aktywny 5 min temu                                              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [🟢] Jan Administrator (admin)                                         ││
│ │     📍 Gdansk, PL • Safari 17                                          ││
│ │     ⏱️ Aktywny 2 min temu                                              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Zalogowanych: 2 adminow, 1 moderator                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Logika statusu aktywnosci

```typescript
const getActivityStatus = (lastActiveAt: string): { status: 'online' | 'away' | 'idle'; label: string } => {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 2) {
    return { status: 'online', label: 'Aktywny teraz' };
  } else if (minutes < 10) {
    return { status: 'away', label: `Aktywny ${minutes} min temu` };
  } else {
    return { status: 'idle', label: `Nieaktywny od ${minutes} min` };
  }
};

// Kolory statusu
// online (< 2 min) -> zielony
// away (2-10 min) -> zolty
// idle (> 10 min) -> szary
```

---

## 2. Integracja Google Calendar

### Wymagania

- **Connector Google Calendar** - do polaczenia potrzebny jest Google Calendar connector
- **Automatyczne tworzenie wydarzen** - po zatwierdzeniu wydarzenia przez admina, tworzy sie wpis w kalendarzu

### Konfiguracja w AdminSettingsTab

Nowa sekcja w panelu ustawien admina:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📅 Integracja Google Calendar                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [✓] Automatycznie dodawaj zatwierdzone wydarzenia do Google Calendar       │
│                                                                             │
│ Status: ⚠️ Nie polaczono z Google Calendar                                 │
│                                                                             │
│ [Polacz Google Calendar]                                                    │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ Po polaczeniu, kazde zatwierdzone wydarzenie zostanie automatycznie        │
│ dodane do Twojego kalendarza Google z nastepujacymi danymi:                │
│                                                                             │
│ • Tytul: [Nazwa wydarzenia]                                                 │
│ • Data: [Data wydarzenia]                                                   │
│ • Lokalizacja: [Lokalizacja, Miasto]                                        │
│ • Opis: Link do strony wydarzenia                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Typ ustawien kalendarza

```typescript
// W types/index.ts
export interface GoogleCalendarSettings {
  enabled: boolean;
  connected: boolean;
  calendarId?: string;        // np. 'primary' lub ID konkretnego kalendarza
  lastSyncAt?: string;
}
```

### Integracja z ModerationTab

Po zatwierdzeniu wydarzenia (`handleApprove`), jezeli integracja jest wlaczona:

```typescript
const handleApprove = async () => {
  if (!selectedEvent) return;
  
  // Zmiana statusu wydarzenia
  setEvents(prev => prev.map(e => 
    e.id === selectedEvent.id 
      ? { ...e, status: 'published' as const, rejectionReason: undefined }
      : e
  ));
  
  // Dodanie do Google Calendar (jesli polaczono)
  if (calendarSettings.enabled && calendarSettings.connected) {
    try {
      await addEventToGoogleCalendar(selectedEvent);
      toast.success('Wydarzenie dodane do Google Calendar');
    } catch (error) {
      toast.error('Nie udalo sie dodac wydarzenia do kalendarza');
    }
  }
  
  toast.success('Wydarzenie zostalo zatwierdzone', {
    description: `"${selectedEvent.name}" jest teraz widoczne publicznie.`
  });
  
  // ...
};
```

### Helper do tworzenia wydarzenia w Google Calendar

```typescript
// W src/lib/googleCalendarUtils.ts
import { Event } from '@/types';

const GATEWAY_URL = 'https://gateway.lovable.dev/google_calendar/calendar/v3';

export const addEventToGoogleCalendar = async (event: Event, calendarId = 'primary') => {
  // Parse event date (format: "15 wrzesnia 2026" lub podobny)
  const eventDate = parseEventDate(event.date);
  
  const calendarEvent = {
    summary: event.name,
    location: `${event.location}, ${event.city}`,
    description: `${event.description}\n\nOrganizator: ${event.organizerName}\n\nWiecej informacji: ${window.location.origin}/events/${event.slug}`,
    start: {
      date: eventDate,  // Format: YYYY-MM-DD dla wydarzen calodniowych
      timeZone: 'Europe/Warsaw',
    },
    end: {
      date: eventDate,
      timeZone: 'Europe/Warsaw',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 dzien przed
        { method: 'email', minutes: 10080 }, // 1 tydzien przed
      ],
    },
  };
  
  const response = await fetch(`${GATEWAY_URL}/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(calendarEvent),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create calendar event');
  }
  
  return response.json();
};
```

---

## Struktura plikow do modyfikacji/utworzenia

| Plik | Akcja | Opis |
|------|-------|------|
| `src/types/index.ts` | Modyfikacja | OnlineSession, GoogleCalendarSettings |
| `src/data/mockData.ts` | Modyfikacja | mockOnlineSessions, mockCalendarSettings |
| `src/lib/googleCalendarUtils.ts` | Nowy | Helper do tworzenia wydarzen w GCal |
| `src/pages/admin/components/AdminOverviewTab.tsx` | Modyfikacja | Sekcja z zalogowanymi adminami/moderatorami |
| `src/pages/admin/components/AdminSettingsTab.tsx` | Modyfikacja | Sekcja konfiguracji Google Calendar |
| `src/pages/admin/components/AdminModerationTab.tsx` | Modyfikacja | Integracja z Google Calendar przy zatwierdzaniu |

---

## Szczegoly techniczne

### Komponent OnlineUserCard

```tsx
interface OnlineUserCardProps {
  session: OnlineSession;
}

const OnlineUserCard = ({ session }: OnlineUserCardProps) => {
  const activity = getActivityStatus(session.lastActiveAt);
  
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    idle: 'bg-gray-400',
  };
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="relative">
        <Avatar>
          <AvatarFallback>{session.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[activity.status]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{session.userName}</span>
          <Badge variant="outline" className="text-xs">
            {session.role === 'admin' ? 'Admin' : 'Moderator'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.location}
            </span>
          )}
          {session.browser && (
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {session.browser}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <Clock className="inline h-3 w-3 mr-1" />
          {activity.label}
        </div>
      </div>
    </div>
  );
};
```

### Przycisk polaczenia z Google Calendar

Jesli connector nie jest polaczony, wyswietle przycisk z akcja:

```tsx
<Button onClick={() => {
  // Prompt uzytkownika do polaczenia Google Calendar connectora
  toast.info('Polacz Google Calendar w ustawieniach projektu');
}}>
  <Calendar className="h-4 w-4 mr-2" />
  Polacz Google Calendar
</Button>
```

### Parsowanie daty wydarzenia

```typescript
const parseEventDate = (dateStr: string): string => {
  // Mapa polskich miesiecy
  const months: Record<string, string> = {
    'stycznia': '01', 'lutego': '02', 'marca': '03',
    'kwietnia': '04', 'maja': '05', 'czerwca': '06',
    'lipca': '07', 'sierpnia': '08', 'wrzesnia': '09',
    'pazdziernika': '10', 'listopada': '11', 'grudnia': '12',
  };
  
  // Format: "15 wrzesnia 2026"
  const parts = dateStr.toLowerCase().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0];
};
```

---

## Flow uzytkownika

### Przegladanie online adminow:

1. Admin otwiera pulpit (`/admin`)
2. W sekcji "Aktualnie zalogowani" widzi liste aktywnych adminow i moderatorow
3. Kazdy uzytkownik ma status aktywnosci (zielony/zolty/szary)
4. Widoczne sa lokalizacja i przegladarka

### Konfiguracja Google Calendar:

1. Admin przechodzi do zakladki "Ustawienia"
2. Widzi sekcje "Integracja Google Calendar"
3. Klika "Polacz Google Calendar" (wymaga connectora)
4. Po polaczeniu wlacza automatyczne dodawanie wydarzen

### Automatyczne tworzenie wydarzen:

1. Organizator zglasza wydarzenie do moderacji
2. Admin zatwierdza wydarzenie w zakladce "Moderacja"
3. System automatycznie tworzy wydarzenie w Google Calendar
4. Admin otrzymuje powiadomienie o sukcesie/bledzie

---

## Uwagi bezpieczenstwa

- Mockowane sesje online sa tylko symulacja - w produkcji nalezaloby uzyc Supabase Auth i realtime
- Integracja Google Calendar wymaga polaczenia connectora przed uzyciem
- Dane dostepu do Google Calendar sa przechowywane bezpiecznie przez gateway Lovable
