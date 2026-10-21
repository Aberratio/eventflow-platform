import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ApiRequestError } from '@/api/errors';
import ResetPasswordPage from '../ResetPasswordPage';

const confirmPasswordReset = vi.fn();
const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));

vi.mock('@/api', () => ({
  confirmPasswordReset: (...args: unknown[]) => confirmPasswordReset(...args),
  // The page shell renders the site footer, which reads the info pages.
  getInfoPages: () => Promise.resolve({ success: true, data: [] }),
}));

vi.mock('sonner', () => ({ toast }));

const TOKEN = 'a'.repeat(64);

const open = (search: string) => window.history.pushState({}, '', `/reset-password${search}`);
const fill = (password: string, confirm: string) => {
  fireEvent.change(screen.getByPlaceholderText('Min. 8 znaków'), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText('Powtórz hasło'), { target: { value: confirm } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Zmień hasło' }));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    confirmPasswordReset.mockReset();
    toast.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('sends the link token and the new password to the API and shows the success view', async () => {
    open(`?token=${TOKEN}`);
    confirmPasswordReset.mockResolvedValue({ success: true, data: undefined });
    render(<ResetPasswordPage />);
    fill('NoweHaslo123', 'NoweHaslo123');
    submit();

    await waitFor(() =>
      expect(confirmPasswordReset).toHaveBeenCalledWith({
        token: TOKEN,
        newPassword: 'NoweHaslo123',
      }),
    );
    expect(await screen.findByText('Hasło zmienione!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Przejdź do logowania' })).toBeInTheDocument();
  });

  it('shows the invalid-link view when the API rejects the token', async () => {
    open(`?token=${TOKEN}`);
    confirmPasswordReset.mockRejectedValue(
      new ApiRequestError(
        'Link jest nieprawidłowy lub wygasł. Poproś o nowy link.',
        'invalid_token',
        400,
      ),
    );
    render(<ResetPasswordPage />);
    fill('NoweHaslo123', 'NoweHaslo123');
    submit();

    expect(await screen.findByText('Nieprawidłowy link')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wyślij nowy link' })).toBeInTheDocument();
    expect(screen.queryByText('Hasło zmienione!')).not.toBeInTheDocument();
  });

  it('shows a server password error on the field and keeps the form', async () => {
    open(`?token=${TOKEN}`);
    confirmPasswordReset.mockRejectedValue(
      new ApiRequestError('Nowe hasło jest za długie.', 'password_too_long', 422),
    );
    render(<ResetPasswordPage />);
    fill('NoweHaslo123', 'NoweHaslo123');
    submit();

    expect(await screen.findByText('Nowe hasło jest za długie.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 znaków')).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
  });

  it('shows a destructive toast for any other failure', async () => {
    open(`?token=${TOKEN}`);
    confirmPasswordReset.mockRejectedValue(new Error('Błąd API 500'));
    render(<ResetPasswordPage />);
    fill('NoweHaslo123', 'NoweHaslo123');
    submit();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ description: 'Nie udało się zmienić hasła. Spróbuj ponownie.' }),
      ),
    );
    expect(screen.getByPlaceholderText('Min. 8 znaków')).toBeInTheDocument();
  });

  it('renders the invalid-link view without calling the API when there is no token', () => {
    open('');
    render(<ResetPasswordPage />);

    expect(screen.getByText('Nieprawidłowy link')).toBeInTheDocument();
    expect(confirmPasswordReset).not.toHaveBeenCalled();
  });
});
