import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ParticipantsTab } from '../ParticipantsTab';
import type { Event, Registration, Distance } from '@/types';

const exportStartList = vi.fn();
const getFormFieldAggregates = vi.fn();
const approveRefund = vi.fn();
const completeRefund = vi.fn();
const markRegistrationPaid = vi.fn();

vi.mock('@/api', () => ({
  exportStartList: (...args: unknown[]) => exportStartList(...args),
  getFormFieldAggregates: (...args: unknown[]) => getFormFieldAggregates(...args),
  approveRefund: (...args: unknown[]) => approveRefund(...args),
  completeRefund: (...args: unknown[]) => completeRefund(...args),
  markRegistrationPaid: (...args: unknown[]) => markRegistrationPaid(...args),
}));

const mockDistance: Distance = {
  id: 'd1',
  name: '10 km',
  length: 10,
  unit: 'km',
  categories: ['Open'],
  registeredCount: 1,
  price: 80,
} as Distance;

const mockEvent: Event = {
  id: 'evt-1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2026-06-01',
  registrationDeadline: '2026-05-28',
  location: 'Test City',
  city: 'Test City',
  description: 'Test',
  discipline: 'running',
  publicationStatus: 'published',
  registrationStatus: 'open',
  imageUrl: '',
  distances: [mockDistance],
  organizerId: 'organizer-1',
  organizerName: 'Organizer',
  featured: false,
} as Event;

const mockRegistrations: Registration[] = [
  {
    id: 'reg-1',
    eventId: 'evt-1',
    userId: 'u1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'd1',
    distanceName: '10 km',
    category: 'Open',
    status: 'confirmed',
    registeredAt: '2026-01-10T10:00:00Z',
    bibNumber: '101',
  } as Registration,
];

// Radix's SelectTrigger reads pointer-capture APIs jsdom doesn't implement —
// without this, opening the Dystans dropdown throws
// "target.hasPointerCapture is not a function" and the option list never
// appears. Scoped to this file rather than the shared test setup since it's
// purely a jsdom gap, not applicable to non-DOM tests.
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

/**
 * E2.6: the "Eksportuj listę startową" UI trigger inside ParticipantsTab's
 * "Eksport" dropdown — mirrors FormFieldAggregatesCard.test.tsx's pattern of
 * mocking '@/api' and asserting the exact call the button produces, plus the
 * one piece of UI logic specific to this feature: the button is disabled
 * until a concrete Dystans (not "Wszystkie dystanse") is selected, because
 * the export is always for exactly one Distance.
 */
describe('ParticipantsTab start-list export (E2.6)', () => {
  it('disables the start-list export options while "Wszystkie dystanse" is selected', async () => {
    render(<ParticipantsTab event={mockEvent} registrations={mockRegistrations} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Eksport/i }));

    expect(
      (await screen.findByText('Lista startowa (CSV, Windows-1250)')).closest('[role="menuitem"]'),
    ).toHaveAttribute('data-disabled');
    expect(screen.getByText('Lista startowa (XLSX)').closest('[role="menuitem"]')).toHaveAttribute(
      'data-disabled',
    );
  });

  it('calls exportStartList with the event id, selected distance and csv format once a Dystans is chosen', async () => {
    exportStartList.mockResolvedValueOnce(undefined);
    render(<ParticipantsTab event={mockEvent} registrations={mockRegistrations} />);

    // Radix's `combobox` role is not "named from content" per the ARIA spec
    // (no aria-label is set on this trigger), so it can only be targeted
    // positionally here — the Dystans select is the first of the two
    // comboboxes on this tab (Dystans, then Status).
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: '10 km' }));

    await user.click(screen.getByRole('button', { name: /Eksport/i }));
    await user.click(await screen.findByText('Lista startowa (CSV, Windows-1250)'));

    await waitFor(() => expect(exportStartList).toHaveBeenCalledWith('evt-1', 'd1', 'csv'));
  });

  it('calls exportStartList with xlsx format for the XLSX menu item', async () => {
    exportStartList.mockResolvedValueOnce(undefined);
    render(<ParticipantsTab event={mockEvent} registrations={mockRegistrations} />);

    // Radix's `combobox` role is not "named from content" per the ARIA spec
    // (no aria-label is set on this trigger), so it can only be targeted
    // positionally here — the Dystans select is the first of the two
    // comboboxes on this tab (Dystans, then Status).
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: '10 km' }));

    await user.click(screen.getByRole('button', { name: /Eksport/i }));
    await user.click(await screen.findByText('Lista startowa (XLSX)'));

    await waitFor(() => expect(exportStartList).toHaveBeenCalledWith('evt-1', 'd1', 'xlsx'));
  });
});
