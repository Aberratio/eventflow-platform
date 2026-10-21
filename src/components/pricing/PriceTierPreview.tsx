import { applyDiscount, isTierExpired } from '@/api';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import type { PriceTier } from '@/types';
import { Calendar, Users } from 'lucide-react';

interface PriceTierPreviewProps {
  basePrice: number;
  tiers: PriceTier[];
  currentCount?: number;
  className?: string;
}

const getTierPrice = (basePrice: number, tier: PriceTier) =>
  tier.price != null
    ? Number(tier.price)
    : applyDiscount(basePrice, tier.discountType, tier.discountValue);

/**
 * Shows the configured tiers in their evaluation order — the same order the
 * server walks in RegistrationRepository::currentDistancePrice — rather than
 * re-sorting by a single field, since a tier can carry both an end date and
 * a participant limit at once.
 */
export const PriceTierPreview = ({
  basePrice,
  tiers,
  currentCount = 0,
  className,
}: PriceTierPreviewProps) => {
  if (tiers.length === 0) {
    return (
      <div className={className}>
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Brak progów: obowiązuje cena bazowa {formatMoney(basePrice)}.
        </div>
      </div>
    );
  }

  let activeFound = false;

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Progi cenowe — wygasa to, co nastąpi wcześniej
        </span>
        <Badge variant="outline" className="text-[11px]">
          <Users className="mr-1 h-3 w-3" />
          zapisani: {currentCount}
        </Badge>
      </div>
      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const expired = isTierExpired(tier, currentCount);
          const isActive = !expired && !activeFound;
          if (isActive) activeFound = true;
          const price = getTierPrice(basePrice, tier);

          return (
            <div
              key={tier.id}
              className={`grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto] ${
                isActive ? 'border-primary bg-primary/5' : expired ? 'opacity-50' : 'bg-background'
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {tier.name || `Próg ${index + 1}`}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {tier.endDate && <span>do {tier.endDate}</span>}
                  {tier.participantLimit != null && (
                    <span>do {tier.participantLimit} uczestnika</span>
                  )}
                  {expired && <span className="text-destructive/80">wygasł</span>}
                </div>
              </div>
              <div className="text-sm font-semibold">{formatMoney(price)}</div>
            </div>
          );
        })}
        <div className="grid gap-2 rounded-md border border-dashed bg-muted/20 p-3 sm:grid-cols-[1fr_auto]">
          <div className="text-xs text-muted-foreground">Po ostatnim (nie)wygasłym progu</div>
          <div className="text-sm font-semibold">{formatMoney(basePrice)}</div>
        </div>
      </div>
    </div>
  );
};
