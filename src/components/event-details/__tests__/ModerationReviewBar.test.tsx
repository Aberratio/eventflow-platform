import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ModerationReviewBar } from '../ModerationReviewBar';
import type { Event } from '@/types';

const approveEvent = vi.fn();
const rejectEvent = vi.fn();

vi.mock('@/api', () => ({
  approveEvent: (...args: unknown[]) => approveEvent(...args),
  rejectEvent: (...args: unknown[]) => rejectEvent(...args),
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
  publicationStatus: 'submitted',
  registrationDeadline: '2026-06-01',
  featured: false,
};

describe('ModerationReviewBar', () => {
  it('shows approve/reject actions when the event is submitted', async () => {
    const user = userEvent.setup();
    approveEvent.mockResolvedValue({ success: true, data: baseEvent });
    render(<ModerationReviewBar event={baseEvent} />);

    expect(screen.getByText('Wydarzenie oczekuje na Twoją decyzję.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zatwierdź/i }));

    await waitFor(() => expect(approveEvent).toHaveBeenCalledWith('event-1'));
  });

  it('does not show approve/reject actions for a draft preview', () => {
    render(<ModerationReviewBar event={{ ...baseEvent, publicationStatus: 'draft' }} />);

    expect(screen.getByText(/nie zostało jeszcze oddane do sprawdzenia/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zatwierdź/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Odeślij/i })).not.toBeInTheDocument();
  });

  it('shows a rejected-context message without action buttons', () => {
    render(<ModerationReviewBar event={{ ...baseEvent, publicationStatus: 'rejected' }} />);

    expect(screen.getByText(/zostało odrzucone/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zatwierdź/i })).not.toBeInTheDocument();
  });
});
