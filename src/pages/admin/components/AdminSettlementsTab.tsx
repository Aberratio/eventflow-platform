import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Wallet } from 'lucide-react';
import { exportSettlementReport, getEvents, getSettlementReport } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMinorMoney, toIsoDate } from '@/lib/format';
import type { SettlementEventTotals } from '@/types';

const ALL_EVENTS = 'all';

const defaultPeriod = () => {
  const now = new Date();
  return {
    dateFrom: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const LINE_TYPE_LABELS = { payment: 'Wpłata', refund: 'Zwrot' } as const;

export const AdminSettlementsTab = () => {
  const initial = useMemo(defaultPeriod, []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [eventId, setEventId] = useState(ALL_EVENTS);

  const periodValid = dateFrom !== '' && dateTo !== '' && dateFrom <= dateTo;
  const eventFilter = eventId === ALL_EVENTS ? undefined : eventId;

  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'admin-settlements'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true, pageSize: 100 }),
  });
  const events = eventsResponse?.data ?? [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settlement-report', dateFrom, dateTo, eventFilter ?? ALL_EVENTS],
    queryFn: () => getSettlementReport({ dateFrom, dateTo, eventId: eventFilter }),
    enabled: periodValid,
  });
  const report = data?.data;

  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'xlsx') =>
      exportSettlementReport({ dateFrom, dateTo, eventId: eventFilter }, format),
    onError: (error: Error) => toast.error(error.message || 'Nie udało się pobrać raportu.'),
  });

  const selectEvent = (event: SettlementEventTotals) => setEventId(event.eventId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Wallet className="h-5 w-5" />
          Rozliczenia (trasa A)
        </h2>
        <p className="text-sm text-muted-foreground">
          Wpłaty zebrane przez bramkę platformy, zwroty i kwota do ręcznej wypłaty dla organizatora.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="settlement-date-from">Od</Label>
            <Input
              id="settlement-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settlement-date-to">Do</Label>
            <Input
              id="settlement-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settlement-event">Wydarzenie</Label>
            <select
              id="settlement-event"
              className="flex h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value={ALL_EVENTS}>Wszystkie wydarzenia</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              disabled={!periodValid || exportMutation.isPending}
              onClick={() => exportMutation.mutate('csv')}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksport CSV
            </Button>
            <Button
              variant="outline"
              disabled={!periodValid || exportMutation.isPending}
              onClick={() => exportMutation.mutate('xlsx')}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksport XLSX
            </Button>
          </div>
        </CardContent>
      </Card>

      {!periodValid && (
        <p role="alert" className="text-sm text-destructive">
          Podaj poprawny okres: data początkowa nie może być późniejsza niż końcowa.
        </p>
      )}
      {periodValid && isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
      {periodValid && isError && (
        <p role="alert" className="text-sm text-destructive">
          Nie udało się wczytać raportu rozliczeniowego.
        </p>
      )}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Podsumowanie">
            <SummaryCard label="Wpłaty" value={formatMinorMoney(report.summary.grossMinor)} />
            <SummaryCard label="Zwroty" value={formatMinorMoney(report.summary.refundsMinor)} />
            <SummaryCard
              label={`Prowizja platformy (${report.commissionRateBps / 100}%)`}
              value={formatMinorMoney(report.summary.commissionMinor)}
            />
            <SummaryCard
              label="Do wypłaty"
              value={formatMinorMoney(report.summary.netMinor)}
              emphasis
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wydarzenia</CardTitle>
            </CardHeader>
            <CardContent>
              {report.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak wpłat i zwrotów trasy A w wybranym okresie.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wydarzenie</TableHead>
                      <TableHead>Organizator</TableHead>
                      <TableHead className="text-right">Wpłaty</TableHead>
                      <TableHead className="text-right">Zwroty</TableHead>
                      <TableHead className="text-right">Prowizja</TableHead>
                      <TableHead className="text-right">Do wypłaty</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.events.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell>{event.organizerName}</TableCell>
                        <TableCell className="text-right">
                          {formatMinorMoney(event.grossMinor)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMinorMoney(event.refundsMinor)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMinorMoney(event.commissionMinor)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatMinorMoney(event.netMinor)}
                        </TableCell>
                        <TableCell className="text-right">
                          {eventFilter === undefined && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Pokaż pozycje: ${event.eventName}`}
                              onClick={() => selectEvent(event)}
                            >
                              Pozycje
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {eventFilter !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pozycje</CardTitle>
              </CardHeader>
              <CardContent>
                {report.lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak pozycji w wybranym okresie.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Uczestnik</TableHead>
                        <TableHead>Nr startowy</TableHead>
                        <TableHead>Bramka</TableHead>
                        <TableHead className="text-right">Kwota</TableHead>
                        <TableHead className="text-right">Prowizja</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.lines.map((line) => {
                        const sign = line.type === 'refund' ? -1 : 1;
                        return (
                          <TableRow key={`${line.type}-${line.reference}`}>
                            <TableCell>{line.occurredAt.slice(0, 10)}</TableCell>
                            <TableCell>{LINE_TYPE_LABELS[line.type]}</TableCell>
                            <TableCell>{line.participantName}</TableCell>
                            <TableCell>{line.bibNumber ?? '—'}</TableCell>
                            <TableCell>{line.gateway}</TableCell>
                            <TableCell className="text-right">
                              {formatMinorMoney(sign * line.amountMinor)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatMinorMoney(sign * line.commissionMinor)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) => (
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={emphasis ? 'text-2xl font-bold' : 'text-xl font-semibold'}>{value}</p>
    </CardContent>
  </Card>
);
