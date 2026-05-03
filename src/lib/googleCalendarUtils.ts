import { Event } from '@/types';

const GOOGLE_CALENDAR_API_URL = import.meta.env.VITE_GOOGLE_CALENDAR_API_URL;

/**
 * Parse Polish date format to ISO date string (YYYY-MM-DD)
 */
export const parseEventDate = (dateStr: string): string => {
  // Map of Polish months
  const months: Record<string, string> = {
    stycznia: '01',
    lutego: '02',
    marca: '03',
    kwietnia: '04',
    maja: '05',
    czerwca: '06',
    lipca: '07',
    sierpnia: '08',
    września: '09',
    października: '10',
    listopada: '11',
    grudnia: '12',
    // Handle lowercase without diacritics
    wrzesnia: '09',
    pazdziernika: '10',
  };

  // Format: "15 września 2026"
  const parts = dateStr.toLowerCase().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};

/**
 * Add an event to Google Calendar via the gateway
 */
export const addEventToGoogleCalendar = async (
  event: Event,
  calendarId = 'primary',
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    if (!GOOGLE_CALENDAR_API_URL) {
      throw new Error('Google Calendar API URL is not configured.');
    }

    // Parse event date
    const eventDate = parseEventDate(event.date);

    const calendarEvent = {
      summary: event.name,
      location: `${event.location}, ${event.city}`,
      description: `${event.description}\n\nOrganizator: ${event.organizerName}\n\nWięcej informacji: ${window.location.origin}/events/${event.slug}`,
      start: {
        date: eventDate, // Format: YYYY-MM-DD for all-day events
        timeZone: 'Europe/Warsaw',
      },
      end: {
        date: eventDate,
        timeZone: 'Europe/Warsaw',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 }, // 1 day before
          { method: 'email', minutes: 10080 }, // 1 week before
        ],
      },
    };

    const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create calendar event: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
