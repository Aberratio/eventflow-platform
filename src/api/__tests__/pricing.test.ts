import { describe, it, expect } from 'vitest';
import {
  applyDiscount,
  getCurrentPrice,
  validateDiscountCode,
  validateTeamName,
  getExistingTeamsForEvent,
} from '@/api/pricing';
import type { DiscountCode, Distance, Event, Registration } from '@/types';

describe('applyDiscount', () => {
  it('applies percent discount correctly', () => {
    expect(applyDiscount(100, 'percent', 20)).toBe(80);
    expect(applyDiscount(150, 'percent', 50)).toBe(75);
  });

  it('applies fixed discount correctly', () => {
    expect(applyDiscount(100, 'fixed', 30)).toBe(70);
  });

  it('keeps grosze for fixed amount discounts', () => {
    expect(applyDiscount(80, 'fixed', 25.5)).toBe(54.5);
  });

  it('does not go below zero for fixed discount', () => {
    expect(applyDiscount(10, 'fixed', 50)).toBe(0);
  });
});

describe('getCurrentPrice', () => {
  it('returns base price when no tiers', () => {
    const distance = { price: 100, priceTiers: [] } as unknown as Distance;
    const result = getCurrentPrice(distance);
    expect(result.price).toBe(100);
    expect(result.tierName).toBe('Cena standardowa');
  });

  it('returns tier price for date-based tiers with active tier', () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const distance = {
      price: 100,
      priceTierMode: 'date',
      priceTiers: [
        { name: 'Wczesna', endDate: futureDate, discountType: 'percent', discountValue: 20 },
      ],
    } as unknown as Distance;
    const result = getCurrentPrice(distance);
    expect(result.price).toBe(80);
    expect(result.tierName).toBe('Wczesna');
  });

  it('returns base price when all date tiers expired', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const distance = {
      price: 100,
      priceTierMode: 'date',
      priceTiers: [
        { name: 'Expired', endDate: pastDate, discountType: 'percent', discountValue: 20 },
      ],
    } as unknown as Distance;
    const result = getCurrentPrice(distance);
    expect(result.price).toBe(100);
  });

  it('handles participant-based tiers', () => {
    const distance = {
      price: 100,
      priceTierMode: 'participants',
      participantCountType: 'registered',
      registeredCount: 5,
      priceTiers: [
        { name: 'Early', participantLimit: 50, discountType: 'fixed', discountValue: 20 },
      ],
    } as unknown as Distance;
    const result = getCurrentPrice(distance);
    expect(result.price).toBe(80);
    expect(result.tierName).toBe('Early');
  });
});

describe('validateDiscountCode', () => {
  const makeEvent = (codes: Partial<DiscountCode>[]): Event =>
    ({
      discountCodes: codes,
    }) as unknown as Event;

  it('returns invalid when no discount codes exist', () => {
    const event = {} as Event;
    const result = validateDiscountCode('ABC', event);
    expect(result.valid).toBe(false);
  });

  it('returns invalid for non-existent code', () => {
    const event = makeEvent([{ code: 'XYZ', active: true }]);
    const result = validateDiscountCode('ABC', event);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Nieprawidłowy kod rabatowy');
  });

  it('returns invalid for inactive code', () => {
    const event = makeEvent([{ code: 'ABC', active: false }]);
    const result = validateDiscountCode('ABC', event);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Kod rabatowy jest nieaktywny');
  });

  it('returns valid for active code with percent discount', () => {
    const event = makeEvent([
      { code: 'SAVE20', active: true, discountType: 'percent', discountValue: 20 },
    ]);
    const result = validateDiscountCode('SAVE20', event);
    expect(result.valid).toBe(true);
    expect(result.discount).toEqual({ type: 'percent', value: 20 });
  });

  it('is case insensitive', () => {
    const event = makeEvent([
      { code: 'SAVE20', active: true, discountType: 'percent', discountValue: 20 },
    ]);
    const result = validateDiscountCode('save20', event);
    expect(result.valid).toBe(true);
  });

  it('rejects expired code', () => {
    const event = makeEvent([
      {
        code: 'OLD',
        active: true,
        discountType: 'fixed',
        discountValue: 10,
        validTo: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    const result = validateDiscountCode('OLD', event);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Kod rabatowy wygasł');
  });

  it('rejects code exceeding max uses', () => {
    const event = makeEvent([
      {
        code: 'USED',
        active: true,
        discountType: 'fixed',
        discountValue: 10,
        maxUses: 5,
        usedCount: 5,
      },
    ]);
    const result = validateDiscountCode('USED', event);
    expect(result.valid).toBe(false);
  });

  it('rejects code that is not active yet', () => {
    const event = makeEvent([
      {
        code: 'FUTURE',
        active: true,
        discountType: 'fixed',
        discountValue: 10,
        validFrom: new Date(Date.now() + 86400000).toISOString(),
      },
    ]);
    const result = validateDiscountCode('FUTURE', event);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Kod rabatowy jeszcze nie jest aktywny');
  });

  it('rejects code assigned to a different distance', () => {
    const event = makeEvent([
      {
        code: 'ONLY5K',
        active: true,
        discountType: 'fixed',
        discountValue: 10,
        distanceIds: ['d-5k'],
      },
    ]);
    const result = validateDiscountCode('ONLY5K', event, 'd-10k');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Kod rabatowy nie dotyczy wybranego dystansu');
  });

  it('accepts code assigned to selected distance', () => {
    const event = makeEvent([
      {
        code: 'ONLY5K',
        active: true,
        discountType: 'fixed',
        discountValue: 10.5,
        distanceIds: ['d-5k'],
      },
    ]);
    const result = validateDiscountCode('ONLY5K', event, 'd-5k');
    expect(result.valid).toBe(true);
    expect(result.discount).toEqual({ type: 'fixed', value: 10.5 });
  });
});

describe('validateTeamName', () => {
  it('rejects short names', () => {
    expect(validateTeamName('AB').valid).toBe(false);
  });

  it('rejects names over 50 chars', () => {
    expect(validateTeamName('A'.repeat(51)).valid).toBe(false);
  });

  it('accepts valid names', () => {
    expect(validateTeamName('Drużyna Alfa').valid).toBe(true);
  });

  it('rejects names with banned words', () => {
    expect(validateTeamName('Team kurwa').valid).toBe(false);
  });

  it('rejects names with special characters', () => {
    expect(validateTeamName('Team @#$').valid).toBe(false);
  });
});

describe('getExistingTeamsForEvent', () => {
  const registrations = [
    { eventId: 'e1', teamName: 'Alpha', status: 'confirmed' },
    { eventId: 'e1', teamName: 'Alpha', status: 'confirmed' },
    { eventId: 'e1', teamName: 'Beta', status: 'confirmed' },
    { eventId: 'e1', teamName: 'Cancelled', status: 'cancelled' },
    { eventId: 'e2', teamName: 'Other', status: 'confirmed' },
  ] as Registration[];

  it('groups teams by name with member count', () => {
    const teams = getExistingTeamsForEvent(registrations, 'e1');
    expect(teams).toHaveLength(2);
    expect(teams[0]).toEqual({ name: 'Alpha', memberCount: 2 });
    expect(teams[1]).toEqual({ name: 'Beta', memberCount: 1 });
  });

  it('excludes cancelled registrations', () => {
    const teams = getExistingTeamsForEvent(registrations, 'e1');
    expect(teams.find((t) => t.name === 'Cancelled')).toBeUndefined();
  });

  it('counts relay members stored on captain registration', () => {
    const teams = getExistingTeamsForEvent(
      [
        {
          eventId: 'e1',
          distanceId: 'd1',
          teamName: 'Relay',
          status: 'confirmed',
          relayMembers: [
            { id: 'm1', name: 'Anna Nowak' },
            { id: 'm2', name: 'Jan Kowalski' },
          ],
        },
      ] as Registration[],
      'e1',
      'd1',
    );

    expect(teams).toEqual([{ name: 'Relay', memberCount: 3 }]);
  });

  it('returns empty for unknown event', () => {
    expect(getExistingTeamsForEvent(registrations, 'e999')).toEqual([]);
  });
});
