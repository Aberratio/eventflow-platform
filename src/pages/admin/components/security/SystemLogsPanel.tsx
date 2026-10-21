import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Terminal, Search, RefreshCw, Trash2, Download, Filter } from 'lucide-react';
import {
  clearStoredLogs,
  getStoredLogs,
  type LogCategory,
  type LogEntry,
  type LogLevel,
} from '@/lib/logger';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

const LEVEL_BADGE: Record<
  LogLevel,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  info: { variant: 'secondary', label: 'INFO' },
  warn: { variant: 'outline', label: 'WARN' },
  error: { variant: 'destructive', label: 'ERROR' },
  audit: { variant: 'default', label: 'AUDIT' },
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth: 'Autoryzacja',
  event: 'Wydarzenie',
  registration: 'Rejestracja',
  result: 'Wyniki',
  shop: 'Sklep',
  user: 'Użytkownik',
  moderation: 'Moderacja',
  cms: 'CMS',
  challenge: 'Wyzwanie',
  email: 'Email',
  settings: 'Ustawienia',
  navigation: 'Nawigacja',
  system: 'System',
};

const PAGE_SIZE = 15;

export const SystemLogsPanel = () => {
  const [logs, setLogs] = useState<ReadonlyArray<LogEntry>>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [page, setPage] = useState(0);

  const refresh = useCallback(() => {
    setLogs([...getStoredLogs()].reverse());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.userName?.toLowerCase().includes(q) ||
        log.targetName?.toLowerCase().includes(q) ||
        log.userId?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleClear = () => {
    clearStoredLogs();
    refresh();
    setPage(0);
    toast.success('Logi wyczyszczone', { description: 'Pamięć logów została wyczyszczona.' });
  };

  const handleExport = () => {
    const json = JSON.stringify(filtered, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logi-systemowe-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Eksport', { description: `Wyeksportowano ${filtered.length} logów.` });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-primary" />
              Logi systemowe
            </CardTitle>
            <CardDescription>
              Podgląd logów aplikacji na żywo ({logs.length} w pamięci)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Odśwież
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Eksport
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} disabled={logs.length === 0}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Wyczyść
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj w logach..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={levelFilter}
            onValueChange={(v) => {
              setLevelFilter(v as LogLevel | 'all');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Poziom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as LogCategory | 'all');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {paginated.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Czas</TableHead>
                  <TableHead className="w-[70px]">Poziom</TableHead>
                  <TableHead className="w-[110px]">Kategoria</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead className="w-[130px]">Użytkownik</TableHead>
                  <TableHead className="w-[130px]">Cel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((log) => {
                  const badge = LEVEL_BADGE[log.level];
                  return (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'dd.MM HH:mm:ss', { locale: pl })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="text-[10px]">
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[log.category] ?? log.category}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.userName ? (
                          <div>
                            <p className="font-medium">{log.userName}</p>
                            <p className="text-muted-foreground">{log.userRole}</p>
                          </div>
                        ) : log.userId ? (
                          <span className="font-mono text-muted-foreground">
                            {log.userId.slice(0, 8)}…
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.targetName ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {log.targetName}
                          </Badge>
                        ) : log.targetId ? (
                          <span className="font-mono text-muted-foreground">{log.targetId}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            {logs.length === 0
              ? 'Brak logów w pamięci. Wykonaj kilka akcji w aplikacji, aby zobaczyć logi.'
              : 'Brak logów spełniających kryteria filtrowania.'}
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Wyświetlono {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}{' '}
              z {filtered.length}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              >
                Poprzednia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Następna
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
