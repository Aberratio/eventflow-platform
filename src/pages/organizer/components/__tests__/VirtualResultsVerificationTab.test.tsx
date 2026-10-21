import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { VirtualResultsVerificationTab } from '../VirtualResultsVerificationTab';
import type { Event, VirtualResultSubmission } from '@/types';

const getVirtualResultSubmissions = vi.fn();
const reviewVirtualResult = vi.fn();
const toast = vi.fn();

vi.mock('@/api', () => ({
  getVirtualResultSubmissions: (...args: unknown[]) => getVirtualResultSubmissions(...args),
  reviewVirtualResult: (...args: unknown[]) => reviewVirtualResult(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

const event: Event = {
  id: 'event-virtual',
  name: 'Wirtualny Bieg',
  slug: 'wirtualny-bieg',
  discipline: 'running',
  date: '2026-06-21',
  location: 'Wirtualnie',
  city: 'Online',
  description: 'Test',
  imageUrl: 'https://example.test/event.jpg',
  distances: [
    {
      id: 'distance-10k',
      name: '10 km',
      length: 10,
      unit: 'km',
      categories: ['Open'],
      registeredCount: 1,
      price: 50,
    },
  ],
  organizerId: 'organizer',
  organizerName: 'Organizer',
  publicationStatus: 'published',
  registrationDeadline: '2026-06-01',
  featured: false,
  isVirtual: true,
};

const submission: VirtualResultSubmission = {
  id: 'submission-1',
  eventId: event.id,
  eventName: event.name,
  distanceId: 'distance-10k',
  distanceName: '10 km',
  userId: 'participant',
  userName: 'Anna Testowa',
  userEmail: 'anna@example.test',
  submittedTime: '00:45:00',
  submittedTimeInSeconds: 2700,
  submittedAt: '2026-06-21T08:00:00Z',
  status: 'pending',
};

describe('VirtualResultsVerificationTab', () => {
  it('approves pending virtual result through API', async () => {
    getVirtualResultSubmissions.mockResolvedValue({ success: true, data: [submission] });
    reviewVirtualResult.mockResolvedValue({
      success: true,
      data: { ...submission, status: 'approved' },
    });
    const user = userEvent.setup();

    render(<VirtualResultsVerificationTab event={event} />);

    expect(await screen.findByText('Anna Testowa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zatwierdź wynik Anna Testowa' }));

    await waitFor(() => {
      expect(reviewVirtualResult).toHaveBeenCalledWith('submission-1', 'approved');
    });
  });
});

describe('VirtualResultsVerificationTab proof link safety', () => {
  it('shows plain text instead of a link for a javascript: proofUrl', async () => {
    getVirtualResultSubmissions.mockResolvedValue({
      success: true,
      data: [{ ...submission, proofUrl: 'javascript:window.__xss=1' }],
    });

    const { container } = render(<VirtualResultsVerificationTab event={event} />);

    expect(await screen.findByText('Anna Testowa')).toBeInTheDocument();
    expect(screen.getByText('Nieprawidłowy link do dowodu')).toBeInTheDocument();
    expect(container.querySelector('a[href^="javascript" i]')).toBeNull();
    expect(screen.queryByRole('link', { name: /zobacz dowód/i })).toBeNull();
  });

  it('links an https proofUrl', async () => {
    getVirtualResultSubmissions.mockResolvedValue({
      success: true,
      data: [{ ...submission, proofUrl: 'https://strava.com/activities/1' }],
    });

    render(<VirtualResultsVerificationTab event={event} />);

    const link = await screen.findByRole('link', { name: /zobacz dowód/i });
    expect(link).toHaveAttribute('href', 'https://strava.com/activities/1');
  });
});
