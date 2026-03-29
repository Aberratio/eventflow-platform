import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TeamResult, Event, Result } from '@/types';
import { Plus, Users, Trophy, Clock, Trash2 } from 'lucide-react';

interface TeamResultsManagerProps {
  event: Event;
  individualResults: Result[];
  teamResults: TeamResult[];
  onAddTeamResult: (team: Omit<TeamResult, 'id'>) => void;
  onDeleteTeamResult: (teamId: string) => void;
}

export const TeamResultsManager = ({
  event,
  individualResults,
  teamResults,
  onAddTeamResult,
  onDeleteTeamResult,
}: TeamResultsManagerProps) => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleAddTeam = () => {
    if (!teamName) {
      toast({
        title: 'Błąd',
        description: 'Podaj nazwę drużyny',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length < 2) {
      toast({
        title: 'Błąd',
        description: 'Drużyna musi mieć co najmniej 2 członków',
        variant: 'destructive',
      });
      return;
    }

    // Get member details and calculate total time
    const members = selectedMembers
      .map((userId) => individualResults.find((r) => r.userId === userId))
      .filter((r): r is Result => r !== undefined)
      .map((r) => ({
        userId: r.userId,
        userName: r.userName,
        time: r.time,
        timeInSeconds: r.timeInSeconds,
      }));

    const totalTimeInSeconds = members.reduce((sum, m) => sum + m.timeInSeconds, 0);
    const hours = Math.floor(totalTimeInSeconds / 3600);
    const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
    const seconds = totalTimeInSeconds % 60;
    const totalTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Calculate position based on existing teams
    const position = teamResults.length + 1;

    onAddTeamResult({
      eventId: event.id,
      distanceId: event.distances[0]?.id || '',
      distanceName: event.distances[0]?.name || '',
      teamName,
      members,
      totalTime,
      totalTimeInSeconds,
      position,
    });

    setTeamName('');
    setSelectedMembers([]);
    setAddDialogOpen(false);

    toast({
      title: 'Drużyna dodana',
      description: `Drużyna "${teamName}" została dodana do klasyfikacji`,
    });
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Get finished individual results for member selection
  const availableMembers = individualResults.filter((r) => r.status === 'finished');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Klasyfikacja drużynowa
          </CardTitle>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj drużynę
          </Button>
        </CardHeader>
        <CardContent>
          {teamResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak drużyn w klasyfikacji.</p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwszą drużynę
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Drużyna</TableHead>
                  <TableHead>Członkowie</TableHead>
                  <TableHead>Łączny czas</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamResults
                  .sort((a, b) => a.totalTimeInSeconds - b.totalTimeInSeconds)
                  .map((team, index) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {index < 3 && (
                            <Trophy
                              className={`h-4 w-4 ${
                                index === 0
                                  ? 'text-yellow-500'
                                  : index === 1
                                  ? 'text-gray-400'
                                  : 'text-amber-600'
                              }`}
                            />
                          )}
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {team.members.map((m) => (
                            <Badge key={m.userId} variant="outline" className="text-xs">
                              {m.userName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="h-4 w-4 text-primary" />
                          {team.totalTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTeamResult(team.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Team Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj drużynę</DialogTitle>
            <DialogDescription>
              Utwórz drużynę wybierając uczestników z listy wyników
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nazwa drużyny</Label>
              <Input
                placeholder="np. Biegacze Warszawy"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Członkowie drużyny ({selectedMembers.length} wybranych)
              </Label>
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {availableMembers.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-sm">
                    Brak dostępnych uczestników z wynikami
                  </p>
                ) : (
                  <div className="divide-y">
                    {availableMembers.map((result) => (
                      <button
                        key={result.userId}
                        type="button"
                        className={`w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors ${
                          selectedMembers.includes(result.userId) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => toggleMember(result.userId)}
                      >
                        <div>
                          <span className="font-medium">{result.userName}</span>
                          <span className="ml-2 text-muted-foreground text-sm">
                            ({result.bibNumber})
                          </span>
                        </div>
                        <span className="font-mono text-sm">{result.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Szacowany łączny czas:</p>
                <p className="font-mono text-lg">
                  {(() => {
                    const total = selectedMembers.reduce((sum, userId) => {
                      const result = individualResults.find((r) => r.userId === userId);
                      return sum + (result?.timeInSeconds || 0);
                    }, 0);
                    const h = Math.floor(total / 3600);
                    const m = Math.floor((total % 3600) / 60);
                    const s = total % 60;
                    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                  })()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddTeam}>Dodaj drużynę</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
