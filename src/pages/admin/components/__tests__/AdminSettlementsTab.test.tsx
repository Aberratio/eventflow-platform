import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, resetQueryClient } from '@/test/test-utils';
import { AdminSettlementsTab } from '../AdminSettlementsTab';
import { formatMinorMoney } from '@/lib/format';
import type { SettlementReport } from '@/types';

const getSettlementReport = vi.fn();
const exportSettlementReport = vi.fn();
const getEvents = vi.fn();

vi.mock('@/api', () => ({
  getSettlementReport: (...args: unknown[]) => getSettlementReport(...args),
  exportSettlementReport: (...args: unknown[]) => exportSettlementReport(...args),
  getEvents: (...args: unknown[]) => getEvents(...args),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const totals = {
  paymentsCount: 2,
  refundsCount: 1,
  grossMinor: 15050,
  refundsMinor: 2025,
  commissionMinor: 0,
  netMinor: 13025,
};

const report: SettlementReport = {
  period: { dateFrom: '2026-03-01', dateTo: '2026-03-31' },
  commissionRateBps: 0,
  summary: totals,
  events: [{ eventId: 'evt-1', eventName: 'Bieg Testowy', organizerName: 'Org Jan', ...totals }],
  lines: [
    {
      type: 'payment',
      occurredAt: '2026-03-10T10:00:00+01:00',
      eventId: 'evt-1',
      eventName: 'Bieg Testowy',
      organizerName: 'Org Jan',
      registrationId: 'r1',
      bibNumber: '12',
      participantName: 'Ala Testowa',
      gateway: 'tpay',
      reference: 'tx-1',
      amountMinor: 10000,
      commissionMinor: 0,
    },
    {
      type: 'refund',
      occurredAt: '2026-03-20T09:00:00+01:00',
      eventId: 'evt-1',
      eventName: 'Bieg Testowy',
      organizerName: 'Org Jan',
      registrationId: 'r1',
      bibNumber: null,
      participantName: 'Ala Testowa',
      gateway: 'gateway',
      reference: 'r1',
      amountMinor: 2025,
      commissionMinor: 0,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  resetQueryClient();
  getEvents.mockResolvedValue({ data: [{ id: 'evt-1', name: 'Bieg Testowy' }] });
  getSettlementReport.mockResolvedValue({ success: true, data: report });
  exportSettlementReport.mockResolvedValue(undefined);
});

describe('AdminSettlementsTab', () => {
  it('converts minor units to a Polish money string', () => {
    expect(formatMinorMoney(13025)).toMatch(/^130,25\s*zł$/);
    expect(formatMinorMoney(0)).toMatch(/^0,00\s*zł$/);
  });

  it('shows the summary and per-event totals for the default period', async () => {
    render(<AdminSettlementsTab />);

    const summary = await screen.findByLabelText('Podsumowanie');
    expect(within(summary).getByText('Do wypłaty')).toBeInTheDocument();
    expect(within(summary).getByText(/130,25/)).toBeInTheDocument();
    expect(within(summary).getByText(/150,50/)).toBeInTheDocument();
    expect(within(summary).getByText(/20,25/)).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Bieg Testowy' })).toBeInTheDocument();
    expect(getSettlementReport).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: undefined, dateFrom: expect.any(String) }),
    );
  });

  it('shows line items after choosing an event and signs refunds negatively', async () => {
    const user = userEvent.setup();
    render(<AdminSettlementsTab />);

    await user.click(await screen.findByRole('button', { name: 'Pokaż pozycje: Bieg Testowy' }));

    await waitFor(() =>
      expect(getSettlementReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ eventId: 'evt-1' }),
      ),
    );
    expect(await screen.findByText('Wpłata')).toBeInTheDocument();
    expect(screen.getByText('Zwrot')).toBeInTheDocument();
    expect(screen.getByText(/-20,25/)).toBeInTheDocument();
    expect(screen.getByText('2026-03-10')).toBeInTheDocument();
  });

  it('exports CSV and XLSX for the chosen period', async () => {
    const user = userEvent.setup();
    render(<AdminSettlementsTab />);
    await screen.findByLabelText('Podsumowanie');

    await user.click(screen.getByRole('button', { name: /Eksport CSV/ }));
    await waitFor(() =>
      expect(exportSettlementReport).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: expect.any(String), dateTo: expect.any(String) }),
        'csv',
      ),
    );
    await user.click(screen.getByRole('button', { name: /Eksport XLSX/ }));
    await waitFor(() =>
      expect(exportSettlementReport).toHaveBeenLastCalledWith(expect.anything(), 'xlsx'),
    );
  });

  it('blocks the request and the exports when the period is inverted', async () => {
    const user = userEvent.setup();
    render(<AdminSettlementsTab />);
    await screen.findByLabelText('Podsumowanie');
    getSettlementReport.mockClear();

    const from = screen.getByLabelText('Od');
    await user.clear(from);
    await user.type(from, '2099-12-31');

    expect(await screen.findByRole('alert')).toHaveTextContent('data początkowa');
    expect(screen.getByRole('button', { name: /Eksport CSV/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Eksport XLSX/ })).toBeDisabled();
    expect(getSettlementReport).not.toHaveBeenCalled();
  });
});
