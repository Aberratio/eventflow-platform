import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formFieldLabel } from '@/lib/formFields';
import type { FormField } from '@/types';

export const DeleteFieldDialog = ({
  field,
  pending,
  onClose,
  onConfirm,
}: {
  /** The field awaiting confirmation; the dialog is closed while null. */
  field: FormField | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (field: FormField) => void;
}) => (
  <Dialog open={field !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Usunąć pole?</DialogTitle>
        <DialogDescription>
          Pole „{field ? formFieldLabel(field) : ''}" zniknie z formularza razem z zebranymi
          odpowiedziami. Tej operacji nie można cofnąć.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Anuluj
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => field && onConfirm(field)}>
          Usuń pole
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
