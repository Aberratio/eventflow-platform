import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthPageShell } from '@/components/ui/auth-page-shell';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resendEmailVerification, verifyEmail } from '@/api';

type Status = 'loading' | 'success' | 'error';

/** Lands here from the verification e-mail (`/verify-email?token=…`). */
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [resending, setResending] = useState(false);
  // The token is single-use: React StrictMode runs effects twice in development, and a second
  // request would get `invalid_token` and overwrite the success state.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail({ token })
      .then(() => {
        setStatus('success');
        // Drops the "niezweryfikowany" badge for a signed-in user.
        void refreshUser();
      })
      .catch(() => setStatus('error'));
  }, [token, refreshUser]);

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await resendEmailVerification();
      toast({
        title: response.data?.alreadyVerified
          ? 'Adres e-mail jest już potwierdzony'
          : 'Wysłaliśmy link weryfikacyjny.',
      });
    } catch (error) {
      toast({
        title: 'Nie udało się wysłać linku',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthPageShell
        icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
        title="Weryfikujemy Twój adres e-mail…"
        maxWidth="max-w-md"
      >
        <span role="status" className="sr-only">
          Trwa weryfikacja adresu e-mail
        </span>
      </AuthPageShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthPageShell
        icon={<CheckCircle className="h-8 w-8 text-success" />}
        title="Adres e-mail potwierdzony"
        subtitle="Dziękujemy. Twój adres e-mail został zweryfikowany."
        maxWidth="max-w-md"
        accent="success"
      >
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <Button asChild className="w-full" size="lg">
              {isAuthenticated ? (
                <Link to="/">Przejdź dalej</Link>
              ) : (
                <Link to="/login">Zaloguj się</Link>
              )}
            </Button>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
      title="Nie udało się potwierdzić adresu"
      subtitle="Link weryfikacyjny jest nieprawidłowy lub wygasł."
      maxWidth="max-w-md"
      accent="destructive"
    >
      <Card className="border-border/50 shadow-lg">
        <CardContent className="space-y-3 pt-6">
          {isAuthenticated ? (
            <Button className="w-full" size="lg" onClick={handleResend} disabled={resending}>
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="mr-2 h-4 w-4" />
              )}
              Wyślij nowy link
            </Button>
          ) : (
            <Button asChild className="w-full" size="lg">
              <Link to="/login">Zaloguj się, aby wysłać nowy link</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
};

export default VerifyEmailPage;
