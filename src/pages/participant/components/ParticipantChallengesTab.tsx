import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Target, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { mockChallengeParticipations, mockChallenges } from '@/api/mock/challenges.mock';
import { useAuth } from '@/contexts/AuthContext';

const ParticipantChallengesTab = () => {
  const { user } = useAuth();
  const myParticipations = mockChallengeParticipations.filter((p) => p.userId === user?.id);

  if (myParticipations.length === 0) {
    return (
      <div className="py-12 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold">Brak aktywnych wyzwań</h3>
        <p className="mb-4 text-muted-foreground">Dołącz do wyzwania i zacznij zbierać biegi!</p>
        <Button asChild>
          <Link to="/challenges">Przeglądaj wyzwania</Link>
        </Button>
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

      {myParticipations.map((participation) => {
        const challenge = mockChallenges.find((c) => c.id === participation.challengeId);
        if (!challenge) return null;

        const progressPercent = (participation.completedCount / challenge.rule.minCompleted) * 100;
        const pendingCount = participation.entries.filter((e) => e.status === 'pending').length;
        const rejectedCount = participation.entries.filter((e) => e.status === 'rejected').length;

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
                <Progress value={Math.min(progressPercent, 100)} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" /> {participation.completedCount} zatwierdzone
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
                  <span className="font-bold text-foreground">#{participation.assignedNumber}</span>
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
    </div>
  );
};

export default ParticipantChallengesTab;
