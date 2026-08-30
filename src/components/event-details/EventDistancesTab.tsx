import { getCurrentPrice, applyDiscount } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, Distance } from '@/types';
import { Download, Info, Tags, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DistanceRouteDialog, hasRouteArtifacts } from '@/components/DistanceRouteDialog';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

interface EventDistancesTabProps {
  event: Event;
}

/** Format distance length for display: always use locale number formatting with spaces as thousands separators */
const formatLength = (length: number, unit: 'km' | 'm'): string => {
  const formatted = length.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
  return `${formatted} ${unit}`;
};

const formatRelayTeamSize = (distance: Distance): string => {
  const min = distance.relayMinTeamSize;
  const max = distance.relayMaxTeamSize;
  if (min && max) return `${min}-${max} os.`;
  if (min) return `od ${min} os.`;
  if (max) return `do ${max} os.`;
  return 'sztafeta';
};

/** Expand short gender codes to readable Polish labels */
const expandCategoryName = (raw: string): string => {
  return raw
    .replace(/\bM\b/g, 'Mężczyźni')
    .replace(/\bK\b/g, 'Kobiety')
    .replace(/\bOpen\b/gi, 'Open');
};

const DistanceCard = ({
  distance,
  singleDistance,
}: {
  distance: Distance;
  singleDistance: boolean;
}) => {
  const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const { price: currentPrice, tierName } = getCurrentPrice(distance);
  const ageCategories = distance.ageCategories ?? [];
  const specialCategories = distance.specialCategories ?? [];
  const structuredCategoryNames = new Set([
    ...ageCategories.map((category) => category.name),
    ...specialCategories.map((category) => category.name),
  ]);
  const generalCategories = distance.categories.filter(
    (category) => !structuredCategoryNames.has(category),
  );
  const fallbackCategories =
    ageCategories.length === 0 && specialCategories.length === 0
      ? distance.categories
      : generalCategories;
  const categoryCount = ageCategories.length + specialCategories.length + fallbackCategories.length;
  const hasStructuredCategories = ageCategories.length > 0 || specialCategories.length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-lg font-semibold">{distance.name}</h4>
              {distance.startType === 'relay' && (
                <Badge variant="outline" className="mt-1">
                  Sztafeta: {formatRelayTeamSize(distance)}
                </Badge>
              )}
              {distance.startType === 'relay' && distance.relayTeamCompletionDeadline && (
                <p className="mt-1 text-xs text-foreground/60">
                  Sklad druzyny trzeba uzupelnic do {distance.relayTeamCompletionDeadline}
                </p>
              )}
              {distance.length != null && (
                <div className="text-2xl font-bold text-primary">
                  {formatLength(distance.length, distance.unit)}
                </div>
              )}
            </div>

            {distance.infoHtml && (
              <RichTextDisplay html={distance.infoHtml} className="text-sm text-foreground/70" />
            )}

            {categoryCount > 0 && (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Tags className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Kategorie</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {categoryCount}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {ageCategories.length > 0 && (
                    <CategorySection label="Podstawowe" count={ageCategories.length}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ageCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="rounded-md border border-border/60 bg-background/60 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{cat.name}</span>
                              {cat.gender && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                  {cat.gender === 'K' ? 'Kobiety' : 'Mężczyźni'}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-foreground/60">
                              Roczniki {cat.birthYearFrom}–{cat.birthYearTo}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CategorySection>
                  )}

                  {specialCategories.length > 0 && (
                    <CategorySection label="Specjalne" count={specialCategories.length}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {specialCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="rounded-md border border-warning/20 bg-warning/[0.04] px-3 py-2"
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <UsersRound className="h-3.5 w-3.5 text-warning/80" />
                              <span>{cat.name}</span>
                            </div>
                            {cat.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-foreground/60">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CategorySection>
                  )}

                  {fallbackCategories.length > 0 && (
                    <CategorySection
                      label={
                        ageCategories.length || specialCategories.length ? 'Pozostałe' : 'Dostępne'
                      }
                      count={fallbackCategories.length}
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {fallbackCategories.map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="border-border/70 bg-background/60 text-xs font-normal text-foreground"
                          >
                            {expandCategoryName(category)}
                          </Badge>
                        ))}
                      </div>
                    </CategorySection>
                  )}
                </div>

                {hasStructuredCategories && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/15 bg-primary/[0.06] px-3 py-2 text-xs text-foreground/70">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                    Kategoria zostanie przypisana automatycznie na podstawie danych Twojego profilu
                    (rok urodzenia i płeć).
                  </div>
                )}
              </div>
            )}

            {distance.priceTiers && distance.priceTiers.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Progi cenowe:</p>
                <div className="space-y-1">
                  {distance.priceTiers.map((tier) => {
                    const tierPrice =
                      tier.price ??
                      applyDiscount(distance.price, tier.discountType, tier.discountValue);
                    const mode = distance.priceTierMode || 'date';
                    const isPastTier =
                      mode === 'date' && tier.endDate ? new Date(tier.endDate) < new Date() : false;
                    return (
                      <div
                        key={tier.id}
                        className={`flex justify-between text-xs ${isPastTier ? 'text-foreground/40 line-through' : 'text-foreground/65'}`}
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
                      <div key={vip.id} className="flex justify-between text-xs text-foreground/65">
                        <span>{vip.name}</span>
                        <span className="font-medium text-primary">{vipPrice} zł</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {distance.officePrice != null && (
              <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                <span className="text-foreground/65">Cena w biurze zawodów: </span>
                <span className="font-semibold">{distance.officePrice} zł</span>
              </div>
            )}
          </div>

          <div className="min-w-[120px] text-right">
            <div className="text-2xl font-bold">{currentPrice} zł</div>
            {!singleDistance && (
              <p className="mt-0.5 text-xs text-foreground/55">cena za ten dystans</p>
            )}
            <Badge variant="secondary" className="mt-1 text-xs">
              {tierName}
            </Badge>
            <div className="mt-1 text-sm text-foreground/65">
              {distance.registeredCount.toLocaleString()}
              {distance.limit && ` / ${distance.limit.toLocaleString()}`} zapisanych
            </div>
            {spotsLeft !== null &&
              distance.limit != null &&
              spotsLeft <= distance.limit * 0.2 &&
              spotsLeft > 0 && (
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

const CategorySection = ({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) => (
  <div>
    <div className="mb-2 flex items-center gap-2">
      <span className="text-xs font-medium uppercase text-foreground/55">{label}</span>
      <span className="h-px flex-1 bg-border/60" />
      <span className="text-[11px] text-foreground/55">{count}</span>
    </div>
    {children}
  </div>
);

export const EventDistancesTab = ({ event }: EventDistancesTabProps) => (
  <div className="space-y-4">
    {event.distances.map((distance) => (
      <DistanceCard
        key={distance.id}
        distance={distance}
        singleDistance={event.distances.length === 1}
      />
    ))}
  </div>
);
