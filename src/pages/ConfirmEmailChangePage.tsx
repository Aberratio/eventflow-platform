import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthPageShell } from '@/components/ui/auth-page-shell';
import { useAuth } from '@/contexts/AuthContext';
import { confirmEmailChange } from '@/api';
import { apiErrorCode } from '@/api/errors';

type Status = 'loading' | 'success' | 'error' | 'taken';

/** Lands here from the e-mail sent to the NEW address (`/confirm-email-change?token=…`). */
const ConfirmEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { logout } = useAuth();
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  // The token is single-use: React StrictMode runs effects twice in development, and a second
  // request would get `invalid_token` and overwrite the success state.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    confirmEmailChange({ token })
      .then(async () => {
        // The server ended every session when the address changed; clear this device's copy too.
        await logout();
        setStatus('success');
      })
      .catch((error: unknown) => {
        setStatus(apiErrorCode(error) === 'email_taken' ? 'taken' : 'error');
      });
  }, [token, logout]);

  if (status === 'loading') {
    return (
      <AuthPageShell
        icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
        title="Zmieniamy Twój adres e-mail…"
        maxWidth="max-w-md"
      >
        <span role="status" className="sr-only">
          Trwa potwierdzanie zmiany adresu e-mail
        </span>
      </AuthPageShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthPageShell
        icon={<CheckCircle className="h-8 w-8 text-success" />}
        title="Adres e-mail został zmieniony"
        subtitle="Adres e-mail został zmieniony. Zaloguj się, używając nowego adresu."
        maxWidth="max-w-md"
        accent="success"
      >
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <Button asChild className="w-full" size="lg">
              <Link to="/login">Zaloguj się</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
      title="Nie udało się zmienić adresu"
      subtitle={
        status === 'taken'
          ? 'Ten adres e-mail jest już zajęty. Spróbuj ponownie z innym adresem.'
          : 'Link jest nieprawidłowy lub wygasł.'
      }
      maxWidth="max-w-md"
      accent="destructive"
    >
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6">
          <Button asChild className="w-full" size="lg">
            <Link to="/login">Przejdź do logowania</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
};

export default ConfirmEmailChangePage;
