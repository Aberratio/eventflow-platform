import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ProfileForm } from '../ProfileForm';
import type { User } from '@/types';

const updateCurrentUser = vi.fn().mockResolvedValue({ id: 'user-1' });
const resendEmailVerification = vi.fn();

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    resendEmailVerification: (...args: unknown[]) => resendEmailVerification(...args),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ updateCurrentUser }),
  };
});

const user: User = {
  id: 'user-1',
  name: 'Jan Testowy',
  email: 'jan@example.test',
  role: 'participant',
};

describe('ProfileForm', () => {
  it('submits a payload with no email key', async () => {
    render(<ProfileForm user={user} />);

    fireEvent.change(screen.getByLabelText('Imię i nazwisko'), {
      target: { value: 'Nowe Imię' },
    });
    fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));

    await waitFor(() => expect(updateCurrentUser).toHaveBeenCalled());

    const payload = updateCurrentUser.mock.calls[0][0];
    expect(payload).not.toHaveProperty('email');
    expect(payload.name).toBe('Nowe Imię');
  });

  it('renders the e-mail input as read-only', () => {
    render(<ProfileForm user={user} />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput).toHaveAttribute('readonly');
    expect(emailInput.value).toBe('jan@example.test');
  });

  it('shows the unverified badge and a resend action only when emailVerified is false', async () => {
    resendEmailVerification.mockResolvedValue({ success: true, data: { alreadyVerified: false } });
    render(<ProfileForm user={{ ...user, emailVerified: false }} />);

    expect(screen.getByText('niezweryfikowany')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Wyślij link weryfikacyjny' }));

    await waitFor(() => expect(resendEmailVerification).toHaveBeenCalledTimes(1));
  });

  it.each([[true], [undefined]])(
    'hides the badge and the resend action when emailVerified is %s',
    (emailVerified) => {
      render(<ProfileForm user={{ ...user, emailVerified }} />);

      expect(screen.queryByText('niezweryfikowany')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Wyślij link weryfikacyjny' }),
      ).not.toBeInTheDocument();
    },
  );

  it('points to the e-mail change section instead of the old support hint', () => {
    render(<ProfileForm user={user} />);

    expect(
      screen.getByText('Aby zmienić adres e-mail, użyj sekcji „Zmień adres e-mail”.'),
    ).toBeInTheDocument();
  });
});
