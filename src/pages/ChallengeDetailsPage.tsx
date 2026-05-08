import {
  getChallengeBySlug,
  getChallengeParticipations,
  joinChallenge,
  submitChallengeEntry,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Gift, Target, Trophy, Upload, XCircle } from 'lucide-react';
import { ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

const entryStatus: Record<ChallengeEntryStatus, { label: string; icon: React.ReactNode }> = {
  approved: { label: 'Zatwierdzone', icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
  pending: { label: 'Oczekuje', icon: <Clock className="h-4 w-4 text-warning" /> },
  rejected: { label: 'Odrzucone', icon: <XCircle className="h-4 w-4 text-destructive" /> },
  not_submitted: { label: 'Niezgłoszone', icon: <div className="h-4 w-4 rounded border" /> },
};

const ChallengeDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [position, setPosition] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const { data: challengeData, isLoading: challengeLoading } = useQuery({
    queryKey: slug ? QUERY_KEYS.challengeBySlug(slug) : ['challenge'],
    queryFn: () => getChallengeBySlug(slug!),
    enabled: !!slug,
  });
  const challenge = challengeData?.data;
  const { data: participationsData } = useQuery({
    queryKey: [...QUERY_KEYS.challengeParticipations, challenge?.id, user?.id],
    queryFn: () => getChallengeParticipations(challenge!.id, user!.id),
    enabled: !!challenge?.id && !!user,
  });
  const participation = participationsData?.data?.[0];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challengeParticipations });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges });
  };

  const joinMutation = useMutation({
    mutationFn: () => joinChallenge(challenge!.id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Dołączono do wyzwania' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitChallengeEntry({
        challengeId: challenge!.id,
        eventId: selectedEventId!,
        submittedTime: time,
        submittedPosition: position ? Number(position) : undefined,
        proofUrl,
      }),
    onSuccess: () => {
      invalidate();
      setSelectedEventId(null);
      setTime('');
      setPosition('');
      setProofUrl('');
      toast({ title: 'Wynik zgłoszony', description: 'Zgłoszenie oczekuje na weryfikację.' });
    },
  });

  if (challengeLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">Ładowanie wyzwania...</div>
      </Layout>
    );
  }

  if (!challenge) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Wyzwanie nie znalezione</h1>
          <Button asChild className="mt-4"><Link to="/challenges">Wróć do listy</Link></Button>
        </div>
      </Layout>
    );
  }

  const progress = participation
    ? (participation.completedCount / challenge.rule.minCompleted) * 100
    : 0;
  const getEntry = (eventId: string) => participation?.entries.find((entry) => entry.eventId === eventId);

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/challenges"><ArrowLeft className="mr-2 h-4 w-4" /> Wyzwania</Link>
        </Button>

        <Card className="mb-6 overflow-hidden">
          {challenge.imageUrl && <img src={challenge.imageUrl} alt={challenge.name} className="h-64 w-full object-cover" />}
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-2"><Trophy className="mr-1 h-3 w-3" /> Wyzwanie</Badge>
                <h1 className="text-3xl font-bold">{challenge.name}</h1>
                <p className="mt-2 text-muted-foreground">{challenge.description}</p>
              </div>
              {!participation && user?.role === 'participant' && (
                <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>Dołącz</Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Target className="h-4 w-4" /> {challenge.rule.minCompleted}/{challenge.events.length} wydarzeń</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Gift className="h-4 w-4" /> {challenge.rewards.length} nagród</span>
              {challenge.startDate && <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Calendar className="h-4 w-4" /> {challenge.startDate} - {challenge.endDate}</span>}
            </div>
          </CardContent>
        </Card>

        {participation && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">Twój postęp</span>
                <span>{participation.completedCount}/{challenge.rule.minCompleted}</span>
              </div>
              <Progress value={Math.min(progress, 100)} />
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader><CardTitle>Produkty i nagrody</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {challenge.rewards.map((reward) => (
              <div key={reward.id} className="rounded border p-3">
                <p className="font-medium">{reward.name}</p>
                <p className="text-sm text-muted-foreground">{reward.price ? `${reward.price} zł` : 'Darmowe'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Wydarzenia w wyzwaniu</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {challenge.events.map((event) => {
              const entry = getEntry(event.eventId);
              const status = entry?.status ?? 'not_submitted';
              return (
                <div key={event.eventId} className="flex items-center gap-3 p-4">
                  {entryStatus[status].icon}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{event.eventName}</p>
                    <p className="text-sm text-muted-foreground">{event.eventDate} · {entryStatus[status].label}{entry?.submittedTime ? ` · ${entry.submittedTime}` : ''}</p>
                  </div>
                  {participation && status === 'not_submitted' && (
                    <Dialog open={selectedEventId === event.eventId} onOpenChange={(open) => setSelectedEventId(open ? event.eventId : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Upload className="mr-1 h-4 w-4" /> Zgłoś</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Zgłoś wynik - {event.eventName}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Czas</Label><Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="01:45:30" /></div>
                          <div><Label>Miejsce</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} type="number" /></div>
                          <div><Label>Link do dowodu</Label><Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} /></div>
                          <Button className="w-full" disabled={!time || submitMutation.isPending} onClick={() => submitMutation.mutate()}>Wyślij</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChallengeDetailsPage;
