import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, RefreshCw, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getEventTeam,
  inviteEventTeamMember,
  resendEventTeamInvitation,
  revokeEventTeamMember,
} from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { isInvitationExpired, teamStatusLabels, visibleTeamMembers } from '@/lib/eventTeam';
import type { EventTeamInvitationMailState, EventTeamMember } from '@/types';

const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const mailStateNote = (state: EventTeamInvitationMailState | undefined): string | null => {
  if (state === 'pending') return 'Wysyłka maila zostanie ponowiona automatycznie.';
  if (state === 'lost') {
    return 'Nie udało się zakolejkować maila. Spróbuj wysłać zaproszenie ponownie.';
  }
  return null;
};

interface EventTeamTabProps {
  eventId: string;
}

/**
 * R-01 (zakres P2, do potwierdzenia przez Zamawiającego): the Event Team tab - the Owner plus the
 * Co-managers. Rendered only for the Owner/admin; the server refuses everyone else (403).
 */
export const EventTeamTab = ({ eventId }: EventTeamTabProps) => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberToRevoke, setMemberToRevoke] = useState<EventTeamMember | null>(null);
  const queryKey = ['event-team', eventId];

  const team = useQuery({ queryKey, queryFn: () => getEventTeam(eventId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const invite = useMutation({
    mutationFn: (address: string) => inviteEventTeamMember(eventId, address),
    onSuccess: async (response) => {
      setEmail('');
      setInviteError(null);
      toast.success('Zaproszenie zostało wysłane');
      const note = mailStateNote(response.data.mailState);
      if (note) toast.warning(note);
      await refresh();
    },
    onError: (error) => setInviteError(errorText(error, 'Nie udało się wysłać zaproszenia.')),
  });

  const resend = useMutation({
    mutationFn: (memberId: string) => resendEventTeamInvitation(eventId, memberId),
    onSuccess: async (response) => {
      toast.success('Zaproszenie zostało wysłane ponownie');
      const note = mailStateNote(response.data.mailState);
      if (note) toast.warning(note);
      await refresh();
    },
    onError: (error) => toast.error(errorText(error, 'Nie udało się wysłać zaproszenia ponownie.')),
  });

  const revoke = useMutation({
    mutationFn: (memberId: string) => revokeEventTeamMember(eventId, memberId),
    onSuccess: async () => {
      toast.success('Dostęp został odebrany');
      await refresh();
    },
    onError: (error) => toast.error(errorText(error, 'Nie udało się odebrać dostępu.')),
    onSettled: () => setMemberToRevoke(null),
  });

  const members = visibleTeamMembers(team.data?.data.members ?? []);
  const owner = team.data?.data.owner ?? null;
  const revokingInvitation = memberToRevoke?.status === 'invited';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zaproś współzarządzającego</CardTitle>
          <CardDescription>
            Współzarządzający może edytować wydarzenie, zarządzać zapisami i wynikami. Nie widzi
            zespołu, nie zmienia płatności, nie usuwa wydarzenia ani nie przekazuje jego własności.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (email.trim()) invite.mutate(email.trim());
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="team-invite-email">Adres e-mail</Label>
              <Input
                id="team-invite-email"
                type="email"
                autoComplete="off"
                placeholder="osoba@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={invite.isPending || !email.trim()}>
              <MailPlus className="mr-2 h-4 w-4" />
              {invite.isPending ? 'Wysyłanie…' : 'Wyślij zaproszenie'}
            </Button>
          </form>
          {inviteError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {inviteError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zespół wydarzenia</CardTitle>
        </CardHeader>
        <CardContent>
          {team.isLoading ? (
            <p className="text-muted-foreground">Ładowanie zespołu…</p>
          ) : team.isError ? (
            <p role="alert" className="text-destructive">
              {errorText(team.error, 'Nie udało się wczytać zespołu.')}
            </p>
          ) : (
            <ul className="divide-y" aria-label="Członkowie zespołu">
              {owner && (
                <li className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{owner.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{owner.email}</p>
                  </div>
                  <Badge>Właściciel</Badge>
                </li>
              )}
              {members.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">
                  Nie ma jeszcze współzarządzających.
                </li>
              )}
              {members.map((member) => {
                const expired = isInvitationExpired(member);
                return (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.name || member.email}</p>
                      {member.name && (
                        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Współzarządzający</Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                        {expired ? 'Zaproszenie wygasło' : teamStatusLabels[member.status]}
                      </Badge>
                      {member.status === 'invited' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(member.id)}
                          aria-label={`Wyślij ponownie zaproszenie: ${member.email}`}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Wyślij ponownie
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberToRevoke(member)}
                        aria-label={`${
                          member.status === 'invited' ? 'Odwołaj zaproszenie' : 'Odbierz dostęp'
                        }: ${member.email}`}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        {member.status === 'invited' ? 'Odwołaj' : 'Odbierz dostęp'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={memberToRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokingInvitation ? 'Odwołać zaproszenie?' : 'Odebrać dostęp?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revokingInvitation
                ? `Link z zaproszenia dla ${memberToRevoke?.email} przestanie działać.`
                : `${memberToRevoke?.name || memberToRevoke?.email} straci dostęp do zarządzania tym wydarzeniem i dostanie o tym wiadomość e-mail.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revoke.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (memberToRevoke) revoke.mutate(memberToRevoke.id);
              }}
            >
              {revokingInvitation ? 'Odwołaj zaproszenie' : 'Odbierz dostęp'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
