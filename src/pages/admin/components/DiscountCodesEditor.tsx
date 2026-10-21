import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Tag, Copy, Eye, Pencil } from 'lucide-react';
import { DiscountCode, Distance } from '@/types';
import { DiscountCodeUsageDialog } from '@/components/organizer/DiscountCodeUsageDialog';
import { AddDiscountCodeDialog } from './AddDiscountCodeDialog';
import { DiscountCodeBatchesPanel } from './DiscountCodeBatchesPanel';
import { EditDiscountCodeDialog } from './EditDiscountCodeDialog';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatDiscountBadge } from '@/lib/discountValue';

interface DiscountCodesEditorProps {
  /** When set, the batch generator (R-07) is offered; it needs the persisted event. */
  eventId?: string;
  discountCodes: DiscountCode[];
  distances: Distance[];
  onChange: (codes: DiscountCode[]) => void;
}

export const DiscountCodesEditor = ({
  eventId,
  discountCodes,
  distances,
  onChange,
}: DiscountCodesEditorProps) => {
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedCodeForUsage, setSelectedCodeForUsage] = useState<DiscountCode | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<(Partial<DiscountCode> & { id: string }) | null>(
    null,
  );

  const handleToggleActive = (codeId: string) => {
    onChange(discountCodes.map((dc) => (dc.id === codeId ? { ...dc, active: !dc.active } : dc)));
  };

  const handleDeleteCode = (codeId: string) => {
    onChange(discountCodes.filter((dc) => dc.id !== codeId));
    toast.success('Kod rabatowy usunięty');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kod skopiowany do schowka');
  };

  const handleStartEdit = (code: DiscountCode) => {
    setEditingCode({ ...code, validFrom: code.validFrom || '', validTo: code.validTo || '' });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (discountValue?: number) => {
    if (!editingCode) return;
    const updated = discountCodes.map((dc) =>
      dc.id === editingCode.id
        ? {
            ...dc,
            discountType: editingCode.discountType || dc.discountType,
            discountValue: discountValue ?? editingCode.discountValue ?? dc.discountValue,
            validFrom: editingCode.validFrom || undefined,
            validTo: editingCode.validTo || undefined,
            maxUses: editingCode.maxUses || undefined,
            distanceIds: editingCode.distanceIds,
          }
        : dc,
    );
    onChange(updated);
    setEditDialogOpen(false);
    setEditingCode(null);
    toast.success('Kod rabatowy zaktualizowany');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Kody rabatowe
          </CardTitle>
          <AddDiscountCodeDialog
            discountCodes={discountCodes}
            distances={distances}
            onAdd={(code) => onChange([...discountCodes, code])}
          />
        </div>
      </CardHeader>
      <CardContent>
        {eventId && (
          <div className="mb-6">
            <DiscountCodeBatchesPanel
              eventId={eventId}
              onCodesGenerated={(codes) => onChange([...discountCodes, ...codes])}
            />
          </div>
        )}
        {discountCodes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Tag className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Brak kodów rabatowych</p>
            <p className="text-sm">Dodaj pierwszy kod rabatowy dla tego wydarzenia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Zniżka</TableHead>
                  <TableHead>Ważność</TableHead>
                  <TableHead>Użycia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => {
                  const isExpired = code.validTo && new Date(code.validTo) < new Date();
                  const isExhausted = code.maxUses && code.usedCount >= code.maxUses;

                  return (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold">{code.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(code.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatDiscountBadge(code.discountValue, code.discountType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.validFrom &&
                          format(new Date(code.validFrom), 'd MMM', { locale: pl })}
                        {code.validFrom && code.validTo && ' - '}
                        {code.validTo &&
                          format(new Date(code.validTo), 'd MMM yyyy', { locale: pl })}
                        {!code.validFrom && !code.validTo && 'Bez limitu'}
                      </TableCell>
                      <TableCell>
                        {code.usedCount}
                        {code.maxUses && ` / ${code.maxUses}`}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="secondary">Wygasł</Badge>
                        ) : isExhausted ? (
                          <Badge variant="secondary">Wyczerpany</Badge>
                        ) : code.active ? (
                          <Badge variant="default">Aktywny</Badge>
                        ) : (
                          <Badge variant="outline">Nieaktywny</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedCodeForUsage(code);
                              setUsageDialogOpen(true);
                            }}
                            title="Pokaż użycia"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(code)}
                            title="Edytuj kod"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={code.active}
                            onCheckedChange={() => handleToggleActive(code.id)}
                            disabled={!!isExpired || !!isExhausted}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCode(code.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <DiscountCodeUsageDialog
        code={selectedCodeForUsage}
        open={usageDialogOpen}
        onOpenChange={setUsageDialogOpen}
      />

      <EditDiscountCodeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingCode={editingCode}
        setEditingCode={setEditingCode}
        distances={distances}
        onSave={handleSaveEdit}
      />
    </Card>
  );
};

export default DiscountCodesEditor;
