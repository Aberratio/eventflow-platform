import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-time-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { PriceTier, PriceTierMode, PriceTierDiscountType } from '@/types';

interface TierEditorProps {
  tier: PriceTier;
  index: number;
  mode: PriceTierMode;
  basePrice: number;
  calculatedPrice: number;
  priceWarning?: string;
  isPast: boolean;
  isOverLimit: boolean;
  onUpdate: (updates: Partial<PriceTier>) => void;
  onRemove: () => void;
}

export const TierEditor = ({
  tier,
  index,
  mode,
  calculatedPrice,
  priceWarning,
  isPast,
  isOverLimit,
  onUpdate,
  onRemove,
}: TierEditorProps) => {
  const dimmed = isPast || isOverLimit;

  return (
    <div className={`space-y-4 rounded-lg border p-4 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Próg {index + 1}</span>
          {isPast && <Badge variant="secondary">Zakończony</Badge>}
          {isOverLimit && <Badge variant="secondary">Przekroczony</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{calculatedPrice} zł</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Nazwa</Label>
          <Input
            value={tier.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="np. Early Bird"
          />
        </div>
        <div className="space-y-2">
          <Label>Typ rabatu</Label>
          <Select
            value={tier.discountType}
            onValueChange={(v: PriceTierDiscountType) => onUpdate({ discountType: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Procentowy (%)</SelectItem>
              <SelectItem value="fixed">Kwotowy (PLN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rabat {tier.discountType === 'percent' ? '(%)' : '(zł)'}</Label>
          <Input
            type="number"
            value={tier.discountValue}
            onChange={(e) => onUpdate({ discountValue: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground">
            {tier.discountValue > 0
              ? `Zniżka ${tier.discountType === 'percent' ? `${tier.discountValue}%` : `${tier.discountValue} zł`}`
              : tier.discountValue < 0
                ? `Dopłata ${tier.discountType === 'percent' ? `${Math.abs(tier.discountValue)}%` : `${Math.abs(tier.discountValue)} zł`}`
                : 'Cena bazowa bez zmian'}
          </p>
          {priceWarning && (
            <p className="flex items-start gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{priceWarning}</span>
            </p>
          )}
        </div>
        {mode === 'date' ? (
          <div className="space-y-2">
            <Label>Data końcowa</Label>
            <DateInput
              value={tier.endDate || ''}
              onValueChange={(endDate) => onUpdate({ endDate })}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Do ilu uczestników</Label>
            <Input
              type="number"
              value={tier.participantLimit || ''}
              onChange={(e) => onUpdate({ participantLimit: parseInt(e.target.value) || 0 })}
              placeholder="np. 100"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Opis (opcjonalnie)</Label>
        <Input
          value={tier.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="np. Zaoszczędź 30%! Zapisz się wcześniej."
        />
      </div>
    </div>
  );
};
