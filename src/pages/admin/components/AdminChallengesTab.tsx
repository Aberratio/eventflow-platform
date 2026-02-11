import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Trophy, Plus, CheckCircle2, Clock, XCircle, Target, Users, Eye, ExternalLink } from 'lucide-react';
import { mockChallenges, mockChallengeParticipations, mockSeries } from '@/data/mockData';
import { ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusRowClass: Record<ChallengeEntryStatus, string> = {
  approved: 'bg-green-50 dark:bg-green-950/30',
  pending: 'bg-yellow-50 dark:bg-yellow-950/30',
  rejected: 'bg-red-50 dark:bg-red-950/30',
  not_submitted: '',
};

const statusIcon: Record<ChallengeEntryStatus, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  not_submitted: <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />,
};

export const AdminChallengesTab = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const allPending = mockChallengeParticipations.flatMap(p =>
    p.entries.filter(e => e.status === 'pending').map(e => ({
      ...e,
      userName: p.userName,
      challengeName: mockChallenges.find(c => c.id === p.challengeId)?.name || '',
      eventName: mockChallenges.find(c => c.id === p.challengeId)?.events.find(ev => ev.eventId === e.eventId)?.eventName || '',
    }))
  );

  const handleApprove = (entryId: string) => {
    toast({ title: 'Zgłoszenie zatwierdzone', description: `Wpis ${entryId} został zatwierdzony.` });
  };

  const handleReject = (entryId: string) => {
    toast({ title: 'Zgłoszenie odrzucone', variant: 'destructive' });
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
            {allPending.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {allPending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-4 w-4" /> Uczestnicy
          </TabsTrigger>
        </TabsList>

        {/* Challenges list */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista wyzwań</h3>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nowe wyzwanie</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Utwórz wyzwanie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nazwa</Label><Input placeholder="np. Korona Półmaratonów 2026" /></div>
                  <div><Label>Slug (URL)</Label><Input placeholder="korona-polmaratonow-2026" /></div>
                  <div><Label>Opis</Label><Textarea placeholder="Opis wyzwania..." /></div>
                  <div>
                    <Label>Powiązanie z serią (opcjonalne)</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak</SelectItem>
                        {mockSeries.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Data startu</Label><Input type="date" /></div>
                    <div><Label>Data końca</Label><Input type="date" /></div>
                  </div>
                  <div><Label>Min. biegów do zaliczenia</Label><Input type="number" placeholder="10" /></div>
                  <div><Label>Limit czasu na bieg (opcjonalnie)</Label><Input placeholder="HH:MM:SS" /></div>
                  <div><Label>URL obrazka</Label><Input placeholder="https://..." /></div>
                  <Button className="w-full" onClick={() => { setCreateOpen(false); toast({ title: 'Wyzwanie utworzone!' }); }}>
                    Utwórz wyzwanie
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {mockChallenges.map(challenge => (
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
                      <span>{mockChallengeParticipations.filter(p => p.challengeId === challenge.id).length} uczestników</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                      {challenge.status === 'active' ? 'Aktywne' : challenge.status === 'completed' ? 'Zakończone' : 'Nadchodzące'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setSelectedChallenge(selectedChallenge === challenge.id ? null : challenge.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedChallenge === challenge.id && (
                  <div className="mt-4 border-t pt-4">
                    <h5 className="text-sm font-medium mb-2">Nagrody:</h5>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {challenge.rewards.map(r => (
                        <Badge key={r.id} variant="secondary">
                          {r.name} {r.price ? `(${r.price} zł)` : '(darmowe)'}
                        </Badge>
                      ))}
                    </div>
                    <h5 className="text-sm font-medium mb-2">Biegi ({challenge.events.length}):</h5>
                    <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                      {challenge.events.map(e => (
                        <div key={e.eventId} className="flex justify-between text-muted-foreground">
                          <span>{e.eventName}</span>
                          <span>{e.eventDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Verification tab */}
        <TabsContent value="verification" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{allPending.length}</div>
              <div className="text-xs text-muted-foreground">Oczekujące</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockChallengeParticipations.flatMap(p => p.entries).filter(e => e.status === 'approved').length}
              </div>
              <div className="text-xs text-muted-foreground">Zatwierdzone</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {mockChallengeParticipations.flatMap(p => p.entries).filter(e => e.status === 'rejected').length}
              </div>
              <div className="text-xs text-muted-foreground">Odrzucone</div>
            </CardContent></Card>
          </div>

          {allPending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              Brak zgłoszeń do weryfikacji
            </CardContent></Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead>Wyzwanie</TableHead>
                  <TableHead>Bieg</TableHead>
                  <TableHead>Czas</TableHead>
                  <TableHead>Miejsce</TableHead>
                  <TableHead>Dowód</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPending.map(entry => (
                  <TableRow key={entry.id} className="bg-yellow-50 dark:bg-yellow-950/30">
                    <TableCell className="font-medium text-sm">{entry.userName}</TableCell>
                    <TableCell className="text-sm">{entry.challengeName}</TableCell>
                    <TableCell className="text-sm">{entry.eventName}</TableCell>
                    <TableCell className="text-sm font-mono">{entry.submittedTime || '—'}</TableCell>
                    <TableCell className="text-sm">{entry.submittedPosition ? `#${entry.submittedPosition}` : '—'}</TableCell>
                    <TableCell>
                      {entry.proofUrl && (
                        <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="default" onClick={() => handleApprove(entry.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Zatwierdź
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(entry.id)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Participants tab */}
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
