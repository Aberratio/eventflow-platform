import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@/api/errors';
import LoginPage from '../LoginPage';

const mockLoginWithCredentials = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

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
    useLocation: () => ({ state: null, pathname: '/login', search: '', hash: '' }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pola mają programowo powiązane etykiety (WCAG 1.3.1, 4.1.2)', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Hasło')).toHaveAttribute('type', 'password');
  });

  it('renderuje formularz logowania', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('twoj@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('nie wyświetla panelu szybkiego logowania', () => {
    render(<LoginPage />);
    expect(screen.queryByText('Szybkie logowanie')).not.toBeInTheDocument();
    expect(screen.queryByText('Uczestnik')).not.toBeInTheDocument();
    expect(screen.queryByText('Organizator')).not.toBeInTheDocument();
  });

  it('wyświetla link do rejestracji', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Zarejestruj się' })).toBeInTheDocument();
  });

  it('wyświetla link do resetowania hasła', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Zapomniałeś hasła?' })).toBeInTheDocument();
  });

  it('pokazuje błąd walidacji gdy email jest pusty', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy adres email')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd walidacji gdy hasło jest puste', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument();
    });
  });

  it('wywołuje loginWithCredentials z poprawnymi danymi', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'demo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith('jan@example.com', 'demo1234');
    });
  });

  it('pokazuje komunikat serwera dla zablokowanego konta', async () => {
    const message =
      'Twoje konto zostało zablokowane. Jeśli uważasz, że to pomyłka, napisz do nas: kontakt@zmierzymyczas.pl.';
    mockLoginWithCredentials.mockRejectedValueOnce(
      new ApiRequestError(message, 'account_blocked', 403),
    );
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'demo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Konto zablokowane',
        description: message,
        variant: 'destructive',
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeEnabled();
    });
  });

  it('po 429 pokazuje czas oczekiwania i blokuje przycisk', async () => {
    mockLoginWithCredentials.mockRejectedValueOnce(
      new ApiRequestError('Zbyt wiele prób', 'too_many_login_attempts', 429, {
        retryAfterSeconds: 240,
      }),
    );
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'zle-haslo');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za 4 min.',
    );
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeDisabled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('dla błędnych danych nadal pokazuje ogólny komunikat', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(false);
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'zle-haslo');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Błąd logowania',
        description: 'Nieprawidłowy email lub hasło.',
        variant: 'destructive',
      });
    });
  });

  it('przycisk jest zablokowany podczas logowania', async () => {
    mockLoginWithCredentials.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 500)),
    );
    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('twoj@email.com'), 'jan@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'demo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logowanie...' })).toBeDisabled();
    });
  });

  it('przełącza widoczność hasła po kliknięciu ikony', async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle is the only type="button" inside the password field
    const toggleBtns = screen.getAllByRole('button');
    // The submit button has type="submit"; the toggle has type="button" and is not the main button
    const toggleBtn = toggleBtns.find(
      (btn) =>
        btn.getAttribute('type') === 'button' &&
        btn !== screen.getByRole('button', { name: 'Zaloguj się' }),
    );
    if (!toggleBtn) throw new Error('Nie znaleziono przycisku toggle hasła');
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
