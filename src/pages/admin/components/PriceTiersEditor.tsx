import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, DollarSign, Calendar, Users, AlertCircle } from 'lucide-react';
import { Distance, PriceTier, PriceTierMode, ParticipantCountType, VipPrice } from '@/types';
import { applyDiscount } from '@/api/mock/helpers';
import { TierEditor } from './TierEditor';
import { VipPricesSection } from './VipPricesSection';

interface PriceTiersEditorProps {
  distances: Distance[];
  onChange: (distances: Distance[]) => void;
}

const SESSION_KEY_PREFIX = 'priceTiers';

const getSessionKey = (distanceId: string, mode: PriceTierMode) =>
  `${SESSION_KEY_PREFIX}-${distanceId}-${mode}`;

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

  const handleModeChange = (distance: Distance, newMode: PriceTierMode) => {
    const currentMode = distance.priceTierMode || 'date';
    if (currentMode === newMode) return;

    const currentTiers = distance.priceTiers || [];
    const saveKey = getSessionKey(distance.id, currentMode);
    sessionStorage.setItem(saveKey, JSON.stringify(currentTiers));

    const loadKey = getSessionKey(distance.id, newMode);
    const saved = sessionStorage.getItem(loadKey);
    const restoredTiers: PriceTier[] = saved ? JSON.parse(saved) : [];

    updateDistance(distance.id, {
      priceTierMode: newMode,
      priceTiers: restoredTiers,
    });
  };

  const addTier = (distanceId: string) => {
    const distance = distances.find((d) => d.id === distanceId);
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
    const mode = distance.priceTierMode || 'date';

    if (mode === 'date') {
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
    } else {
      updateDistanceTiers(distanceId, [
        {
          id: `pt-${Date.now()}-1`,
          name: 'Pierwsze 100 osób',
          discountType: 'percent',
          discountValue: 25,
          participantLimit: 100,
          description: 'Najlepsza cena!',
        },
        {
          id: `pt-${Date.now()}-2`,
          name: '101–200 osób',
          discountType: 'percent',
          discountValue: 10,
          participantLimit: 200,
          description: 'Mniejszy rabat',
        },
        {
          id: `pt-${Date.now()}-3`,
          name: 'Powyżej 200',
          discountType: 'percent',
          discountValue: 0,
          participantLimit: 500,
          description: 'Cena standardowa',
        },
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
          Skonfiguruj progi cenowe dla każdego dystansu. Ustal rabat od ceny bazowej — system
          automatycznie wyliczy cenę końcową.
        </p>

        {distances.map((distance) => {
          const isExpanded = expandedDistance === distance.id;
          const tiers = distance.priceTiers || [];
          const mode = distance.priceTierMode || 'date';
          const distanceVipPrices = distance.vipPrices || [];

          return (
            <div key={distance.id} className="rounded-lg border-2 border-yellow-400">
              <button
                type="button"
                onClick={() => setExpandedDistance(isExpanded ? null : distance.id)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{distance.name}</span>
                  <span className="text-muted-foreground">
                    ({distance.length} {distance.unit})
                  </span>
                  <Badge variant="secondary">{tiers.length} progów</Badge>
                  {mode === 'participants' && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      wg uczestników
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium">Cena bazowa: {distance.price} zł</span>
              </button>

              {isExpanded && (
                <div className="space-y-4 p-4 pt-0">
                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tryb progów cenowych</Label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(v: PriceTierMode) => handleModeChange(distance, v)}
                      className="flex gap-6"
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="date" />
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Po dacie</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="participants" />
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Po liczbie uczestników</span>
                      </label>
                    </RadioGroup>

                    <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Uwaga: Dla każdego dystansu można wybrać tylko jeden tryb naliczania progów
                        cenowych. Zmiana trybu spowoduje zapisanie poprzedniej konfiguracji —
                        wrócisz do niej po ponownym przełączeniu.
                      </span>
                    </div>

                    {mode === 'participants' && (
                      <div className="ml-6">
                        <Label className="text-xs text-muted-foreground">
                          Liczymy uczestników:
                        </Label>
                        <RadioGroup
                          value={distance.participantCountType || 'registered'}
                          onValueChange={(v: ParticipantCountType) =>
                            updateDistance(distance.id, { participantCountType: v })
                          }
                          className="mt-1 flex gap-4"
                        >
                          <label className="flex cursor-pointer items-center gap-1.5">
                            <RadioGroupItem value="registered" />
                            <span className="text-xs">Zapisani</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-1.5">
                            <RadioGroupItem value="paid" />
                            <span className="text-xs">Opłaceni</span>
                          </label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm">Cena bazowa:</span>
                    <span className="font-bold text-primary">{distance.price} zł</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ustawiona w konfiguracji dystansu)
                    </span>
                  </div>

                  {tiers.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="mb-4 text-muted-foreground">
                        Brak progów cenowych. Wszystkie zapisy będą mieć cenę bazową{' '}
                        {distance.price} zł.
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
                      {tiers
                        .sort((a, b) => {
                          if (mode === 'date') {
                            return (
                              new Date(a.endDate || '').getTime() -
                              new Date(b.endDate || '').getTime()
                            );
                          }
                          return (a.participantLimit || 0) - (b.participantLimit || 0);
                        })
                        .map((tier, index) => {
                          const calculatedPrice = applyDiscount(
                            distance.price,
                            tier.discountType,
                            tier.discountValue,
                          );
                          const isPast =
                            mode === 'date' && tier.endDate && new Date(tier.endDate) < new Date();
                          const isOverLimit =
                            mode === 'participants' &&
                            tier.participantLimit != null &&
                            distance.registeredCount >= tier.participantLimit;

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
                    distanceVipPrices={distanceVipPrices}
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
