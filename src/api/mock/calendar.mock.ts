import type { OnlineSession, GoogleCalendarSettings } from '@/types';

export const mockOnlineSessions: OnlineSession[] = [
  {
    userId: 'a1',
    userName: 'Admin Platformy',
    role: 'admin',
    loginAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
    lastActiveAt: new Date().toISOString(),
    browser: 'Chrome 120',
    location: 'Warszawa, PL',
  },
  {
    userId: 'mod1',
    userName: 'Monika Moderator',
    role: 'moderator',
    loginAt: new Date(Date.now() - 7200000).toISOString(), // 2h ago
    lastActiveAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    browser: 'Firefox 121',
    location: 'Kraków, PL',
  },
  {
    userId: 'a2',
    userName: 'Jan Administrator',
    role: 'admin',
    loginAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    lastActiveAt: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    browser: 'Safari 17',
    location: 'Gdańsk, PL',
  },
];

// ============== GOOGLE CALENDAR SETTINGS ==============
export const mockGoogleCalendarSettings: GoogleCalendarSettings = {
  enabled: false,
  connected: false,
  calendarId: 'primary',
};


