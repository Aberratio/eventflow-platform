import { applyDiscount } from '@/api';
import { Badge } from '@/components/ui/badge';
import type { ParticipantCountType, PriceTier, PriceTierMode } from '@/types';
import { Calendar, Users } from 'lucide-react';

interface PriceTierPreviewProps {
  basePrice: number;
  tiers: PriceTier[];
  mode: PriceTierMode;
  participantCountType?: ParticipantCountType;
  currentCount?: number;
  className?: string;
}

const formatPrice = (price: number) => `${price.toFixed(2).replace(/\.00$/, '')} PLN`;

const getTierPrice = (basePrice: number, tier: PriceTier) =>
  tier.price != null
    ? Number(tier.price)
    : applyDiscount(basePrice, tier.discountType, tier.discountValue);

const getSortedTiers = (tiers: PriceTier[], mode: PriceTierMode) =>
  [...tiers].sort((a, b) =>
    mode === 'date'
      ? String(a.endDate || '').localeCompare(String(b.endDate || ''))
      : Number(a.participantLimit || 0) - Number(b.participantLimit || 0),
  );

export const PriceTierPreview = ({
  basePrice,
  tiers,
  mode,
  participantCountType = 'registered',
  currentCount = 0,
  className,
}: PriceTierPreviewProps) => {
  const sortedTiers = getSortedTiers(tiers, mode);

  if (sortedTiers.length === 0) {
    return (
      <div className={className}>
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Brak progow: obowiazuje cena bazowa {formatPrice(basePrice)}.
        </div>
      </div>
    );
  }

  if (mode === 'date') {
    return (
      <div className={className}>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Timeline cen wedlug dat
        </div>
        <div className="grid gap-2 md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {sortedTiers.map((tier, index) => {
            const price = getTierPrice(basePrice, tier);
            return (
              <div key={tier.id} className="relative rounded-md border bg-background p-3">
                <div className="absolute left-3 right-3 top-0 h-1 rounded-b bg-primary/70" />
                <div className="text-xs text-muted-foreground">
                  {index === 0 ? 'do' : 'nastepnie do'} {tier.endDate || 'brak daty'}
                </div>
                <div className="mt-1 text-sm font-semibold">{formatPrice(price)}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {tier.name || `Prog ${index + 1}`}
                </div>
              </div>
            );
          })}
          <div className="rounded-md border border-dashed bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">po ostatnim progu</div>
            <div className="mt-1 text-sm font-semibold">{formatPrice(basePrice)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Cena bazowa</div>
          </div>
        </div>
      </div>
    );
  }

  let previousLimit = 0;
  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Przedzialy cen wedlug liczby uczestnikow
        </span>
        <Badge variant="outline" className="text-[11px]">
          {participantCountType === 'paid' ? 'oplaceni' : 'zapisani'}: {currentCount}
        </Badge>
      </div>
      <div className="space-y-2">
        {sortedTiers.map((tier, index) => {
          const limit = Number(tier.participantLimit || 0);
          const from = previousLimit + 1;
          previousLimit = limit;
          const isCurrent = currentCount < limit && currentCount >= from - 1;
          const price = getTierPrice(basePrice, tier);

          return (
            <div
              key={tier.id}
              className={`grid gap-2 rounded-md border p-3 sm:grid-cols-[140px_1fr_auto] ${
                isCurrent ? 'border-primary bg-primary/5' : 'bg-background'
              }`}
            >
              <div className="text-sm font-medium">
                {from}-{limit}
              </div>
              <div className="min-w-0">
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.max(16, 100 - index * 16)}%` }}
                  />
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {tier.name || `Prog ${index + 1}`}
                </div>
              </div>
              <div className="text-sm font-semibold">{formatPrice(price)}</div>
            </div>
          );
        })}
        <div className="grid gap-2 rounded-md border border-dashed bg-muted/20 p-3 sm:grid-cols-[140px_1fr_auto]">
          <div className="text-sm font-medium">od {previousLimit + 1}</div>
          <div className="text-xs text-muted-foreground">Cena bazowa po wykorzystaniu progow</div>
          <div className="text-sm font-semibold">{formatPrice(basePrice)}</div>
        </div>
      </div>
    </div>
  );
};
