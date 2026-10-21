import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ParticipantsTab } from '../ParticipantsTab';
import type { Event, Registration } from '@/types';

vi.mock('@/api', () => ({
  exportStartList: vi.fn(),
  getFormFieldAggregates: vi.fn(),
  approveRefund: vi.fn(),
  completeRefund: vi.fn(),
  markRegistrationPaid: vi.fn(),
}));

const event = {
  id: 'evt-1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2026-06-01',
  registrationDeadline: '2026-05-28',
  location: 'X',
  city: 'X',
  description: 'x',
  discipline: 'running',
  publicationStatus: 'published',
  registrationStatus: 'open',
  imageUrl: '',
  distances: [
    {
      id: 'd1',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 1,
      price: 80,
    },
  ],
  organizerId: 'o1',
  organizerName: 'Org',
  featured: false,
} as unknown as Event;

const registration = {
  id: 'r1',
  eventId: 'evt-1',
  userId: 'u',
  userName: 'Jan',
  userEmail: 'j@example.com',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  status: 'confirmed',
  registeredAt: '2026-01-10T10:00:00Z',
} as Registration;

// XML next to CSV and XLSX in the start-list export menu.
describe('ParticipantsTab start-list export menu', () => {
  it('offers CSV, XLSX and XML start-list formats', async () => {
    render(<ParticipantsTab event={event} registrations={[registration]} />);

    await userEvent.click(screen.getByRole('button', { name: /Eksport/ }));

    expect(await screen.findByText('Lista startowa (CSV, Windows-1250)')).toBeInTheDocument();
    expect(screen.getByText('Lista startowa (XLSX)')).toBeInTheDocument();
    expect(screen.getByText('Lista startowa (XML)')).toBeInTheDocument();
  });
});
