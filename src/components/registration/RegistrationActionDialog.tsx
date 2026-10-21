import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Class shared by the native selects inside the registration change dialogs. */
export const registrationSelectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface RegistrationActionDialogProps {
  open: boolean;
  /** Already guarded against closing while pending (see useRegistrationAction). */
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/** Dialog frame shared by the registration change dialogs: header, body, footer. */
export const RegistrationActionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: RegistrationActionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter>{footer}</DialogFooter>
    </DialogContent>
  </Dialog>
);
