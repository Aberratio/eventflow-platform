import type { PriceTierDiscountType, Event, Registration, Distance } from '@/types';
import { roundToCents, formatDiscountBadge } from '@/lib/discountValue';

/** Calculate price after applying a discount to a base price. */
export const applyDiscount = (
  basePrice: number,
  discountType: PriceTierDiscountType,
  discountValue: number,
): number => {
  if (discountType === 'percent') {
    return roundToCents(basePrice * (1 - Number(discountValue) / 100));
  }
  return roundToCents(Math.max(0, basePrice - Number(discountValue)));
};

/** Get the current active price tier for a distance. */
export const getCurrentPrice = (
  distance: Distance,
  context?: { paidCount?: number },
): {
  price: number;
  tierName: string;
  nextTier?: { name: string; price: number; threshold: string };
  discount?: { type: PriceTierDiscountType; value: number };
} => {
  if (!distance.priceTiers || distance.priceTiers.length === 0) {
    return { price: distance.price, tierName: 'Cena standardowa' };
  }

  const basePrice = distance.price;
  const mode = distance.priceTierMode || 'date';

  if (mode === 'participants') {
    const countType = distance.participantCountType || 'registered';
    const count =
      countType === 'paid'
        ? (context?.paidCount ?? distance.paidCount ?? 0)
        : distance.registeredCount;

    const sortedTiers = [...distance.priceTiers]
      .filter((t) => t.participantLimit != null)
      .sort((a, b) => (a.participantLimit ?? 0) - (b.participantLimit ?? 0));

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      if (count < (tier.participantLimit ?? 0)) {
        const price =
          tier.price != null
            ? roundToCents(Number(tier.price))
            : applyDiscount(basePrice, tier.discountType, tier.discountValue);
        const nextTier = sortedTiers[i + 1];
        return {
          price,
          tierName: tier.name,
          discount: { type: tier.discountType, value: tier.discountValue },
          nextTier: nextTier
            ? {
                name: nextTier.name,
                price:
                  nextTier.price != null
                    ? roundToCents(Number(nextTier.price))
                    : applyDiscount(basePrice, nextTier.discountType, nextTier.discountValue),
                threshold: `od ${tier.participantLimit} uczestnika`,
              }
            : undefined,
        };
      }
    }

    // Past all tiers — base price
    return { price: basePrice, tierName: 'Cena standardowa' };
  }

  // mode === 'date'
  const now = new Date();
  const sortedTiers = [...distance.priceTiers]
    .filter((t) => t.endDate != null)
    .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    if (new Date(tier.endDate!) >= now) {
      const price =
        tier.price != null
          ? roundToCents(Number(tier.price))
          : applyDiscount(basePrice, tier.discountType, tier.discountValue);
      const nextTier = sortedTiers[i + 1];
      return {
        price,
        tierName: tier.name,
        discount: { type: tier.discountType, value: tier.discountValue },
        nextTier: nextTier
          ? {
              name: nextTier.name,
              price:
                nextTier.price != null
                  ? roundToCents(Number(nextTier.price))
                  : applyDiscount(basePrice, nextTier.discountType, nextTier.discountValue),
              threshold: `od ${tier.endDate}`,
            }
          : undefined,
      };
    }
  }

  // All tiers expired — base price
  return { price: basePrice, tierName: 'Cena standardowa' };
};

/** Validate a discount code for an event. */
export const validateDiscountCode = (
  code: string,
  event: Event,
  distanceId?: string,
): { valid: boolean; discount?: { type: 'percent' | 'fixed'; value: number }; message: string } => {
  if (!event.discountCodes) {
    return { valid: false, message: 'Kod rabatowy nie istnieje' };
  }

  const discountCode = event.discountCodes.find(
    (dc) => dc.code.toUpperCase() === code.toUpperCase(),
  );

  if (!discountCode) return { valid: false, message: 'Nieprawidłowy kod rabatowy' };
  if (!discountCode.active) return { valid: false, message: 'Kod rabatowy jest nieaktywny' };

  const now = new Date();
  if (discountCode.validFrom && new Date(discountCode.validFrom) > now) {
    return { valid: false, message: 'Kod rabatowy jeszcze nie jest aktywny' };
  }
  if (discountCode.validTo && new Date(discountCode.validTo) < now) {
    return { valid: false, message: 'Kod rabatowy wygasł' };
  }
  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    return { valid: false, message: 'Kod rabatowy został wykorzystany maksymalną liczbę razy' };
  }
  if (distanceId && discountCode.distanceIds && discountCode.distanceIds.length > 0) {
    if (!discountCode.distanceIds.includes(distanceId)) {
      return { valid: false, message: 'Kod rabatowy nie dotyczy wybranego dystansu' };
    }
  }

  return {
    valid: true,
    discount: { type: discountCode.discountType, value: discountCode.discountValue },
    message:
      discountCode.discountType === 'percent'
        ? `Zniżka ${discountCode.discountValue}%`
        : `Zniżka ${formatDiscountBadge(discountCode.discountValue, discountCode.discountType)}`,
  };
};

/** Validate a team name string. */
export const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();

  if (trimmed.length < 3) return { valid: false, error: 'Nazwa musi mieć minimum 3 znaki' };
  if (trimmed.length > 50) return { valid: false, error: 'Nazwa może mieć maksymalnie 50 znaków' };

  const validPattern = /^[\p{L}0-9\s\-'.]+$/u;
  if (!validPattern.test(trimmed))
    return { valid: false, error: 'Nazwa zawiera niedozwolone znaki' };

  const bannedWords = ['dupa', 'chuj', 'kurwa', 'pierdol'];
  const lowerName = trimmed.toLowerCase();
  if (bannedWords.some((w) => lowerName.includes(w))) {
    return { valid: false, error: 'Nazwa zawiera niedozwolone słowa' };
  }

  return { valid: true };
};

/** Get existing teams for an event from registrations. */
export const getExistingTeamsForEvent = (
  registrations: Registration[],
  eventId: string,
  distanceId?: string,
): Array<{ name: string; memberCount: number }> => {
  const teamsMap = new Map<string, number>();

  registrations
    .filter(
      (r) =>
        r.eventId === eventId &&
        (!distanceId || r.distanceId === distanceId) &&
        r.teamName &&
        r.status !== 'cancelled',
    )
    .forEach((r) => {
      const count = teamsMap.get(r.teamName!) || 0;
      teamsMap.set(r.teamName!, count + 1 + (r.relayMembers?.length ?? 0));
    });

  return Array.from(teamsMap.entries())
    .map(([name, memberCount]) => ({ name, memberCount }))
    .sort((a, b) => b.memberCount - a.memberCount);
};
