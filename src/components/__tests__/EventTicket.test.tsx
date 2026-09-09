import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EventTicket } from '../EventTicket';
import { Ticket } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const baseTicket: Ticket = {
  id: 'ticket-1',
  eventId: 'event-1',
  eventName: 'Maraton Testowy',
  eventDate: '2026-09-15',
  distanceId: 'distance-1',
  distanceName: 'Maraton',
  location: 'Park Łazienkowski, Warszawa',
  participantName: 'Jan Testowy',
  participantId: 'participant-1',
  bibNumber: '123',
  category: 'Open',
  registrationId: 'registration-1',
};

/**
 * E3.6 (issue 12 §4): "odprawiono Cię o 7:42" — the Bilet must show the
 * check-in fact BZ reports back once known, and must not show anything for
 * the (far more common) not-yet-checked-in case.
 */
describe('EventTicket check-in display (E3.6)', () => {
  it('shows nothing check-in related when the ticket was never checked in', () => {
    render(<EventTicket ticket={baseTicket} />);

    expect(screen.queryByText(/Odprawiono/)).not.toBeInTheDocument();
  });

  it('shows "Odprawiono Cię o HH:mm" once BZ reports a check-in timestamp', () => {
    const checkedInAt = '2026-09-15T07:42:00+02:00';
    // Formatted with the exact same helper the component uses, so this
    // assertion holds regardless of the test runner's own timezone.
    const expectedTime = format(new Date(checkedInAt), 'HH:mm', { locale: pl });

    render(<EventTicket ticket={{ ...baseTicket, checkedInAt }} />);

    expect(screen.getByText(new RegExp(`Odprawiono Cię o ${expectedTime}`))).toBeInTheDocument();
  });

  it("includes checkedInBy (BZ's own identifier for who confirmed it) when present", () => {
    render(
      <EventTicket
        ticket={{
          ...baseTicket,
          checkedInAt: '2026-09-15T07:42:00+02:00',
          checkedInBy: 'Jan Kowalski (BZ)',
        }}
      />,
    );

    expect(screen.getByText(/Jan Kowalski \(BZ\)/)).toBeInTheDocument();
  });
});
