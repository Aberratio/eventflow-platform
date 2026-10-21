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

describe('EditResultDialog', () => {
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

describe('EditResultDialog net time and places', () => {
  const withNumbers = { ...result, netTime: '00:44:30', position: 1, categoryPosition: 1 };

  const renderDialog = (value = withNumbers) =>
    render(
      <EditResultDialog
        open
        onOpenChange={vi.fn()}
        result={value}
        isOfficial={false}
        onSaved={vi.fn()}
      />,
    );

  it('prefills net time and places and sends only the changed ones', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByLabelText('Czas netto')).toHaveValue('00:44:30');
    expect(screen.getByLabelText('Miejsce (open)')).toHaveValue('1');
    const net = screen.getByLabelText('Czas netto');
    await user.clear(net);
    await user.type(net, '00:44:00');
    const place = screen.getByLabelText('Miejsce (open)');
    await user.clear(place);
    await user.type(place, '3');
    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));

    await waitFor(() => expect(updateResult).toHaveBeenCalledTimes(1));
    expect(updateResult).toHaveBeenCalledWith('r1', {
      time: '00:45:00',
      timeInSeconds: 2700,
      status: 'finished',
      netTime: '00:44:00',
      netTimeInSeconds: 2640,
      position: 3,
    });
  });

  it('sends null for an emptied net time and place', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.clear(screen.getByLabelText('Czas netto'));
    await user.clear(screen.getByLabelText('Miejsce w kategorii'));
    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));

    await waitFor(() => expect(updateResult).toHaveBeenCalledTimes(1));
    expect(updateResult.mock.calls[0][1]).toMatchObject({
      netTime: null,
      netTimeInSeconds: null,
      categoryPosition: null,
    });
    expect(updateResult.mock.calls[0][1]).not.toHaveProperty('position');
  });

  it('rejects a malformed net time and a non-positive place', async () => {
    const user = userEvent.setup();
    renderDialog();

    const net = screen.getByLabelText('Czas netto');
    await user.clear(net);
    await user.type(net, '44:30');
    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));
    expect(await screen.findByText(/format czasu netto/)).toBeInTheDocument();

    await user.clear(net);
    await user.type(net, '00:44:30');
    const place = screen.getByLabelText('Miejsce (open)');
    await user.clear(place);
    await user.type(place, '0');
    await user.click(screen.getByRole('button', { name: 'Zapisz korektę' }));
    expect(await screen.findByText(/Miejsce musi być dodatnią/)).toBeInTheDocument();
    expect(updateResult).not.toHaveBeenCalled();
  });
});

describe('ResultCorrectionsDialog', () => {
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
