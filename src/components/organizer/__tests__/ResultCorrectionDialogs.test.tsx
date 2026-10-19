import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { EditResultDialog } from '../EditResultDialog';
import { ResultCorrectionsDialog } from '../ResultCorrectionsDialog';

const updateResult = vi.fn();
const getResultCorrections = vi.fn();

vi.mock('@/api', () => ({
  updateResult: (...args: unknown[]) => updateResult(...args),
  getResultCorrections: (...args: unknown[]) => getResultCorrections(...args),
}));

const result = {
  id: 'r1',
  bibNumber: '101',
  userName: 'Jan Kowalski',
  time: '00:45:00',
  status: 'finished' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  updateResult.mockResolvedValue({ success: true, data: { id: 'r1' } });
});

describe('EditResultDialog (G-03)', () => {
  it('sends the new time, status and the reason of the correction', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <EditResultDialog
        open
        onOpenChange={vi.fn()}
        result={result}
        isOfficial={false}
        onSaved={onSaved}
      />,
    );

    const time = screen.getByLabelText('Czas');
    await user.clear(time);
    await user.type(time, '00:44:10');
    await user.type(screen.getByLabelText(/Powód korekty/), 'Błędny odczyt maty');
    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));

    await waitFor(() =>
      expect(updateResult).toHaveBeenCalledWith('r1', {
        time: '00:44:10',
        timeInSeconds: 2650,
        status: 'finished',
        reason: 'Błędny odczyt maty',
      }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('requires a reason once the results are official', async () => {
    const user = userEvent.setup();
    render(
      <EditResultDialog open onOpenChange={vi.fn()} result={result} isOfficial onSaved={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));

    expect(await screen.findByText(/Podaj powód korekty/)).toBeInTheDocument();
    expect(updateResult).not.toHaveBeenCalled();
  });

  it('omits the reason when left empty on preliminary results', async () => {
    const user = userEvent.setup();
    render(
      <EditResultDialog
        open
        onOpenChange={vi.fn()}
        result={result}
        isOfficial={false}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));

    await waitFor(() => expect(updateResult).toHaveBeenCalledTimes(1));
    expect(updateResult.mock.calls[0][1]).not.toHaveProperty('reason');
  });
});

describe('ResultCorrectionsDialog (G-03)', () => {
  it('lists who, when, what changed (from -> to) and why', async () => {
    getResultCorrections.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'c1',
          resultId: 'r1',
          correctedBy: 'u1',
          correctedByName: 'Anna Organizator',
          correctedAt: '2026-10-19T10:00:00+00:00',
          reason: 'Błędny odczyt maty',
          wasOfficial: true,
          changes: {
            time: { from: '00:45:00', to: '00:44:10' },
            status: { from: 'finished', to: 'dsq' },
          },
        },
      ],
    });
    render(
      <ResultCorrectionsDialog open onOpenChange={vi.fn()} resultId="r1" title="Jan Kowalski" />,
    );

    expect(await screen.findByText('Anna Organizator')).toBeInTheDocument();
    expect(screen.getByText(/00:45:00/)).toBeInTheDocument();
    expect(screen.getByText(/00:44:10/)).toBeInTheDocument();
    expect(screen.getByText('Błędny odczyt maty')).toBeInTheDocument();
    expect(screen.getByText(/po publikacji oficjalnej/i)).toBeInTheDocument();
    expect(getResultCorrections).toHaveBeenCalledWith('r1');
  });

  it('says so when there are no corrections', async () => {
    getResultCorrections.mockResolvedValue({ success: true, data: [] });
    render(<ResultCorrectionsDialog open onOpenChange={vi.fn()} resultId="r1" />);

    expect(await screen.findByText('Ten wynik nie był korygowany.')).toBeInTheDocument();
  });
});
