import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportDuplicateDialog } from '../ReportDuplicateDialog';

// R-08: dialog zgłoszenia duplikatu - kandydaci z /competitors/duplicates, wysyłka zgłoszenia.

const { mockCheck, mockReport } = vi.hoisted(() => ({ mockCheck: vi.fn(), mockReport: vi.fn() }));

vi.mock('@/api', () => ({
  checkCompetitorDuplicates: mockCheck,
  reportCompetitorDuplicate: mockReport,
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ReportDuplicateDialog
        competitorId="c1"
        firstName="Ala"
        lastName="Testowa"
        birthDate="2015-01-01"
      />
    </QueryClientProvider>,
  );
};

const openDialog = () =>
  userEvent.click(screen.getByRole('button', { name: /Zgłoś duplikat profilu Ala Testowa/ }));

describe('ReportDuplicateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReport.mockResolvedValue({ success: true, data: { id: 'r1' } });
  });

  it('excludes the profile itself and sends the chosen candidate with the note', async () => {
    mockCheck.mockResolvedValue({
      success: true,
      data: [
        { id: 'c1', firstName: 'Ala', lastName: 'Testowa', birthDate: '2015-01-01' },
        { id: 'c2', firstName: 'Ala', lastName: 'Testowa', birthDate: '2015-01-01' },
      ],
    });
    renderDialog();
    await openDialog();

    const radios = await screen.findAllByRole('radio');
    expect(radios).toHaveLength(1);
    const send = screen.getByRole('button', { name: 'Wyślij zgłoszenie' });
    expect(send).toBeDisabled();

    await userEvent.click(radios[0]);
    await userEvent.type(screen.getByPlaceholderText(/Uwagi dla Moderatora/), '  to ta sama  ');
    await userEvent.click(send);

    await waitFor(() =>
      expect(mockReport).toHaveBeenCalledWith('c1', { duplicateOfId: 'c2', note: 'to ta sama' }),
    );
    expect(mockCheck).toHaveBeenCalledWith('Ala', 'Testowa', '2015-01-01');
  });

  it('tells when there are no other matching profiles', async () => {
    mockCheck.mockResolvedValue({ success: true, data: [] });
    renderDialog();
    await openDialog();

    expect(await screen.findByText(/Nie znaleziono innych profili/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyślij zgłoszenie' })).toBeDisabled();
  });
});
