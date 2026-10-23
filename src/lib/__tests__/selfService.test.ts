import { describe, expect, it } from 'vitest';
import type { Event } from '@/types';
import { ApiRequestError } from '@/api/errors';
import {
  evaluateSelfService,
  refundRequestErrorMessage,
  selfServiceDeadline,
  selfServiceDeniedMessage,
} from '../selfService';

const event = (over: Partial<Event> = {}): Event =>
  ({
    id: 'e1',
    date: '2026-06-20T00:00:00',
    publicationStatus: 'published',
    ...over,
  }) as Event;

const NOW = new Date('2026-06-01T12:00:00');

describe('evaluateSelfService', () => {
  it('allows an active registration inside the default window', () => {
    const verdict = evaluateSelfService(event(), { status: 'confirmed' }, NOW);
    expect(verdict.allowed).toBe(true);
  });

  it('closes 7 days before the start when the organizer set no date', () => {
    const verdict = evaluateSelfService(
      event({ date: '2026-06-08T00:00:00' }),
      { status: 'pending' },
      NOW,
    );
    expect(verdict).toMatchObject({ allowed: false, reason: 'closed' });
  });

  it('prefers the server-computed effective deadline', () => {
    const e = event({ selfServiceEffectiveDeadline: '2026-06-01T12:00:01' });
    expect(evaluateSelfService(e, { status: 'confirmed' }, NOW).allowed).toBe(true);
    const closed = event({ selfServiceEffectiveDeadline: '2026-06-01T12:00:00' });
    expect(evaluateSelfService(closed, { status: 'confirmed' }, NOW)).toMatchObject({
      allowed: false,
      reason: 'closed',
    });
  });

  it('is off when the organizer switched self-service off', () => {
    expect(
      evaluateSelfService(event({ selfServiceEnabled: false }), { status: 'confirmed' }, NOW),
    ).toMatchObject({ allowed: false, reason: 'disabled' });
  });

  it('refuses inactive registrations and finished events', () => {
    expect(evaluateSelfService(event(), { status: 'cancelled' }, NOW)).toMatchObject({
      allowed: false,
      reason: 'registration_not_active',
    });
    expect(
      evaluateSelfService(event({ publicationStatus: 'finished' }), { status: 'confirmed' }, NOW),
    ).toMatchObject({ allowed: false, reason: 'event_over' });
  });

  it('falls back to 7 days before the start for the deadline', () => {
    expect(selfServiceDeadline(event())?.toISOString()).toBe(
      new Date('2026-06-13T00:00:00').toISOString(),
    );
  });

  it('explains disabled and closed, stays silent otherwise', () => {
    expect(selfServiceDeniedMessage('disabled', null)).toContain('wyłączył');
    expect(selfServiceDeniedMessage('closed', '13 czerwca 2026, 00:00')).toContain(
      '13 czerwca 2026',
    );
    expect(selfServiceDeniedMessage('event_over', null)).toBeNull();
  });
});

describe('refundRequestErrorMessage', () => {
  it('explains that only a paid registration can be refunded', () => {
    const error = new ApiRequestError('Only a paid registration can request a refund.', 'refund_requires_paid_registration', 409);
    expect(refundRequestErrorMessage(error)).toBe('Zwrot można zgłosić tylko dla opłaconego zapisu.');
  });

  it('shows the server message for other API errors', () => {
    const error = new ApiRequestError('Nie znaleziono zapisu.', 'registration_not_found', 404);
    expect(refundRequestErrorMessage(error)).toBe('Nie znaleziono zapisu.');
  });

  it('falls back to a retry hint for network errors', () => {
    expect(refundRequestErrorMessage(new TypeError('Failed to fetch'))).toBe('Spróbuj ponownie za chwilę.');
  });
});
