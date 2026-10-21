import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { BibNumberAssignment } from '../BibNumberAssignment';
import type { Event, Registration } from '@/types';

const assignBibNumbers = vi.fn();
const updateRegistration = vi.fn();

vi.mock('@/api', () => ({
  assignBibNumbers: (...args: unknown[]) => assignBibNumbers(...args),
  updateRegistration: (...args: unknown[]) => updateRegistration(...args),
}));

const event = {
  id: 'evt-1',
  distances: [
    { id: 'd10', name: '10 km', bibRangeFrom: 1, bibRangeTo: 99 },
    { id: 'd5', name: '5 km', bibRangeFrom: null, bibRangeTo: null },
  ],
} as unknown as Event;

const reg = (id: string, distanceId: string, extra: Partial<Registration> = {}): Registration =>
  ({
    id,
    distanceId,
    userName: id,
    status: 'confirmed',
    registeredAt: '2026-01-10T10:00:00Z',
    ...extra,
  }) as Registration;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BibNumberAssignment (R-13)', () => {
  it('shows the range of each distance', () => {
    render(
      <BibNumberAssignment event={event} registrations={[]} onRegistrationsChange={vi.fn()} />,
    );
    expect(screen.getByText('Zakres 1–99')).toBeInTheDocument();
    expect(screen.getByText('Brak zakresu')).toBeInTheDocument();
  });

  it('asks the server to assign numbers and applies the returned assignments', async () => {
    assignBibNumbers.mockResolvedValueOnce({
      success: true,
      data: { assigned: 1, assignments: [{ registrationId: 'a', bibNumber: '001' }], skipped: [] },
    });
    const onChange = vi.fn();
    const registrations = [reg('a', 'd10'), reg('b', 'd5')];
    render(
      <BibNumberAssignment
        event={event}
        registrations={registrations}
        onRegistrationsChange={onChange}
      />,
    );

    // only the registration in the ranged distance is eligible
    const button = screen.getByRole('button', { name: /Nadaj numery startowe \(1\)/ });
    await userEvent.click(button);

    await waitFor(() => expect(assignBibNumbers).toHaveBeenCalledTimes(1));
    expect(assignBibNumbers).toHaveBeenCalledWith('evt-1', {
      distanceIds: ['d10', 'd5'],
      order: 'registered',
      paidOnly: true,
    });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const updated = onChange.mock.calls[0][0] as Registration[];
    expect(updated.find((r) => r.id === 'a')?.bibNumber).toBe('001');
    expect(updated.find((r) => r.id === 'b')?.bibNumber).toBeUndefined();
  });

  it('does not change registrations when the server rejects the assignment', async () => {
    assignBibNumbers.mockRejectedValueOnce(new Error('boom'));
    const onChange = vi.fn();
    render(
      <BibNumberAssignment
        event={event}
        registrations={[reg('a', 'd10')]}
        onRegistrationsChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Nadaj numery startowe/ }));
    await waitFor(() => expect(assignBibNumbers).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });
});
