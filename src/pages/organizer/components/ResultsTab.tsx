import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Event, Result, Registration, TeamResult, EventResultDocument } from '@/types';
import { mockResults, mockTeamResults, mockResultDocuments } from '@/data/mockData';
import { Plus, Upload, Save, Trophy, Clock, AlertCircle, Download, FileText, Printer, Users, Trash2 } from 'lucide-react';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddResultDialog } from '@/components/organizer/AddResultDialog';
import { UploadResultDocumentDialog } from '@/components/organizer/UploadResultDocumentDialog';
import { TeamResultsManager } from '@/components/organizer/TeamResultsManager';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ResultsTabProps {
  event: Event;
  registrations: Registration[];
}

interface LocalResult {
  bibNumber: string;
  time: string;
  status: 'finished' | 'dnf' | 'dsq';
  userName?: string;
  category?: string;
}

export const ResultsTab = ({ event, registrations }: ResultsTabProps) => {
  const { toast } = useToast();
  const [selectedDistance, setSelectedDistance] = useState<string>(event.distances[0]?.id || '');
  const [entryMode, setEntryMode] = useState<'manual' | 'import'>('manual');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Get existing results for this event
  const eventResults = mockResults.filter(r => r.eventId === event.id && r.distanceId === selectedDistance);
  
  // Local state for added results (simulating)
  const [localResults, setLocalResults] = useState<LocalResult[]>([]);
  const [localTeamResults, setLocalTeamResults] = useState<TeamResult[]>(
    mockTeamResults.filter(t => t.eventId === event.id)
  );
  const [localDocuments, setLocalDocuments] = useState<EventResultDocument[]>(
    mockResultDocuments.filter(d => d.eventId === event.id)
  );

  const allResults = [...eventResults.map(r => ({
    bibNumber: r.bibNumber,
    time: r.time,
    status: r.status,
    userName: r.userName,
    category: r.category,
  })), ...localResults];

  const handleAddResult = (result: LocalResult) => {
    setLocalResults([...localResults, result]);
  };

  const handleDeleteResult = (bibNumber: string) => {
    setLocalResults(localResults.filter(r => r.bibNumber !== bibNumber));
    toast({
      title: 'Wynik usunięty',
      description: `Usunięto wynik dla numeru ${bibNumber}`,
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

  const handleExportCSV = () => {
    const sortedResults = [...allResults].sort((a, b) => a.time.localeCompare(b.time));
    const data = sortedResults.map((r, i) => ({
      'Pozycja': r.status === 'finished' ? i + 1 : '-',
      'Numer startowy': r.bibNumber,
      'Uczestnik': r.userName || '-',
      'Czas': r.time,
      'Kategoria': r.category || '-',
      'Status': r.status === 'finished' ? 'Ukończył' : r.status === 'dnf' ? 'DNF' : 'DSQ',
    }));
    exportToCSV(data, `wyniki-${event.slug}-${selectedDistanceData?.name || 'all'}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    const sortedResults = [...allResults].sort((a, b) => a.time.localeCompare(b.time));
    const columns = ['Poz.', 'Numer', 'Uczestnik', 'Czas', 'Kategoria', 'Status'];
    const rows = sortedResults.map((r, i) => [
      r.status === 'finished' ? String(i + 1) : '-',
      r.bibNumber,
      r.userName || '-',
      r.time,
      r.category || '-',
      r.status === 'finished' ? 'Ukończył' : r.status === 'dnf' ? 'DNF' : 'DSQ',
    ]);
    generatePrintableHTML(`Wyniki - ${event.name} - ${selectedDistanceData?.name || ''}`, columns, rows);
  };

  const handleUploadDocument = (doc: Omit<EventResultDocument, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const newDoc: EventResultDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'o1', // Current organizer
    };
    setLocalDocuments([...localDocuments, newDoc]);
  };

  const handleDeleteDocument = (docId: string) => {
    setLocalDocuments(localDocuments.filter(d => d.id !== docId));
    toast({
      title: 'Dokument usunięty',
      description: 'Dokument został usunięty',
    });
  };

  const handleAddTeamResult = (team: Omit<TeamResult, 'id'>) => {
    const newTeam: TeamResult = {
      ...team,
      id: `team-${Date.now()}`,
    };
    setLocalTeamResults([...localTeamResults, newTeam]);
  };

  const handleDeleteTeamResult = (teamId: string) => {
    setLocalTeamResults(localTeamResults.filter(t => t.id !== teamId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge className="bg-success/10 text-success">Ukończył</Badge>;
      case 'dnf':
        return <Badge variant="secondary">DNF</Badge>;
      case 'dsq':
        return <Badge variant="destructive">DSQ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedDistanceData = event.distances.find(d => d.id === selectedDistance);
  const allEventResults = mockResults.filter(r => r.eventId === event.id);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-4 items-center">
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

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Dodaj wynik
              </Button>
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" /> Dodaj PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different result types */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Wyniki indywidualne
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Klasyfikacja drużynowa
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenty PDF ({localDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Individual Results Tab */}
        <TabsContent value="individual">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Wyniki indywidualne - {selectedDistanceData?.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={entryMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEntryMode('manual')}
                >
                  Ręcznie
                </Button>
                <Button
                  variant={entryMode === 'import' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEntryMode('import')}
                >
                  Import CSV
                </Button>
                {allResults.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Eksport
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportCSV}>
                        <FileText className="h-4 w-4 mr-2" /> Pobierz CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <Printer className="h-4 w-4 mr-2" /> Drukuj PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {entryMode === 'import' ? (
                <div className="space-y-4">
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
                </div>
              ) : allResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak wprowadzonych wyników dla tego dystansu.</p>
                  <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Dodaj pierwszy wynik
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Poz.</TableHead>
                      <TableHead className="w-20">Numer</TableHead>
                      <TableHead>Uczestnik</TableHead>
                      <TableHead>Czas</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
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
                                  index === 0 ? 'text-warning' :
                                  index === 1 ? 'text-muted-foreground' :
                                  'text-warning/70'
                                }`} />}
                                <span className="font-medium">{index + 1}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-mono font-medium">{result.bibNumber}</TableCell>
                          <TableCell>{result.userName || '-'}</TableCell>
                          <TableCell className="font-mono">{result.time}</TableCell>
                          <TableCell>{result.category || '-'}</TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteResult(result.bibNumber)}
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
        </TabsContent>

        {/* Team Results Tab */}
        <TabsContent value="teams">
          <TeamResultsManager
            event={event}
            individualResults={allEventResults}
            teamResults={localTeamResults}
            onAddTeamResult={handleAddTeamResult}
            onDeleteTeamResult={handleDeleteTeamResult}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Dokumenty PDF z wynikami
              </CardTitle>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Dodaj dokument
              </Button>
            </CardHeader>
            <CardContent>
              {localDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak dokumentów PDF.</p>
                  <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Dodaj pierwszy dokument
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {localDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.type === 'open' ? 'OPEN' : doc.type === 'team' ? 'Drużynowa' : doc.type === 'category' ? 'Kategorie' : 'Dystans'}
                            </Badge>
                            {doc.distanceName && (
                              <span className="text-xs text-muted-foreground">
                                {doc.distanceName}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              • {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: pl })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publish button */}
      {(allResults.length > 0 || localDocuments.length > 0) && (
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

      {/* Dialogs */}
      <AddResultDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        registrations={registrations.filter(r => r.distanceId === selectedDistance)}
        onAddResult={handleAddResult}
      />

      <UploadResultDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        eventId={event.id}
        distances={event.distances}
        onUpload={handleUploadDocument}
      />
    </div>
  );
};
