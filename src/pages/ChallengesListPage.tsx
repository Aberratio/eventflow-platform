import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, Target, Gift } from 'lucide-react';
import { mockChallenges, mockChallengeParticipations } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<string, string> = {
  active: 'Aktywne',
  completed: 'Zakończone',
  upcoming: 'Nadchodzące',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  upcoming: 'outline',
};

const ChallengesListPage = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 bg-warning rounded-full" />
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Wyzwania
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-4">
            Ukończ wymagane biegi i zdobądź nagrody!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {mockChallenges.map(challenge => {
            const userParticipation = user
              ? mockChallengeParticipations.find(p => p.challengeId === challenge.id && p.userId === user.id)
              : null;

            const progressPercent = userParticipation
              ? (userParticipation.completedCount / challenge.rule.minCompleted) * 100
              : 0;

            return (
              <Link key={challenge.id} to={`/challenges/${challenge.slug}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  {challenge.imageUrl && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{challenge.name}</CardTitle>
                      <Badge variant={statusVariants[challenge.status]}>
                        {statusLabels[challenge.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {challenge.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {challenge.rule.minCompleted} z {challenge.events.length} biegów
                      </span>
                      {challenge.startDate && challenge.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {challenge.startDate} – {challenge.endDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        {challenge.rewards.length} {challenge.rewards.length === 1 ? 'nagroda' : 'nagrody'}
                      </span>
                    </div>

                    {userParticipation && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Twój postęp</span>
                          <span className="font-medium">
                            {userParticipation.completedCount}/{challenge.rule.minCompleted}
                          </span>
                        </div>
                        <Progress value={Math.min(progressPercent, 100)} className="h-2" />
                        {userParticipation.isCompleted && (
                          <Badge variant="default" className="mt-1">
                            <Trophy className="h-3 w-3 mr-1" />
                            Ukończone!
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ChallengesListPage;
