import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { getRegistrationChanges } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { describeRegistrationChange } from '@/lib/registrationChanges';

interface RegistrationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationId: string;
  eventName: string;
}

/** R-02: „Historia zapisu” — what changed on one Zapis, when and by whom, oldest first. */
export const RegistrationHistoryDialog = ({
  open,
  onOpenChange,
  registrationId,
  eventName,
}: RegistrationHistoryDialogProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['registration-changes', registrationId],
    queryFn: () => getRegistrationChanges(registrationId),
    enabled: open,
  });
  const changes = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historia zapisu</DialogTitle>
          <DialogDescription>{eventName}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Ładowanie…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Nie udało się wczytać historii zapisu.</p>
        ) : changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ten zapis nie był jeszcze zmieniany.</p>
        ) : (
          <ol className="space-y-2" aria-label="Historia zapisu">
            {changes.map((change) => (
              <li key={change.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{describeRegistrationChange(change)}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(change.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}
                </p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};
