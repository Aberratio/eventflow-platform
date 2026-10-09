import { describe, expect, it } from 'vitest';
import type { Event } from '@/types';
import { buildChildIdMap, remapChildIds, toEventWritePayload } from '../eventChildren';

describe('toEventWritePayload', () => {
  it('drops server-owned counters and does not mutate its input', () => {
    const input = {
      name: 'Bieg',
      discountCodes: [
        { id: 'dc-1', code: 'A', usedCount: 5, usedBy: [{ registrationId: 'r1' }], active: true },
      ],
      distances: [{ id: 'd1', name: '5 km', registeredCount: 7, price: 50 }],
    } as unknown as Parameters<typeof toEventWritePayload>[0];
    const snapshot = JSON.parse(JSON.stringify(input));

    const body = toEventWritePayload(input);

    expect(body).toEqual({
      name: 'Bieg',
      discountCodes: [{ id: 'dc-1', code: 'A', active: true }],
      distances: [{ id: 'd1', name: '5 km', price: 50 }],
    });
    expect(input).toEqual(snapshot);
  });

  it('leaves payloads without children untouched', () => {
    expect(toEventWritePayload({ liveResultsUrl: 'https://x' })).toEqual({
      liveResultsUrl: 'https://x',
    });
  });
});

describe('buildChildIdMap', () => {
  it('pairs rows by index, including nested pricing variants', () => {
    const submitted = {
      discountCodes: [{ id: 'dc-seed' }, { id: 'dc-123' }],
      merchandise: [{ id: 'merch_9' }],
      distances: [{ id: 'dist-tmp', pricingVariants: [{ id: 'pv-tmp' }] }],
    } as unknown as Parameters<typeof buildChildIdMap>[0];
    const saved = {
      discountCodes: [{ id: 'dc-seed' }, { id: 'srv-1' }],
      merchandise: [{ id: 'srv-m' }],
      distances: [{ id: 'srv-d', pricingVariants: [{ id: 'srv-pv' }] }],
    } as unknown as Event;

    expect(Object.fromEntries(buildChildIdMap(submitted, saved))).toEqual({
      'dc-123': 'srv-1',
      merch_9: 'srv-m',
      'dist-tmp': 'srv-d',
      'pv-tmp': 'srv-pv',
    });
  });

  it('records nothing for a collection whose length differs', () => {
    const submitted = { discountCodes: [{ id: 'a' }, { id: 'b' }] } as unknown as Parameters<
      typeof buildChildIdMap
    >[0];
    const saved = { discountCodes: [{ id: 'x' }] } as unknown as Event;
    expect(buildChildIdMap(submitted, saved).size).toBe(0);
  });
});

describe('remapChildIds', () => {
  it('remaps ids and distanceIds and keeps unchanged arrays referentially equal', () => {
    const map = new Map([
      ['dist-tmp', 'srv-d'],
      ['dc-1', 'srv-1'],
    ]);
    const rows = [{ id: 'dc-1', distanceIds: ['dist-tmp', 'd-real'] }, { id: 'dc-2' }];

    expect(remapChildIds(rows, map)).toEqual([
      { id: 'srv-1', distanceIds: ['srv-d', 'd-real'] },
      { id: 'dc-2' },
    ]);
    expect(rows[0].id).toBe('dc-1');
    expect(remapChildIds(rows, new Map())).toBe(rows);
  });
});
