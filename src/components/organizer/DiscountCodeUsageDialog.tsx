import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DiscountCode } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Users } from 'lucide-react';

interface DiscountCodeUsageDialogProps {
  code: DiscountCode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DiscountCodeUsageDialog = ({
  code,
  open,
  onOpenChange,
}: DiscountCodeUsageDialogProps) => {
  if (!code) return null;

  const usages = code.usedBy || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Użycia kodu <code className="font-mono">{code.code}</code>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {code.usedCount} {code.maxUses ? `z ${code.maxUses}` : ''} użyć
          </p>
        </DialogHeader>

        {usages.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>Nikt jeszcze nie skorzystał z tego kodu</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Użytkownik</TableHead>
                  <TableHead>Dystans</TableHead>
                  <TableHead>Data użycia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.map((usage) => (
                  <TableRow key={usage.registrationId}>
                    <TableCell className="font-medium">{usage.userName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{usage.distanceName}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(usage.usedAt), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
