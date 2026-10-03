import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { EventSettingsTab } from '../EventSettingsTab';
import type { Event } from '@/types';

const submitEvent = vi.fn();
const cancelEvent = vi.fn();
const setEventVisibility = vi.fn();
const setEventIsTest = vi.fn();
const deleteEvent = vi.fn();

vi.mock('@/api', () => ({
  submitEvent: (...args: unknown[]) => submitEvent(...args),
  cancelEvent: (...args: unknown[]) => cancelEvent(...args),
  setEventVisibility: (...args: unknown[]) => setEventVisibility(...args),
  setEventIsTest: (...args: unknown[]) => setEventIsTest(...args),
  deleteEvent: (...args: unknown[]) => deleteEvent(...args),
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

const organizerOwner = { id: 'organizer-1', role: 'organizer' as const };
const otherOrganizer = { id: 'organizer-2', role: 'organizer' as const };
const admin = { id: 'admin-1', role: 'admin' as const };
const moderator = { id: 'moderator-1', role: 'moderator' as const };

describe('EventSettingsTab', () => {
  it('shows the test-mode toggle only while the event is a draft', () => {
    render(<EventSettingsTab event={baseEvent} />);
    expect(screen.getByText('Tryb testowy')).toBeInTheDocument();
    expect(screen.getByLabelText('Wydarzenie testowe')).toBeInTheDocument();
  });

  it('calls setEventIsTest (not the generic event update) when the test-mode toggle changes', async () => {
    const user = userEvent.setup();
    setEventIsTest.mockResolvedValue({ success: true, data: { ...baseEvent, isTest: true } });
    render(<EventSettingsTab event={baseEvent} />);

    await user.click(screen.getByLabelText('Wydarzenie testowe'));

    await waitFor(() => expect(setEventIsTest).toHaveBeenCalledWith('event-1', true));
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

  it("shows the moderator's reason on a draft that was sent back", () => {
    render(
      <EventSettingsTab
        event={{ ...baseEvent, publicationStatus: 'draft', rejectionReason: 'Brak mapy' }}
      />,
    );
    expect(screen.getByText(/Powod odrzucenia:/)).toBeInTheDocument();
    expect(screen.getByText(/Brak mapy/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Popraw i oddaj ponownie do sprawdzenia/i }),
    ).toBeInTheDocument();
  });

  it('shows the plain submit label on a never-reviewed draft', () => {
    render(<EventSettingsTab event={{ ...baseEvent, publicationStatus: 'draft' }} />);
    expect(screen.getByRole('button', { name: 'Oddaj do sprawdzenia' })).toBeInTheDocument();
    expect(screen.queryByText(/Powod odrzucenia/)).not.toBeInTheDocument();
  });

  it('only shows the visibility card once the event is published', () => {
    const { rerender } = render(<EventSettingsTab event={baseEvent} />);
    expect(screen.queryByText('Widocznosc')).not.toBeInTheDocument();

    rerender(<EventSettingsTab event={{ ...baseEvent, publicationStatus: 'published' }} />);
    expect(screen.getByText('Widocznosc')).toBeInTheDocument();
  });

  it('shows a cancel action for the owning organizer when the event is published, and calls cancelEvent on confirm', async () => {
    const user = userEvent.setup();
    cancelEvent.mockResolvedValue({ success: true, data: baseEvent });
    render(
      <EventSettingsTab
        event={{ ...baseEvent, publicationStatus: 'published' }}
        currentUser={organizerOwner}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Odwolaj wydarzenie' });
    await user.click(cancelButton);

    const confirmButton = await screen.findByRole('button', { name: 'Tak, odwolaj wydarzenie' });
    await user.click(confirmButton);

    await waitFor(() => expect(cancelEvent).toHaveBeenCalledWith('event-1'));
  });

  it('shows a cancel action for admin/superadmin on a published event', () => {
    render(
      <EventSettingsTab
        event={{ ...baseEvent, publicationStatus: 'published' }}
        currentUser={admin}
      />,
    );
    expect(screen.getByRole('button', { name: 'Odwolaj wydarzenie' })).toBeInTheDocument();
  });

  it('does not show a cancel action for a moderator, even on a published event', () => {
    render(
      <EventSettingsTab
        event={{ ...baseEvent, publicationStatus: 'published' }}
        currentUser={moderator}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Odwolaj wydarzenie' })).not.toBeInTheDocument();
  });

  it('does not show a cancel action for an organizer who does not own the event', () => {
    render(
      <EventSettingsTab
        event={{ ...baseEvent, publicationStatus: 'published' }}
        currentUser={otherOrganizer}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Odwolaj wydarzenie' })).not.toBeInTheDocument();
  });

  it('does not show a cancel action for a draft event', () => {
    render(<EventSettingsTab event={baseEvent} currentUser={organizerOwner} />);
    expect(screen.queryByRole('button', { name: 'Odwolaj wydarzenie' })).not.toBeInTheDocument();
  });
});
