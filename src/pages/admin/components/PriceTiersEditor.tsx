import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, DollarSign, Calendar } from 'lucide-react';
import { Distance, PriceTier } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface PriceTiersEditorProps {
  distances: Distance[];
  onChange: (distances: Distance[]) => void;
}

export const PriceTiersEditor = ({ distances, onChange }: PriceTiersEditorProps) => {
  const [expandedDistance, setExpandedDistance] = useState<string | null>(
    distances.length > 0 ? distances[0].id : null
  );

  const updateDistanceTiers = (distanceId: string, tiers: PriceTier[]) => {
    const updated = distances.map(d => 
      d.id === distanceId ? { ...d, priceTiers: tiers } : d
    );
    onChange(updated);
  };

  const addTier = (distanceId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance) return;

    const existingTiers = distance.priceTiers || [];
    const newTier: PriceTier = {
      id: `pt-${Date.now()}`,
      name: 'Nowy próg',
      price: distance.price,
      endDate: new Date().toISOString().split('T')[0],
      description: '',
    };

    updateDistanceTiers(distanceId, [...existingTiers, newTier]);
  };

  const updateTier = (distanceId: string, tierId: string, updates: Partial<PriceTier>) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance || !distance.priceTiers) return;

    const updatedTiers = distance.priceTiers.map(t =>
      t.id === tierId ? { ...t, ...updates } : t
    );
    updateDistanceTiers(distanceId, updatedTiers);
  };

  const removeTier = (distanceId: string, tierId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance || !distance.priceTiers) return;

    const updatedTiers = distance.priceTiers.filter(t => t.id !== tierId);
    updateDistanceTiers(distanceId, updatedTiers);
  };

  const createDefaultTiers = (distanceId: string) => {
    const distance = distances.find(d => d.id === distanceId);
    if (!distance) return;

    const basePrice = distance.price;
    const now = new Date();
    const earlyBirdEnd = new Date(now);
    earlyBirdEnd.setMonth(earlyBirdEnd.getMonth() + 1);
    const regularEnd = new Date(now);
    regularEnd.setMonth(regularEnd.getMonth() + 2);
    const lastMinuteEnd = new Date(now);
    lastMinuteEnd.setMonth(lastMinuteEnd.getMonth() + 3);

    const defaultTiers: PriceTier[] = [
      {
        id: `pt-${Date.now()}-1`,
        name: 'Early Bird',
        price: Math.round(basePrice * 0.7),
        endDate: earlyBirdEnd.toISOString().split('T')[0],
        description: 'Zaoszczędź 30%! Zapisz się wcześniej.',
      },
      {
        id: `pt-${Date.now()}-2`,
        name: 'Cena regularna',
        price: basePrice,
        endDate: regularEnd.toISOString().split('T')[0],
        description: 'Standardowa cena startowa.',
      },
      {
        id: `pt-${Date.now()}-3`,
        name: 'Last Minute',
        price: Math.round(basePrice * 1.2),
        endDate: lastMinuteEnd.toISOString().split('T')[0],
        description: 'Ostatnia szansa na zapis!',
      },
    ];

    updateDistanceTiers(distanceId, defaultTiers);
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
          Skonfiguruj progi cenowe dla każdego dystansu (np. Early Bird, Last Minute)
        </p>

        {distances.map(distance => {
          const isExpanded = expandedDistance === distance.id;
          const tiers = distance.priceTiers || [];

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
                </div>
                <span className="text-sm text-muted-foreground">
                  Cena bazowa: {distance.price} zł
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 space-y-4">
                  <Separator />

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
                        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                        .map((tier, index) => {
                          const isPast = new Date(tier.endDate) < new Date();
                          
                          return (
                            <div
                              key={tier.id}
                              className={`p-4 border rounded-lg space-y-4 ${isPast ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Próg {index + 1}</span>
                                {isPast && <Badge variant="secondary">Zakończony</Badge>}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTier(distance.id, tier.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Nazwa progu</Label>
                                  <Input
                                    value={tier.name}
                                    onChange={(e) => updateTier(distance.id, tier.id, { name: e.target.value })}
                                    placeholder="np. Early Bird"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Cena (PLN)</Label>
                                  <Input
                                    type="number"
                                    value={tier.price}
                                    onChange={(e) => updateTier(distance.id, tier.id, { price: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Data końcowa</Label>
                                  <Input
                                    type="date"
                                    value={tier.endDate}
                                    onChange={(e) => updateTier(distance.id, tier.id, { endDate: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Opis (opcjonalnie)</Label>
                                <Input
                                  value={tier.description || ''}
                                  onChange={(e) => updateTier(distance.id, tier.id, { description: e.target.value })}
                                  placeholder="np. Zaoszczędź 30%! Zapisz się wcześniej."
                                />
                              </div>
                            </div>
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

export default PriceTiersEditor;
