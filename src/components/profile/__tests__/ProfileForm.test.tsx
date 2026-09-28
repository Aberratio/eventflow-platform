import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ProfileForm } from '../ProfileForm';
import type { User } from '@/types';

const updateCurrentUser = vi.fn().mockResolvedValue({ id: 'user-1' });

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
});
