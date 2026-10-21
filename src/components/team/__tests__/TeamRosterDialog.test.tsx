import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, resetQueryClient, screen, waitFor } from '@/test/test-utils';
import TeamRosterDialog from '../TeamRosterDialog';

const mockGetTeamMembers = vi.fn();
const mockSwap = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getTeamMembers: (...args: unknown[]) => mockGetTeamMembers(...args),
    swapTeamMember: (...args: unknown[]) => mockSwap(...args),
    getCare: () =>
      Promise.resolve({
        success: true,
        data: { myProfile: null, myCompetitors: [], caregivers: [] },
      }),
  };
});

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

/** The captain picks the member to swap out from the server-provided roster. */
describe('TeamRosterDialog', () => {
  beforeEach(() => {
    resetQueryClient();
    mockGetTeamMembers.mockReset();
    mockSwap.mockReset();
  });

  it('lists the roster and opens the swap form for the chosen member', async () => {
    mockGetTeamMembers.mockResolvedValue({
      success: true,
      data: [
        {
          registrationId: 'r1',
          name: 'Jan Kapitan',
          status: 'confirmed',
          bibNumber: '12',
          competitorId: 'c1',
        },
        {
          registrationId: 'r2',
          name: 'Anna Kontuzjowana',
          status: 'confirmed',
          bibNumber: null,
          competitorId: 'c2',
        },
      ],
    });
    mockSwap.mockResolvedValue({ success: true, data: { id: 'r2', teamId: 't1' } });

    render(<TeamRosterDialog open onOpenChange={vi.fn()} teamId="t1" teamName="Szybcy" />);

    expect(await screen.findByText('Jan Kapitan')).toBeInTheDocument();
    expect(screen.getByText('Nr startowy 12')).toBeInTheDocument();
    expect(mockGetTeamMembers).toHaveBeenCalledWith('t1');

    fireEvent.click(screen.getAllByRole('button', { name: 'Wymień zawodnika' })[1]);
    fireEvent.change(await screen.findByLabelText('Imię'), { target: { value: 'Ola' } });
    fireEvent.change(screen.getByLabelText('Nazwisko'), { target: { value: 'Nowak' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Wymień zawodnika' }).at(-1)!);

    await waitFor(() =>
      expect(mockSwap).toHaveBeenCalledWith('t1', 'r2', {
        newPerson: { firstName: 'Ola', lastName: 'Nowak' },
      }),
    );
  });

  it('says so when the roster cannot be loaded', async () => {
    mockGetTeamMembers.mockRejectedValue(new Error('403'));

    render(<TeamRosterDialog open onOpenChange={vi.fn()} teamId="t1" teamName="Szybcy" />);

    expect(await screen.findByText('Nie udało się wczytać składu drużyny.')).toBeInTheDocument();
  });
});
