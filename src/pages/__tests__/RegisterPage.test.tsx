import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@/api/errors';
import RegisterPage from '../RegisterPage';

const mockLoginWithCredentials = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockRegister = vi.fn();

vi.mock('@/api', async () => ({
  ...(await vi.importActual<typeof import('@/api')>('@/api')),
  register: (...args: unknown[]) => mockRegister(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    loginWithCredentials: mockLoginWithCredentials,
    isAuthenticated: false,
    user: null,
  }),
  useAuthSafe: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/logger', () => ({
  appLogger: { auth: vi.fn() },
}));

async function fillValidForm() {
  await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
  await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'Kowalski');
  await userEvent.type(screen.getByPlaceholderText('jan@example.com'), 'jan.kowalski@example.com');
  await userEvent.type(screen.getByPlaceholderText('Min. 8 znaków'), 'haslo1234');
  await userEvent.type(screen.getByPlaceholderText('Powtórz hasło'), 'haslo1234');
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginWithCredentials.mockResolvedValue(false);
    mockRegister.mockResolvedValue({
      success: true,
      data: { id: 'u1' },
      message: 'User registered',
    });
  });

  it('renderuje wszystkie pola formularza', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText('Jan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Kowalski')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('jan@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 znaków')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Powtórz hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zarejestruj się' })).toBeInTheDocument();
  });

  it('nie oferuje wyboru roli (rejestracja tworzy wyłącznie zawodnika)', () => {
    render(<RegisterPage />);
    expect(screen.queryByText('Organizator')).not.toBeInTheDocument();
    expect(screen.queryByText('Typ konta')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('wyświetla link do logowania', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('pokazuje błąd gdy imię ma mniej niż 2 znaki', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('Jan'), 'J');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Imię musi mieć minimum 2 znaki')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd gdy nazwisko ma mniej niż 2 znaki', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
    await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'K');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Nazwisko musi mieć minimum 2 znaki')).toBeInTheDocument();
    });
  });

  it('blokuje submit przy nieprawidłowym emailu', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
    await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'Kowalski');
    await userEvent.type(screen.getByPlaceholderText('jan@example.com'), 'to-nie-email');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 znaków'), 'haslo1234');
    await userEvent.type(screen.getByPlaceholderText('Powtórz hasło'), 'haslo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    // Zod validation blocks the submit — loginWithCredentials is not called
    await new Promise((r) => setTimeout(r, 200));
    expect(mockLoginWithCredentials).not.toHaveBeenCalled();
  });

  it('pokazuje błąd gdy hasło ma mniej niż 8 znaków', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
    await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'Kowalski');
    await userEvent.type(screen.getByPlaceholderText('jan@example.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 znaków'), 'krotkie');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasło musi mieć minimum 8 znaków')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd gdy hasła się nie zgadzają', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
    await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'Kowalski');
    await userEvent.type(screen.getByPlaceholderText('jan@example.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 znaków'), 'haslo1234');
    await userEvent.type(screen.getByPlaceholderText('Powtórz hasło'), 'inne5678');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasła muszą być identyczne')).toBeInTheDocument();
    });
  });

  it('poprawna rejestracja wywołuje API bez roli, loguje i przekierowuje do /participant', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        password: 'haslo1234',
      });
    });
    expect(mockRegister.mock.calls[0][0]).not.toHaveProperty('role');
    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith(
        'jan.kowalski@example.com',
        'haslo1234',
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/participant');
    });
  });

  it('toast po rejestracji nie obiecuje wysłanego maila, tylko opisuje stan', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Konto zostało utworzone!' }),
      );
    });
    const description = mockToast.mock.calls[0][0].description as string;
    expect(description).not.toMatch(/wysłaliśmy/i);
  });

  it('409 z serwera: pokazuje polski komunikat, nie loguje i nie pokazuje sukcesu', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiRequestError('Ten adres e-mail jest już zajęty.', 'email_taken', 409),
    );
    render(<RegisterPage />);

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Ten adres e-mail jest już zajęty.',
          variant: 'destructive',
        }),
      );
    });
    expect(await screen.findAllByText('Ten adres e-mail jest już zajęty.')).not.toHaveLength(0);
    expect(mockLoginWithCredentials).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Konto zostało utworzone!' }),
    );
    expect(screen.getByRole('button', { name: 'Zarejestruj się' })).toBeEnabled();
  });

  it('przycisk jest zablokowany w trakcie wysyłania', async () => {
    let finish: (value: unknown) => void = () => undefined;
    mockRegister.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    expect(await screen.findByRole('button', { name: 'Tworzenie konta...' })).toBeDisabled();
    finish({ success: true, data: {} });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/participant'));
  });

  it('nie zawiera hardkodowanych adresów email jako mock danych', () => {
    render(<RegisterPage />);
    expect(screen.queryByText('jan@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('anna@example.com')).not.toBeInTheDocument();
  });
});
