import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BankPaymentSummary } from '../BankPaymentSummary';
import type { Event } from '@/types';

// Regression test for TD.3: this component referenced
// `event.paymentConfig?.bankTransferAddress`, a field that never existed on
// `PaymentConfig` (the real field is `transferTitle`, used elsewhere e.g.
// RegistrationForm.tsx, EventSidebar.tsx). That typo meant the "Tytuł
// przelewu" block silently never rendered. The fix reads `transferTitle`.

const baseEvent: Event = {
  id: 'event-1',
  name: 'Bieg Testowy',
  slug: 'bieg-testowy',
  discipline: 'running',
  date: '2026-06-15',
  location: 'Park',
  city: 'Warszawa',
  description: 'Test',
  imageUrl: '/test.jpg',
  distances: [],
  organizerId: 'organizer-1',
  organizerName: 'Organizator',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
  paymentConfig: {
    type: 'organizer_bank',
    bankAccountNumber: '12 3456 7890 1234 5678 9012 3456',
    bankAccountHolder: 'Jan Kowalski',
    transferTitle: 'Zapis-BiegTestowy-{numer}',
  },
};

describe('BankPaymentSummary', () => {
  it('renders the transfer title when paymentConfig.transferTitle is set', () => {
    render(<BankPaymentSummary event={baseEvent} registrations={[]} />);

    expect(screen.getByText(/Tytuł przelewu:/)).toBeInTheDocument();
    expect(screen.getByText(/Zapis-BiegTestowy-\{numer\}/)).toBeInTheDocument();
  });

  it('does not render the transfer title block when transferTitle is unset', () => {
    render(
      <BankPaymentSummary
        event={{
          ...baseEvent,
          paymentConfig: { ...baseEvent.paymentConfig, transferTitle: undefined },
        }}
        registrations={[]}
      />,
    );

    expect(screen.queryByText(/Tytuł przelewu:/)).not.toBeInTheDocument();
  });
});
