import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import type { Event, Registration } from '@/types';

const api = vi.hoisted(() => ({
  checkCompetitorDuplicates: vi.fn(),
  transferRegistration: vi.fn(),
}));
vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

import { ApiRequestError } from '@/api/errors';
import { TransferRegistrationDialog } from '../TransferRegistrationDialog';

const event = { id: 'e1', name: 'Bieg Testowy' } as unknown as Event;
const registration = {
  id: 'r1',
  eventId: 'e1',
  distanceName: '10 km',
  userName: 'Jan Kowalski',
  status: 'confirmed',
} as Registration;

const renderDialog = (props: { onTransferred?: () => void } = {}) =>
  render(
    <TransferRegistrationDialog
      open
      onOpenChange={vi.fn()}
      registration={registration}
      event={event}
      {...props}
    />,
  );

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('TransferRegistrationDialog', () => {
  beforeEach(() => {
    api.checkCompetitorDuplicates.mockReset();
    api.transferRegistration.mockReset();
  });

  it('finds an existing Zawodnik, explains the consequences and transfers on confirm', async () => {
    api.checkCompetitorDuplicates.mockResolvedValue({
      success: true,
      data: [{ id: 'c9', firstName: 'Anna', lastName: 'Nowak', birthDate: '1990-05-01' }],
    });
    api.transferRegistration.mockResolvedValue({
      success: true,
      data: { ...registration, balanceDueMinor: 0, overpaymentMinor: 0 },
    });
    const onTransferred = vi.fn();
    renderDialog({ onTransferred });

    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
    type('Imię', 'Anna');
    type('Nazwisko', 'Nowak');
    type('Data urodzenia', '1990-05-01');
    fireEvent.click(screen.getByRole('button', { name: 'Szukaj zawodnika' }));

    fireEvent.click(await screen.findByRole('radio', { name: /Anna Nowak/ }));
    expect(api.checkCompetitorDuplicates).toHaveBeenCalledWith('Anna', 'Nowak', '1990-05-01');
    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));

    expect(screen.getByText(/Kod startowy zostanie wygenerowany od nowa/)).toBeInTheDocument();
    expect(screen.getByText(/Nie ma rozliczenia między osobami/)).toBeInTheDocument();
    expect(api.transferRegistration).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Przenieś zapis' }));

    await waitFor(() => expect(onTransferred).toHaveBeenCalledTimes(1));
    expect(api.transferRegistration).toHaveBeenCalledWith('r1', { competitorId: 'c9' });
  });

  it('says so when nobody is found', async () => {
    api.checkCompetitorDuplicates.mockResolvedValue({ success: true, data: [] });
    renderDialog();

    type('Imię', 'Ktoś');
    type('Nazwisko', 'Nieznany');
    fireEvent.click(screen.getByRole('button', { name: 'Szukaj zawodnika' }));

    expect(await screen.findByText(/Nie znaleziono takiego zawodnika/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
  });

  it('sends the data of a new person', async () => {
    api.transferRegistration.mockResolvedValue({
      success: true,
      data: { ...registration, balanceDueMinor: 0, overpaymentMinor: 0 },
    });
    renderDialog();

    fireEvent.change(screen.getByLabelText('Kto przejmuje zapis'), { target: { value: 'new' } });
    type('Imię', 'Ewa');
    type('Nazwisko', 'Nowa');
    type('Data urodzenia', '2000-01-02');
    fireEvent.change(screen.getByLabelText('Płeć'), { target: { value: 'K' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
    fireEvent.click(screen.getByRole('button', { name: 'Przenieś zapis' }));

    await waitFor(() => expect(api.transferRegistration).toHaveBeenCalledTimes(1));
    expect(api.transferRegistration).toHaveBeenCalledWith('r1', {
      newPerson: { firstName: 'Ewa', lastName: 'Nowa', birthDate: '2000-01-02', gender: 'K' },
    });
  });

  it('keeps the dialog open and shows the server error', async () => {
    api.transferRegistration.mockRejectedValue(
      new ApiRequestError('Ta osoba jest już zapisana na to wydarzenie.', 'x', 409),
    );
    const onTransferred = vi.fn();
    renderDialog({ onTransferred });

    fireEvent.change(screen.getByLabelText('Kto przejmuje zapis'), { target: { value: 'new' } });
    type('Imię', 'Ewa');
    type('Nazwisko', 'Nowa');
    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
    fireEvent.click(screen.getByRole('button', { name: 'Przenieś zapis' }));

    expect(await screen.findByText(/jest już zapisana/)).toBeInTheDocument();
    expect(onTransferred).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Przenieś zapis' })).toBeEnabled();
  });
});
