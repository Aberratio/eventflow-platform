import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordChangeDialog } from '../PasswordChangeDialog';

const changePassword = vi.fn();
const toast = vi.fn();

vi.mock('@/api', () => ({
  changePassword: (...args: unknown[]) => changePassword(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

vi.mock('@/lib/logger', () => ({
  appLogger: { auth: vi.fn() },
}));

const onOpenChange = vi.fn();
const onPasswordChanged = vi.fn();

const renderDialog = () =>
  render(
    <PasswordChangeDialog open onOpenChange={onOpenChange} onPasswordChanged={onPasswordChanged} />,
  );

const fill = (current: string, next: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText('Obecne hasło'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nowe hasło'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Potwierdź nowe hasło'), { target: { value: confirm } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Zmień hasło' }));

describe('PasswordChangeDialog', () => {
  beforeEach(() => {
    changePassword.mockReset();
    toast.mockReset();
    onOpenChange.mockReset();
    onPasswordChanged.mockReset();
  });

  it('calls changePassword with the old and new password and closes on success', async () => {
    changePassword.mockResolvedValue({ success: true, data: undefined });
    renderDialog();
    fill('demo1234', 'NoweHaslo123!', 'NoweHaslo123!');
    submit();

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        oldPassword: 'demo1234',
        newPassword: 'NoweHaslo123!',
      }),
    );
    await waitFor(() => expect(onPasswordChanged).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hasło zmienione' }));
  });

  it('keeps the dialog open with a destructive toast when the API rejects the change', async () => {
    changePassword.mockRejectedValue(new Error('Obecne hasło jest nieprawidłowe.'));
    renderDialog();
    fill('zle-haslo', 'NoweHaslo123!', 'NoweHaslo123!');
    submit();

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nie udało się zmienić hasła',
          description: 'Obecne hasło jest nieprawidłowe.',
          variant: 'destructive',
        }),
      ),
    );
    expect(onPasswordChanged).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Obecne hasło')).toHaveValue('zle-haslo');
  });

  it('sends a weak but long enough password because the strength meter is advisory', async () => {
    changePassword.mockResolvedValue({ success: true, data: undefined });
    renderDialog();
    fill('demo1234', 'abcdefgh', 'abcdefgh');
    submit();

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        oldPassword: 'demo1234',
        newPassword: 'abcdefgh',
      }),
    );
  });

  it.each([
    ['too short', 'demo1234', 'abcdefg', 'abcdefg', 'Nowe hasło musi mieć co najmniej 8 znaków.'],
    ['unchanged', 'demo1234', 'demo1234', 'demo1234', 'Nowe hasło musi różnić się od obecnego.'],
    ['different confirmation', 'demo1234', 'abcdefgh', 'abcdefgX', 'Hasła nie są identyczne.'],
  ])('blocks a %s password client-side', (_name, current, next, confirm, message) => {
    renderDialog();
    fill(current, next, confirm);
    submit();

    expect(changePassword).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: message, variant: 'destructive' }),
    );
  });
});
