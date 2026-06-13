import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  open: boolean;
  onDiscard: () => void;
  onStay: () => void;
}

export const UnsavedChangesDialog = ({ open, onDiscard, onStay }: UnsavedChangesDialogProps) => (
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Niezapisane zmiany
        </DialogTitle>
        <DialogDescription>
          Na tej sekcji masz niezapisane zmiany. Jeśli przejdziesz dalej, zmiany zostaną utracone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <Button variant="outline" onClick={onStay}>
          Zostań i edytuj
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          Odrzuć zmiany i przejdź
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
