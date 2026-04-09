import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Star } from 'lucide-react';
import { VipPrice, PriceTierDiscountType } from '@/types';
import { applyDiscount } from '@/api/mock/helpers';

interface VipPricesSectionProps {
  distanceVipPrices: VipPrice[];
  basePrice: number;
  onAddVip: () => void;
  onUpdateVip: (vipId: string, updates: Partial<VipPrice>) => void;
  onRemoveVip: (vipId: string) => void;
}

export const VipPricesSection = ({
  distanceVipPrices,
  basePrice,
  onAddVip,
  onUpdateVip,
  onRemoveVip,
}: VipPricesSectionProps) => {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Ceny specjalne (VIP) — dla całej kategorii
            {distanceVipPrices.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {distanceVipPrices.length}
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Ceny VIP obowiązują niezależnie od aktywnego progu cenowego. Rabat VIP jest naliczany od
          ceny bazowej dystansu ({basePrice} zł).
        </p>
        {distanceVipPrices.map((vip) => {
          const vipFinalPrice = applyDiscount(basePrice, vip.discountType, vip.discountValue);

          return (
            <div key={vip.id} className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  {vip.name || 'Nowa cena VIP'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-semibold dark:bg-yellow-900/30">
                    {vipFinalPrice} zł
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemoveVip(vip.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nazwa ceny VIP</Label>
                  <Input
                    value={vip.name}
                    onChange={(e) => onUpdateVip(vip.id, { name: e.target.value })}
                    placeholder="np. Osoba niepełnosprawna"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Typ rabatu</Label>
                  <Select
                    value={vip.discountType}
                    onValueChange={(v: PriceTierDiscountType) =>
                      onUpdateVip(vip.id, { discountType: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Procentowy (%)</SelectItem>
                      <SelectItem value="fixed">Kwotowy (PLN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Rabat {vip.discountType === 'percent' ? '(%)' : '(zł)'} od ceny bazowej
                  </Label>
                  <Input
                    type="number"
                    value={vip.discountValue}
                    onChange={(e) =>
                      onUpdateVip(vip.id, { discountValue: parseFloat(e.target.value) || 0 })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id={`vip-field-${vip.id}`}
                  checked={!!vip.customFieldLabel}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdateVip(vip.id, { customFieldLabel: '', customFieldRequired: false });
                    } else {
                      onUpdateVip(vip.id, {
                        customFieldLabel: undefined,
                        customFieldRequired: undefined,
                      });
                    }
                  }}
                />
                <Label htmlFor={`vip-field-${vip.id}`} className="cursor-pointer text-xs">
                  Dodaj pole dodatkowe (np. numer licencji)
                </Label>
              </div>

              {vip.customFieldLabel !== undefined && (
                <div className="ml-7 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nazwa pola</Label>
                    <Input
                      value={vip.customFieldLabel || ''}
                      onChange={(e) => onUpdateVip(vip.id, { customFieldLabel: e.target.value })}
                      placeholder="np. Nr orzeczenia"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Checkbox
                      id={`vip-req-${vip.id}`}
                      checked={!!vip.customFieldRequired}
                      onCheckedChange={(checked) =>
                        onUpdateVip(vip.id, { customFieldRequired: !!checked })
                      }
                    />
                    <Label htmlFor={`vip-req-${vip.id}`} className="cursor-pointer text-xs">
                      Pole wymagane
                    </Label>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={onAddVip} className="w-full">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Dodaj cenę VIP
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};
