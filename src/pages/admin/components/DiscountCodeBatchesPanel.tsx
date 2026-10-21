import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportDiscountCodeBatch, getDiscountCodeBatches } from '@/api';
import type { DiscountCode } from '@/types';
import { batchToDiscountCodes } from '@/lib/discountBatches';
import { formatDiscountBadge } from '@/lib/discountValue';
import { GenerateDiscountBatchDialog } from './GenerateDiscountBatchDialog';

interface DiscountCodeBatchesPanelProps {
  eventId: string;
  onCodesGenerated: (codes: DiscountCode[]) => void;
}

/**
 * Batch generator entry point of the discount codes tab - "Generuj partię" plus the list of
 * batches already generated for the event, each with a CSV download.
 */
export const DiscountCodeBatchesPanel = ({
  eventId,
  onCodesGenerated,
}: DiscountCodeBatchesPanelProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['discount-code-batches', eventId];
  const { data: batches = [] } = useQuery({
    queryKey,
    queryFn: () => getDiscountCodeBatches(eventId),
    select: (response) => response.data,
  });

  const handleDownload = async (batchId: string) => {
    try {
      await exportDiscountCodeBatch(eventId, batchId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się pobrać pliku CSV');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Partie kodów</h3>
        <GenerateDiscountBatchDialog
          eventId={eventId}
          onGenerated={(batch) => {
            onCodesGenerated(batchToDiscountCodes(batch));
            void queryClient.invalidateQueries({ queryKey });
          }}
        />
      </div>
      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak wygenerowanych partii</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {batches.map((batch) => (
            <li key={batch.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium">{batch.label}</p>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span>
                    {batch.codesTotal} kodów, użyto {batch.usedTotal}
                  </span>
                  <Badge variant="secondary">
                    {formatDiscountBadge(batch.discountValue, batch.discountType)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(batch.id)}
                aria-label={`Pobierz CSV partii ${batch.label}`}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
