import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  Printer,
  Plus,
  Trophy,
  Clock,
  Upload,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface LocalResult {
  bibNumber: string;
  time: string;
  status: 'finished' | 'dnf' | 'dsq';
  userName?: string;
  category?: string;
}

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

interface IndividualResultsCardProps {
  distanceName?: string;
  results: LocalResult[];
  entryMode: 'manual' | 'import';
  onEntryModeChange: (mode: 'manual' | 'import') => void;
  onAddResult: () => void;
  onDeleteResult: (bibNumber: string) => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const IndividualResultsCard: React.FC<IndividualResultsCardProps> = ({
  distanceName,
  results,
  entryMode,
  onEntryModeChange,
  onAddResult,
  onDeleteResult,
  onImportCSV,
  onExportCSV,
  onExportPDF,
}) => (
  <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
      <CardTitle>Wyniki indywidualne - {distanceName}</CardTitle>
      <div className="flex gap-2">
        <Button
          variant={entryMode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEntryModeChange('manual')}
        >
          Ręcznie
        </Button>
        <Button
          variant={entryMode === 'import' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onEntryModeChange('import')}
        >
          Import CSV
        </Button>
        {results.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Eksport
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onExportCSV}>
                <FileText className="mr-2 h-4 w-4" /> Pobierz CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPDF}>
                <Printer className="mr-2 h-4 w-4" /> Drukuj PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {entryMode === 'import' ? (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2">Przeciągnij plik CSV lub kliknij, aby wybrać</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Format: numer_startowy, czas (HH:MM:SS), status (finished/dnf/dsq)
            </p>
            <Button onClick={onImportCSV}>
              <Upload className="mr-2 h-4 w-4" /> Wybierz plik
            </Button>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Przykładowy format pliku:</p>
                <pre className="mt-2 font-mono text-xs">
                  numer,czas,status{'\n'}101,01:23:45,finished{'\n'}102,01:25:30,finished{'\n'}
                  103,,dnf
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Brak wprowadzonych wyników dla tego dystansu.</p>
          <Button className="mt-4" onClick={onAddResult}>
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
              {[...results]
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
                          {index < 3 && (
                            <Trophy
                              className={`h-4 w-4 ${index === 0 ? 'text-warning' : index === 1 ? 'text-muted-foreground' : 'text-warning/70'}`}
                            />
                          )}
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      ) : (
                        '-'
                      )}
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
                        onClick={() => onDeleteResult(result.bibNumber)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);
