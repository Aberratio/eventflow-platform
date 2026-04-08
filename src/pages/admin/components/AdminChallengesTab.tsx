import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Plus, CheckCircle2, Clock, XCircle, Target, Users, ExternalLink, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { mockChallengeParticipations, mockChallenges } from '@/api/mock/challenges.mock';
import { mockEvents } from '@/api/mock/events.mock';
import { mockSeries } from '@/api/mock/series.mock';
import { Challenge, ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusRowClass: Record<ChallengeEntryStatus, string> = {
  approved: 'bg-success/5',
  pending: 'bg-warning/5',
  rejected: 'bg-destructive/5',
  not_submitted: '',
};

const statusIcon: Record<ChallengeEntryStatus, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-success" />,
  pending: <Clock className="h-4 w-4 text-warning" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
  not_submitted: <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />,
};

// ─── Verification card per challenge ───
const VerificationChallengeCard = ({
  challenge, statusFilter,
}: {
  challenge: typeof mockChallenges[0];
  statusFilter: string;
}) => {
  const participants = mockChallengeParticipations.filter(p => p.challengeId === challenge.id);
  const allEntries = participants.flatMap(p => p.entries);
  const pendingCount = allEntries.filter(e => e.status === 'pending').length;
  const approvedCount = allEntries.filter(e => e.status === 'approved').length;
  const rejectedCount = allEntries.filter(e => e.status === 'rejected').length;
  const [open, setOpen] = useState(pendingCount > 0);

  const filteredParticipants = participants.filter(p => {
    if (statusFilter === 'all') return p.entries.length > 0;
    return p.entries.some(e => e.status === statusFilter);
  });

  if (filteredParticipants.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{challenge.name}</span>
              <div className="flex gap-1.5 ml-auto">
                {pendingCount > 0 && <Badge variant="outline" className="text-warning border-warning/30">⏳ {pendingCount}</Badge>}
                <Badge variant="outline" className="text-success border-success/30">✅ {approvedCount}</Badge>
                {rejectedCount > 0 && <Badge variant="outline" className="text-destructive border-destructive/30">❌ {rejectedCount}</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {filteredParticipants.map(p => {
              const filteredEntries = statusFilter === 'all'
                ? p.entries
                : p.entries.filter(e => e.status === statusFilter);

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{p.userName}</span>
                    <span className="text-muted-foreground">(postęp: {p.completedCount}/{challenge.rule.minCompleted})</span>
                    {p.isCompleted && <Badge variant="default" className="text-xs">✅ Ukończone</Badge>}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Bieg</TableHead>
                        <TableHead className="hidden sm:table-cell">Czas</TableHead>
                        <TableHead className="hidden sm:table-cell">Miejsce</TableHead>
                        <TableHead className="hidden sm:table-cell">Dowód</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map(entry => {
                        const event = challenge.events.find(e => e.eventId === entry.eventId);
                        return (
                          <TableRow key={entry.id} className={cn(statusRowClass[entry.status])}>
                            <TableCell className="w-8">{statusIcon[entry.status]}</TableCell>
                            <TableCell className="text-sm">{event?.eventName || '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm font-mono">{entry.submittedTime || '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{entry.submittedPosition ? `#${entry.submittedPosition}` : '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {entry.proofUrl && (
                                <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> Link
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.status === 'pending' && (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="default" onClick={() => toast({ title: 'Zatwierdzone!' })}>
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Zatwierdź
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => toast({ title: 'Odrzucone', variant: 'destructive' })}>
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {entry.status === 'approved' && <span className="text-xs text-success">Zatwierdzone</span>}
                              {entry.status === 'rejected' && <span className="text-xs text-destructive">Odrzucone</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// ─── Main component ───
export const AdminChallengesTab = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const allEntries = mockChallengeParticipations.flatMap(p => p.entries);
  const pendingTotal = allEntries.filter(e => e.status === 'pending').length;
  const approvedTotal = allEntries.filter(e => e.status === 'approved').length;
  const rejectedTotal = allEntries.filter(e => e.status === 'rejected').length;

  const handleStatusChange = (challengeId: string, newStatus: string) => {
    toast({ title: `Status zmieniony na: ${newStatus === 'active' ? 'Aktywne' : newStatus === 'completed' ? 'Zakończone' : 'Nadchodzące'}` });
  };

  const handleDelete = (challengeId: string) => {
    toast({ title: 'Wyzwanie usunięte', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="challenges">
        <TabsList>
          <TabsTrigger value="challenges" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Wyzwania
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-1.5">
            <Clock className="h-4 w-4" /> Weryfikacja
            {pendingTotal > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {pendingTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-4 w-4" /> Uczestnicy
          </TabsTrigger>
        </TabsList>

        {/* ─── Challenges CRUD ─── */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista wyzwań</h3>
            <Button size="sm" onClick={() => navigate('/admin/challenges/new')}>
              <Plus className="h-4 w-4 mr-1" /> Nowe wyzwanie
            </Button>
          </div>

          {mockChallenges.map(challenge => {
            const participantCount = mockChallengeParticipations.filter(p => p.challengeId === challenge.id).length;
            return (
              <Card key={challenge.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        {challenge.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{challenge.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" />{challenge.rule.minCompleted}/{challenge.events.length} biegów</span>
                        <span>{challenge.startDate} – {challenge.endDate}</span>
                        <span>{participantCount} uczestników</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Select defaultValue={challenge.status} onValueChange={v => handleStatusChange(challenge.id, v)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktywne</SelectItem>
                          <SelectItem value="upcoming">Nadchodzące</SelectItem>
                          <SelectItem value="completed">Zakończone</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/challenges/${challenge.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć wyzwanie?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Czy na pewno chcesz usunąć „{challenge.name}"? Tej operacji nie można cofnąć.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(challenge.id)}>Usuń</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── Verification per challenge ─── */}
        <TabsContent value="verification" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'Wszystkie', count: pendingTotal + approvedTotal + rejectedTotal },
              { key: 'pending', label: 'Oczekujące', count: pendingTotal },
              { key: 'approved', label: 'Zatwierdzone', count: approvedTotal },
              { key: 'rejected', label: 'Odrzucone', count: rejectedTotal },
            ] as const).map(f => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label} <Badge variant="secondary" className="ml-1.5">{f.count}</Badge>
              </Button>
            ))}
          </div>

          {mockChallenges.map(challenge => (
            <VerificationChallengeCard
              key={challenge.id}
              challenge={challenge}
              statusFilter={statusFilter}
            />
          ))}
        </TabsContent>

        {/* ─── Participants tab ─── */}
        <TabsContent value="participants" className="space-y-4">
          {mockChallenges.map(challenge => {
            const participants = mockChallengeParticipations.filter(p => p.challengeId === challenge.id);
            if (participants.length === 0) return null;

            return (
              <Card key={challenge.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    {challenge.name}
                    <Badge variant="secondary">{participants.length} uczestników</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Uczestnik</TableHead>
                        <TableHead>Postęp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nagroda</TableHead>
                        <TableHead>Nr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-sm">{p.userName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(p.completedCount / challenge.rule.minCompleted) * 100} className="h-2 w-20" />
                              <span className="text-xs">{p.completedCount}/{challenge.rule.minCompleted}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {p.isCompleted ? (
                              <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Ukończone</Badge>
                            ) : (
                              <Badge variant="outline">W trakcie</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {p.rewardGranted ? (
                              <Badge variant="secondary">Przyznana</Badge>
                            ) : p.isCompleted ? (
                              <Button size="sm" variant="outline" onClick={() => toast({ title: 'Nagroda przyznana!' })}>
                                Przyznaj
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {p.assignedNumber ? `#${p.assignedNumber}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};
