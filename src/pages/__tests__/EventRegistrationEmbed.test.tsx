import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, resetQueryClient } from '@/test/test-utils';
import EventRegistrationEmbed from '../EventRegistrationEmbed';

const { getEventBySlug } = vi.hoisted(() => ({ getEventBySlug: vi.fn() }));

vi.mock('@/api', () => ({ getEventBySlug }));
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useParams: () => ({ slug: 'bieg-testowy' }),
}));

const zcEvent = {
  id: 'ev-1',
  slug: 'bieg-testowy',
  name: 'Bieg Testowy',
  date: '2026-09-15',
  location: 'Park Miejski',
  city: 'Łódź',
};

describe('EventRegistrationEmbed', () => {
  beforeEach(() => resetQueryClient());

  it('shows event name, date, place and a registration CTA for a Zmierzymy Czas form event', async () => {
    getEventBySlug.mockResolvedValue({ data: zcEvent });
    render(<EventRegistrationEmbed />);

    expect(await screen.findByRole('heading', { name: 'Bieg Testowy' })).toBeInTheDocument();
    expect(screen.getByText(/15 września 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Park Miejski/)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'Przejdź do zapisów' });
    expect(cta).toHaveAttribute('href', '/events/bieg-testowy/register');
    // The regular site is not frameable, so the CTA must leave the iframe.
    expect(cta).toHaveAttribute('target', '_blank');
  });
});
