import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DuplicateReportsQueue } from '../DuplicateReportsQueue';
import type { CompetitorDuplicateReport } from '@/types';

// Kolejka zgłoszonych duplikatów - lista, filtr statusu, "Porównaj" i "Odrzuć".

const { mockList, mockReject } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockReject: vi.fn(),
}));

vi.mock('@/api', () => ({
  listCompetitorDuplicateReports: mockList,
  rejectCompetitorDuplicateReport: mockReject,
}));

const report = (over: Partial<CompetitorDuplicateReport> = {}): CompetitorDuplicateReport => ({
  id: 'r1',
  competitorId: 'c1',
  duplicateOfId: 'c2',
  competitor: { firstName: 'Ala', lastName: 'Testowa', birthDate: '2015-01-01' },
  duplicateOf: { firstName: 'Alicja', lastName: 'Testowa', birthDate: null },
  reporterName: 'Opiekun',
  reporterRole: 'participant',
  note: 'To ta sama osoba',
  status: 'open',
  rejectReason: null,
  createdAt: '2026-10-20 10:00:00',
  ...over,
});

const renderQueue = (onCompare = vi.fn()) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <DuplicateReportsQueue onCompare={onCompare} />
    </QueryClientProvider>,
  );
  return onCompare;
};

describe('DuplicateReportsQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ success: true, data: [report()] });
    mockReject.mockResolvedValue({ success: true, data: report({ status: 'rejected' }) });
  });

  it('lists open reports by default and compares the pair', async () => {
    const onCompare = renderQueue();

    expect(await screen.findByText(/Ala Testowa \(2015-01-01\)/)).toBeInTheDocument();
    expect(screen.getByText(/To ta sama osoba/)).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledWith('open');

    await userEvent.click(screen.getByRole('button', { name: 'Porównaj' }));
    expect(onCompare).toHaveBeenCalledWith('c1', 'c2');
  });

  it('rejects a report with the typed reason', async () => {
    renderQueue();
    await userEvent.click(await screen.findByRole('button', { name: 'Odrzuć' }));
    await userEvent.type(screen.getByLabelText('Powód odrzucenia (opcjonalnie)'), 'Różne osoby');
    await userEvent.click(screen.getByRole('button', { name: 'Odrzuć zgłoszenie' }));

    await waitFor(() => expect(mockReject).toHaveBeenCalledWith('r1', 'Różne osoby'));
  });

  it('reloads with the chosen status filter and hides actions for resolved reports', async () => {
    renderQueue();
    await screen.findByText(/Ala Testowa/);
    mockList.mockResolvedValue({
      success: true,
      data: [report({ status: 'rejected', rejectReason: 'Różne osoby' })],
    });

    await userEvent.selectOptions(screen.getByLabelText('Status zgłoszeń'), 'rejected');

    await waitFor(() => expect(mockList).toHaveBeenCalledWith('rejected'));
    expect(await screen.findByText(/Powód: Różne osoby/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Odrzuć' })).not.toBeInTheDocument();
  });

  it('shows an empty state instead of hiding the queue', async () => {
    mockList.mockResolvedValue({ success: true, data: [] });
    renderQueue();
    expect(await screen.findByText('Brak zgłoszeń.')).toBeInTheDocument();
  });
});
