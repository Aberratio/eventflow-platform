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

const START_CODE = `pqr_${'a1'.repeat(24)}`;

describe('EventTicket start code QR (B-04, G-01)', () => {
  it('encodes the bare pqr_ start code (not JSON) for a confirmed Zapis', () => {
    const { container } = render(
      <EventTicket
        ticket={{ ...baseTicket, qrCode: START_CODE, registrationStatus: 'confirmed' }}
      />,
    );

    const qr = container.querySelector('svg[data-qr-value]');
    expect(qr).not.toBeNull();
    expect(qr?.getAttribute('data-qr-value')).toBe(START_CODE);
    expect(qr?.getAttribute('data-qr-value')).not.toContain('{');
  });

  it.each(['pending', 'expired', 'cancelled', 'removed'] as const)(
    'shows no QR and a status message for a %s Zapis',
    (registrationStatus) => {
      const { container } = render(
        <EventTicket ticket={{ ...baseTicket, qrCode: START_CODE, registrationStatus }} />,
      );

      expect(container.querySelector('svg')?.getAttribute('data-qr-value')).toBeFalsy();
      expect(container.querySelector('[data-qr-value]')).toBeNull();
      expect(screen.getByTestId('ticket-inactive')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Pobierz bilet/ })).not.toBeInTheDocument();
    },
  );

  it('says the ticket appears after payment for an unpaid Zapis', () => {
    render(
      <EventTicket ticket={{ ...baseTicket, qrCode: START_CODE, registrationStatus: 'pending' }} />,
    );
    expect(screen.getByText(/Bilet pojawi się po opłaceniu zapisu/)).toBeInTheDocument();
  });

  it('links "Pobierz bilet" to the print page of the Zapis', () => {
    render(
      <EventTicket
        ticket={{ ...baseTicket, qrCode: START_CODE, registrationStatus: 'confirmed' }}
      />,
    );
    expect(screen.getByRole('link', { name: /Pobierz bilet/ })).toHaveAttribute(
      'href',
      '/participant/tickets/registration-1/print',
    );
  });
});

/** UX-mobile blocker: a ticket without a usable `eventDate` must not crash the whole Bilety tab. */
describe('EventTicket without eventDate', () => {
  it('renders the ticket instead of throwing "Invalid time value"', () => {
    const ticket = { ...baseTicket, eventDate: undefined } as unknown as Ticket;

    render(<EventTicket ticket={ticket} />);

    expect(screen.getByText('Maraton Testowy')).toBeInTheDocument();
  });
});
