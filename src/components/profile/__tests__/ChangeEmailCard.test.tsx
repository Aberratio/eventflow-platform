import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ChangeEmailCard } from '../ChangeEmailCard';

const requestEmailChange = vi.fn();

vi.mock('@/api', () => ({
  requestEmailChange: (...args: unknown[]) => requestEmailChange(...args),
}));

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Nowy adres e-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Obecne hasło'), { target: { value: password } });
};
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Wyślij link potwierdzający' }));

describe('ChangeEmailCard', () => {
  beforeEach(() => {
    requestEmailChange.mockReset();
  });

  it('sends the new address and current password and shows the pending address', async () => {
    requestEmailChange.mockResolvedValue({
      success: true,
      data: { pendingEmail: 'nowy@example.test' },
    });
    render(<ChangeEmailCard />);
    fill('Nowy@Example.test', 'demo1234');
    submit();

    await waitFor(() =>
      expect(requestEmailChange).toHaveBeenCalledWith({
        newEmail: 'Nowy@Example.test',
        currentPassword: 'demo1234',
      }),
    );
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Wysłaliśmy link na nowy@example.test.');
    expect(status).toHaveTextContent('logujesz się dotychczasowym adresem');
    expect(screen.getByLabelText('Nowy adres e-mail')).toHaveValue('');
    expect(screen.getByLabelText('Obecne hasło')).toHaveValue('');
  });

  it('shows the server message in an alert and keeps the fields', async () => {
    requestEmailChange.mockRejectedValue(new Error('Ten adres e-mail jest już zajęty.'));
    render(<ChangeEmailCard />);
    fill('zajety@example.test', 'demo1234');
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Ten adres e-mail jest już zajęty.');
    expect(screen.getByLabelText('Nowy adres e-mail')).toHaveValue('zajety@example.test');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not call the API when a field is empty', () => {
    render(<ChangeEmailCard />);
    fill('', 'demo1234');
    submit();

    expect(requestEmailChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Podaj nowy adres e-mail i obecne hasło.');
  });
});
