import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Trophy, CheckCircle2, Clock, XCircle, ExternalLink, Users } from 'lucide-react';
import { mockChallenges, mockChallengeParticipations } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export const ModeratorChallengesTab = () => {
  const allPending = mockChallengeParticipations.flatMap(p =>
    p.entries.filter(e => e.status === 'pending').map(e => ({
      ...e,
      userName: p.userName,
      challengeName: mockChallenges.find(c => c.id === p.challengeId)?.name || '',
      eventName: mockChallenges.find(c => c.id === p.challengeId)?.events.find(ev => ev.eventId === e.eventId)?.eventName || '',
    }))
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Pending verifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Zgłoszenia do weryfikacji
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allPending.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              Brak zgłoszeń do weryfikacji
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead>Wyzwanie</TableHead>
                  <TableHead>Bieg</TableHead>
                  <TableHead className="hidden sm:table-cell">Czas</TableHead>
                  <TableHead className="hidden sm:table-cell">Dowód</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPending.map(entry => (
                  <TableRow key={entry.id} className="bg-yellow-50 dark:bg-yellow-950/30">
                    <TableCell className="font-medium text-sm">{entry.userName}</TableCell>
                    <TableCell className="text-sm">{entry.challengeName}</TableCell>
                    <TableCell className="text-sm">{entry.eventName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-mono">{entry.submittedTime || '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {entry.proofUrl && (
                        <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="default" onClick={() => toast({ title: 'Zatwierdzone!' })}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Zatwierdź
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => toast({ title: 'Odrzucone', variant: 'destructive' })}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Participants overview per challenge */}
      {mockChallenges.map(challenge => {
        const participants = mockChallengeParticipations.filter(p => p.challengeId === challenge.id);
        if (participants.length === 0) return null;

        return (
          <Card key={challenge.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                {challenge.name}
                <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{participants.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Uczestnik</TableHead>
                    <TableHead>Postęp</TableHead>
                    <TableHead>Status</TableHead>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
