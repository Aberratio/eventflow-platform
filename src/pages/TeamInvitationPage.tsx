import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthPageShell } from '@/components/ui/auth-page-shell';
import { useAuth } from '@/contexts/AuthContext';
import { acceptTeamInvitation, getTeamInvitation } from '@/api';
import { ApiRequestError, apiErrorCode } from '@/api/errors';

/** What the Account sees when the invitation cannot be accepted, by the server's error code. */
const refusalMessages: Record<string, string> = {
  invitation_not_found: 'To zaproszenie nie istnieje albo zostało odwołane.',
  invitation_expired: 'To zaproszenie wygasło. Poproś organizatora o nowe.',
  invitation_email_mismatch:
    'To zaproszenie wysłano na inny adres e-mail. Zaloguj się na właściwe konto.',
};

const refusalMessage = (error: unknown): string =>
  (error instanceof ApiRequestError && error.code && refusalMessages[error.code]) ||
  (error instanceof Error ? error.message : 'Nie udało się przetworzyć zaproszenia.');

/**
 * R-01 (zakres P2, do potwierdzenia przez Zamawiającego): lands here from the e-mail invitation
 * (`/team-invitations/{token}`). The preview is public; accepting needs the Account the invitation was
 * addressed to, so a signed-out visitor is sent to the login and brought back.
 */
const TeamInvitationPage = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  const preview = useQuery({
    queryKey: ['team-invitation', token],
    queryFn: () => getTeamInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });

  const accept = useMutation({ mutationFn: () => acceptTeamInvitation(token) });

  const returnTo = `/team-invitations/${token}`;
  const goToLogin = () => navigate('/logowanie', { state: { returnTo } });

  if (preview.isLoading || authLoading) {
    return (
      <AuthPageShell
        icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
        title="Sprawdzamy zaproszenie…"
        maxWidth="max-w-md"
      >
        <span role="status" className="sr-only">
          Trwa wczytywanie zaproszenia
        </span>
      </AuthPageShell>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthPageShell
        icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
        title="Nie można użyć zaproszenia"
        subtitle={refusalMessage(preview.error)}
        maxWidth="max-w-md"
        accent="destructive"
      >
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <Button asChild className="w-full" size="lg">
              <Link to="/">Przejdź na stronę główną</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  const invitation = preview.data.data;

  if (accept.isSuccess) {
    const joined = accept.data.data;
    return (
      <AuthPageShell
        icon={<CheckCircle className="h-8 w-8 text-success" />}
        title="Jesteś w zespole wydarzenia"
        subtitle={`Zostałeś współzarządzającym wydarzenia „${joined.eventName || invitation.eventName}”.`}
        maxWidth="max-w-md"
        accent="success"
      >
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <Button asChild className="w-full" size="lg">
              <Link to={`/organizer/events/${joined.eventId}/overview`}>
                Przejdź do zarządzania wydarzeniem
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  const mismatch = apiErrorCode(accept.error) === 'invitation_email_mismatch';

  return (
    <AuthPageShell
      icon={<Users className="h-8 w-8 text-primary" />}
      title="Zaproszenie do zespołu wydarzenia"
      subtitle={`${invitation.inviterName || 'Organizator'} zaprasza Cię do współzarządzania wydarzeniem „${invitation.eventName}”.`}
      maxWidth="max-w-md"
    >
      <Card className="border-border/50 shadow-lg">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Zaproszenie wysłano na adres <span className="font-medium">{invitation.email}</span>.
            Zaakceptować je można tylko na koncie z tym adresem e-mail.
          </p>

          {accept.isError && (
            <p role="alert" className="text-sm text-destructive">
              {refusalMessage(accept.error)}
            </p>
          )}

          {!isAuthenticated || !user ? (
            <>
              <Button className="w-full" size="lg" onClick={goToLogin}>
                Zaloguj się, aby zaakceptować
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Nie masz konta?{' '}
                <Link to="/rejestracja" className="text-primary underline">
                  Zarejestruj się
                </Link>{' '}
                tym samym adresem e-mail, a potem wróć do tego linku.
              </p>
            </>
          ) : mismatch ? (
            <Button
              className="w-full"
              size="lg"
              disabled={switching}
              onClick={async () => {
                setSwitching(true);
                await logout();
                goToLogin();
              }}
            >
              Wyloguj się i zaloguj na właściwe konto
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              disabled={accept.isPending}
              onClick={() => accept.mutate()}
            >
              {accept.isPending ? 'Akceptowanie…' : 'Akceptuj'}
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
};

export default TeamInvitationPage;
