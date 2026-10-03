import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ChangePasswordCard } from '../ChangePasswordCard';

const changePassword = vi.fn();

vi.mock('@/api', () => ({
  changePassword: (...args: unknown[]) => changePassword(...args),
}));

const fill = (current: string, next: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText('Obecne hasło'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nowe hasło'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Powtórz nowe hasło'), { target: { value: confirm } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Zmień hasło' }));

describe('ChangePasswordCard', () => {
  beforeEach(() => {
    changePassword.mockReset();
  });

  it('submits old and new password and clears the fields', async () => {
    changePassword.mockResolvedValue(undefined);
    render(<ChangePasswordCard />);
    fill('demo1234', 'NoweHaslo123', 'NoweHaslo123');
    submit();

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        oldPassword: 'demo1234',
        newPassword: 'NoweHaslo123',
      }),
    );
    await waitFor(() => expect(screen.getByLabelText('Obecne hasło')).toHaveValue(''));
    expect(screen.getByLabelText('Nowe hasło')).toHaveValue('');
    expect(screen.getByLabelText('Powtórz nowe hasło')).toHaveValue('');
  });

  it('blocks mismatched confirmation', () => {
    render(<ChangePasswordCard />);
    fill('demo1234', 'NoweHaslo123', 'Inne12345');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Hasła nie są identyczne.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('blocks a too-short password', () => {
    render(<ChangePasswordCard />);
    fill('demo1234', 'short7!', 'short7!');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Nowe hasło musi mieć co najmniej 8 znaków.',
    );
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('blocks a password equal to the current one', () => {
    render(<ChangePasswordCard />);
    fill('demo1234', 'demo1234', 'demo1234');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Nowe hasło musi różnić się od obecnego.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('blocks empty fields', () => {
    render(<ChangePasswordCard />);
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent('Wypełnij wszystkie pola.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('shows the server error and keeps the fields', async () => {
    changePassword.mockRejectedValue(new Error('Obecne hasło jest nieprawidłowe.'));
    render(<ChangePasswordCard />);
    fill('zle-haslo', 'NoweHaslo123', 'NoweHaslo123');
    submit();

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Obecne hasło jest nieprawidłowe.'),
    );
    expect(screen.getByLabelText('Obecne hasło')).toHaveValue('zle-haslo');
    expect(screen.getByLabelText('Nowe hasło')).toHaveValue('NoweHaslo123');
  });
});
