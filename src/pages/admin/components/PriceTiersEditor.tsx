import { applyDiscount } from '@/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import { Distance, PriceTier, VipPrice } from '@/types';
import { TierEditor } from './TierEditor';
import { VipPricesSection } from './VipPricesSection';
import { PriceTierPreview } from '@/components/pricing/PriceTierPreview';
import { formatMoney } from '@/lib/format';

interface PriceTiersEditorProps {
  distances: Distance[];
  onChange: (distances: Distance[]) => void;
}

export const PriceTiersEditor = ({ distances, onChange }: PriceTiersEditorProps) => {
  const [expandedDistance, setExpandedDistance] = useState<string | null>(
    distances.length > 0 ? distances[0].id : null,
  );

  const updateDistance = (distanceId: string, updates: Partial<Distance>) => {
    const updated = distances.map((d) => (d.id === distanceId ? { ...d, ...updates } : d));
    onChange(updated);
  };

  const updateDistanceTiers = (distanceId: string, tiers: PriceTier[]) => {
    updateDistance(distanceId, { priceTiers: tiers });
  };

  const addTier = (distanceId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance) return;

    const newTier: PriceTier = {
      id: `pt-${Date.now()}`,
      name: 'Nowy próg',
      discountType: 'percent',
      discountValue: 0,
      endDate: new Date().toISOString().split('T')[0],
      description: '',
    };

    updateDistanceTiers(distanceId, [...(distance.priceTiers || []), newTier]);
  };

  const updateTier = (distanceId: string, tierId: string, updates: Partial<PriceTier>) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance?.priceTiers) return;
    const updatedTiers = distance.priceTiers.map((t) =>
      t.id === tierId ? { ...t, ...updates } : t,
    );
    updateDistanceTiers(distanceId, updatedTiers);
  };

  const removeTier = (distanceId: string, tierId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance?.priceTiers) return;
    updateDistanceTiers(
      distanceId,
      distance.priceTiers.filter((t) => t.id !== tierId),
    );
  };

  const addVipPrice = (distanceId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance) return;
    const newVip: VipPrice = {
      id: `vip-${Date.now()}`,
      name: '',
      discountType: 'percent',
      discountValue: 10,
    };
    updateDistance(distanceId, { vipPrices: [...(distance.vipPrices || []), newVip] });
  };

  const updateVipPrice = (distanceId: string, vipId: string, updates: Partial<VipPrice>) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance) return;
    updateDistance(distanceId, {
      vipPrices: (distance.vipPrices || []).map((v) => (v.id === vipId ? { ...v, ...updates } : v)),
    });
  };

  const removeVipPrice = (distanceId: string, vipId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance) return;
    updateDistance(distanceId, {
      vipPrices: (distance.vipPrices || []).filter((v) => v.id !== vipId),
    });
  };

  const createDefaultTiers = (distanceId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
    if (!distance) return;

    const now = new Date();
    const earlyEnd = new Date(now);
    earlyEnd.setMonth(earlyEnd.getMonth() + 1);
    const regularEnd = new Date(now);
    regularEnd.setMonth(regularEnd.getMonth() + 2);
    const lastEnd = new Date(now);
    lastEnd.setMonth(lastEnd.getMonth() + 3);

    updateDistanceTiers(distanceId, [
      {
        id: `pt-${Date.now()}-1`,
        name: 'Early Bird',
        discountType: 'percent',
        discountValue: 30,
        endDate: earlyEnd.toISOString().split('T')[0],
        description: 'Zaoszczędź 30%!',
      },
      {
        id: `pt-${Date.now()}-2`,
        name: 'Cena regularna',
        discountType: 'percent',
        discountValue: 0,
        endDate: regularEnd.toISOString().split('T')[0],
        description: 'Standardowa cena startowa.',
      },
      {
        id: `pt-${Date.now()}-3`,
        name: 'Last Minute',
        discountType: 'percent',
        discountValue: -20,
        endDate: lastEnd.toISOString().split('T')[0],
        description: 'Ostatnia szansa na zapis!',
      },
    ]);
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
          Skonfiguruj progi cenowe dla każdego dystansu. Każdy próg może mieć datę końcową i/lub
          limit uczestników jednocześnie — wygasa na tym, co nastąpi wcześniej.
        </p>

        {distances.map((distance) => {
          const isExpanded = expandedDistance === distance.id;
          const tiers = distance.priceTiers || [];

          return (
            <div key={distance.id} className="rounded-lg border-2 border-yellow-400">
              <button
                type="button"
                onClick={() => setExpandedDistance(isExpanded ? null : distance.id)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{distance.name}</span>
                  {distance.length != null && (
                    <span className="text-muted-foreground">
                      ({distance.length} {distance.unit})
                    </span>
                  )}
                  <Badge variant="secondary">{tiers.length} progów</Badge>
                </div>
                <span className="text-sm font-medium">
                  Cena bazowa: {formatMoney(distance.price)}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-4 p-4 pt-0">
                  <Separator />

                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Każdy próg może mieć datę końcową, limit uczestników, albo oba naraz — wygasa
                      na tym, co nastąpi wcześniej.
                    </span>
                  </div>

                  <PriceTierPreview
                    basePrice={distance.price}
                    tiers={tiers}
                    currentCount={distance.registeredCount}
                  />

                  <Separator />

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm">Cena bazowa:</span>
                    <span className="font-bold text-primary">{formatMoney(distance.price)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ustawiona w konfiguracji dystansu)
                    </span>
                  </div>

                  {tiers.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="mb-4 text-muted-foreground">
                        Brak progów cenowych. Wszystkie zapisy będą mieć cenę bazową{' '}
                        {formatMoney(distance.price)}.
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" onClick={() => addTier(distance.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj próg
                        </Button>
                        <Button onClick={() => createDefaultTiers(distance.id)}>
                          Utwórz domyślne progi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {tiers.map((tier, index) => {
                        const calculatedPrice = applyDiscount(
                          distance.price,
                          tier.discountType,
                          tier.discountValue,
                        );
                        const visiblePrice =
                          tier.price != null ? Number(tier.price) : calculatedPrice;
                        const isPast = !!tier.endDate && new Date(tier.endDate) < new Date();
                        const isOverLimit =
                          tier.participantLimit != null &&
                          distance.registeredCount >= tier.participantLimit;

                        return (
                          <TierEditor
                            key={tier.id}
                            tier={tier}
                            index={index}
                            calculatedPrice={tier.price != null ? visiblePrice : calculatedPrice}
                            priceWarning={
                              visiblePrice > distance.price
                                ? 'Cena progu jest wyższa od ceny bazowej. To dozwolone, ale zwykle dodatkowe ceny powinny być niższe.'
                                : undefined
                            }
                            isPast={!!isPast}
                            isOverLimit={!!isOverLimit}
                            onUpdate={(updates) => updateTier(distance.id, tier.id, updates)}
                            onRemove={() => removeTier(distance.id, tier.id)}
                          />
                        );
                      })}

                      <Button
                        variant="outline"
                        onClick={() => addTier(distance.id)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj próg cenowy
                      </Button>
                    </>
                  )}

                  <Separator />

                  <VipPricesSection
                    distanceVipPrices={distance.vipPrices || []}
                    basePrice={distance.price}
                    onAddVip={() => addVipPrice(distance.id)}
                    onUpdateVip={(vipId, updates) => updateVipPrice(distance.id, vipId, updates)}
                    onRemoveVip={(vipId) => removeVipPrice(distance.id, vipId)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PriceTiersEditor;
