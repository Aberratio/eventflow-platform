import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCompetitorDuplicateReports, rejectCompetitorDuplicateReport } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { CompetitorDuplicateReportProfile, CompetitorDuplicateReportStatus } from '@/types';

type StatusFilter = CompetitorDuplicateReportStatus | 'all';

const STATUS_LABELS: Record<StatusFilter, string> = {
  open: 'Otwarte',
  rejected: 'Odrzucone',
  merged: 'Scalone',
  all: 'Wszystkie',
};

const name = (p: CompetitorDuplicateReportProfile) =>
  `${p.firstName} ${p.lastName}${p.birthDate ? ` (${p.birthDate})` : ''}`;

/**
 * Zgłoszenia duplikatów od opiekunów/organizatorów, nad narzędziem scalania.
 * "Porównaj" ładuje oba profile do porównania; "Odrzuć" zamyka zgłoszenie bez scalania.
 * Status `merged` ustawia serwer po scaleniu profili.
 */
export const DuplicateReportsQueue = ({
  onCompare,
}: {
  onCompare: (a: string, b: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const { data } = useQuery({
    queryKey: QUERY_KEYS.competitorDuplicateReports(status),
    queryFn: () => listCompetitorDuplicateReports(status),
  });
  const reports = data?.data ?? [];

  const reject = useMutation({
    mutationFn: (id: string) => rejectCompetitorDuplicateReport(id, reason.trim() || undefined),
    onSuccess: () => {
      toast({ title: 'Zgłoszenie odrzucone' });
      setRejectingId(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['competitors', 'duplicate-reports'] });
    },
    onError: () => toast({ title: 'Nie udało się odrzucić zgłoszenia', variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Zgłoszone duplikaty ({reports.length})</CardTitle>
        <select
          aria-label="Status zgłoszeń"
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak zgłoszeń.</p>
        ) : (
          <ul className="divide-y">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <div className="text-sm">
                  <p className="font-medium">
                    {name(r.competitor)} ↔ {name(r.duplicateOf)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Zgłosił(a): {r.reporterName ?? 'nieznany'} ({r.reporterRole})
                    {r.note ? ` — ${r.note}` : ''}
                  </p>
                  {r.status !== 'open' && (
                    <p className="text-xs text-muted-foreground">
                      Status: {STATUS_LABELS[r.status]}
                      {r.rejectReason ? ` · Powód: ${r.rejectReason}` : ''}
                    </p>
                  )}
                </div>
                {r.status === 'open' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCompare(r.competitorId, r.duplicateOfId)}
                    >
                      Porównaj
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectingId(r.id)}>
                      Odrzuć
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Dialog open={rejectingId !== null} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć zgłoszenie duplikatu</DialogTitle>
            <DialogDescription>Profile pozostaną osobne. Powód jest opcjonalny.</DialogDescription>
          </DialogHeader>
          <Label htmlFor="dup-reject-reason">Powód odrzucenia (opcjonalnie)</Label>
          <Textarea
            id="dup-reject-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              disabled={reject.isPending}
              onClick={() => rejectingId && reject.mutate(rejectingId)}
            >
              Odrzuć zgłoszenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
