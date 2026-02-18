import type { PriceTier, Event, Registration } from '@/types';

/** Get the current active price tier for a distance. */
export const getCurrentPrice = (
  distance: { price: number; priceTiers?: PriceTier[] },
): { price: number; tierName: string; nextTier?: PriceTier } => {
  if (!distance.priceTiers || distance.priceTiers.length === 0) {
    return { price: distance.price, tierName: 'Cena standardowa' };
  }

  const now = new Date();
  const sortedTiers = [...distance.priceTiers].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  );

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    if (new Date(tier.endDate) >= now) {
      return { price: tier.price, tierName: tier.name, nextTier: sortedTiers[i + 1] };
    }
  }

  const lastTier = sortedTiers[sortedTiers.length - 1];
  return { price: lastTier?.price || distance.price, tierName: lastTier?.name || 'Cena standardowa' };
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
        : `Zniżka ${discountCode.discountValue} zł`,
  };
};

/** Validate a team name string. */
export const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();

  if (trimmed.length < 3) return { valid: false, error: 'Nazwa musi mieć minimum 3 znaki' };
  if (trimmed.length > 50) return { valid: false, error: 'Nazwa może mieć maksymalnie 50 znaków' };

  const validPattern = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s\-'.]+$/;
  if (!validPattern.test(trimmed)) return { valid: false, error: 'Nazwa zawiera niedozwolone znaki' };

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
): Array<{ name: string; memberCount: number }> => {
  const teamsMap = new Map<string, number>();

  registrations
    .filter((r) => r.eventId === eventId && r.teamName && r.status !== 'cancelled')
    .forEach((r) => {
      const count = teamsMap.get(r.teamName!) || 0;
      teamsMap.set(r.teamName!, count + 1);
    });

  return Array.from(teamsMap.entries())
    .map(([name, memberCount]) => ({ name, memberCount }))
    .sort((a, b) => b.memberCount - a.memberCount);
};
