import { getChallengeParticipations, getChallenges } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { QueryErrorState } from '@/components/ui/query-error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHero, PageHeroTitle } from '@/components/ui/page-hero';
import { StatPill } from '@/components/ui/stat-pill';
import { Calendar, ChevronRight, Flame, Gift, Target, Trophy, Users } from 'lucide-react';
import { Challenge, ChallengeParticipation } from '@/types';

const statusLabels: Record<string, string> = {
  active: 'Aktywne',
  completed: 'Zakończone',
  upcoming: 'Nadchodzące',
  archived: 'Archiwalne',
};

const ChallengesListPage = () => {
  const { user } = useAuth();
  const {
    data: challengesData,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.challenges,
    queryFn: () => getChallenges(),
  });
  const { data: participationsData } = useQuery({
    queryKey: [...QUERY_KEYS.challengeParticipations, user?.id],
    queryFn: () => getChallengeParticipations(undefined, user!.id),
    enabled: !!user,
  });

  const challenges = challengesData?.data ?? [];
  const participations = participationsData?.data ?? [];
  const activeChallenges = challenges.filter((challenge) => challenge.status === 'active');
  const otherChallenges = challenges.filter((challenge) => challenge.status !== 'active');

  return (
    <Layout>
      <PageHero glow>
        <PageHeroTitle
          icon={<Trophy className="h-6 w-6" />}
          title="Wyzwania"
          subtitle="Ukończ wymagane wydarzenia i zdobądź nagrody"
        />
        <div className="mt-5 flex items-center gap-4">
          <StatPill
            icon={<Flame className="h-4 w-4 text-primary" />}
            label={`${activeChallenges.length} aktywnych`}
          />
          <StatPill
            icon={<Target className="h-4 w-4 text-warning" />}
            label={`${challenges.length} łącznie`}
          />
        </div>
      </PageHero>

      <div className="container py-8">
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            <ChallengeGroup
              title="Aktywne wyzwania"
              challenges={activeChallenges}
              userId={user?.id}
              participations={participations}
            />
            <ChallengeGroup
              title="Pozostałe"
              challenges={otherChallenges}
              userId={user?.id}
              participations={participations}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

const ChallengeGroup = ({
  title,
  challenges,
  userId,
  participations,
}: {
  title: string;
  challenges: Challenge[];
  userId?: string;
  participations: ChallengeParticipation[];
}) => {
  if (challenges.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            participation={participations.find(
              (item) => item.challengeId === challenge.id && item.userId === userId,
            )}
          />
        ))}
      </div>
    </div>
  );
};

const ChallengeCard = ({
  challenge,
  participation,
}: {
  challenge: Challenge;
  participation?: ChallengeParticipation;
}) => {
  const progressPercent = participation
    ? (participation.completedCount / challenge.rule.minCompleted) * 100
    : 0;

  return (
    <Link to={`/challenges/${challenge.slug}`}>
      <Card className="group overflow-hidden transition-all hover:border-border/80 hover:shadow-lg">
        {challenge.imageUrl && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={challenge.imageUrl}
              alt={challenge.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
              <h3 className="line-clamp-1 font-semibold">{challenge.name}</h3>
              <Badge variant="outline">{statusLabels[challenge.status]}</Badge>
            </div>
          </div>
        )}
        <CardContent className="space-y-3 p-4">
          {!challenge.imageUrl && (
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{challenge.name}</h3>
              <Badge variant="outline">{statusLabels[challenge.status]}</Badge>
            </div>
          )}
          <p className="line-clamp-2 text-sm text-muted-foreground">{challenge.description}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
              <Target className="h-3 w-3" /> {challenge.rule.minCompleted}/{challenge.events.length}{' '}
              wydarzeń
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
              <Gift className="h-3 w-3" /> {challenge.rewards.length} nagród
            </span>
            {challenge.startDate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
                <Calendar className="h-3 w-3" /> {challenge.startDate} - {challenge.endDate}
              </span>
            )}
          </div>
          {participation && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" /> Twój postęp
                </span>
                <span className="font-semibold">
                  {participation.completedCount}/{challenge.rule.minCompleted}
                </span>
              </div>
              <Progress
                aria-label="Twój postęp"
                value={Math.min(progressPercent, 100)}
                className="h-2"
              />
            </div>
          )}
          <div className="flex justify-end">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ChallengesListPage;
