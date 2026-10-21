import { describe, expect, it } from 'vitest';
import type { DistanceChangeQuote, RegistrationChange } from '@/types';
import { canChangeDistance, describeBalance } from '../distanceChange';
import { describeRegistrationChange } from '../registrationChanges';

const quote = (over: Partial<DistanceChangeQuote> = {}): DistanceChangeQuote => ({
  registrationId: 'r1',
  from: { distanceId: 'd1', distanceName: '10 km' },
  to: { distanceId: 'd2', distanceName: '5 km' },
  category: 'Open',
  currentTotal: 80,
  newTotal: 50,
  paidAmount: 80,
  balance: -30,
  balanceDueMinor: 0,
  refundDueMinor: 0,
  settlementItems: [],
  discountDropped: false,
  bibCleared: false,
  blockedReason: null,
  blockedMessage: null,
  ...over,
});

describe('canChangeDistance', () => {
  it('offers live individual registrations only', () => {
    expect(canChangeDistance({ status: 'pending' })).toBe(true);
    expect(canChangeDistance({ status: 'confirmed' })).toBe(true);
    expect(canChangeDistance({ status: 'confirmed', teamId: 't1' })).toBe(false);
    expect(canChangeDistance({ status: 'cancelled' })).toBe(false);
    expect(canChangeDistance({ status: 'expired' })).toBe(false);
  });
});

describe('describeBalance', () => {
  it('says nothing needs settling when the balance is zero', () => {
    expect(describeBalance(quote(), false)).toEqual({
      tone: 'neutral',
      text: 'Zmiana nie wymaga żadnych rozliczeń.',
    });
  });

  it('announces a refund request for an overpayment', () => {
    const notice = describeBalance(quote({ refundDueMinor: 3000 }), false);
    expect(notice.tone).toBe('refund');
    expect(notice.text).toContain('30,00');
    expect(notice.text).toContain('wniosek o jej zwrot');
  });

  it('blocks the owner when a dearer distance leaves a balance due', () => {
    const notice = describeBalance(
      quote({ balanceDueMinor: 4000, blockedReason: 'balance_due_requires_organizer' }),
      false,
    );
    expect(notice.tone).toBe('blocked');
    expect(notice.text).toContain('40,00');
    expect(notice.text).toContain('organizator');
  });

  it('tells the organizer to settle the extra by hand', () => {
    const notice = describeBalance(quote({ balanceDueMinor: 4000 }), true);
    expect(notice.tone).toBe('due');
    expect(notice.text).toContain('rozlicz');
  });

  it('shows the server message for any other block', () => {
    const notice = describeBalance(
      quote({ blockedReason: 'payment_in_progress', blockedMessage: 'Trwa płatność.' }),
      true,
    );
    expect(notice).toEqual({ tone: 'blocked', text: 'Trwa płatność.' });
  });
});

describe('describeRegistrationChange for a distance change', () => {
  const change = (over: Partial<RegistrationChange>): RegistrationChange => ({
    id: 'c1',
    registrationId: 'r1',
    type: 'distance_changed',
    from: { distanceName: '10 km' },
    to: { distanceName: '5 km' },
    actorId: 'u1',
    actorRole: 'owner',
    createdAt: '2030-01-01T10:00:00+01:00',
    ...over,
  });

  it('names both distances', () => {
    expect(describeRegistrationChange(change({}))).toBe('Zmieniono dystans: 10 km → 5 km');
  });

  it('marks an organizer change and a refund request', () => {
    expect(
      describeRegistrationChange(
        change({ actorRole: 'manager', to: { distanceName: '5 km', refundRequested: true } }),
      ),
    ).toBe(
      'Zmieniono dystans: 10 km → 5 km (przez organizatora) — złożono wniosek o zwrot nadpłaty',
    );
  });
});
