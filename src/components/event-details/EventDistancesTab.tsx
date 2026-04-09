import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, Distance } from '@/types';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { getCurrentPrice, applyDiscount } from '@/api/mock/helpers';
import { DistanceRouteDialog, hasRouteArtifacts } from '@/components/DistanceRouteDialog';

interface EventDistancesTabProps {
  event: Event;
}

const DistanceCard = ({ distance }: { distance: Distance }) => {
  const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const { price: currentPrice, tierName } = getCurrentPrice(distance);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-lg font-semibold">{distance.name}</h4>
              <div className="text-2xl font-bold text-primary">
                {distance.length} {distance.unit}
              </div>
            </div>

            {distance.ageCategories && distance.ageCategories.length > 0 ? (
              <div>
                <p className="mb-1 text-sm font-medium">Kategorie wiekowe:</p>
                <div className="flex flex-wrap gap-1">
                  {distance.ageCategories.map((cat) => (
                    <Badge key={cat.id} variant="outline" className="text-xs">
                      {cat.name} ({cat.gender}) {cat.birthYearFrom}–{cat.birthYearTo}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Kategorie: {distance.categories.join(', ')}
              </div>
            )}

            {distance.priceTiers && distance.priceTiers.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Progi cenowe:</p>
                <div className="space-y-1">
                  {distance.priceTiers.map((tier) => {
                    const tierPrice = applyDiscount(
                      distance.price,
                      tier.discountType,
                      tier.discountValue,
                    );
                    const mode = distance.priceTierMode || 'date';
                    const isPastTier =
                      mode === 'date' && tier.endDate ? new Date(tier.endDate) < new Date() : false;
                    return (
                      <div
                        key={tier.id}
                        className={`flex justify-between text-xs ${isPastTier ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
                      >
                        <span>{tier.name}</span>
                        <span>
                          {tierPrice} zł
                          {mode === 'date' &&
                            tier.endDate &&
                            ` do ${format(new Date(tier.endDate), 'd MMM yyyy', { locale: pl })}`}
                          {mode === 'participants' &&
                            tier.participantLimit != null &&
                            ` (do ${tier.participantLimit} os.)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {distance.vipPrices && distance.vipPrices.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Ceny specjalne:</p>
                <div className="space-y-1">
                  {distance.vipPrices.map((vip) => {
                    const vipPrice = applyDiscount(
                      distance.price,
                      vip.discountType,
                      vip.discountValue,
                    );
                    return (
                      <div
                        key={vip.id}
                        className="flex justify-between text-xs text-muted-foreground"
                      >
                        <span>{vip.name}</span>
                        <span className="font-medium text-primary">{vipPrice} zł</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-[120px] text-right">
            <div className="text-2xl font-bold">{currentPrice} zł</div>
            <Badge variant="secondary" className="text-xs">
              {tierName}
            </Badge>
            <div className="mt-1 text-sm text-muted-foreground">
              {distance.registeredCount.toLocaleString()}
              {distance.limit && ` / ${distance.limit.toLocaleString()}`} zapisanych
            </div>
            {spotsLeft !== null && spotsLeft <= 100 && spotsLeft > 0 && (
              <Badge variant="destructive" className="mt-1">
                Ostatnie {spotsLeft} miejsc!
              </Badge>
            )}
            {isFull && (
              <Badge variant="secondary" className="mt-1">
                Brak miejsc
              </Badge>
            )}
          </div>
        </div>

        {hasRouteArtifacts(distance) && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap items-center gap-3">
              {distance.routeMapUrl && (
                <img
                  src={distance.routeMapUrl}
                  alt={`Mapa ${distance.name}`}
                  className="h-12 w-20 rounded border object-cover"
                />
              )}
              {distance.routeElevationProfile && (
                <img
                  src={distance.routeElevationProfile}
                  alt={`Profil ${distance.name}`}
                  className="h-12 w-20 rounded border object-cover"
                />
              )}
              {distance.routeGpxUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={distance.routeGpxUrl} download className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    GPX
                  </a>
                </Button>
              )}
              <DistanceRouteDialog distance={distance} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const EventDistancesTab = ({ event }: EventDistancesTabProps) => (
  <div className="space-y-4">
    {event.distances.map((distance) => (
      <DistanceCard key={distance.id} distance={distance} />
    ))}
  </div>
);
