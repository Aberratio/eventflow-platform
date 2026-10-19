import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSettingsTab } from '@/pages/admin/components/AdminSettingsTab';
import {
  getChallengePointsSettings,
  updateChallengePointsSettings,
  getGlobalInsuranceSettings,
  getCalendarSettings,
  updateCalendarSettings,
} from '@/api';
import type {
  ChallengePointsSettings,
  GlobalInsuranceSettings,
  GoogleCalendarSettings,
} from '@/types';

// E6.2 (issue 15 §2): admin UI for the global points-per-place table that
// drives a Wyzwanie's point_threshold condition node scoring.

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getChallengePointsSettings: vi.fn(),
    updateChallengePointsSettings: vi.fn(),
    getGlobalInsuranceSettings: vi.fn(),
    updateGlobalInsuranceSettings: vi.fn(),
    getCalendarSettings: vi.fn(),
    updateCalendarSettings: vi.fn(),
  };
});

const mockedGetChallengePointsSettings = vi.mocked(getChallengePointsSettings);
const mockedUpdateChallengePointsSettings = vi.mocked(updateChallengePointsSettings);
const mockedGetGlobalInsuranceSettings = vi.mocked(getGlobalInsuranceSettings);
const mockedGetCalendarSettings = vi.mocked(getCalendarSettings);
const mockedUpdateCalendarSettings = vi.mocked(updateCalendarSettings);

const pointsSettings: ChallengePointsSettings = {
  pointsTable: [100, 95, 90],
  floorPoints: 5,
};

const insuranceSettings: GlobalInsuranceSettings = {
  infoHtml: '',
  baseFee: 15,
  ageMultiplier: 0.5,
  maxAge: 70,
};

const calendarSettings: GoogleCalendarSettings = {
  credentialsConfigured: false,
  connected: false,
  enabled: false,
};

describe('AdminSettingsTab — Challenge points settings (E6.2)', () => {
  beforeEach(() => {
    mockedGetChallengePointsSettings.mockResolvedValue({ data: pointsSettings } as never);
    mockedUpdateChallengePointsSettings.mockResolvedValue({ data: pointsSettings } as never);
    mockedGetGlobalInsuranceSettings.mockResolvedValue({ data: insuranceSettings } as never);
    mockedGetCalendarSettings.mockResolvedValue({ data: calendarSettings } as never);
  });

  it('renders one row per configured place plus the floor value', async () => {
    render(<AdminSettingsTab />);

    expect(await screen.findByText('Punktacja Wyzwań')).toBeInTheDocument();
    expect(screen.getByLabelText('Miejsce 1')).toHaveValue(100);
    expect(screen.getByLabelText('Miejsce 2')).toHaveValue(95);
    expect(screen.getByLabelText('Miejsce 3')).toHaveValue(90);
    expect(screen.getByLabelText(/Punkty za miejsce poza tabelą/)).toHaveValue(5);
  });

  it('editing a place value and saving sends the updated table', async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTab />);

    const place2 = await screen.findByLabelText('Miejsce 2');
    await user.clear(place2);
    await user.type(place2, '80');

    await user.click(screen.getByRole('button', { name: /Zapisz tabelę punktacji/ }));

    await waitFor(() => {
      expect(mockedUpdateChallengePointsSettings).toHaveBeenCalledWith(
        expect.objectContaining({ pointsTable: [100, 80, 90], floorPoints: 5 }),
      );
    });
  });

  it('"Dodaj miejsce" appends a new row seeded from the last value', async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTab />);

    await screen.findByLabelText('Miejsce 3');
    await user.click(screen.getByRole('button', { name: /Dodaj miejsce/ }));

    expect(await screen.findByLabelText('Miejsce 4')).toHaveValue(90);
  });

  it('removing a place row drops only that row and re-saves without it', async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTab />);

    await screen.findByLabelText('Miejsce 3');
    await user.click(screen.getByLabelText('Usuń miejsce 2'));

    expect(screen.queryByLabelText('Miejsce 3')).not.toBeInTheDocument();
    // What used to be place 3 (90) is now labelled place 2, place 1 untouched.
    expect(screen.getByLabelText('Miejsce 1')).toHaveValue(100);
    expect(screen.getByLabelText('Miejsce 2')).toHaveValue(90);

    await user.click(screen.getByRole('button', { name: /Zapisz tabelę punktacji/ }));

    await waitFor(() => {
      expect(mockedUpdateChallengePointsSettings).toHaveBeenCalledWith(
        expect.objectContaining({ pointsTable: [100, 90] }),
      );
    });
  });

  it('editing the floor value and saving sends it with the unchanged table', async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTab />);

    const floor = await screen.findByLabelText(/Punkty za miejsce poza tabelą/);
    await user.clear(floor);
    await user.type(floor, '10');

    await user.click(screen.getByRole('button', { name: /Zapisz tabelę punktacji/ }));

    await waitFor(() => {
      expect(mockedUpdateChallengePointsSettings).toHaveBeenCalledWith(
        expect.objectContaining({ floorPoints: 10, pointsTable: [100, 95, 90] }),
      );
    });
  });

  it('negative input is clamped to zero rather than sent as-is', async () => {
    render(<AdminSettingsTab />);

    const floor = await screen.findByLabelText(/Punkty za miejsce poza tabelą/);
    // userEvent.type() can't drive a "-" keystroke into a native
    // type="number" input under jsdom reliably - fireEvent.change with the
    // raw string reproduces what a browser would deliver to onChange.
    fireEvent.change(floor, { target: { value: '-5' } });

    expect(floor).toHaveValue(0);
  });
});

// R-17 (umowa §5.9): the admin can configure the Google Calendar integration; the service-account
// key itself lives only on the server, the panel only shows whether it is there.
describe('AdminSettingsTab — Google Calendar (R-17)', () => {
  beforeEach(() => {
    mockedGetChallengePointsSettings.mockResolvedValue({ data: pointsSettings } as never);
    mockedGetGlobalInsuranceSettings.mockResolvedValue({ data: insuranceSettings } as never);
    mockedUpdateCalendarSettings.mockReset();
    mockedUpdateCalendarSettings.mockResolvedValue({ data: calendarSettings } as never);
  });

  it('without a server key shows the "contact the server administrator" status', async () => {
    mockedGetCalendarSettings.mockResolvedValue({ data: calendarSettings } as never);
    render(<AdminSettingsTab />);

    expect(await screen.findByText('Brak klucza konta usługi Google')).toBeInTheDocument();
    expect(screen.getByText(/Skontaktuj się z administratorem serwera/)).toBeInTheDocument();
  });

  it('with a key shows it as configured', async () => {
    mockedGetCalendarSettings.mockResolvedValue({
      data: {
        ...calendarSettings,
        credentialsConfigured: true,
        connected: true,
        enabled: true,
        calendarId: 'a@b',
      },
    } as never);
    render(<AdminSettingsTab />);

    expect(await screen.findByText('Klucz konta usługi Google skonfigurowany')).toBeInTheDocument();
    expect(screen.getByText('Integracja aktywna')).toBeInTheDocument();
  });

  it('saves the calendar id and sends only that field', async () => {
    const user = userEvent.setup();
    mockedGetCalendarSettings.mockResolvedValue({ data: calendarSettings } as never);
    render(<AdminSettingsTab />);

    const input = await screen.findByLabelText('ID kalendarza Google');
    await user.type(input, 'zawody@group.calendar.google.com');
    await user.click(screen.getByRole('button', { name: /^Zapisz$/ }));

    await waitFor(() => {
      expect(mockedUpdateCalendarSettings).toHaveBeenCalledWith({
        calendarId: 'zawody@group.calendar.google.com',
      });
    });
  });

  it('the enable switch is locked until a calendar id exists, then sends only enabled', async () => {
    const user = userEvent.setup();
    mockedGetCalendarSettings.mockResolvedValue({ data: calendarSettings } as never);
    const { unmount } = render(<AdminSettingsTab />);
    expect(
      await screen.findByRole('switch', { name: 'Automatyczne dodawanie wydarzeń' }),
    ).toBeDisabled();
    unmount();

    mockedGetCalendarSettings.mockResolvedValue({
      data: { ...calendarSettings, calendarId: 'a@b' },
    } as never);
    render(<AdminSettingsTab />);
    await user.click(
      await screen.findByRole('switch', { name: 'Automatyczne dodawanie wydarzeń' }),
    );

    await waitFor(() => {
      expect(mockedUpdateCalendarSettings).toHaveBeenCalledWith({ enabled: true });
    });
  });
});
