import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@/api/errors';
import { AddOrganizerDialog } from '../AddOrganizerDialog';

const mockCreateUser = vi.fn();
const mockUpdateUserRole = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/api', async () => ({
  ...(await vi.importActual<typeof import('@/api')>('@/api')),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  updateUserRole: (...args: unknown[]) => mockUpdateUserRole(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const participant = {
  id: 'u-1',
  name: 'Anna Nowak',
  email: 'anna@example.test',
  role: 'participant',
} as never;

async function openNewTab() {
  await userEvent.click(screen.getByRole('tab', { name: 'Nowy użytkownik' }));
}

async function fillNew() {
  await userEvent.type(screen.getByPlaceholderText('Jan Kowalski'), 'Jan Kowalski');
  await userEvent.type(screen.getByPlaceholderText('email@example.com'), 'jan@example.test');
}

describe('AddOrganizerDialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tworzy konto organizatora przez API i pokazuje komunikat serwera', async () => {
    mockCreateUser.mockResolvedValue({
      success: true,
      data: { id: 'new' },
      message: 'Konto zostało utworzone, ale nie udało się wysłać linku do ustawienia hasła.',
    });
    render(<AddOrganizerDialog open onOpenChange={onOpenChange} nonOrganizers={[]} />);

    await openNewTab();
    await fillNew();
    fireEvent.click(screen.getByRole('button', { name: /Dodaj organizatora/ }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Jan Kowalski',
        email: 'jan@example.test',
        role: 'organizer',
      });
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Konto zostało utworzone, ale nie udało się wysłać linku do ustawienia hasła.',
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('błąd z serwera (409) pokazuje komunikat i nie zamyka okna ani nie ogłasza sukcesu', async () => {
    mockCreateUser.mockRejectedValue(
      new ApiRequestError('Ten adres e-mail jest już zajęty.', 'email_taken', 409),
    );
    render(<AddOrganizerDialog open onOpenChange={onOpenChange} nonOrganizers={[]} />);

    await openNewTab();
    await fillNew();
    fireEvent.click(screen.getByRole('button', { name: /Dodaj organizatora/ }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Ten adres e-mail jest już zajęty.');
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('nadanie roli istniejącemu użytkownikowi wywołuje API roli', async () => {
    mockUpdateUserRole.mockResolvedValue({ success: true, data: { id: 'u-1' } });
    render(<AddOrganizerDialog open onOpenChange={onOpenChange} nonOrganizers={[participant]} />);

    await userEvent.type(screen.getByPlaceholderText('Wpisz email użytkownika...'), 'anna@');
    await userEvent.click(await screen.findByText('Anna Nowak'));
    fireEvent.click(screen.getByRole('button', { name: /Nadaj rolę organizatora/ }));

    await waitFor(() => {
      expect(mockUpdateUserRole).toHaveBeenCalledWith('u-1', 'organizer');
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Użytkownik Anna Nowak otrzymał rolę organizatora',
      );
    });
  });

  it('błąd nadania roli nie ogłasza sukcesu', async () => {
    mockUpdateUserRole.mockRejectedValue(new ApiRequestError('Brak uprawnień.', 'forbidden', 403));
    render(<AddOrganizerDialog open onOpenChange={onOpenChange} nonOrganizers={[participant]} />);

    await userEvent.type(screen.getByPlaceholderText('Wpisz email użytkownika...'), 'anna@');
    await userEvent.click(await screen.findByText('Anna Nowak'));
    fireEvent.click(screen.getByRole('button', { name: /Nadaj rolę organizatora/ }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Brak uprawnień.'));
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
});
