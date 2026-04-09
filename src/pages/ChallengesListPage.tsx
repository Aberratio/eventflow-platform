import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, Target, Gift, ChevronRight, Users, Flame } from 'lucide-react';
import { mockChallengeParticipations, mockChallenges } from '@/api/mock/challenges.mock';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<string, string> = {
  active: 'Aktywne',
  completed: 'Zakończone',
  upcoming: 'Nadchodzące',
};

const statusConfig: Record<
  string,
  { variant: 'default' | 'secondary' | 'outline'; className: string }
> = {
  active: { variant: 'default', className: 'bg-success/20 text-success border-success/30' },
  completed: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  upcoming: { variant: 'outline', className: 'border-info/40 text-info' },
};

const ChallengesListPage = () => {
  const { user } = useAuth();

  const activeChallenges = mockChallenges.filter((c) => c.status === 'active');
  const otherChallenges = mockChallenges.filter((c) => c.status !== 'active');

  return (
    <Layout>
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-warning/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container relative py-10 sm:py-14">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/15 p-2.5">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Wyzwania</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ukończ wymagane biegi i zdobądź nagrody!
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{activeChallenges.length} aktywnych</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-1.5">
              <Target className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">{mockChallenges.length} łącznie</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Active challenges */}
        {activeChallenges.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-success" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Aktywne wyzwania
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} user={user} featured />
              ))}
            </div>
          </div>
        )}

        {/* Other challenges */}
        {otherChallenges.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-warning" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pozostałe
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {otherChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} user={user} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

interface ChallengeCardProps {
  challenge: (typeof mockChallenges)[0];
  user: ReturnType<typeof useAuth>['user'];
  featured?: boolean;
}

const ChallengeCard = ({ challenge, user, featured }: ChallengeCardProps) => {
  const userParticipation = user
    ? mockChallengeParticipations.find(
        (p) => p.challengeId === challenge.id && p.userId === user.id,
      )
    : null;

  const progressPercent = userParticipation
    ? (userParticipation.completedCount / challenge.rule.minCompleted) * 100
    : 0;

  const status = statusConfig[challenge.status] ?? statusConfig.upcoming;

  return (
    <Link to={`/challenges/${challenge.slug}`}>
      <Card
        className={`group overflow-hidden transition-all duration-300 hover:border-border/80 hover:shadow-lg ${featured ? 'border-success/20' : ''}`}
      >
        {/* Image with overlay */}
        {challenge.imageUrl && (
          <div className="relative h-40 overflow-hidden sm:h-48">
            <img
              src={challenge.imageUrl}
              alt={challenge.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-foreground sm:text-lg">
                  {challenge.name}
                </h3>
                <Badge variant={status.variant} className={`shrink-0 text-xs ${status.className}`}>
                  {statusLabels[challenge.status]}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {!challenge.imageUrl && (
          <div className="px-4 pb-2 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold sm:text-lg">{challenge.name}</h3>
              <Badge variant={status.variant} className={`shrink-0 text-xs ${status.className}`}>
                {statusLabels[challenge.status]}
              </Badge>
            </div>
          </div>
        )}

        <CardContent className="space-y-3 pb-4 pt-3">
          <p className="line-clamp-2 text-sm text-muted-foreground">{challenge.description}</p>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              {challenge.rule.minCompleted}/{challenge.events.length} biegów
            </span>
            {challenge.startDate && challenge.endDate && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-info" />
                {challenge.startDate} – {challenge.endDate}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <Gift className="h-3.5 w-3.5 text-warning" />
              {challenge.rewards.length} {challenge.rewards.length === 1 ? 'nagroda' : 'nagrody'}
            </span>
          </div>

          {/* Progress bar */}
          {userParticipation && (
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Twój postęp
                </span>
                <span className="font-semibold text-foreground">
                  {userParticipation.completedCount}/{challenge.rule.minCompleted}
                </span>
              </div>
              <Progress value={Math.min(progressPercent, 100)} className="h-2" />
              {userParticipation.isCompleted && (
                <Badge
                  variant="default"
                  className="mt-1 border-success/30 bg-success/20 text-success"
                >
                  <Trophy className="mr-1 h-3 w-3" />
                  Ukończone!
                </Badge>
              )}
            </div>
          )}

          {/* Chevron hint */}
          <div className="flex justify-end pt-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ChallengesListPage;
