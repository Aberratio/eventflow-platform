import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Event, Result, Registration } from '@/types';
import { mockResults } from '@/data/mockData';
import { Plus, Upload, Save, Trophy, Clock, AlertCircle } from 'lucide-react';

interface ResultsTabProps {
  event: Event;
  registrations: Registration[];
}

interface ResultEntry {
  bibNumber: string;
  time: string;
  status: 'finished' | 'dnf' | 'dsq';
}

export const ResultsTab = ({ event, registrations }: ResultsTabProps) => {
  const { toast } = useToast();
  const [selectedDistance, setSelectedDistance] = useState<string>(event.distances[0]?.id || '');
  const [entryMode, setEntryMode] = useState<'manual' | 'import'>('manual');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newResult, setNewResult] = useState<ResultEntry>({
    bibNumber: '',
    time: '',
    status: 'finished'
  });

  // Get existing results for this event
  const eventResults = mockResults.filter(r => r.eventId === event.id && r.distanceId === selectedDistance);
  
  // Local state for added results (simulating)
  const [localResults, setLocalResults] = useState<ResultEntry[]>([]);

  const allResults = [...eventResults.map(r => ({
    bibNumber: r.bibNumber,
    time: r.time,
    status: r.status
  })), ...localResults];

  const handleAddResult = () => {
    if (!newResult.bibNumber || !newResult.time) {
      toast({
        title: 'Błąd',
        description: 'Wypełnij wszystkie pola',
        variant: 'destructive'
      });
      return;
    }

    // Check if bib number exists in registrations
    const registration = registrations.find(r => r.bibNumber === newResult.bibNumber);
    if (!registration) {
      toast({
        title: 'Ostrzeżenie',
        description: `Numer startowy ${newResult.bibNumber} nie został znaleziony w zapisach.`,
        variant: 'destructive'
      });
      return;
    }

    setLocalResults([...localResults, newResult]);
    setNewResult({ bibNumber: '', time: '', status: 'finished' });
    setAddDialogOpen(false);
    
    toast({
      title: 'Wynik dodany',
      description: `Dodano wynik dla numeru ${newResult.bibNumber}`,
    });
  };

  const handleImportCSV = () => {
    toast({
      title: 'Import CSV',
      description: 'Wybierz plik CSV z wynikami (symulacja)',
    });
    
    // Simulate import
    setTimeout(() => {
      toast({
        title: 'Import zakończony',
        description: 'Zaimportowano 25 wyników (symulacja)',
      });
    }, 1500);
  };

  const handlePublishResults = () => {
    toast({
      title: 'Wyniki opublikowane',
      description: 'Wyniki są teraz widoczne dla uczestników.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge className="bg-green-500/10 text-green-600">Ukończył</Badge>;
      case 'dnf':
        return <Badge variant="secondary">DNF</Badge>;
      case 'dsq':
        return <Badge variant="destructive">DSQ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedDistanceData = event.distances.find(d => d.id === selectedDistance);

  return (
    <div className="space-y-6">
      {/* Distance selector and mode */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="space-y-1">
                <Label>Dystans</Label>
                <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Wybierz dystans" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.distances.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.length} {d.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={entryMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setEntryMode('manual')}
              >
                Ręczne wprowadzanie
              </Button>
              <Button
                variant={entryMode === 'import' ? 'default' : 'outline'}
                onClick={() => setEntryMode('import')}
              >
                Import CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry mode content */}
      {entryMode === 'manual' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Wprowadź wyniki - {selectedDistanceData?.name}</CardTitle>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Dodaj wynik
            </Button>
          </CardHeader>
          <CardContent>
            {allResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Brak wprowadzonych wyników dla tego dystansu.</p>
                <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Dodaj pierwszy wynik
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Poz.</TableHead>
                    <TableHead>Numer</TableHead>
                    <TableHead>Czas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allResults
                    .sort((a, b) => {
                      if (a.status !== 'finished') return 1;
                      if (b.status !== 'finished') return -1;
                      return a.time.localeCompare(b.time);
                    })
                    .map((result, index) => (
                      <TableRow key={`${result.bibNumber}-${index}`}>
                        <TableCell>
                          {result.status === 'finished' ? (
                            <div className="flex items-center gap-1">
                              {index < 3 && <Trophy className={`h-4 w-4 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />}
                              <span className="font-medium">{index + 1}</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-mono font-medium">{result.bibNumber}</TableCell>
                        <TableCell className="font-mono">{result.time}</TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Import wyników z pliku CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2">Przeciągnij plik CSV lub kliknij, aby wybrać</p>
              <p className="text-sm text-muted-foreground mb-4">
                Format: numer_startowy, czas (HH:MM:SS), status (finished/dnf/dsq)
              </p>
              <Button onClick={handleImportCSV}>
                <Upload className="mr-2 h-4 w-4" /> Wybierz plik
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Przykładowy format pliku:</p>
                  <pre className="mt-2 font-mono text-xs">
                    numer,czas,status{'\n'}
                    101,01:23:45,finished{'\n'}
                    102,01:25:30,finished{'\n'}
                    103,,dnf
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish button */}
      {allResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Publikacja wyników</h3>
                <p className="text-sm text-muted-foreground">
                  Po opublikowaniu wyniki będą widoczne dla wszystkich uczestników
                </p>
              </div>
              <Button onClick={handlePublishResults}>
                <Save className="mr-2 h-4 w-4" /> Opublikuj wyniki
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add result dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj wynik</DialogTitle>
            <DialogDescription>
              Wprowadź dane uczestnika i jego wynik
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Numer startowy</Label>
              <Input
                placeholder="np. 101"
                value={newResult.bibNumber}
                onChange={e => setNewResult({ ...newResult, bibNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Czas (HH:MM:SS)</Label>
              <Input
                placeholder="01:23:45"
                value={newResult.time}
                onChange={e => setNewResult({ ...newResult, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newResult.status}
                onValueChange={(v: 'finished' | 'dnf' | 'dsq') => setNewResult({ ...newResult, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finished">Ukończył</SelectItem>
                  <SelectItem value="dnf">DNF (nie ukończył)</SelectItem>
                  <SelectItem value="dsq">DSQ (dyskwalifikacja)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddResult}>
              Dodaj wynik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
