import { describe, expect, it } from 'vitest';
import { toPublicStartListEntry } from '../publicStartList';
import type { Registration } from '@/types';

const baseRegistration: Registration = {
  id: 'r1',
  eventId: 'event-1',
  eventName: 'Event',
  userId: 'u1',
  userName: 'Jan Testowy',
  userEmail: 'jan@example.test',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  registeredAt: '2026-09-01T10:00:00Z',
  status: 'confirmed',
  bibNumber: '101',
  qrCode: 'pqr_deadbeef',
  discountCode: 'ABC',
};

describe('toPublicStartListEntry', () => {
  it('drops userEmail, qrCode and discountCode', () => {
    const entry = toPublicStartListEntry(baseRegistration);

    expect(entry).not.toHaveProperty('userEmail');
    expect(entry).not.toHaveProperty('qrCode');
    expect(entry).not.toHaveProperty('discountCode');
  });

  it('sets hasMerchandise from merchandiseOrders length', () => {
    const withOrders = toPublicStartListEntry({
      ...baseRegistration,
      merchandiseOrders: [
        {
          merchandiseId: 'm1',
          merchandiseName: 'Koszulka',
          quantity: 1,
          price: 10,
        },
      ],
    });
    expect(withOrders.hasMerchandise).toBe(true);

    const withoutOrders = toPublicStartListEntry({ ...baseRegistration, merchandiseOrders: [] });
    expect(withoutOrders.hasMerchandise).toBe(false);

    const withUndefinedOrders = toPublicStartListEntry({
      ...baseRegistration,
      merchandiseOrders: undefined,
    });
    expect(withUndefinedOrders.hasMerchandise).toBe(false);
  });

  it('keeps the id, name, status and team fields', () => {
    const entry = toPublicStartListEntry(baseRegistration);

    expect(entry.id).toBe('r1');
    expect(entry.userId).toBe('u1');
    expect(entry.userName).toBe('Jan Testowy');
    expect(entry.status).toBe('confirmed');
    expect(entry.bibNumber).toBe('101');
    expect(entry.formFields).toEqual([]);
  });
});
