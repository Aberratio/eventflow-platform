import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EventCard } from '../EventCard';
import { Event } from '@/types';

const mockEvent: Event = {
  id: '1',
  name: 'Maraton Testowy',
  slug: 'maraton-testowy',
  date: '2026-09-15',
  city: 'Warszawa',
  location: 'Park Łazienkowski',
  discipline: 'running',
  distances: [{
    id: 'd1', name: 'Maraton', length: 42.195, unit: 'km', price: 150,
    categories: ['Open'], registeredCount: 0,
  }],
  organizerId: 'o1',
  organizerName: 'Org',
  description: 'Opis',
  registrationStatus: 'open',
  imageUrl: '/test.jpg',
  status: 'published',
  registrationDeadline: '2026-09-10',
  featured: false,
};

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Maraton Testowy')).toBeInTheDocument();
  });

  it('renders city', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Warszawa/)).toBeInTheDocument();
  });

  it('renders date', () => {
    render(<EventCard event={mockEvent} />);
    // date-fns formats "2026-09-15" in Polish
    expect(screen.getByText(/wrze/i)).toBeInTheDocument();
  });

  it('links to event details page', () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events/maraton-testowy');
  });
});
