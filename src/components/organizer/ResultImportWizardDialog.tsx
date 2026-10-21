import { useMemo, useState } from 'react';
import {
  createResultImport,
  updateResultImportMapping,
  updateResultImportRow,
  commitResultImport,
} from '@/api';
import type {
  Distance,
  ResultImportBatch,
  ResultImportCandidate,
  ResultImportMappedData,
  ResultImportMode,
  ResultImportRow,
} from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';

interface ResultImportWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  selectedDistanceId: string;
  distances: Distance[];
  onCommitted: () => void;
}

const mappingTargets = [
  ['bibNumber', 'Numer startowy'],
  ['fullName', 'Imię i nazwisko'],
  ['firstName', 'Imię'],
  ['lastName', 'Nazwisko'],
  ['time', 'Czas'],
  ['status', 'Status'],
  ['position', 'Miejsce'],
  ['category', 'Kategoria'],
  ['gender', 'Płeć'],
  ['birthYear', 'Rok urodzenia'],
  ['club', 'Klub'],
] as const;

const errorLabels: Record<string, string> = {
  time_missing: 'Brak czasu',
  time_invalid: 'Nieprawidłowy czas',
  participant_not_matched: 'Nie dopasowano uczestnika',
  ambiguous_participant: 'Kilku pasujących uczestników',
  missing_mapping: 'Brak mapowania kolumn',
};

function rowValue(
  row: ResultImportRow,
  drafts: Record<string, Partial<ResultImportMappedData>>,
  field: keyof ResultImportMappedData,
): string {
  const draft = drafts[row.id]?.[field];
  const value = draft ?? row.mappedData?.[field] ?? '';
  return value == null ? '' : String(value);
}

function statusBadge(row: ResultImportRow) {
  if (row.ignoreRow || row.status === 'ignored')
    return <Badge variant="secondary">Ignorowany</Badge>;
  if (row.status === 'ready') return <Badge className="bg-success/10 text-success">Gotowy</Badge>;
  if (row.status === 'ambiguous') return <Badge variant="secondary">Duplikat</Badge>;
  if (row.status === 'needs_match') return <Badge variant="outline">Do dopasowania</Badge>;
  if (row.status === 'committed')
    return <Badge className="bg-success/10 text-success">Zapisany</Badge>;
  return <Badge variant="destructive">Do poprawy</Badge>;
}

export function ResultImportWizardDialog({
  open,
  onOpenChange,
  eventId,
  selectedDistanceId,
  distances,
  onCommitted,
}: ResultImportWizardDialogProps) {
  const { toast } = useToast();
  const [distanceId, setDistanceId] = useState(selectedDistanceId);
  const [mode, setMode] = useState<ResultImportMode>('replace');
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ResultImportBatch | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<ResultImportMappedData>>>({});
  const [candidateRow, setCandidateRow] = useState<ResultImportRow | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedDistance = distances.find((d) => d.id === distanceId);
  const summary = batch?.summary;
  const blockingCount =
    (summary?.invalid ?? 0) + (summary?.needsMatch ?? 0) + (summary?.ambiguous ?? 0);
  const canCommit = !!batch && blockingCount === 0 && (summary?.ready ?? 0) > 0;

  const candidateRows = useMemo(
    () => batch?.rows.filter((row) => row.status !== 'ready' && !row.ignoreRow) ?? [],
    [batch?.rows],
  );

  const reset = () => {
    setBatch(null);
    setMapping({});
    setSheetName(null);
    setDrafts({});
    setCandidateRow(null);
    setFile(null);
    setMode('replace');
    setDistanceId(selectedDistanceId);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Brak pliku',
        description: 'Wybierz plik CSV, XLSX albo PDF.',
        variant: 'destructive',
      });
      return;
    }
    setBusy(true);
    try {
      const response = await createResultImport(eventId, distanceId, file, mode);
      setBatch(response.data);
      setMapping(response.data.mapping ?? {});
      setSheetName(response.data.sheetName ?? null);
      toast({ title: 'Import przygotowany', description: 'Sprawdź mapowanie i podgląd wyników.' });
    } catch (error) {
      toast({
        title: 'Import nieudany',
        description: error instanceof Error ? error.message : 'Nie udało się wgrać pliku.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAnalyze = async () => {
    if (!batch) return;
    setBusy(true);
    try {
      const response = await updateResultImportMapping(batch.id, mapping, sheetName);
      setBatch(response.data);
      setDrafts({});
      toast({
        title: 'Podgląd zaktualizowany',
        description: 'Możesz poprawić pojedyncze wiersze przed zatwierdzeniem.',
      });
    } catch (error) {
      toast({
        title: 'Analiza nieudana',
        description:
          error instanceof Error ? error.message : 'Nie udało się przeanalizować importu.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const patchRow = async (row: ResultImportRow, data: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await updateResultImportRow(row.id, data);
      setBatch(response.data);
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
    } catch (error) {
      toast({
        title: 'Nie zapisano wiersza',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    if (!batch) return;
    setBusy(true);
    try {
      await commitResultImport(batch.id);
      toast({
        title: 'Wyniki zapisane',
        description: 'Wyniki są już widoczne w wydarzeniu i profilach uczestników.',
      });
      onCommitted();
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Nie zatwierdzono importu',
        description: error instanceof Error ? error.message : 'Rozwiąż problematyczne wiersze.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const setDraft = (rowId: string, field: keyof ResultImportMappedData, value: string) => {
    setDrafts((current) => ({
      ...current,
      [rowId]: { ...current[rowId], [field]: value },
    }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import wyników z pliku</DialogTitle>
            <DialogDescription>
              Wgraj CSV/XLSX albo eksperymentalnie odczytaj PDF dla jednego dystansu, popraw dane w
              podgladzie i zatwierdz oficjalne wyniki.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Dystans</Label>
                <Select value={distanceId} onValueChange={setDistanceId} disabled={!!batch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz dystans" />
                  </SelectTrigger>
                  <SelectContent>
                    {distances.map((distance) => (
                      <SelectItem key={distance.id} value={distance.id}>
                        {distance.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tryb</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as ResultImportMode)}
                  disabled={!!batch}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">Zastąp dystans</SelectItem>
                    <SelectItem value="upsert">Dopisz/aktualizuj</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plik CSV/XLSX/PDF</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={!!batch}
                />
              </div>
              <Button onClick={handleUpload} disabled={busy || !!batch || !distanceId}>
                {busy && !batch ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Wgraj
              </Button>
            </div>

            {batch && (
              <>
                <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                  {summary?.sheets && summary.sheets.length > 0 && (
                    <div className="space-y-2">
                      <Label>Arkusz</Label>
                      <Select value={sheetName ?? ''} onValueChange={setSheetName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Arkusz" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.sheets.map((sheet) => (
                            <SelectItem key={sheet} value={sheet}>
                              {sheet}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {mappingTargets.map(([target, label]) => (
                      <div key={target} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        <Select
                          value={mapping[target] ?? '__none'}
                          onValueChange={(value) =>
                            setMapping((current) => {
                              const next = { ...current };
                              if (value === '__none') delete next[target];
                              else next[target] = value;
                              return next;
                            })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Brak" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Brak</SelectItem>
                            {batch.headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleAnalyze} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Przelicz podgląd
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <Badge variant="outline">Razem: {summary?.total ?? 0}</Badge>
                  <Badge className="bg-success/10 text-success">
                    Gotowe: {summary?.ready ?? 0}
                  </Badge>
                  <Badge variant="outline">Dopasuj: {summary?.needsMatch ?? 0}</Badge>
                  <Badge variant="secondary">Duplikaty: {summary?.ambiguous ?? 0}</Badge>
                  <Badge variant="destructive">Bledy: {summary?.invalid ?? 0}</Badge>
                  <Badge variant="secondary">Ignorowane: {summary?.ignored ?? 0}</Badge>
                </div>

                {blockingCount > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Import wymaga decyzji</AlertTitle>
                    <AlertDescription>
                      Popraw czas/status albo dopasuj uczestników w problematycznych wierszach przed
                      zatwierdzeniem.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Import gotowy</AlertTitle>
                    <AlertDescription>
                      Wszystkie aktywne wiersze dla dystansu {selectedDistance?.name} sa gotowe do
                      zapisu.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Wiersz</TableHead>
                        <TableHead className="min-w-48">Uczestnik</TableHead>
                        <TableHead className="w-28">Numer</TableHead>
                        <TableHead className="w-32">Czas</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead className="w-24">Miejsce</TableHead>
                        <TableHead className="w-36">Kategoria</TableHead>
                        <TableHead className="w-24">Ignoruj</TableHead>
                        <TableHead className="w-64">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batch.rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="align-top font-mono text-xs">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <Input
                                value={rowValue(row, drafts, 'fullName')}
                                onChange={(event) =>
                                  setDraft(row.id, 'fullName', event.target.value)
                                }
                                className="h-8"
                              />
                              <div className="flex flex-wrap gap-1">
                                {statusBadge(row)}
                                {row.errors.map((error) => (
                                  <Badge key={error} variant="outline" className="text-xs">
                                    {errorLabels[error] ?? error}
                                  </Badge>
                                ))}
                              </div>
                              {row.selectedRegistrationId && (
                                <p className="text-xs text-muted-foreground">
                                  Przypisano zapis: {row.selectedRegistrationId}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={rowValue(row, drafts, 'bibNumber')}
                              onChange={(event) =>
                                setDraft(row.id, 'bibNumber', event.target.value)
                              }
                              className="h-8 font-mono"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={rowValue(row, drafts, 'time')}
                              onChange={(event) => setDraft(row.id, 'time', event.target.value)}
                              className="h-8 font-mono"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Select
                              value={rowValue(row, drafts, 'status') || 'finished'}
                              onValueChange={(value) => setDraft(row.id, 'status', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="finished">finished</SelectItem>
                                <SelectItem value="dnf">DNF</SelectItem>
                                <SelectItem value="dsq">DSQ</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={rowValue(row, drafts, 'position')}
                              onChange={(event) => setDraft(row.id, 'position', event.target.value)}
                              className="h-8 font-mono"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={rowValue(row, drafts, 'category')}
                              onChange={(event) => setDraft(row.id, 'category', event.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Checkbox
                              checked={row.ignoreRow}
                              onCheckedChange={(checked) => patchRow(row, { ignoreRow: !!checked })}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => patchRow(row, drafts[row.id] ?? {})}
                                disabled={busy}
                              >
                                Zapisz
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCandidateRow(row)}
                              >
                                Dopasuj
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => patchRow(row, { status: 'dnf', time: 'DNF' })}
                              >
                                DNF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => patchRow(row, { status: 'dsq', time: 'DSQ' })}
                              >
                                DSQ
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {candidateRows.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Najpierw sprawdź problematyczne wiersze:{' '}
                    {candidateRows
                      .map((row) => row.rowNumber)
                      .slice(0, 8)
                      .join(', ')}
                    {candidateRows.length > 8 ? '...' : ''}
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Zamknij
            </Button>
            <Button onClick={handleCommit} disabled={!canCommit || busy}>
              {busy && batch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Zatwierdź wyniki
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!candidateRow} onOpenChange={(next) => !next && setCandidateRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dopasuj uczestnika</DialogTitle>
            <DialogDescription>Wybierz zapis z listy startowej tego dystansu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(candidateRow?.candidates ?? []).map((candidate: ResultImportCandidate) => (
              <button
                key={candidate.id}
                type="button"
                className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted"
                onClick={() => {
                  if (!candidateRow) return;
                  patchRow(candidateRow, { selectedRegistrationId: candidate.id });
                  setCandidateRow(null);
                }}
              >
                <div className="font-medium">{candidate.userName}</div>
                <div className="text-sm text-muted-foreground">
                  Nr {candidate.bibNumber || '-'} - {candidate.category} - {candidate.gender || '-'}{' '}
                  - {candidate.birthYear || '-'} - {candidate.club || '-'}
                </div>
                <div className="text-xs text-muted-foreground">{candidate.userEmail}</div>
              </button>
            ))}
            {(candidateRow?.candidates ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Brak kandydatow dla tego wiersza.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
