import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TicketPrintPage from '../TicketPrintPage';

const START_CODE = `pqr_${'b2'.repeat(24)}`;
const IDENTITY_CODE = `zqr_${'c3'.repeat(24)}`;

const api = vi.hoisted(() => ({
  getRegistrationsByUser: vi.fn(),
  getEventById: vi.fn(),
  getCare: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Jan Testowy', role: 'participant' } }),
}));
vi.mock('@/api', () => api);

const registration = (status: string) => ({
  id: 'reg-1',
  eventId: 'ev-1',
  eventName: 'Bieg Testowy',
  userId: 'user-1',
  competitorId: 'comp-1',
  userName: 'Jan Testowy',
  distanceId: 'd-1',
  distanceName: '10 km',
  category: 'Open',
  status,
  bibNumber: '77',
  qrCode: START_CODE,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/participant/tickets/reg-1/print']}>
        <Routes>
          <Route path="/participant/tickets/:registrationId/print" element={<TicketPrintPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('TicketPrintPage', () => {
  beforeEach(() => {
    api.getEventById.mockResolvedValue({
      data: { id: 'ev-1', name: 'Bieg Testowy', date: '2026-09-15', location: 'Park Miejski', city: 'Łódź' },
    });
    api.getCare.mockResolvedValue({
      data: { myProfile: { id: 'comp-1', identityCode: IDENTITY_CODE }, myCompetitors: [], caregivers: [] },
    });
  });

  it('renders the start card with data and both QR codes, and prints on click', async () => {
    api.getRegistrationsByUser.mockResolvedValue({ data: [registration('confirmed')] });
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { container } = renderPage();

    expect(await screen.findByText('Bieg Testowy')).toBeInTheDocument();
    expect(screen.getByText('Park Miejski', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('10 km')).toBeInTheDocument();
    expect(screen.getByText('77', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Jan Testowy')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        Array.from(container.querySelectorAll('[data-qr-value]')).map((n) =>
          n.getAttribute('data-qr-value'),
        ),
      ).toEqual([START_CODE, IDENTITY_CODE]),
    );

    await userEvent.click(screen.getByRole('button', { name: /Drukuj \/ Zapisz jako PDF/ }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('shows no QR for an unpaid Zapis', async () => {
    api.getRegistrationsByUser.mockResolvedValue({ data: [registration('pending')] });
    const { container } = renderPage();

    expect(await screen.findByText(/Bilet pojawi się po opłaceniu zapisu/)).toBeInTheDocument();
    expect(container.querySelector('[data-qr-value]')).toBeNull();
    expect(screen.queryByRole('button', { name: /Drukuj/ })).not.toBeInTheDocument();
  });
});
