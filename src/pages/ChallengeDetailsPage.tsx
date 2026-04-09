import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trophy,
  ArrowLeft,
  Target,
  Gift,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  ExternalLink,
  Medal,
  MapPin,
  Users,
  Flame,
} from 'lucide-react';
import { mockChallengeParticipations, mockChallenges } from '@/api/mock/challenges.mock';
import { useAuth } from '@/contexts/AuthContext';
import { ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  ChallengeEntryStatus,
  { label: string; icon: React.ReactNode; rowClass: string; dotClass: string }
> = {
  approved: {
    label: 'Zatwierdzone',
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    rowClass: 'border-l-2 border-l-success/60',
    dotClass: 'bg-success',
  },
  pending: {
    label: 'Oczekuje',
    icon: <Clock className="h-4 w-4 text-warning" />,
    rowClass: 'border-l-2 border-l-warning/60',
    dotClass: 'bg-warning',
  },
  rejected: {
    label: 'Odrzucone',
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    rowClass: 'border-l-2 border-l-destructive/60',
    dotClass: 'bg-destructive',
  },
  not_submitted: {
    label: 'Niezgłoszone',
    icon: <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />,
    rowClass: 'border-l-2 border-l-transparent',
    dotClass: 'bg-muted-foreground/30',
  },
};

const ChallengeDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [submitTime, setSubmitTime] = useState('');
  const [submitPosition, setSubmitPosition] = useState('');
  const [submitProofUrl, setSubmitProofUrl] = useState('');

  const challenge = mockChallenges.find((c) => c.slug === slug);
  if (!challenge) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Wyzwanie nie znalezione</h1>
          <Button asChild className="mt-4">
            <Link to="/challenges">Wróć do listy</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const participation = user
    ? mockChallengeParticipations.find(
        (p) => p.challengeId === challenge.id && p.userId === user.id,
      )
    : null;

  const progressPercent = participation
    ? (participation.completedCount / challenge.rule.minCompleted) * 100
    : 0;

  const getEntryForEvent = (eventId: string) => {
    return participation?.entries.find((e) => e.eventId === eventId);
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
    toast({
      title: 'Dołączono do wyzwania!',
      description: `Jesteś teraz uczestnikiem "${challenge.name}".`,
    });
  };

  const approvedCount = participation?.entries.filter((e) => e.status === 'approved').length || 0;
  const pendingCount = participation?.entries.filter((e) => e.status === 'pending').length || 0;

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero with image overlay */}
        <div className="relative">
          {challenge.imageUrl && (
            <div className="h-56 overflow-hidden sm:h-72 lg:h-80">
              <img
                src={challenge.imageUrl}
                alt={challenge.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
            </div>
          )}

          {/* Back button - over image */}
          <div className="absolute left-4 top-4 z-10 sm:left-8">
            <Link
              to="/challenges"
              className="inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-3 py-1.5 text-sm text-foreground/80 backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Wyzwania
            </Link>
          </div>

          {/* Title overlay */}
          <div className="container relative z-10 -mt-24 max-w-4xl px-4 pb-6 sm:-mt-28 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 text-xs text-primary">
                    <Trophy className="mr-1 h-3 w-3" />
                    Wyzwanie
                  </Badge>
                  {challenge.startDate && (
                    <Badge
                      variant="outline"
                      className="border-border text-xs text-muted-foreground"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {challenge.startDate} – {challenge.endDate}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{challenge.name}</h1>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {challenge.description}
                </p>
              </div>
              {!participation && user?.role === 'participant' && (
                <Button onClick={handleJoinChallenge} size="lg" className="shrink-0 gap-2">
                  <Flame className="h-4 w-4" />
                  Dołącz do wyzwania
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="container max-w-4xl space-y-6 px-4 pb-12 sm:px-8">
          {/* Progress card - prominent if participating */}
          {participation && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Twój postęp</span>
                      {participation.assignedNumber && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Nr Korony:{' '}
                          <span className="font-bold text-foreground">
                            #{participation.assignedNumber}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {participation.completedCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {challenge.rule.minCompleted}
                    </span>
                    {participation.isCompleted && (
                      <Badge className="ml-1 gap-1 bg-success hover:bg-success">
                        <Trophy className="h-3 w-3" /> Ukończone!
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={Math.min(progressPercent, 100)} className="h-2.5" />
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                    Zatwierdzone: {approvedCount}
                  </span>
                  {pendingCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                      Oczekuje: {pendingCount}
                    </span>
                  )}
                  <span>
                    Pozostało:{' '}
                    {Math.max(0, challenge.rule.minCompleted - participation.completedCount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl font-bold sm:text-2xl">{challenge.rule.minCompleted}</div>
                <div className="text-[11px] text-muted-foreground sm:text-xs">
                  z {challenge.events.length} biegów
                </div>
              </CardContent>
            </Card>
            {challenge.rule.maxTime ? (
              <Card className="border-border/60 bg-card/60">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div className="text-base font-bold sm:text-lg">{challenge.rule.maxTime}</div>
                  <div className="text-[11px] text-muted-foreground sm:text-xs">Limit czasu</div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-card/60">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-info/10">
                    <Users className="h-4 w-4 text-info" />
                  </div>
                  <div className="text-xl font-bold sm:text-2xl">{challenge.events.length}</div>
                  <div className="text-[11px] text-muted-foreground sm:text-xs">biegów w serii</div>
                </CardContent>
              </Card>
            )}
            <Card className="border-border/60 bg-card/60">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                  <Gift className="h-4 w-4 text-success" />
                </div>
                <div className="text-xl font-bold sm:text-2xl">{challenge.rewards.length}</div>
                <div className="text-[11px] text-muted-foreground sm:text-xs">
                  {challenge.rewards.length === 1 ? 'nagroda' : 'nagrody'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal className="h-4 w-4 text-primary" />
                Nagrody
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {challenge.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
                      {reward.type === 'free' ? '📜' : '🏅'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{reward.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {reward.price ? `${reward.price} zł` : 'Darmowe'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Events list - card-based instead of table for mobile friendliness */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Lista biegów
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {challenge.events.length} biegów
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {challenge.events.map((event, idx) => {
                  const entryStatus = getEntryStatus(event.eventId);
                  const entry = getEntryForEvent(event.eventId);
                  const config = statusConfig[entryStatus];

                  return (
                    <div
                      key={event.eventId}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
                        config.rowClass,
                      )}
                    >
                      {/* Number */}
                      <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground/50">
                        {idx + 1}.
                      </span>

                      {/* Status icon */}
                      <div className="shrink-0">{config.icon}</div>

                      {/* Event info */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{event.eventName}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.eventDate}</span>
                          {entry?.submittedTime && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="font-mono text-foreground/70">
                                {entry.submittedTime}
                              </span>
                            </>
                          )}
                          {entry?.submittedPosition && (
                            <>
                              <span className="opacity-40">·</span>
                              <span>#{entry.submittedPosition}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status label (desktop) */}
                      <Badge
                        variant="outline"
                        className={cn(
                          'hidden px-2 py-0.5 text-[10px] sm:flex',
                          entryStatus === 'approved' && 'border-success/30 text-success',
                          entryStatus === 'pending' && 'border-warning/30 text-warning',
                          entryStatus === 'rejected' && 'border-destructive/30 text-destructive',
                          entryStatus === 'not_submitted' && 'border-border text-muted-foreground',
                        )}
                      >
                        {config.label}
                      </Badge>

                      {/* Action */}
                      <div className="shrink-0">
                        {entryStatus === 'not_submitted' && participation && (
                          <Dialog
                            open={submitDialogOpen && selectedEventId === event.eventId}
                            onOpenChange={(open) => {
                              setSubmitDialogOpen(open);
                              if (!open) setSelectedEventId(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => setSelectedEventId(event.eventId)}
                              >
                                <Upload className="mr-1 h-3 w-3" />
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
                                  <Input
                                    placeholder="01:45:30"
                                    value={submitTime}
                                    onChange={(e) => setSubmitTime(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Miejsce w klasyfikacji</Label>
                                  <Input
                                    type="number"
                                    placeholder="np. 234"
                                    value={submitPosition}
                                    onChange={(e) => setSubmitPosition(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Link do dowodu (wyniki / Strava)</Label>
                                  <Input
                                    placeholder="https://..."
                                    value={submitProofUrl}
                                    onChange={(e) => setSubmitProofUrl(e.target.value)}
                                  />
                                </div>
                                <Button onClick={handleSubmitResult} className="w-full">
                                  Wyślij zgłoszenie
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {entryStatus === 'rejected' && entry?.rejectionReason && (
                          <span className="text-xs text-destructive" title={entry.rejectionReason}>
                            Odrzucone
                          </span>
                        )}
                        {entry?.proofUrl && entryStatus !== 'not_submitted' && (
                          <a
                            href={entry.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Dowód
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ChallengeDetailsPage;
