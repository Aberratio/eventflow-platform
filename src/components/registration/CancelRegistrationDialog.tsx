import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Event, Registration } from '@/types';
import { hasPaidAmount, selfServiceDeadline } from '@/lib/selfService';

interface CancelRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration;
  event: Event;
  /** True while the cancel request is in flight. */
  pending?: boolean;
  onConfirm: () => void;
}

/**
 * R-02 (zakres P2): confirmation before the owner cancels their own Zapis. Spells out what happens
 * to the money (a refund request the organizer decides on) and to the slot (it returns to the pool).
 */
export const CancelRegistrationDialog = ({
  open,
  onOpenChange,
  registration,
  event,
  pending = false,
  onConfirm,
}: CancelRegistrationDialogProps) => {
  const deadline = selfServiceDeadline(event);
  const paid = hasPaidAmount(registration);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zrezygnować z udziału?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {event.name} — {registration.distanceName}. Twój zapis zostanie anulowany, a miejsce
                wróci do puli. Tej operacji nie można cofnąć.
              </p>
              {paid ? (
                <p>
                  Zapis jest opłacony, więc złożymy za Ciebie wniosek o zwrot. Organizator rozpatrzy
                  go zgodnie z zasadami wydarzenia — o decyzji dostaniesz informację.
                </p>
              ) : (
                <p>Zapis nie jest opłacony, więc nie będzie żadnego zwrotu.</p>
              )}
              {deadline && (
                <p>
                  Samodzielnie możesz zrezygnować do{' '}
                  {format(deadline, 'd MMMM yyyy, HH:mm', { locale: pl })}.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Wróć</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Rezygnuję…' : 'Tak, rezygnuję'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
