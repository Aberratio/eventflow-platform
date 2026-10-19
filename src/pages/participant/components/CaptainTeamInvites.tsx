import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { getTeamById, getTeamInvite } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import TeamRosterDialog from '@/components/team/TeamRosterDialog';
import { toast } from '@/hooks/use-toast';
import { buildTeamInviteLink } from '@/lib/teamInvite';
import type { Event, Registration } from '@/types';

/** A Zapis in one of these statuses no longer holds a place in its Drużyna. */
const INACTIVE_STATUSES = ['cancelled', 'expired', 'removed'];

interface CaptainTeamInvitesProps {
  items: Array<{ registration: Registration; event: Event }>;
}

/**
 * PP.54 (spec 23 §1): "Twoje drużyny" — the captain's way back to the invitation link. The
 * link is only shown at team creation, and a gateway event redirects the captain away from that
 * page, so the participant dashboard is where they (or anyone who lost the link) can copy it.
 * Lazy on purpose: the secret token is fetched only when the button is clicked.
 */
const CaptainTeamInvites = ({ items }: CaptainTeamInvitesProps) => {
  const { user } = useAuth();
  const [rosterTeam, setRosterTeam] = useState<{ id: string; name: string } | null>(null);

  const teamEvents = new Map<string, Event>();
  for (const { registration, event } of items) {
    if (registration.teamId && !INACTIVE_STATUSES.includes(registration.status)) {
      teamEvents.set(registration.teamId, event);
    }
  }
  const teamIds = Array.from(teamEvents.keys());

  const teamQueries = useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: ['team', teamId],
      queryFn: () => getTeamById(teamId),
      retry: false,
    })),
  });

  const captainTeams = teamQueries
    .map((query, index) => ({ team: query.data?.data, event: teamEvents.get(teamIds[index]) }))
    .filter(
      (row): row is { team: NonNullable<typeof row.team>; event: Event } =>
        !!row.team && !!row.event && !!user?.id && row.team.createdByUserId === user.id,
    );

  if (captainTeams.length === 0) return null;

  const copyInviteLink = async (teamId: string, event: Event) => {
    try {
      const response = await getTeamInvite(teamId);
      const link = buildTeamInviteLink(
        window.location.origin,
        event.slug,
        teamId,
        response.data.inviteToken,
      );
      await navigator.clipboard.writeText(link);
      toast({ title: 'Skopiowano link zaproszenia' });
    } catch {
      toast({ title: 'Nie udało się pobrać linku zaproszenia', variant: 'destructive' });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          Twoje drużyny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {captainTeams.map(({ team, event }) => (
          <div
            key={team.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{team.name}</p>
              <p className="truncate text-sm text-muted-foreground">{event.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRosterTeam({ id: team.id, name: team.name })}
              >
                Skład i wymiana zawodnika
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyInviteLink(team.id, event)}
              >
                Kopiuj link zaproszenia
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      {rosterTeam && (
        <TeamRosterDialog
          open
          onOpenChange={(next) => {
            if (!next) setRosterTeam(null);
          }}
          teamId={rosterTeam.id}
          teamName={rosterTeam.name}
        />
      )}
    </Card>
  );
};

export default CaptainTeamInvites;
