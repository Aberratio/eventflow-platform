import { mockResults, mockTeamResults, mockResultDocuments } from '@/api';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Event, Result, Registration, TeamResult, EventResultDocument } from '@/types';
import { Plus, FileText, Save, Trophy, Users } from 'lucide-react';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { AddResultDialog } from '@/components/organizer/AddResultDialog';
import { UploadResultDocumentDialog } from '@/components/organizer/UploadResultDocumentDialog';
import { TeamResultsManager } from '@/components/organizer/TeamResultsManager';
import { IndividualResultsCard } from './IndividualResultsCard';
import { ResultDocumentsCard } from './ResultDocumentsCard';

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

  const eventResults = mockResults.filter(
    (r) => r.eventId === event.id && r.distanceId === selectedDistance,
  );
  const [localResults, setLocalResults] = useState<LocalResult[]>([]);
  const [localTeamResults, setLocalTeamResults] = useState<TeamResult[]>(
    mockTeamResults.filter((t) => t.eventId === event.id),
  );
  const [localDocuments, setLocalDocuments] = useState<EventResultDocument[]>(
    mockResultDocuments.filter((d) => d.eventId === event.id),
  );

  const allResults: LocalResult[] = [
    ...eventResults.map((r) => ({
      bibNumber: r.bibNumber,
      time: r.time,
      status: r.status,
      userName: r.userName,
      category: r.category,
    })),
    ...localResults,
  ];

  const selectedDistanceData = event.distances.find((d) => d.id === selectedDistance);
  const allEventResults = mockResults.filter((r) => r.eventId === event.id);

  const handleAddResult = (result: LocalResult) => setLocalResults([...localResults, result]);
  const handleDeleteResult = (bibNumber: string) => {
    setLocalResults(localResults.filter((r) => r.bibNumber !== bibNumber));
    toast({ title: 'Wynik usunięty', description: `Usunięto wynik dla numeru ${bibNumber}` });
  };

  const handleImportCSV = () => {
    toast({ title: 'Import CSV', description: 'Wybierz plik CSV z wynikami (symulacja)' });
    setTimeout(
      () =>
        toast({ title: 'Import zakończony', description: 'Zaimportowano 25 wyników (symulacja)' }),
      1500,
    );
  };

  const handlePublishResults = () =>
    toast({
      title: 'Wyniki opublikowane',
      description: 'Wyniki są teraz widoczne dla uczestników.',
    });

  const handleExportCSV = () => {
    const sorted = [...allResults].sort((a, b) => a.time.localeCompare(b.time));
    const data = sorted.map((r, i) => ({
      Pozycja: r.status === 'finished' ? i + 1 : '-',
      'Numer startowy': r.bibNumber,
      Uczestnik: r.userName || '-',
      Czas: r.time,
      Kategoria: r.category || '-',
      Status: r.status === 'finished' ? 'Ukończył' : r.status === 'dnf' ? 'DNF' : 'DSQ',
    }));
    exportToCSV(data, `wyniki-${event.slug}-${selectedDistanceData?.name || 'all'}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    const sorted = [...allResults].sort((a, b) => a.time.localeCompare(b.time));
    const columns = ['Poz.', 'Numer', 'Uczestnik', 'Czas', 'Kategoria', 'Status'];
    const rows = sorted.map((r, i) => [
      r.status === 'finished' ? String(i + 1) : '-',
      r.bibNumber,
      r.userName || '-',
      r.time,
      r.category || '-',
      r.status === 'finished' ? 'Ukończył' : r.status === 'dnf' ? 'DNF' : 'DSQ',
    ]);
    generatePrintableHTML(
      `Wyniki - ${event.name} - ${selectedDistanceData?.name || ''}`,
      columns,
      rows,
    );
  };

  const handleUploadDocument = (
    doc: Omit<EventResultDocument, 'id' | 'uploadedAt' | 'uploadedBy'>,
  ) => {
    setLocalDocuments([
      ...localDocuments,
      { ...doc, id: `doc-${Date.now()}`, uploadedAt: new Date().toISOString(), uploadedBy: 'o1' },
    ]);
  };

  const handleDeleteDocument = (docId: string) => {
    setLocalDocuments(localDocuments.filter((d) => d.id !== docId));
    toast({ title: 'Dokument usunięty', description: 'Dokument został usunięty' });
  };

  const handleAddTeamResult = (team: Omit<TeamResult, 'id'>) =>
    setLocalTeamResults([...localTeamResults, { ...team, id: `team-${Date.now()}` }]);
  const handleDeleteTeamResult = (teamId: string) =>
    setLocalTeamResults(localTeamResults.filter((t) => t.id !== teamId));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <Select value={selectedDistance} onValueChange={setSelectedDistance}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Wybierz dystans" />
              </SelectTrigger>
              <SelectContent>
                {event.distances.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.length} {d.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
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

        <TabsContent value="individual">
          <IndividualResultsCard
            distanceName={selectedDistanceData?.name}
            results={allResults}
            entryMode={entryMode}
            onEntryModeChange={setEntryMode}
            onAddResult={() => setAddDialogOpen(true)}
            onDeleteResult={handleDeleteResult}
            onImportCSV={handleImportCSV}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        </TabsContent>

        <TabsContent value="teams">
          <TeamResultsManager
            event={event}
            individualResults={allEventResults}
            teamResults={localTeamResults}
            onAddTeamResult={handleAddTeamResult}
            onDeleteTeamResult={handleDeleteTeamResult}
          />
        </TabsContent>

        <TabsContent value="documents">
          <ResultDocumentsCard
            documents={localDocuments}
            onUpload={() => setUploadDialogOpen(true)}
            onDelete={handleDeleteDocument}
          />
        </TabsContent>
      </Tabs>

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

      <AddResultDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        registrations={registrations.filter((r) => r.distanceId === selectedDistance)}
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
