import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, RefreshCw } from 'lucide-react';
import { DiscountCode, Distance } from '@/types';
import { toast } from 'sonner';

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface AddDiscountCodeDialogProps {
  discountCodes: DiscountCode[];
  distances: Distance[];
  onAdd: (code: DiscountCode) => void;
}

export const AddDiscountCodeDialog = ({ discountCodes, distances, onAdd }: AddDiscountCodeDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState<Partial<DiscountCode>>({
    code: '',
    discountType: 'percent',
    discountValue: 10,
    validFrom: '',
    validTo: '',
    maxUses: undefined,
    usedCount: 0,
    distanceIds: [],
    active: true,
  });

  const handleAddCode = () => {
    if (!newCode.code) {
      toast.error('Wpisz kod rabatowy');
      return;
    }

    if (discountCodes.some(dc => dc.code.toUpperCase() === newCode.code?.toUpperCase())) {
      toast.error('Kod rabatowy już istnieje');
      return;
    }

    const code: DiscountCode = {
      id: `dc-${Date.now()}`,
      code: newCode.code.toUpperCase(),
      discountType: newCode.discountType || 'percent',
      discountValue: newCode.discountValue || 10,
      validFrom: newCode.validFrom || undefined,
      validTo: newCode.validTo || undefined,
      maxUses: newCode.maxUses || undefined,
      usedCount: 0,
      distanceIds: newCode.distanceIds,
      active: true,
    };

    onAdd(code);
    setDialogOpen(false);
    setNewCode({
      code: '',
      discountType: 'percent',
      discountValue: 10,
      validFrom: '',
      validTo: '',
      maxUses: undefined,
      usedCount: 0,
      distanceIds: [],
      active: true,
    });
    toast.success('Kod rabatowy dodany');
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj kod
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy kod rabatowy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Kod</Label>
            <div className="flex gap-2">
              <Input
                value={newCode.code || ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="np. SUMMER2026"
                className="uppercase"
              />
              <Button variant="outline" size="icon" onClick={() => setNewCode(prev => ({ ...prev, code: generateRandomCode() }))} title="Wygeneruj losowy kod">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ zniżki</Label>
              <Select
                value={newCode.discountType}
                onValueChange={(v: 'percent' | 'fixed') => setNewCode(prev => ({ ...prev, discountType: v }))}
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
                value={newCode.discountValue || ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, discountValue: parseInt(e.target.value) || 0 }))}
                placeholder={newCode.discountType === 'percent' ? '10' : '50'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ważny od (opcjonalnie)</Label>
              <Input type="date" value={newCode.validFrom || ''} onChange={(e) => setNewCode(prev => ({ ...prev, validFrom: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ważny do (opcjonalnie)</Label>
              <Input type="date" value={newCode.validTo || ''} onChange={(e) => setNewCode(prev => ({ ...prev, validTo: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limit użyć (opcjonalnie)</Label>
            <Input
              type="number"
              value={newCode.maxUses || ''}
              onChange={(e) => setNewCode(prev => ({ ...prev, maxUses: parseInt(e.target.value) || undefined }))}
              placeholder="Bez limitu"
            />
          </div>

          {distances.length > 0 && (
            <div className="space-y-2">
              <Label>Tylko dla dystansów (opcjonalnie)</Label>
              <div className="flex flex-wrap gap-2">
                {distances.map(d => (
                  <Badge
                    key={d.id}
                    variant={newCode.distanceIds?.includes(d.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = newCode.distanceIds || [];
                      const updated = current.includes(d.id) ? current.filter(id => id !== d.id) : [...current, d.id];
                      setNewCode(prev => ({ ...prev, distanceIds: updated }));
                    }}
                  >
                    {d.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Pozostaw puste, jeśli kod ma działać dla wszystkich dystansów</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
          <Button onClick={handleAddCode}>Dodaj kod</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
