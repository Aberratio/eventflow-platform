import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DiscountCode, Distance } from '@/types';
import { toast } from 'sonner';

interface EditDiscountCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCode: Partial<DiscountCode> & { id: string } | null;
  setEditingCode: React.Dispatch<React.SetStateAction<(Partial<DiscountCode> & { id: string }) | null>>;
  distances: Distance[];
  onSave: () => void;
}

export const EditDiscountCodeDialog = ({
  open,
  onOpenChange,
  editingCode,
  setEditingCode,
  distances,
  onSave,
}: EditDiscountCodeDialogProps) => {
  if (!editingCode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj kod: {editingCode.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ zniżki</Label>
              <Select
                value={editingCode.discountType}
                onValueChange={(v: 'percent' | 'fixed') => setEditingCode(prev => prev ? { ...prev, discountType: v } : prev)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Procentowa (%)</SelectItem>
                  <SelectItem value="fixed">Kwotowa (PLN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wartość</Label>
              <Input
                type="number"
                value={editingCode.discountValue || ''}
                onChange={(e) => setEditingCode(prev => prev ? { ...prev, discountValue: parseInt(e.target.value) || 0 } : prev)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ważny od</Label>
              <Input type="date" value={editingCode.validFrom || ''} onChange={(e) => setEditingCode(prev => prev ? { ...prev, validFrom: e.target.value } : prev)} />
            </div>
            <div className="space-y-2">
              <Label>Ważny do</Label>
              <Input type="date" value={editingCode.validTo || ''} onChange={(e) => setEditingCode(prev => prev ? { ...prev, validTo: e.target.value } : prev)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limit użyć</Label>
            <Input
              type="number"
              value={editingCode.maxUses || ''}
              onChange={(e) => setEditingCode(prev => prev ? { ...prev, maxUses: parseInt(e.target.value) || undefined } : prev)}
              placeholder="Bez limitu"
            />
          </div>

          {distances.length > 0 && (
            <div className="space-y-2">
              <Label>Tylko dla dystansów</Label>
              <div className="flex flex-wrap gap-2">
                {distances.map(d => (
                  <Badge
                    key={d.id}
                    variant={editingCode.distanceIds?.includes(d.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = editingCode.distanceIds || [];
                      const updated = current.includes(d.id) ? current.filter(id => id !== d.id) : [...current, d.id];
                      setEditingCode(prev => prev ? { ...prev, distanceIds: updated } : prev);
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={onSave}>Zapisz zmiany</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
