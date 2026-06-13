import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DiscountCode, Distance } from '@/types';
import {
  formatDiscountValue,
  formatMoney,
  isDiscountInputAllowed,
  parseDiscountValueInput,
} from '@/lib/discountValue';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface EditDiscountCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCode: (Partial<DiscountCode> & { id: string }) | null;
  setEditingCode: React.Dispatch<
    React.SetStateAction<(Partial<DiscountCode> & { id: string }) | null>
  >;
  distances: Distance[];
  onSave: (discountValue?: number) => void;
}

export const EditDiscountCodeDialog = ({
  open,
  onOpenChange,
  editingCode,
  setEditingCode,
  distances,
  onSave,
}: EditDiscountCodeDialogProps) => {
  const [discountValueInput, setDiscountValueInput] = useState('');

  useEffect(() => {
    if (!editingCode) return;
    setDiscountValueInput(
      formatDiscountValue(editingCode.discountValue ?? 0, editingCode.discountType || 'percent'),
    );
  }, [editingCode, open]);

  if (!editingCode) return null;

  const discountType = editingCode.discountType || 'percent';

  const handleDiscountTypeChange = (nextType: 'percent' | 'fixed') => {
    const parsed = parseDiscountValueInput(discountValueInput, discountType);
    const nextValue = parsed?.value ?? editingCode.discountValue ?? 0;
    setDiscountValueInput(formatDiscountValue(nextValue, nextType));
    setEditingCode((prev) =>
      prev ? { ...prev, discountType: nextType, discountValue: nextValue } : prev,
    );
  };

  const handleDiscountValueChange = (value: string) => {
    if (!isDiscountInputAllowed(value, discountType)) return;

    setDiscountValueInput(value);
  };

  const handleDiscountValueBlur = () => {
    const parsed = parseDiscountValueInput(discountValueInput, discountType);
    if (parsed) setDiscountValueInput(formatDiscountValue(parsed.value, discountType));
  };

  const handleSave = () => {
    const parsed = parseDiscountValueInput(discountValueInput, discountType);
    if (!parsed || parsed.value <= 0) {
      toast.error(
        discountType === 'fixed'
          ? 'Podaj kwotę rabatu, np. 25,50'
          : 'Podaj wartość rabatu w procentach',
      );
      return;
    }
    onSave(parsed.value);
  };

  const affectedDistances =
    editingCode.distanceIds && editingCode.distanceIds.length > 0
      ? distances.filter((distance) => editingCode.distanceIds?.includes(distance.id))
      : distances;
  const parsedDiscountValue = parseDiscountValueInput(discountValueInput, discountType)?.value ?? 0;
  const overDiscountedDistances =
    discountType === 'fixed'
      ? affectedDistances.filter((distance) => parsedDiscountValue > distance.price)
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj kod: {editingCode.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Typ zniżki</Label>
              <Select value={discountType} onValueChange={handleDiscountTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Procentowa (%)</SelectItem>
                  <SelectItem value="fixed">Kwotowa (PLN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wartość {discountType === 'fixed' ? '(PLN)' : '(%)'}</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode={discountType === 'fixed' ? 'decimal' : 'numeric'}
                  value={discountValueInput}
                  onChange={(e) => handleDiscountValueChange(e.target.value)}
                  onBlur={handleDiscountValueBlur}
                  placeholder={discountType === 'percent' ? '10' : '50,00'}
                  aria-describedby="edit-discount-value-help"
                  className="pr-12"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  {discountType === 'fixed' ? 'zł' : '%'}
                </span>
              </div>
              <p id="edit-discount-value-help" className="text-xs text-muted-foreground">
                {discountType === 'fixed'
                  ? 'Możesz wpisać np. 25,50 albo 25.50.'
                  : 'Wpisz pełną liczbę procent.'}
              </p>
              {overDiscountedDistances.length > 0 && (
                <div className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Rabat jest wyższy niż cena:{' '}
                    {overDiscountedDistances
                      .map((distance) => `${distance.name} (${formatMoney(distance.price)})`)
                      .join(', ')}
                    . Uczestnik zapłaci 0,00 zł za te zawody.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ważny od</Label>
              <Input
                type="date"
                value={editingCode.validFrom || ''}
                onChange={(e) =>
                  setEditingCode((prev) => (prev ? { ...prev, validFrom: e.target.value } : prev))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ważny do</Label>
              <Input
                type="date"
                value={editingCode.validTo || ''}
                onChange={(e) =>
                  setEditingCode((prev) => (prev ? { ...prev, validTo: e.target.value } : prev))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limit użyć</Label>
            <Input
              type="number"
              value={editingCode.maxUses || ''}
              onChange={(e) =>
                setEditingCode((prev) =>
                  prev ? { ...prev, maxUses: parseInt(e.target.value) || undefined } : prev,
                )
              }
              placeholder="Bez limitu"
            />
          </div>

          {distances.length > 0 && (
            <div className="space-y-2">
              <Label>Tylko dla dystansów</Label>
              <div className="flex flex-wrap gap-2">
                {distances.map((d) => (
                  <Badge
                    key={d.id}
                    variant={editingCode.distanceIds?.includes(d.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = editingCode.distanceIds || [];
                      const updated = current.includes(d.id)
                        ? current.filter((id) => id !== d.id)
                        : [...current, d.id];
                      setEditingCode((prev) => (prev ? { ...prev, distanceIds: updated } : prev));
                    }}
                  >
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz zmiany</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
