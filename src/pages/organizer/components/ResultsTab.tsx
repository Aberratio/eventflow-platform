import { getResultsByEvent, getResultDocuments, publishOfficialResults } from '@/api';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Event, Registration, EventResultDocument } from '@/types';
import { Plus, FileText, CheckCircle2, Trophy, Users, AlertCircle } from 'lucide-react';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { AddResultDialog } from '@/components/organizer/AddResultDialog';
import { EditResultDialog } from '@/components/organizer/EditResultDialog';
import { ResultCorrectionsDialog } from '@/components/organizer/ResultCorrectionsDialog';
import { UploadResultDocumentDialog } from '@/components/organizer/UploadResultDocumentDialog';
import { ResultImportWizardDialog } from '@/components/organizer/ResultImportWizardDialog';
import { PublicationStatusBadge } from '@/components/results/PublicationStatusBadge';
import { TeamClassificationCard } from '@/components/results/TeamClassificationCard';
import { IndividualResultsCard } from './IndividualResultsCard';
import { ResultDocumentsCard } from './ResultDocumentsCard';

interface ResultsTabProps {
  event: Event;
  registrations: Registration[];
}

interface LocalResult {
  id?: string;
  bibNumber: string;
  time: string;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
  userName?: string;
  category?: string;
}

export const ResultsTab = ({ event, registrations }: ResultsTabProps) => {
  const queryClient = useQueryClient();
  const [selectedDistance, setSelectedDistance] = useState<string>(event.distances[0]?.id || '');
  const [entryMode, setEntryMode] = useState<'manual' | 'import'>('manual');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  // Id of the server result being corrected / whose correction history is open.
  const [editResultId, setEditResultId] = useState<string | null>(null);
  const [correctionsResultId, setCorrectionsResultId] = useState<string | null>(null);
  const canUploadResults =
    event.publicationStatus === 'published' || event.publicationStatus === 'finished';

  const { data: resultsResp } = useQuery({
    queryKey: ['event-results', event.id],
    queryFn: () => getResultsByEvent(event.id),
  });
  const { data: documentsResp } = useQuery({
    queryKey: ['event-result-documents', event.id],
    queryFn: () => getResultDocuments(event.id),
  });

  const allApiResults = resultsResp?.data ?? [];
  const eventResults = allApiResults.filter((r) => r.distanceId === selectedDistance);
  const distancePublicationStatus: 'preliminary' | 'official' =
    eventResults[0]?.publicationStatus ?? 'preliminary';
  const [localResults, setLocalResults] = useState<LocalResult[]>([]);
  const [localDocuments, setLocalDocuments] = useState<EventResultDocument[]>([]);

  useEffect(() => {
    if (documentsResp?.data) setLocalDocuments(documentsResp.data);
  }, [documentsResp?.data]);

  const allResults: LocalResult[] = [
    ...eventResults.map((r) => ({
      id: r.id,
      bibNumber: r.bibNumber,
      time: r.time,
      status: r.status,
      userName: r.userName,
      category: r.category,
    })),
    ...localResults,
  ];

  const editResult = eventResults.find((r) => r.id === editResultId);

  const selectedDistanceData = event.distances.find((d) => d.id === selectedDistance);

  const handleAddResult = (result: LocalResult) => setLocalResults([...localResults, result]);
  const handleDeleteResult = (bibNumber: string) => {
    setLocalResults(localResults.filter((r) => r.bibNumber !== bibNumber));
    toast.success('Wynik usunięty', { description: `Usunięto wynik dla numeru ${bibNumber}` });
  };

  const _handleImportCSV = () => {
    toast('Import CSV', { description: 'Wybierz plik CSV z wynikami (symulacja)' });
    setTimeout(
      () =>
        toast.success('Import zakończony', { description: 'Zaimportowano 25 wyników (symulacja)' }),
      1500,
    );
  };

  const publishOfficialMutation = useMutation({
    mutationFn: () => publishOfficialResults(event.id, selectedDistance),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
      toast.success('Wyniki oficjalne', {
        description: `Oznaczono ${response.data.updatedCount} wynik(ów) jako oficjalne.`,
      });
    },
    onError: (error) => {
      toast.error('Błąd', {
        description:
          error instanceof Error ? error.message : 'Nie udało się oznaczyć wyników jako oficjalne',
      });
    },
  });

  const handleExportCSV = () => {
    const sorted = [...allResults].sort((a, b) => a.time.localeCompare(b.time));
    const data = sorted.map((r, i) => ({
      Pozycja: r.status === 'finished' ? i + 1 : '-',
      'Numer startowy': r.bibNumber,
      Uczestnik: r.userName || '-',
      Czas: r.time,
      Kategoria: r.category || '-',
      Status:
        r.status === 'finished'
          ? 'Ukończył'
          : r.status === 'dnf'
            ? 'DNF'
            : r.status === 'dns'
              ? 'DNS'
              : 'DSQ',
    }));
    exportToCSV(data, `wyniki-${event.slug}-${selectedDistanceData?.name || 'all'}`);
    toast.success('Eksport CSV', { description: 'Plik został pobrany.' });
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
      r.status === 'finished'
        ? 'Ukończył'
        : r.status === 'dnf'
          ? 'DNF'
          : r.status === 'dns'
            ? 'DNS'
            : 'DSQ',
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
    toast.success('Dokument usunięty', { description: 'Dokument został usunięty' });
  };

  return (
    <div className="space-y-6">
      {!canUploadResults && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wyniki niedostępne dla tego statusu</AlertTitle>
          <AlertDescription>
            Wyniki mozna wgrywac tylko do wydarzen trwajacych albo zakonczonych.
          </AlertDescription>
        </Alert>
      )}

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
                    {d.name}
                    {d.length != null ? ` (${d.length} ${d.unit})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAddDialogOpen(true)} disabled={!canUploadResults}>
                <Plus className="mr-2 h-4 w-4" /> Dodaj wynik
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
                disabled={!canUploadResults}
              >
                <FileText className="mr-2 h-4 w-4" /> Dodaj PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
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
            publicationStatus={eventResults.length > 0 ? distancePublicationStatus : undefined}
            results={allResults}
            entryMode={entryMode}
            onEntryModeChange={setEntryMode}
            onAddResult={() => setAddDialogOpen(true)}
            onDeleteResult={handleDeleteResult}
            onImportCSV={() => setImportDialogOpen(true)}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            canEdit={canUploadResults}
            onEditResult={setEditResultId}
            onShowCorrections={setCorrectionsResultId}
          />
        </TabsContent>

        <TabsContent value="teams">
          {selectedDistanceData?.startType === 'relay' ? (
            <TeamClassificationCard eventId={event.id} distanceId={selectedDistance} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Klasyfikacja drużynowa jest dostępna tylko dla dystansów sztafetowych. Zmień typ
                startu tego dystansu w edycji Wydarzenia, aby ją włączyć.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <ResultDocumentsCard
            documents={localDocuments}
            onUpload={() => setUploadDialogOpen(true)}
            onDelete={handleDeleteDocument}
            canUpload={canUploadResults}
          />
        </TabsContent>
      </Tabs>

      {eventResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Publikacja wyników</h3>
                  <PublicationStatusBadge status={distancePublicationStatus} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {distancePublicationStatus === 'official'
                    ? 'Wyniki tego dystansu są oficjalne. Korekta pojedynczego wyniku jest zawsze możliwa i nie zmienia tego statusu.'
                    : 'Wyniki wstępne są już widoczne dla uczestników. Po rozpatrzeniu ewentualnych reklamacji oznacz je jako oficjalne.'}
                </p>
              </div>
              {distancePublicationStatus === 'preliminary' && (
                <Button
                  onClick={() => publishOfficialMutation.mutate()}
                  disabled={publishOfficialMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Oznacz jako oficjalne
                </Button>
              )}
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
      {editResult && (
        <EditResultDialog
          open
          onOpenChange={(open) => !open && setEditResultId(null)}
          result={{ ...editResult, id: editResult.id }}
          isOfficial={distancePublicationStatus === 'official'}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['event-results', event.id] })}
        />
      )}
      {correctionsResultId && (
        <ResultCorrectionsDialog
          open
          onOpenChange={(open) => !open && setCorrectionsResultId(null)}
          resultId={correctionsResultId}
          title={allResults.find((r) => r.id === correctionsResultId)?.userName}
        />
      )}
      <UploadResultDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        eventId={event.id}
        distances={event.distances}
        onUpload={handleUploadDocument}
      />
      <ResultImportWizardDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        eventId={event.id}
        selectedDistanceId={selectedDistance}
        distances={event.distances}
        onCommitted={() => {
          queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
          queryClient.invalidateQueries({ queryKey: ['event-registrations', event.id] });
        }}
      />
    </div>
  );
};
