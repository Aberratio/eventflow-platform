import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { getResultCorrections } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ResultCorrectionField } from '@/types';

const FIELD_LABELS: Record<ResultCorrectionField, string> = {
  time: 'Czas brutto',
  netTime: 'Czas netto',
  status: 'Status',
  position: 'Miejsce',
  categoryPosition: 'Miejsce w kategorii',
};

const show = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

interface ResultCorrectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string;
  title?: string;
}

/** The server's correction trail of one result - who, when, from -> to, and why. */
export const ResultCorrectionsDialog = ({
  open,
  onOpenChange,
  resultId,
  title,
}: ResultCorrectionsDialogProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['result-corrections', resultId],
    queryFn: () => getResultCorrections(resultId),
    enabled: open,
  });
  const rows = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historia korekt</DialogTitle>
          {title && <DialogDescription>{title}</DialogDescription>}
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
        {isError && (
          <p className="text-sm text-destructive">Nie udało się pobrać historii korekt.</p>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Ten wynik nie był korygowany.</p>
        )}

        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="space-y-1 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{row.correctedByName ?? row.correctedBy}</span>
                <span className="text-muted-foreground">
                  {format(new Date(row.correctedAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                </span>
              </div>
              {row.wasOfficial && <Badge variant="outline">po publikacji oficjalnej</Badge>}
              <ul className="space-y-0.5">
                {(Object.keys(row.changes) as ResultCorrectionField[]).map((field) => (
                  <li key={field}>
                    {FIELD_LABELS[field] ?? field}:{' '}
                    <span className="font-mono">
                      {show(row.changes[field]?.from)} {'->'} {show(row.changes[field]?.to)}
                    </span>
                  </li>
                ))}
              </ul>
              {row.reason && <p className="text-muted-foreground">{row.reason}</p>}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
