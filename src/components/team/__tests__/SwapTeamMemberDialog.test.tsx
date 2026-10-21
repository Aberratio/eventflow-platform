import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, resetQueryClient, screen, waitFor } from '@/test/test-utils';
import { ApiRequestError } from '@/api/errors';
import type { Registration } from '@/types';
import SwapTeamMemberDialog from '../SwapTeamMemberDialog';

/**
 * The swap form. New person => `newPerson` payload; a known Zawodnik (captain
 * flow only) => `competitorId`; a server refusal (e.g. the deadline) is shown, not swallowed.
 */

const mockSwap = vi.fn();
const mockGetCare = vi.fn();
const mockToast = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    swapTeamMember: (...args: unknown[]) => mockSwap(...args),
    getCare: (...args: unknown[]) => mockGetCare(...args),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({ toast: (...args: unknown[]) => mockToast(...args) }),
}));

const swapped = { id: 'r1', teamId: 't1', userName: 'Nowy Zawodnik' } as Registration;

const renderDialog = (props: Partial<React.ComponentProps<typeof SwapTeamMemberDialog>> = {}) => {
  const onOpenChange = vi.fn();
  const onSwapped = vi.fn();
  render(
    <SwapTeamMemberDialog
      open
      onOpenChange={onOpenChange}
      teamId="t1"
      registrationId="r1"
      memberName="Jan Kontuzjowany"
      onSwapped={onSwapped}
      {...props}
    />,
  );
  return { onOpenChange, onSwapped };
};

describe('SwapTeamMemberDialog', () => {
  beforeEach(() => {
    // jsdom lacks the pointer/scroll APIs Radix Select calls when it opens.
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.releasePointerCapture = vi.fn();
    resetQueryClient();
    mockSwap.mockReset();
    mockGetCare.mockReset();
    mockToast.mockReset();
  });

  it('keeps the submit button disabled until first and last name are filled', () => {
    renderDialog();

    const submit = screen.getByRole('button', { name: 'Wymień zawodnika' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Imię'), { target: { value: 'Ola' } });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nazwisko'), { target: { value: 'Nowak' } });
    expect(submit).toBeEnabled();
  });

  it('sends the new person to the swap endpoint and reports the updated Zapis', async () => {
    mockSwap.mockResolvedValue({ success: true, data: swapped });
    const { onOpenChange, onSwapped } = renderDialog();

    fireEvent.change(screen.getByLabelText('Imię'), { target: { value: ' Ola ' } });
    fireEvent.change(screen.getByLabelText('Nazwisko'), { target: { value: 'Nowak' } });
    fireEvent.change(screen.getByLabelText('Data urodzenia'), { target: { value: '1990-04-04' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wymień zawodnika' }));

    await waitFor(() =>
      expect(mockSwap).toHaveBeenCalledWith('t1', 'r1', {
        newPerson: { firstName: 'Ola', lastName: 'Nowak', birthDate: '1990-04-04' },
      }),
    );
    await waitFor(() => expect(onSwapped).toHaveBeenCalledWith(swapped));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Zawodnik wymieniony' }),
    );
  });

  it('shows the server message when the swap is refused (deadline passed)', async () => {
    mockSwap.mockRejectedValue(
      new ApiRequestError(
        'Termin wymiany zawodnika w drużynie minął.',
        'team_swap_deadline_passed',
        409,
      ),
    );
    const { onSwapped } = renderDialog();

    fireEvent.change(screen.getByLabelText('Imię'), { target: { value: 'Ola' } });
    fireEvent.change(screen.getByLabelText('Nazwisko'), { target: { value: 'Nowak' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wymień zawodnika' }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: 'Termin wymiany zawodnika w drużynie minął.',
        }),
      ),
    );
    expect(onSwapped).not.toHaveBeenCalled();
  });

  it('does not offer known Zawodnicy to the organizer', () => {
    renderDialog();

    expect(mockGetCare).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Kto wchodzi do składu')).not.toBeInTheDocument();
  });

  it('offers the captain own profile and wards, and sends the chosen competitorId', async () => {
    mockGetCare.mockResolvedValue({
      success: true,
      data: {
        myProfile: { id: 'c-me', firstName: 'Jan', lastName: 'Kapitan' },
        myCompetitors: [
          { id: 'care1', competitorId: 'c-kid', firstName: 'Zosia', lastName: 'Kapitan' },
        ],
        caregivers: [],
      },
    });
    mockSwap.mockResolvedValue({ success: true, data: swapped });
    renderDialog({ offerCareCompetitors: true });

    const select = await screen.findByLabelText('Kto wchodzi do składu');
    fireEvent.keyDown(select, { key: 'Enter' });
    fireEvent.click(
      await screen.findByText('Zosia Kapitan', { selector: '[role=option] *, [role=option]' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Wymień zawodnika' }));

    await waitFor(() =>
      expect(mockSwap).toHaveBeenCalledWith('t1', 'r1', { competitorId: 'c-kid' }),
    );
  });
});
