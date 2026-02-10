import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Tag, Copy, RefreshCw, Eye, Pencil } from 'lucide-react';
import { DiscountCode, Distance } from '@/types';
import { DiscountCodeUsageDialog } from '@/components/organizer/DiscountCodeUsageDialog';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

interface DiscountCodesEditorProps {
  discountCodes: DiscountCode[];
  distances: Distance[];
  onChange: (codes: DiscountCode[]) => void;
}

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const DiscountCodesEditor = ({ discountCodes, distances, onChange }: DiscountCodesEditorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedCodeForUsage, setSelectedCodeForUsage] = useState<DiscountCode | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<Partial<DiscountCode> & { id: string } | null>(null);
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

    onChange([...discountCodes, code]);
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

  const handleToggleActive = (codeId: string) => {
    const updated = discountCodes.map(dc =>
      dc.id === codeId ? { ...dc, active: !dc.active } : dc
    );
    onChange(updated);
  };

  const handleDeleteCode = (codeId: string) => {
    onChange(discountCodes.filter(dc => dc.id !== codeId));
    toast.success('Kod rabatowy usunięty');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kod skopiowany do schowka');
  };

  const handleGenerateCode = () => {
    setNewCode(prev => ({ ...prev, code: generateRandomCode() }));
  };

  const handleStartEdit = (code: DiscountCode) => {
    setEditingCode({
      ...code,
      validFrom: code.validFrom || '',
      validTo: code.validTo || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingCode) return;
    const updated = discountCodes.map(dc =>
      dc.id === editingCode.id
        ? {
            ...dc,
            discountType: editingCode.discountType || dc.discountType,
            discountValue: editingCode.discountValue ?? dc.discountValue,
            validFrom: editingCode.validFrom || undefined,
            validTo: editingCode.validTo || undefined,
            maxUses: editingCode.maxUses || undefined,
            distanceIds: editingCode.distanceIds,
          }
        : dc
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
                    <Button variant="outline" size="icon" onClick={handleGenerateCode} title="Wygeneruj losowy kod">
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
                    <Input
                      type="date"
                      value={newCode.validFrom || ''}
                      onChange={(e) => setNewCode(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ważny do (opcjonalnie)</Label>
                    <Input
                      type="date"
                      value={newCode.validTo || ''}
                      onChange={(e) => setNewCode(prev => ({ ...prev, validTo: e.target.value }))}
                    />
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
                            const updated = current.includes(d.id)
                              ? current.filter(id => id !== d.id)
                              : [...current, d.id];
                            setNewCode(prev => ({ ...prev, distanceIds: updated }));
                          }}
                        >
                          {d.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pozostaw puste, jeśli kod ma działać dla wszystkich dystansów
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleAddCode}>
                  Dodaj kod
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {discountCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Brak kodów rabatowych</p>
            <p className="text-sm">Dodaj pierwszy kod rabatowy dla tego wydarzenia</p>
          </div>
        ) : (
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
              {discountCodes.map(code => {
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
                        {code.discountType === 'percent' ? `${code.discountValue}%` : `${code.discountValue} zł`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {code.validFrom && format(new Date(code.validFrom), 'd MMM', { locale: pl })}
                      {code.validFrom && code.validTo && ' - '}
                      {code.validTo && format(new Date(code.validTo), 'd MMM yyyy', { locale: pl })}
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
                          onClick={() => { setSelectedCodeForUsage(code); setUsageDialogOpen(true); }}
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
                          disabled={isExpired || isExhausted}
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
        )}
      </CardContent>

      <DiscountCodeUsageDialog
        code={selectedCodeForUsage}
        open={usageDialogOpen}
        onOpenChange={setUsageDialogOpen}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edytuj kod: {editingCode?.code}</DialogTitle>
          </DialogHeader>
          {editingCode && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ zniżki</Label>
                  <Select
                    value={editingCode.discountType}
                    onValueChange={(v: 'percent' | 'fixed') => setEditingCode(prev => prev ? { ...prev, discountType: v } : prev)}
                  >
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
                  <Input
                    type="date"
                    value={editingCode.validFrom || ''}
                    onChange={(e) => setEditingCode(prev => prev ? { ...prev, validFrom: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ważny do</Label>
                  <Input
                    type="date"
                    value={editingCode.validTo || ''}
                    onChange={(e) => setEditingCode(prev => prev ? { ...prev, validTo: e.target.value } : prev)}
                  />
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
                          const updated = current.includes(d.id)
                            ? current.filter(id => id !== d.id)
                            : [...current, d.id];
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSaveEdit}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DiscountCodesEditor;
