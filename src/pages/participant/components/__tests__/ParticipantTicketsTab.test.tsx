import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import type { Ticket } from '@/types';
import ParticipantTicketsTab from '../ParticipantTicketsTab';

vi.mock('@/components/EventTicket', () => ({
  EventTicket: ({ ticket }: { ticket: Ticket }) => (
    <div data-testid="ticket">{ticket.eventName}</div>
  ),
}));

// Frozen clock: 30 minutes after local midnight, the moment the old UTC-based dates broke the test.
const NOW = new Date(2026, 9, 21, 0, 30, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const dayOffset =(days: number): string => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  // Local calendar date (toISOString is UTC and shifts the day just after local midnight).
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ticket = (over: Partial<Ticket>): Ticket => ({
  id: 't',
  eventId: 'e',
  eventName: 'Bieg',
  eventDate: dayOffset(7),
  distanceId: 'd',
  distanceName: '10 km',
  location: 'Warszawa',
  participantName: 'Jan Testowy',
  participantId: 'p',
  bibNumber: '1',
  category: 'Open',
  registrationId: 'r',
  registrationStatus: 'confirmed',
  qrCode: 'QR-1',
  ...over,
});

// G-12 (spec 11 pkt 4): GET /users/{id}/tickets now carries eventDate, so the tab can split on it.
describe('ParticipantTicketsTab (G-12)', () => {
  it('splits tickets into upcoming and archived by eventDate', () => {
    render(
      <ParticipantTicketsTab
        tickets={[
          ticket({ id: 'a', eventName: 'Przyszły bieg', eventDate: dayOffset(10) }),
          ticket({ id: 'b', eventName: 'Dzisiejszy bieg', eventDate: dayOffset(0) }),
          ticket({ id: 'c', eventName: 'Dawny bieg', eventDate: dayOffset(-30) }),
        ]}
      />,
    );

    expect(screen.getByText('Nadchodzące wydarzenia (2)')).toBeInTheDocument();
    expect(screen.getByText('Archiwalne (1)')).toBeInTheDocument();
    expect(screen.getByText('Dawny bieg')).toBeInTheDocument();
  });

  it('keeps a ticket without a usable eventDate in the upcoming list instead of dropping it', () => {
    render(
      <ParticipantTicketsTab
        tickets={[ticket({ id: 'x', eventName: 'Bez daty', eventDate: undefined as never })]}
      />,
    );

    expect(screen.getByText('Nadchodzące wydarzenia (1)')).toBeInTheDocument();
    expect(screen.getByText('Bez daty')).toBeInTheDocument();
  });
});
