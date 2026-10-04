import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ApiRequestError } from '@/api/errors';
import ConfirmEmailChangePage from '../ConfirmEmailChangePage';

const confirmEmailChange = vi.fn();
const logout = vi.fn();

vi.mock('@/api', () => ({
  confirmEmailChange: (...args: unknown[]) => confirmEmailChange(...args),
  // The page shell renders the site footer, which reads the info pages.
  getInfoPages: () => Promise.resolve({ success: true, data: [] }),
}));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ logout }),
  };
});

const TOKEN = 'c'.repeat(64);
const open = (search: string) => window.history.pushState({}, '', `/confirm-email-change${search}`);

describe('ConfirmEmailChangePage', () => {
  beforeEach(() => {
    confirmEmailChange.mockReset();
    logout.mockReset();
    logout.mockResolvedValue(undefined);
  });

  it('confirms once under StrictMode, logs out locally and asks to sign in with the new address', async () => {
    open(`?token=${TOKEN}`);
    confirmEmailChange.mockResolvedValue({ success: true, data: undefined });
    render(
      <StrictMode>
        <ConfirmEmailChangePage />
      </StrictMode>,
    );

    expect(
      await screen.findByText(
        'Adres e-mail został zmieniony. Zaloguj się, używając nowego adresu.',
      ),
    ).toBeInTheDocument();
    expect(confirmEmailChange).toHaveBeenCalledTimes(1);
    expect(confirmEmailChange).toHaveBeenCalledWith({ token: TOKEN });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/login');
  });

  it('explains a taken address on 409 and does not log out', async () => {
    open(`?token=${TOKEN}`);
    confirmEmailChange.mockRejectedValue(new ApiRequestError('x', 'email_taken', 409));
    render(<ConfirmEmailChangePage />);

    expect(
      await screen.findByText(
        'Ten adres e-mail jest już zajęty. Spróbuj ponownie z innym adresem.',
      ),
    ).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows the invalid-link message for an invalid token', async () => {
    open(`?token=${TOKEN}`);
    confirmEmailChange.mockRejectedValue(new ApiRequestError('x', 'invalid_token', 400));
    render(<ConfirmEmailChangePage />);

    expect(await screen.findByText('Link jest nieprawidłowy lub wygasł.')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows the error state without any request when there is no token', () => {
    open('');
    render(<ConfirmEmailChangePage />);

    expect(screen.getByText('Link jest nieprawidłowy lub wygasł.')).toBeInTheDocument();
    expect(confirmEmailChange).not.toHaveBeenCalled();
  });
});
