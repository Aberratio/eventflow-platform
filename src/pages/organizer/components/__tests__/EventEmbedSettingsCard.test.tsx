import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { EventEmbedSettingsCard } from '../EventEmbedSettingsCard';
import type { Event } from '@/types';

const updateEvent = vi.fn();

vi.mock('@/api', () => ({
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}));

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
  publicationStatus: 'draft',
  registrationDeadline: '2026-06-01',
  featured: false,
  embedEnabled: false,
  embedAllowedOrigins: [],
};

describe('EventEmbedSettingsCard', () => {
  beforeEach(() => {
    updateEvent.mockReset();
  });

  it('round-trips enabling embedding and adding an allowed origin', async () => {
    const user = userEvent.setup();
    updateEvent.mockResolvedValue({
      success: true,
      data: { ...baseEvent, embedEnabled: true, embedAllowedOrigins: ['https://example.com'] },
    });

    render(<EventEmbedSettingsCard event={baseEvent} />);

    await user.click(screen.getByLabelText('Udostępnij formularz do osadzenia'));

    await user.type(screen.getByPlaceholderText('https://przyklad.pl'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /Dodaj/i }));
    expect(screen.getByText('https://example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zapisz ustawienia osadzania/i }));

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith('event-1', {
        embedEnabled: true,
        embedAllowedOrigins: ['https://example.com'],
      }),
    );
  });

  it('removes an allowed origin from the list before saving', async () => {
    const user = userEvent.setup();
    updateEvent.mockResolvedValue({ success: true, data: baseEvent });

    render(
      <EventEmbedSettingsCard
        event={{ ...baseEvent, embedEnabled: true, embedAllowedOrigins: ['https://example.com'] }}
      />,
    );

    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Usuń https://example.com'));
    expect(screen.queryByText('https://example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zapisz ustawienia osadzania/i }));

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith('event-1', {
        embedEnabled: true,
        embedAllowedOrigins: [],
      }),
    );
  });

  it('rejects an origin with a path via the client-side sanity check, without calling the API', async () => {
    const user = userEvent.setup();

    render(<EventEmbedSettingsCard event={baseEvent} />);

    await user.type(screen.getByPlaceholderText('https://przyklad.pl'), 'https://example.com/path');
    await user.click(screen.getByRole('button', { name: /Dodaj/i }));

    expect(
      screen.getByText('Podaj sam adres, np. https://przyklad.pl (bez ścieżki, bez /).'),
    ).toBeInTheDocument();
    expect(screen.queryByText('https://example.com/path')).not.toBeInTheDocument();
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it('shows the server validation error on a 422-style rejection', async () => {
    const user = userEvent.setup();
    updateEvent.mockRejectedValue(
      new Error('Each embedAllowedOrigins entry must be a bare origin'),
    );

    render(<EventEmbedSettingsCard event={baseEvent} />);
    await user.click(screen.getByRole('button', { name: /Zapisz ustawienia osadzania/i }));

    await waitFor(() => expect(updateEvent).toHaveBeenCalled());
  });
});
