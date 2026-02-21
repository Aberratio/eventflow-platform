import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, ArrowLeft, Target, Gift, Calendar, CheckCircle2, Clock, XCircle, Upload, ExternalLink } from 'lucide-react';
import { mockChallenges, mockChallengeParticipations } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusConfig: Record<ChallengeEntryStatus, { label: string; icon: React.ReactNode; rowClass: string }> = {
  approved: { label: 'Zatwierdzone', icon: <CheckCircle2 className="h-4 w-4 text-success" />, rowClass: 'bg-success/5' },
  pending: { label: 'Oczekuje', icon: <Clock className="h-4 w-4 text-warning" />, rowClass: 'bg-warning/5' },
  rejected: { label: 'Odrzucone', icon: <XCircle className="h-4 w-4 text-destructive" />, rowClass: 'bg-destructive/5' },
  not_submitted: { label: 'Niezgłoszone', icon: <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />, rowClass: '' },
};

const ChallengeDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [submitTime, setSubmitTime] = useState('');
  const [submitPosition, setSubmitPosition] = useState('');
  const [submitProofUrl, setSubmitProofUrl] = useState('');

  const challenge = mockChallenges.find(c => c.slug === slug);
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

  const participation = user
    ? mockChallengeParticipations.find(p => p.challengeId === challenge.id && p.userId === user.id)
    : null;

  const progressPercent = participation
    ? (participation.completedCount / challenge.rule.minCompleted) * 100
    : 0;

  const getEntryForEvent = (eventId: string) => {
    return participation?.entries.find(e => e.eventId === eventId);
  };

  const getEntryStatus = (eventId: string): ChallengeEntryStatus => {
    const entry = getEntryForEvent(eventId);
    return entry?.status || 'not_submitted';
  };

  const handleSubmitResult = () => {
    if (!submitTime) {
      toast({ title: 'Podaj czas ukończenia', variant: 'destructive' });
      return;
    }
    toast({ title: 'Wynik zgłoszony!', description: 'Twoje zgłoszenie oczekuje na weryfikację.' });
    setSubmitDialogOpen(false);
    setSubmitTime('');
    setSubmitPosition('');
    setSubmitProofUrl('');
    setSelectedEventId(null);
  };

  const handleJoinChallenge = () => {
    toast({ title: 'Dołączono do wyzwania!', description: `Jesteś teraz uczestnikiem "${challenge.name}".` });
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Back */}
        <Link to="/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Wyzwania
        </Link>

        {/* Header */}
        {challenge.imageUrl && (
          <div className="h-48 sm:h-64 overflow-hidden rounded-lg mb-6">
            <img src={challenge.imageUrl} alt={challenge.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              {challenge.name}
            </h1>
            <p className="text-muted-foreground mt-1">{challenge.description}</p>
          </div>
          {!participation && user?.role === 'participant' && (
            <Button onClick={handleJoinChallenge} size="lg">
              Dołącz do wyzwania
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{challenge.rule.minCompleted}</div>
              <div className="text-xs text-muted-foreground">z {challenge.events.length} wymaganych</div>
            </CardContent>
          </Card>
          {challenge.rule.maxTime && (
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-lg font-bold">{challenge.rule.maxTime}</div>
                <div className="text-xs text-muted-foreground">Limit czasu</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-sm font-medium">{challenge.startDate}</div>
              <div className="text-xs text-muted-foreground">do {challenge.endDate}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Gift className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{challenge.rewards.length}</div>
              <div className="text-xs text-muted-foreground">{challenge.rewards.length === 1 ? 'nagroda' : 'nagrody'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nagrody</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {challenge.rewards.map(reward => (
                <Badge key={reward.id} variant="secondary" className="py-1.5 px-3 text-sm gap-1.5">
                  {reward.type === 'free' ? '📜' : '🏅'}
                  {reward.name}
                  {reward.price ? ` (${reward.price} zł)` : ' (darmowe)'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {participation && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Twój postęp</span>
                <span className="text-sm font-bold">
                  {participation.completedCount}/{challenge.rule.minCompleted}
                  {participation.isCompleted && (
                    <Badge variant="default" className="ml-2">
                      <Trophy className="h-3 w-3 mr-1" /> Ukończone!
                    </Badge>
                  )}
                </span>
              </div>
              <Progress value={Math.min(progressPercent, 100)} className="h-3" />
              {participation.assignedNumber && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nr Korony: <span className="font-bold text-foreground">#{participation.assignedNumber}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lista biegów ({challenge.events.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Bieg</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden sm:table-cell">Czas</TableHead>
                  <TableHead className="hidden sm:table-cell">Miejsce</TableHead>
                  <TableHead className="text-right">Akcja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenge.events.map(event => {
                  const entryStatus = getEntryStatus(event.eventId);
                  const entry = getEntryForEvent(event.eventId);
                  const config = statusConfig[entryStatus];

                  return (
                    <TableRow key={event.eventId} className={cn(config.rowClass)}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {config.icon}
                          <span className="text-xs hidden sm:inline">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{event.eventName}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">{event.eventDate}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{event.eventDate}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm font-mono">
                        {entry?.submittedTime || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {entry?.submittedPosition ? `#${entry.submittedPosition}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entryStatus === 'not_submitted' && participation && (
                          <Dialog open={submitDialogOpen && selectedEventId === event.eventId} onOpenChange={(open) => { setSubmitDialogOpen(open); if (!open) setSelectedEventId(null); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedEventId(event.eventId)}>
                                <Upload className="h-3 w-3 mr-1" />
                                Zgłoś
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Zgłoś wynik – {event.eventName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Czas (HH:MM:SS) *</Label>
                                  <Input placeholder="01:45:30" value={submitTime} onChange={e => setSubmitTime(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Miejsce w klasyfikacji</Label>
                                  <Input type="number" placeholder="np. 234" value={submitPosition} onChange={e => setSubmitPosition(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Link do dowodu (wyniki / Strava)</Label>
                                  <Input placeholder="https://..." value={submitProofUrl} onChange={e => setSubmitProofUrl(e.target.value)} />
                                </div>
                                <Button onClick={handleSubmitResult} className="w-full">
                                  Wyślij zgłoszenie
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {entryStatus === 'rejected' && entry?.rejectionReason && (
                          <span className="text-xs text-destructive" title={entry.rejectionReason}>Odrzucone</span>
                        )}
                        {entry?.proofUrl && entryStatus !== 'not_submitted' && (
                          <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Dowód
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChallengeDetailsPage;
