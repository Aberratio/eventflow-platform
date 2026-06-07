import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PrivacyChangeConfirmDialogProps {
  open: boolean;
  nextIsPrivate: boolean;
  isConfirming?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const PrivacyChangeConfirmDialog = ({
  open,
  nextIsPrivate,
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: PrivacyChangeConfirmDialogProps) => {
  const title = nextIsPrivate
    ? 'Zmienić wydarzenie na prywatne?'
    : 'Zmienić wydarzenie na publiczne?';
  const confirmLabel = nextIsPrivate ? 'Tak, ustaw jako prywatne' : 'Tak, ustaw jako publiczne';
  const confirmingLabel = nextIsPrivate ? 'Ustawianie...' : 'Publikowanie zmiany...';
  const effects = nextIsPrivate
    ? [
        'Wydarzenie zniknie z publicznych list, wyszukiwarki, wyróżnionych wydarzeń i innych publicznych sekcji.',
        'Strona wydarzenia pozostanie dostępna tylko dla osób, które mają bezpośredni link z kodem dostępu.',
        'Istniejące zapisy, płatności, wyniki, wiadomości i dane uczestników nie zostaną usunięte.',
      ]
    : [
        'Wydarzenie zacznie być widoczne na publicznych listach i w wyszukiwarce, jeśli jego status pozwala na publiczną prezentację.',
        'Specjalny kod dostępu nie będzie potrzebny do wejścia na stronę wydarzenia.',
        'Istniejące zapisy, płatności, wyniki, wiadomości i dane uczestników pozostaną bez zmian.',
      ];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Po potwierdzeniu i zapisaniu zmiany stanie się dokładnie to:</p>
              <ul className="list-disc space-y-1 pl-5">
                {effects.map((effect) => (
                  <li key={effect}>{effect}</li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? confirmingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
