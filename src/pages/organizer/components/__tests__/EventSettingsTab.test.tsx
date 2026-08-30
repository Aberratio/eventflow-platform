import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { EventSettingsTab } from '../EventSettingsTab';
import type { Event } from '@/types';

const submitEvent = vi.fn();
const cancelEvent = vi.fn();
const updateEvent = vi.fn();
const setEventVisibility = vi.fn();
const deleteEvent = vi.fn();
const updateEventStatus = vi.fn();

vi.mock('@/api', () => ({
  submitEvent: (...args: unknown[]) => submitEvent(...args),
  cancelEvent: (...args: unknown[]) => cancelEvent(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
  setEventVisibility: (...args: unknown[]) => setEventVisibility(...args),
  deleteEvent: (...args: unknown[]) => deleteEvent(...args),
  updateEventStatus: (...args: unknown[]) => updateEventStatus(...args),
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
};

describe('EventSettingsTab', () => {
  it('shows the test-mode toggle only while the event is a draft', () => {
    render(<EventSettingsTab event={baseEvent} />);
    expect(screen.getByText('Tryb testowy')).toBeInTheDocument();
    expect(screen.getByLabelText('Wydarzenie testowe')).toBeInTheDocument();
  });

  it('hides the test-mode toggle once the event is published', () => {
    render(<EventSettingsTab event={{ ...baseEvent, publicationStatus: 'published' }} />);
    expect(screen.queryByText('Tryb testowy')).not.toBeInTheDocument();
  });

  it('shows the rejection reason and a resubmit label when rejected', () => {
    render(
      <EventSettingsTab
        event={{
          ...baseEvent,
          publicationStatus: 'rejected',
          rejectionReason: 'Brakuje regulaminu',
        }}
      />,
    );
    expect(screen.getByText(/Brakuje regulaminu/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Popraw i oddaj ponownie do sprawdzenia/i }),
    ).toBeInTheDocument();
  });

  it('only shows the visibility card once the event is published', () => {
    const { rerender } = render(<EventSettingsTab event={baseEvent} />);
    expect(screen.queryByText('Widocznosc')).not.toBeInTheDocument();

    rerender(<EventSettingsTab event={{ ...baseEvent, publicationStatus: 'published' }} />);
    expect(screen.getByText('Widocznosc')).toBeInTheDocument();
  });

  it('shows a cancel action only when the event is published, and calls cancelEvent on confirm', async () => {
    const user = userEvent.setup();
    cancelEvent.mockResolvedValue({ success: true, data: baseEvent });
    render(<EventSettingsTab event={{ ...baseEvent, publicationStatus: 'published' }} />);

    const cancelButton = screen.getByRole('button', { name: 'Odwolaj wydarzenie' });
    await user.click(cancelButton);

    const confirmButton = await screen.findByRole('button', { name: 'Tak, odwolaj wydarzenie' });
    await user.click(confirmButton);

    await waitFor(() => expect(cancelEvent).toHaveBeenCalledWith('event-1'));
  });

  it('does not show a cancel action for a draft event', () => {
    render(<EventSettingsTab event={baseEvent} />);
    expect(screen.queryByRole('button', { name: 'Odwolaj wydarzenie' })).not.toBeInTheDocument();
  });
});
