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

async function fillValidForm(role: 'participant' | 'organizer' = 'participant') {
  await userEvent.type(screen.getByPlaceholderText('Jan'), 'Jan');
  await userEvent.type(screen.getByPlaceholderText('Kowalski'), 'Kowalski');
  await userEvent.type(screen.getByPlaceholderText('jan@example.com'), 'jan.kowalski@example.com');
  await userEvent.type(screen.getByPlaceholderText('Min. 8 znaków'), 'haslo1234');
  await userEvent.type(screen.getByPlaceholderText('Powtórz hasło'), 'haslo1234');

  if (role === 'organizer') {
    // Kliknij label "Organizator" (RadioGroupItem używa sr-only input)
    fireEvent.click(screen.getByText('Organizator').closest('label')!);
  }
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginWithCredentials.mockResolvedValue(false);
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

  it('wyświetla opcje wyboru roli', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Zawodnik')).toBeInTheDocument();
    expect(screen.getByText('Organizator')).toBeInTheDocument();
  });

  it('wyświetla link do logowania', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('domyślnie zaznaczona jest rola Zawodnik', () => {
    render(<RegisterPage />);
    const participantRadio = screen.getByDisplayValue('participant');
    expect(participantRadio).toBeChecked();
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
    // Walidacja Zod blokuje submit — loginWithCredentials nie jest wywoływane
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

  it('poprawna rejestracja wywołuje loginWithCredentials i przekierowuje uczestnika', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm('participant');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

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

  it('rejestracja organizatora przekierowuje do /organizer', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm('organizer');
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/organizer');
    });
  });

  it('wyświetla toast z potwierdzeniem po rejestracji', async () => {
    mockLoginWithCredentials.mockResolvedValueOnce(true);
    render(<RegisterPage />);

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Konto zostało utworzone!' }),
      );
    });
  });

  it('nie zawiera hardkodowanych adresów email jako mock danych', () => {
    render(<RegisterPage />);
    expect(screen.queryByText('jan@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('anna@example.com')).not.toBeInTheDocument();
  });
});
