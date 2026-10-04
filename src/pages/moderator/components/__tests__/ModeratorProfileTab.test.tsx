import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ModeratorProfileTab } from '../ModeratorProfileTab';

vi.mock('@/api', () => ({
  changePassword: vi.fn(),
  requestEmailChange: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: 'mod-1',
        name: 'Maria Moderator',
        email: 'maria@example.test',
        role: 'moderator',
      },
    }),
  };
});

describe('ModeratorProfileTab', () => {
  it('renders the password card instead of the "contact the admin" notice', () => {
    render(<ModeratorProfileTab />);

    expect(screen.getByRole('button', { name: 'Zmień hasło' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Obecne hasło', { selector: '#current-password' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/skontaktuj się z administratorem systemu/)).not.toBeInTheDocument();
    expect(
      screen.getByText('Możesz edytować podstawowe dane profilu i zmienić hasło.'),
    ).toBeInTheDocument();
  });

  it('renders the e-mail input read-only and offers the e-mail change card', () => {
    render(<ModeratorProfileTab />);

    const email = screen.getByLabelText('Email') as HTMLInputElement;
    expect(email).toHaveAttribute('readonly');
    expect(email.value).toBe('maria@example.test');
    expect(screen.getByRole('button', { name: 'Wyślij link potwierdzający' })).toBeInTheDocument();
  });
});
