import { safeUrl } from '@/lib/safeUrl';
import {
  archiveChallenge,
  getChallengeParticipations,
  getChallenges,
  reviewChallengeEntry,
  updateChallenge,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Archive,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { Challenge, ChallengeEntry, ChallengeEntryStatus } from '@/types';
import { toast } from 'sonner';

const statusLabels = {
  active: 'Aktywne',
  upcoming: 'Nadchodzące',
  completed: 'Zakończone',
  archived: 'Archiwalne',
};

const entryLabels: Record<ChallengeEntryStatus, string> = {
  approved: 'Zatwierdzone',
  pending: 'Oczekujące',
  rejected: 'Odrzucone',
  not_submitted: 'Niezgłoszone',
};

interface AdminChallengesTabProps {
  basePath?: '/admin' | '/moderator';
}

export const AdminChallengesTab = ({ basePath = '/admin' }: AdminChallengesTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Challenge configuration is admin-only (macierz uprawnien); the moderator only reviews entries.
  const canConfigure = basePath === '/admin';
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all',
  );
  const [rejectingEntry, setRejectingEntry] = useState<
    (ChallengeEntry & { userName: string }) | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: challengesData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.challenges, 'staff'],
    queryFn: () => getChallenges({ includeArchived: true }),
  });
  const { data: participationsData } = useQuery({
    queryKey: QUERY_KEYS.challengeParticipations,
    queryFn: () => getChallengeParticipations(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challengeParticipations });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateChallenge(id, { status: status as Challenge['status'] }),
    onSuccess: () => {
      invalidate();
      toast.success('Status wyzwania został zmieniony');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveChallenge,
    onSuccess: () => {
      invalidate();
      toast.success('Wyzwanie zostało zarchiwizowane');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: ChallengeEntryStatus;
      reason?: string;
    }) => reviewChallengeEntry(id, status, reason),
    onSuccess: () => {
      invalidate();
      toast.success('Zgłoszenie zostało zweryfikowane');
      setRejectingEntry(null);
      setRejectionReason('');
    },
  });

  const challenges = challengesData?.data ?? [];
  const participations = participationsData?.data ?? [];
  const entries = participations.flatMap((participation) =>
    participation.entries.map((entry) => ({ ...entry, userName: participation.userName })),
  );
  const visibleEntries = entries.filter(
    (entry) => statusFilter === 'all' || entry.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wyzwania</h2>
          <p className="text-muted-foreground">Konfiguracja, uczestnicy i weryfikacja zgłoszeń</p>
        </div>
        {canConfigure && (
          <Button onClick={() => navigate(`${basePath}/challenges/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Nowe wyzwanie
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie wyzwań...</p>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge) => {
            const challengeParticipations = participations.filter(
              (p) => p.challengeId === challenge.id,
            );
            return (
              <Card key={challenge.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Trophy className="h-4 w-4 text-primary" />
                      {challenge.name}
                      <Badge variant="outline">{statusLabels[challenge.status]}</Badge>
                    </h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {challenge.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {challenge.rule.minCompleted}/{challenge.events.length} wydarzeń ·{' '}
                      {challengeParticipations.length} uczestników · {challenge.rewards.length}{' '}
                      produktów
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canConfigure && (
                      <>
                        <Select
                          value={challenge.status}
                          onValueChange={(status) =>
                            statusMutation.mutate({ id: challenge.id, status })
                          }
                        >
                          <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Nadchodzące</SelectItem>
                            <SelectItem value="active">Aktywne</SelectItem>
                            <SelectItem value="completed">Zakończone</SelectItem>
                            <SelectItem value="archived">Archiwalne</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`${basePath}/challenges/${challenge.id}/edit`)}
                        >
                          <Pencil className="mr-1 h-4 w-4" /> Edytuj
                        </Button>
                        {challenge.status !== 'archived' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveMutation.mutate(challenge.id)}
                          >
                            <Archive className="mr-1 h-4 w-4" /> Archiwizuj
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Weryfikacja zgłoszeń
          </CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'Wszystkie' : entryLabels[status]}{' '}
                <Badge variant="secondary" className="ml-1">
                  {status === 'all'
                    ? entries.length
                    : entries.filter((entry) => entry.status === status).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uczestnik</TableHead>
                <TableHead>Wydarzenie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Czas</TableHead>
                <TableHead>Dowód</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.map((entry) => {
                const challenge = challenges.find((item) => item.id === entry.challengeId);
                const event = challenge?.events.find((item) => item.eventId === entry.eventId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell>{event?.eventName ?? entry.eventId}</TableCell>
                    <TableCell>
                      {entryLabels[entry.status]}
                      {entry.status === 'rejected' && entry.rejectionReason && (
                        <p className="text-xs text-muted-foreground">
                          Powód: {entry.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{entry.submittedTime ?? '-'}</TableCell>
                    <TableCell>
                      {safeUrl(entry.proofUrl) ? (
                        <a
                          href={safeUrl(entry.proofUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline"
                        >
                          Zobacz dowód <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              reviewMutation.mutate({ id: entry.id, status: 'approved' })
                            }
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Zatwierdź
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setRejectingEntry(entry);
                              setRejectionReason('');
                            }}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Odrzuć
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Uczestnicy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {participations.map((participation) => {
            const challenge = challenges.find((item) => item.id === participation.challengeId);
            return (
              <div
                key={participation.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <span>
                  {participation.userName} · {challenge?.name ?? participation.challengeId}
                </span>
                <div className="flex items-center gap-2">
                  <Progress
                    aria-label="Postęp wyzwania"
                    value={
                      (participation.completedCount /
                        Math.max(1, challenge?.rule.minCompleted ?? 1)) *
                      100
                    }
                    className="h-2 w-24"
                  />
                  <span>
                    {participation.completedCount}/{challenge?.rule.minCompleted ?? 1}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog
        open={rejectingEntry !== null}
        onOpenChange={(open) => !open && setRejectingEntry(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Odrzuć zgłoszenie{rejectingEntry ? ` — ${rejectingEntry.userName}` : ''}
            </DialogTitle>
            <DialogDescription>
              Powód odrzucenia jest opcjonalny, ale pomaga zawodnikowi poprawić zgłoszenie.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (rejectingEntry) {
                reviewMutation.mutate({
                  id: rejectingEntry.id,
                  status: 'rejected',
                  reason: rejectionReason || undefined,
                });
              }
            }}
          >
            <fieldset className="space-y-3" disabled={reviewMutation.isPending}>
              <legend className="sr-only">Powód odrzucenia zgłoszenia</legend>
              <div>
                <Label htmlFor="rejection-reason">Powód odrzucenia (opcjonalnie)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Np. dowód nieczytelny, brak potwierdzenia miejsca"
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={reviewMutation.isPending}
              >
                Odrzuć zgłoszenie
              </Button>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
