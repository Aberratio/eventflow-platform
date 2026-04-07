import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EventCard } from '../EventCard';

const mockEvent = {
  id: '1',
  name: 'Maraton Testowy',
  slug: 'maraton-testowy',
  date: '15 września 2026',
  city: 'Warszawa',
  location: 'Park Łazienkowski',
  discipline: 'running' as const,
  distances: [
    { id: 'd1', name: 'Maraton', length: '42.195 km', price: 150, elevationGain: 100, category: [] },
  ],
  organizerId: 'o1',
  organizerName: 'Org',
  description: 'Opis',
  registrationStatus: 'open' as const,
  imageUrl: '/test.jpg',
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
    expect(screen.getByText(/15 września 2026/)).toBeInTheDocument();
  });

  it('renders registration badge for open events', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Zapisy otwarte/i)).toBeInTheDocument();
  });

  it('links to event details page', () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events/maraton-testowy');
  });
});
