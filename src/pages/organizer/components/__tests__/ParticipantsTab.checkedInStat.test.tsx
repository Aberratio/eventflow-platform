import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ParticipantsTab } from '../ParticipantsTab';
import type { Event, Registration, Distance } from '@/types';

vi.mock('@/api', () => ({
  exportStartList: vi.fn(),
  getFormFieldAggregates: vi.fn(),
  approveRefund: vi.fn(),
  completeRefund: vi.fn(),
  markRegistrationPaid: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockDistance: Distance = {
  id: 'd1',
  name: '10 km',
  length: 10,
  unit: 'km',
  categories: ['Open'],
  registeredCount: 3,
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

function reg(overrides: Partial<Registration>): Registration {
  return {
    id: 'reg-default',
    eventId: 'evt-1',
    userId: 'u',
    userName: 'Uczestnik',
    userEmail: 'u@example.com',
    distanceId: 'd1',
    distanceName: '10 km',
    category: 'Open',
    status: 'confirmed',
    registeredAt: '2026-01-10T10:00:00Z',
    ...overrides,
  } as Registration;
}

/**
 * "ilu uczestników odebrało pakiet" — the minimal
 * organizer-facing stat this ticket adds to the existing participant list
 * dashboard, ahead of the full reporting ticket. Verifies the count is
 * derived correctly from checkedInAt across a mix of registrations, and
 * excludes removed ones the same way the other stat cards on this tab do.
 */
describe('ParticipantsTab checked-in stat', () => {
  it('counts only registrations with a checkedInAt timestamp', () => {
    const registrations: Registration[] = [
      reg({ id: 'reg-1', checkedInAt: '2026-06-01T07:42:00+02:00' }),
      reg({ id: 'reg-2', checkedInAt: '2026-06-01T08:00:00+02:00' }),
      reg({ id: 'reg-3' }),
    ];

    render(<ParticipantsTab event={mockEvent} registrations={registrations} />);

    expect(screen.getByText('Odprawionych')).toBeInTheDocument();
    const statCard = screen.getByText('Odprawionych').closest('div')?.parentElement;
    expect(statCard).not.toBeNull();
    expect(statCard!.textContent).toContain('2');
  });

  it('shows zero when nobody has been checked in yet', () => {
    const registrations: Registration[] = [reg({ id: 'reg-1' }), reg({ id: 'reg-2' })];

    render(<ParticipantsTab event={mockEvent} registrations={registrations} />);

    const statCard = screen.getByText('Odprawionych').closest('div')?.parentElement;
    expect(statCard!.textContent).toContain('0');
  });

  it('excludes removed registrations from the checked-in count', () => {
    const registrations: Registration[] = [
      reg({ id: 'reg-1', status: 'removed', checkedInAt: '2026-06-01T07:42:00+02:00' }),
      reg({ id: 'reg-2', checkedInAt: '2026-06-01T08:00:00+02:00' }),
    ];

    render(<ParticipantsTab event={mockEvent} registrations={registrations} />);

    const statCard = screen.getByText('Odprawionych').closest('div')?.parentElement;
    expect(statCard!.textContent).toContain('1');
  });
});
