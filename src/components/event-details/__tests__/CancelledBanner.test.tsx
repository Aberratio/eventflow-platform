import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { CancelledBanner } from '../CancelledBanner';
import type { Event } from '@/types';

const event: Event = {
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
  publicationStatus: 'cancelled',
  registrationDeadline: '2026-06-01',
  featured: false,
};

describe('CancelledBanner', () => {
  it('renders a cancelled-event message', () => {
    render(<CancelledBanner event={event} />);

    expect(screen.getByText('Wydarzenie odwołane')).toBeInTheDocument();
    expect(screen.getByText(/Organizator odwołał to wydarzenie/i)).toBeInTheDocument();
  });
});
