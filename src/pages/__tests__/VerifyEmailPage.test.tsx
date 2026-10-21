import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ApiRequestError } from '@/api/errors';
import VerifyEmailPage from '../VerifyEmailPage';

const verifyEmail = vi.fn();
const resendEmailVerification = vi.fn();
const refreshUser = vi.fn();
let authenticated = false;
const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));

vi.mock('@/api', () => ({
  verifyEmail: (...args: unknown[]) => verifyEmail(...args),
  resendEmailVerification: (...args: unknown[]) => resendEmailVerification(...args),
  // The page shell renders the site footer, which reads the info pages.
  getInfoPages: () => Promise.resolve({ success: true, data: [] }),
}));

vi.mock('sonner', () => ({ toast }));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ isAuthenticated: authenticated, refreshUser }),
  };
});

const TOKEN = 'b'.repeat(64);
const open = (search: string) => window.history.pushState({}, '', `/verify-email${search}`);

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    verifyEmail.mockReset();
    resendEmailVerification.mockReset();
    refreshUser.mockReset();
    toast.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    authenticated = false;
  });

  it('sends exactly one verification request under StrictMode and shows success', async () => {
    open(`?token=${TOKEN}`);
    verifyEmail.mockResolvedValue({ success: true, data: undefined });
    render(
      <StrictMode>
        <VerifyEmailPage />
      </StrictMode>,
    );

    expect(await screen.findByText('Adres e-mail potwierdzony')).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith({ token: TOKEN });
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('refreshes the signed-in user after success and offers to continue', async () => {
    open(`?token=${TOKEN}`);
    authenticated = true;
    verifyEmail.mockResolvedValue({ success: true, data: undefined });
    render(<VerifyEmailPage />);

    expect(await screen.findByRole('link', { name: 'Przejdź dalej' })).toBeInTheDocument();
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  it('shows the error state without any request when there is no token', () => {
    open('');
    render(<VerifyEmailPage />);

    expect(
      screen.getByText('Link weryfikacyjny jest nieprawidłowy lub wygasł.'),
    ).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('offers to sign in for a new link when the link is invalid and the user is anonymous', async () => {
    open(`?token=${TOKEN}`);
    verifyEmail.mockRejectedValue(new ApiRequestError('x', 'invalid_token', 400));
    render(<VerifyEmailPage />);

    expect(
      await screen.findByText('Link weryfikacyjny jest nieprawidłowy lub wygasł.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Zaloguj się, aby wysłać nowy link' }),
    ).toBeInTheDocument();
  });

  it('lets a signed-in user request a new link from the error state', async () => {
    open(`?token=${TOKEN}`);
    authenticated = true;
    verifyEmail.mockRejectedValue(new ApiRequestError('x', 'invalid_token', 400));
    resendEmailVerification.mockResolvedValue({ success: true, data: { alreadyVerified: false } });
    render(<VerifyEmailPage />);

    const button = await screen.findByRole('button', { name: 'Wyślij nowy link' });
    button.click();

    await waitFor(() => expect(resendEmailVerification).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Wysłaliśmy link weryfikacyjny.'),
    );
  });
});
