import { useState } from 'react';
import { getCare, getChallengeParticipations, getChallenges, joinChallenge } from '@/api';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Target, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ChallengeParticipation } from '@/types';

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface ParticipationGroup {
  key: string;
  competitorId: string | null;
  name: string | null;
  items: ChallengeParticipation[];
}

/** Participations grouped by Zawodnik; rows with no Zawodnik (legacy) belong to the account itself. */
const groupParticipationsByCompetitor = (
  participations: ChallengeParticipation[],
): ParticipationGroup[] => {
  const groups = new Map<string, ParticipationGroup>();
  for (const participation of participations) {
    const key = participation.competitorId ?? 'own';
    const group = groups.get(key) ?? {
      key,
      competitorId: participation.competitorId ?? null,
      name: participation.competitorName ?? null,
      items: [],
    };
    group.items.push(participation);
    groups.set(key, group);
  }
  return [...groups.values()];
};

const ParticipantChallengesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wardId, setWardId] = useState('');
  const [challengeToJoin, setChallengeToJoin] = useState('');

  const { data: participationsResp } = useQuery({
    queryKey: ['challenge-participations', user?.id],
    queryFn: () => getChallengeParticipations(undefined, user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: challengesResp } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => getChallenges(),
  });
  const { data: care } = useQuery({
    queryKey: ['care'],
    queryFn: () => getCare(),
    select: (r) => r.data,
    enabled: Boolean(user?.id),
  });
  const myParticipations = participationsResp?.data ?? [];
  const allChallenges = challengesResp?.data ?? [];
  const wards = care?.myCompetitors ?? [];
  const ownCompetitorId = care?.myProfile?.id ?? null;

  const joinForWard = useMutation({
    mutationFn: () => joinChallenge(challengeToJoin, wardId),
    onSuccess: () => {
      toast.success('Zapisano na wyzwanie', {
        description: 'Podopieczny bierze udział w wyzwaniu.',
      });
      setChallengeToJoin('');
      queryClient.invalidateQueries({ queryKey: ['challenge-participations'] });
    },
    onError: (err: Error) => {
      toast.error('Błąd', { description: err.message });
    },
  });

  const joinableChallenges = allChallenges.filter(
    (c) =>
      (c.status === 'active' || c.status === 'upcoming') &&
      !myParticipations.some((p) => p.challengeId === c.id && p.competitorId === wardId),
  );

  const wardJoinForm =
    wards.length > 0 ? (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Zapisz podopiecznego na wyzwanie</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (wardId && challengeToJoin) joinForWard.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="challenge-ward">Zawodnik</Label>
              <select
                id="challenge-ward"
                className={SELECT_CLASS}
                value={wardId}
                onChange={(e) => {
                  setWardId(e.target.value);
                  setChallengeToJoin('');
                }}
              >
                <option value="">Wybierz zawodnika</option>
                {wards.map((ward) => (
                  <option key={ward.competitorId} value={ward.competitorId}>
                    {ward.firstName} {ward.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="challenge-to-join">Wyzwanie</Label>
              <select
                id="challenge-to-join"
                className={SELECT_CLASS}
                value={challengeToJoin}
                disabled={!wardId}
                onChange={(e) => setChallengeToJoin(e.target.value)}
              >
                <option value="">Wybierz wyzwanie</option>
                {joinableChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!wardId || !challengeToJoin || joinForWard.isPending}>
              Zapisz na wyzwanie
            </Button>
          </form>
        </CardContent>
      </Card>
    ) : null;

  const groups = groupParticipationsByCompetitor(myParticipations);

  if (myParticipations.length === 0) {
    return (
      <div className="space-y-6">
        {wardJoinForm}
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold">Brak aktywnych wyzwań</h3>
          <p className="mb-4 text-muted-foreground">Dołącz do wyzwania i zacznij zbierać biegi!</p>
          <Button asChild>
            <Link to="/challenges">Przeglądaj wyzwania</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Moje wyzwania</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/challenges">Wszystkie wyzwania</Link>
        </Button>
      </div>

      {wardJoinForm}

      {groups.map((group) => (
        <section key={group.key} className="space-y-4" aria-label={group.name ?? 'Moje wyzwania'}>
          {groups.length > 1 && (
            <h3 className="text-base font-semibold">
              {group.competitorId === null || group.competitorId === ownCompetitorId
                ? `${group.name ?? 'Ja'} (Ty)`
                : group.name}
            </h3>
          )}
          {group.items.map((participation) => {
            const challenge = allChallenges.find((c) => c.id === participation.challengeId);
            if (!challenge) return null;

            const progressPercent =
              (participation.completedCount / challenge.rule.minCompleted) * 100;
            const pendingCount = participation.entries.filter((e) => e.status === 'pending').length;
            const rejectedCount = participation.entries.filter(
              (e) => e.status === 'rejected',
            ).length;

            return (
              <Card key={participation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-primary" />
                      {challenge.name}
                    </CardTitle>
                    {participation.isCompleted ? (
                      <Badge variant="default">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Ukończone
                      </Badge>
                    ) : (
                      <Badge variant="outline">W trakcie</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Postęp</span>
                      <span className="font-medium">
                        {participation.completedCount}/{challenge.rule.minCompleted}
                      </span>
                    </div>
                    <Progress
                      aria-label="Postęp wyzwania"
                      value={Math.min(progressPercent, 100)}
                      className="h-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" /> {participation.completedCount}{' '}
                      zatwierdzone
                    </span>
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-warning">
                        <Clock className="h-3 w-3" /> {pendingCount} oczekujące
                      </span>
                    )}
                    {rejectedCount > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-3 w-3" /> {rejectedCount} odrzucone
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-3 w-3" />{' '}
                      {challenge.events.length - participation.entries.length} do zgłoszenia
                    </span>
                  </div>

                  {participation.assignedNumber && (
                    <p className="text-sm text-muted-foreground">
                      Nr Korony:{' '}
                      <span className="font-bold text-foreground">
                        #{participation.assignedNumber}
                      </span>
                    </p>
                  )}

                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link to={`/challenges/${challenge.slug}`}>
                      Szczegóły <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
    </div>
  );
};

export default ParticipantChallengesTab;
