import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from '../LoginPage';

const mockLoginWithCredentials = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    loginWithCredentials: mockLoginWithCredentials,
    isAuthenticated: false,
    user: null,
  }),
  useAuthSafe: () => ({
    loginWithCredentials: mockLoginWithCredentials,
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
  useToast: () => ({ toast: vi.fn() }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje formularz logowania', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
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
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument();
    });
  });

  it('wywołuje loginWithCredentials z poprawnymi danymi', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'demo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith('jan@example.com', 'demo1234');
    });
  });

  it('przycisk jest zablokowany podczas logowania', async () => {
    mockLoginWithCredentials.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 200)),
    );
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'demo1234');
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logowanie...' })).toBeDisabled();
    });
  });

  it('przełącza widoczność hasła po kliknięciu ikony', async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText('Hasło');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' });
    await userEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

describe('LoginPage — przekierowanie po zalogowaniu', () => {
  it('przekierowuje uczestnika do /participant', async () => {
    vi.doMock('@/contexts/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({
        loginWithCredentials: vi.fn(),
        isAuthenticated: true,
        user: { role: 'participant' },
      }),
    }));

    const { default: LoginPageRedirect } = await import('../LoginPage');
    render(<LoginPageRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/participant');
    });
  });
});
