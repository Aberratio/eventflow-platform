import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, DollarSign, Calendar, Users, Percent, ArrowRight } from 'lucide-react';
import { Distance, PriceTier, PriceTierMode, ParticipantCountType, PriceTierDiscountType } from '@/types';
import { applyDiscount } from '@/api/mock/helpers';

interface PriceTiersEditorProps {
  distances: Distance[];
  onChange: (distances: Distance[]) => void;
}

export const PriceTiersEditor = ({ distances, onChange }: PriceTiersEditorProps) => {
  const [expandedDistance, setExpandedDistance] = useState<string | null>(
    distances.length > 0 ? distances[0].id : null
  );

  const updateDistance = (distanceId: string, updates: Partial<Distance>) => {
    const updated = distances.map(d =>
      d.id === distanceId ? { ...d, ...updates } : d
    );
    onChange(updated);
  };

  const updateDistanceTiers = (distanceId: string, tiers: PriceTier[]) => {
    updateDistance(distanceId, { priceTiers: tiers });
  };

  const addTier = (distanceId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance) return;
    const mode = distance.priceTierMode || 'date';

    const newTier: PriceTier = {
      id: `pt-${Date.now()}`,
      name: 'Nowy próg',
      discountType: 'percent',
      discountValue: 0,
      ...(mode === 'date'
        ? { endDate: new Date().toISOString().split('T')[0] }
        : { participantLimit: 100 }),
      description: '',
    };

    updateDistanceTiers(distanceId, [...(distance.priceTiers || []), newTier]);
  };

  const updateTier = (distanceId: string, tierId: string, updates: Partial<PriceTier>) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance?.priceTiers) return;
    const updatedTiers = distance.priceTiers.map(t =>
      t.id === tierId ? { ...t, ...updates } : t
    );
    updateDistanceTiers(distanceId, updatedTiers);
  };

  const removeTier = (distanceId: string, tierId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance?.priceTiers) return;
    updateDistanceTiers(distanceId, distance.priceTiers.filter(t => t.id !== tierId));
  };

  const createDefaultTiers = (distanceId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance) return;
    const mode = distance.priceTierMode || 'date';

    if (mode === 'date') {
      const now = new Date();
      const earlyEnd = new Date(now); earlyEnd.setMonth(earlyEnd.getMonth() + 1);
      const regularEnd = new Date(now); regularEnd.setMonth(regularEnd.getMonth() + 2);
      const lastEnd = new Date(now); lastEnd.setMonth(lastEnd.getMonth() + 3);

      updateDistanceTiers(distanceId, [
        { id: `pt-${Date.now()}-1`, name: 'Early Bird', discountType: 'percent', discountValue: 30, endDate: earlyEnd.toISOString().split('T')[0], description: 'Zaoszczędź 30%!' },
        { id: `pt-${Date.now()}-2`, name: 'Cena regularna', discountType: 'percent', discountValue: 0, endDate: regularEnd.toISOString().split('T')[0], description: 'Standardowa cena startowa.' },
        { id: `pt-${Date.now()}-3`, name: 'Last Minute', discountType: 'percent', discountValue: -20, endDate: lastEnd.toISOString().split('T')[0], description: 'Ostatnia szansa na zapis!' },
      ]);
    } else {
      updateDistanceTiers(distanceId, [
        { id: `pt-${Date.now()}-1`, name: 'Pierwsze 100 osób', discountType: 'percent', discountValue: 25, participantLimit: 100, description: 'Najlepsza cena!' },
        { id: `pt-${Date.now()}-2`, name: '101–200 osób', discountType: 'percent', discountValue: 10, participantLimit: 200, description: 'Mniejszy rabat' },
        { id: `pt-${Date.now()}-3`, name: 'Powyżej 200', discountType: 'percent', discountValue: 0, participantLimit: 500, description: 'Cena standardowa' },
      ]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Progi cenowe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Skonfiguruj progi cenowe dla każdego dystansu. Ustal rabat od ceny bazowej — system automatycznie wyliczy cenę końcową.
        </p>

        {distances.map(distance => {
          const isExpanded = expandedDistance === distance.id;
          const tiers = distance.priceTiers || [];
          const mode = distance.priceTierMode || 'date';

          return (
            <div key={distance.id} className="border rounded-lg">
              <button
                type="button"
                onClick={() => setExpandedDistance(isExpanded ? null : distance.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{distance.name}</span>
                  <span className="text-muted-foreground">
                    ({distance.length} {distance.unit})
                  </span>
                  <Badge variant="secondary">{tiers.length} progów</Badge>
                  {mode === 'participants' && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      wg uczestników
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium">
                  Cena bazowa: {distance.price} zł
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 space-y-4">
                  <Separator />

                  {/* Mode selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tryb progów cenowych</Label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(v: PriceTierMode) => {
                        updateDistance(distance.id, { priceTierMode: v, priceTiers: [] });
                      }}
                      className="flex gap-6"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="date" />
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Po dacie</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="participants" />
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Po liczbie uczestników</span>
                      </label>
                    </RadioGroup>

                    {mode === 'participants' && (
                      <div className="ml-6">
                        <Label className="text-xs text-muted-foreground">Liczymy uczestników:</Label>
                        <RadioGroup
                          value={distance.participantCountType || 'registered'}
                          onValueChange={(v: ParticipantCountType) =>
                            updateDistance(distance.id, { participantCountType: v })
                          }
                          className="flex gap-4 mt-1"
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <RadioGroupItem value="registered" />
                            <span className="text-xs">Zapisani</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <RadioGroupItem value="paid" />
                            <span className="text-xs">Opłaceni</span>
                          </label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Base price info */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm">Cena bazowa:</span>
                    <span className="font-bold text-primary">{distance.price} zł</span>
                    <span className="text-xs text-muted-foreground ml-2">(ustawiona w konfiguracji dystansu)</span>
                  </div>

                  {tiers.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        Brak progów cenowych. Wszystkie zapisy będą mieć cenę bazową {distance.price} zł.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => addTier(distance.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Dodaj próg
                        </Button>
                        <Button onClick={() => createDefaultTiers(distance.id)}>
                          Utwórz domyślne progi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {tiers
                        .sort((a, b) => {
                          if (mode === 'date') {
                            return new Date(a.endDate || '').getTime() - new Date(b.endDate || '').getTime();
                          }
                          return (a.participantLimit || 0) - (b.participantLimit || 0);
                        })
                        .map((tier, index) => {
                          const calculatedPrice = applyDiscount(distance.price, tier.discountType, tier.discountValue);
                          const isPast = mode === 'date' && tier.endDate && new Date(tier.endDate) < new Date();
                          const isOverLimit = mode === 'participants' && tier.participantLimit != null && distance.registeredCount >= tier.participantLimit;

                          return (
                            <TierEditor
                              key={tier.id}
                              tier={tier}
                              index={index}
                              mode={mode}
                              basePrice={distance.price}
                              calculatedPrice={calculatedPrice}
                              isPast={!!isPast}
                              isOverLimit={!!isOverLimit}
                              onUpdate={(updates) => updateTier(distance.id, tier.id, updates)}
                              onRemove={() => removeTier(distance.id, tier.id)}
                            />
                          );
                        })}

                      <Button variant="outline" onClick={() => addTier(distance.id)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Dodaj próg cenowy
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

/** Single tier row editor */
const TierEditor = ({
  tier,
  index,
  mode,
  basePrice,
  calculatedPrice,
  isPast,
  isOverLimit,
  onUpdate,
  onRemove,
}: {
  tier: PriceTier;
  index: number;
  mode: PriceTierMode;
  basePrice: number;
  calculatedPrice: number;
  isPast: boolean;
  isOverLimit: boolean;
  onUpdate: (updates: Partial<PriceTier>) => void;
  onRemove: () => void;
}) => {
  const dimmed = isPast || isOverLimit;

  return (
    <div className={`p-4 border rounded-lg space-y-4 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Próg {index + 1}</span>
          {isPast && <Badge variant="secondary">Zakończony</Badge>}
          {isOverLimit && <Badge variant="secondary">Przekroczony</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {/* Calculated price preview */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{calculatedPrice} zł</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Label>
            Rabat {tier.discountType === 'percent' ? '(%)' : '(zł)'}
          </Label>
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
        </div>
        {mode === 'date' ? (
          <div className="space-y-2">
            <Label>Data końcowa</Label>
            <Input
              type="date"
              value={tier.endDate || ''}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
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

export default PriceTiersEditor;
