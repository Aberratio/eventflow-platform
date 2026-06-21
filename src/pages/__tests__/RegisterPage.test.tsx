import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../RegisterPage';

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
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/logger', () => ({
  appLogger: { auth: vi.fn() },
}));

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    password: 'haslo1234',
    confirmPassword: 'haslo1234',
    ...overrides,
  };

  await userEvent.type(screen.getByLabelText('Imię'), values.firstName);
  await userEvent.type(screen.getByLabelText('Nazwisko'), values.lastName);
  await userEvent.type(screen.getByLabelText('Email'), values.email);
  await userEvent.type(screen.getByLabelText('Hasło'), values.password);
  await userEvent.type(screen.getByLabelText('Potwierdź hasło'), values.confirmPassword);
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginWithCredentials.mockResolvedValue(false);
  });

  it('renderuje wszystkie pola formularza', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('Imię')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwisko')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByLabelText('Potwierdź hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zarejestruj się' })).toBeInTheDocument();
  });

  it('wyświetla opcje wyboru roli', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Zawodnik')).toBeInTheDocument();
    expect(screen.getByText('Organizator')).toBeInTheDocument();
  });

  it('wyświetla link do logowania', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('pokazuje błąd gdy imię ma mniej niż 2 znaki', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Imię'), 'J');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Imię musi mieć minimum 2 znaki')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd gdy nazwisko ma mniej niż 2 znaki', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Imię'), 'Jan');
    await userEvent.type(screen.getByLabelText('Nazwisko'), 'K');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Nazwisko musi mieć minimum 2 znaki')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd przy nieprawidłowym emailu', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Imię'), 'Jan');
    await userEvent.type(screen.getByLabelText('Nazwisko'), 'Kowalski');
    await userEvent.type(screen.getByLabelText('Email'), 'to-nie-email');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy adres email')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd gdy hasło ma mniej niż 8 znaków', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Imię'), 'Jan');
    await userEvent.type(screen.getByLabelText('Nazwisko'), 'Kowalski');
    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'krotkie');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasło musi mieć minimum 8 znaków')).toBeInTheDocument();
    });
  });

  it('pokazuje błąd gdy hasła się nie zgadzają', async () => {
    render(<RegisterPage />);
    await fillForm({ password: 'haslo1234', confirmPassword: 'inne5678' });
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => {
      expect(screen.getByText('Hasła muszą być identyczne')).toBeInTheDocument();
    });
  });

  it('poprawna rejestracja wywołuje loginWithCredentials i przekierowuje uczestnika', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith('jan.kowalski@example.com', 'haslo1234');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/participant');
    });
  });

  it('rejestracja organizatora przekierowuje do /organizer', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillForm();
    await userEvent.click(screen.getByLabelText('Organizator'));
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/organizer');
    });
  });

  it('wyświetla toast z potwierdzeniem po rejestracji', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Konto zostało utworzone!' }),
      );
    });
  });

  it('przycisk jest zablokowany podczas wysyłania', async () => {
    mockLoginWithCredentials.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 200)),
    );
    render(<RegisterPage />);

    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tworzenie konta...' })).toBeDisabled();
    });
  });

  it('nie zawiera hardkodowanych adresów email jako mock danych', () => {
    render(<RegisterPage />);
    expect(screen.queryByText('jan@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('anna@example.com')).not.toBeInTheDocument();
  });
});
