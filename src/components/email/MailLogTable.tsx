import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { getMailLog } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  MAIL_LOG_STATUS_LABELS,
  MAIL_TYPE_LABELS,
  mailTypeLabel,
  type MailLogEntry,
} from '@/types/email';

const PAGE_SIZE = 25;
const ALL = 'all';

interface MailLogTableProps {
  /** Undefined = global log (admin only). */
  eventId?: string;
}

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString('pl-PL') : '—';

/** Read-only dispatch log with filters and server-side pagination. */
export const MailLogTable: React.FC<MailLogTableProps> = ({ eventId }) => {
  const [entries, setEntries] = useState<MailLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [mailType, setMailType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMailLog(
        {
          page,
          pageSize: PAGE_SIZE,
          ...(mailType !== ALL && { mailType }),
          ...(status !== ALL && { status }),
          ...(!eventId && appliedSearch && { search: appliedSearch }),
        },
        eventId,
      );
      setEntries(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się załadować dziennika wysyłek');
    } finally {
      setLoading(false);
    }
  }, [page, mailType, status, appliedSearch, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetPageThen =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPage(1);
      setter(value);
    };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select value={mailType} onValueChange={resetPageThen(setMailType)}>
          <SelectTrigger className="w-60" aria-label="Typ maila">
            <SelectValue placeholder="Typ maila" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Wszystkie typy</SelectItem>
            {Object.entries(MAIL_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPageThen(setStatus)}>
          <SelectTrigger className="w-44" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Wszystkie statusy</SelectItem>
            {Object.entries(MAIL_LOG_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!eventId && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setAppliedSearch(search.trim());
            }}
          >
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Fragment adresu odbiorcy"
              aria-label="Szukaj odbiorcy"
              className="w-56"
            />
            <Button type="submit" variant="secondary">
              Szukaj
            </Button>
          </form>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Mail className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Brak wysyłek</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Odbiorca</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="hidden md:table-cell">Temat</TableHead>
                <TableHead className="hidden sm:table-cell">Utworzono</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Próby</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{entry.recipient}</TableCell>
                  <TableCell>{mailTypeLabel(entry.mailType)}</TableCell>
                  <TableCell className="hidden md:table-cell">{entry.subject}</TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'failed' ? 'destructive' : 'secondary'}>
                      {MAIL_LOG_STATUS_LABELS[entry.status] ?? entry.status}
                    </Badge>
                    {entry.lastError && (
                      <p className="mt-1 text-xs text-destructive">{entry.lastError}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{entry.attempts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Strona {page} z {totalPages} ({total} wysyłek)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Następna
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
