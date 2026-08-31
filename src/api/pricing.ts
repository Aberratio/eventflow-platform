import type {
  PriceTierDiscountType,
  Event,
  Registration,
  Distance,
  PriceTier,
  DistancePricingVariant,
  InsuranceVariant,
} from '@/types';
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

/**
 * A Próg (price tier) expires on whichever of its two independent, optional
 * limits is hit first ("co nastąpi wcześniej") — mirrors
 * RegistrationRepository::currentDistancePrice on the server (E0.3).
 */
export const isTierExpired = (tier: PriceTier, registeredCount: number): boolean => {
  const expiredByDate = !!tier.endDate && new Date(tier.endDate) < new Date();
  const expiredByCount =
    tier.participantLimit != null && tier.participantLimit > 0
      ? registeredCount >= tier.participantLimit
      : false;
  return expiredByDate || expiredByCount;
};

/** Human-readable description of what makes a tier expire, for preview/threshold UI. */
export const describeTierThreshold = (tier: PriceTier): string | undefined => {
  const parts: string[] = [];
  if (tier.endDate) parts.push(`do ${tier.endDate}`);
  if (tier.participantLimit != null) parts.push(`do ${tier.participantLimit} uczestnika`);
  return parts.length > 0 ? parts.join(' lub ') : undefined;
};

const priceForTier = (basePrice: number, tier: PriceTier): number =>
  tier.price != null
    ? roundToCents(Number(tier.price))
    : applyDiscount(basePrice, tier.discountType, tier.discountValue);

/**
 * Get the current active price tier for a distance. Tiers are evaluated in
 * their configured order (not re-sorted) — the first one that is not
 * expired by either limit wins, matching the server's
 * RegistrationRepository::currentDistancePrice (E0.3).
 */
export const getCurrentPrice = (
  distance: Distance,
): {
  price: number;
  tierName: string;
  nextTier?: { name: string; price: number; threshold: string };
  discount?: { type: PriceTierDiscountType; value: number };
} => {
  const tiers = distance.priceTiers ?? [];
  if (tiers.length === 0) {
    return { price: distance.price, tierName: 'Cena standardowa' };
  }

  const basePrice = distance.price;
  const registeredCount = distance.registeredCount;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (!isTierExpired(tier, registeredCount)) {
      const nextTier = tiers[i + 1];
      return {
        price: priceForTier(basePrice, tier),
        tierName: tier.name,
        discount: { type: tier.discountType, value: tier.discountValue },
        nextTier: nextTier
          ? {
              name: nextTier.name,
              price: priceForTier(basePrice, nextTier),
              threshold: describeTierThreshold(tier) ?? '',
            }
          : undefined,
      };
    }
  }

  // All tiers expired — base price
  return { price: basePrice, tierName: 'Cena standardowa' };
};

/**
 * PREVIEW ONLY — non-authoritative. Resolve the current price of a Wariant
 * opłaty (steps 1-2 of the E1.2 "Rozliczenie" algorithm): the Wariant is a
 * full price list carrying its own base price and its own tier list — not a
 * discount off `distance.price`. Tiers are evaluated in configured order,
 * first non-expired one wins (`isTierExpired`), matching the server's
 * eventual authoritative computation. The server always recomputes and
 * freezes the real "opłata startowa" on the Zapis; this only drives the
 * client-side price preview shown before submit.
 */
export const getVariantPrice = (
  variant: DistancePricingVariant,
  registeredCount: number,
): {
  price: number;
  tierName: string;
  nextTier?: { name: string; price: number; threshold: string };
} => {
  const tiers = variant.priceTiers ?? [];
  const basePrice = variant.price;
  if (tiers.length === 0) {
    return { price: roundToCents(basePrice), tierName: 'Cena standardowa' };
  }

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (!isTierExpired(tier, registeredCount)) {
      const nextTier = tiers[i + 1];
      return {
        price: priceForTier(basePrice, tier),
        tierName: tier.name,
        nextTier: nextTier
          ? {
              name: nextTier.name,
              price: priceForTier(basePrice, nextTier),
              threshold: describeTierThreshold(tier) ?? '',
            }
          : undefined,
      };
    }
  }

  return { price: roundToCents(basePrice), tierName: 'Cena standardowa' };
};

/**
 * Age as of a given reference date (defaults to today), counting whole years
 * elapsed since `birthDate`. Used for the NNW premium preview, which per
 * E1.2 resolution #9 must use the age AS OF THE EVENT DATE, not today and
 * not the registration date.
 */
export const calculateAge = (birthDate: string, asOfDate: string | Date = new Date()): number => {
  const ref = typeof asOfDate === 'string' ? new Date(asOfDate) : asOfDate;
  const birth = new Date(birthDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    ref.getMonth() > birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

/**
 * PREVIEW ONLY — non-authoritative. NNW premium for step 6 of the E1.2
 * algorithm: baseFee + max(0, age-18) * ageMultiplier, age computed as of
 * the EVENT date. Returns 0 when the competitor's age at the event exceeds
 * the variant's maxAge (insurance unavailable). The server recomputes and
 * freezes the real amount.
 */
export const calculateInsurancePreview = (
  variant: InsuranceVariant,
  birthDate: string,
  eventDate: string,
): number => {
  const age = calculateAge(birthDate, eventDate);
  if (age > variant.maxAge) return 0;
  return roundToCents(variant.baseFee + Math.max(0, age - 18) * variant.ageMultiplier);
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
      teamsMap.set(r.teamName!, count + 1);
    });

  return Array.from(teamsMap.entries())
    .map(([name, memberCount]) => ({ name, memberCount }))
    .sort((a, b) => b.memberCount - a.memberCount);
};
