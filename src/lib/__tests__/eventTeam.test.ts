import { describe, expect, it } from 'vitest';
import type { Event, EventTeamMember } from '@/types';
import {
  canReachEventManagement,
  coManagedEvents,
  isCoManagerOf,
  isEventOwnerLevel,
  isInvitationExpired,
  visibleTeamMembers,
} from '../eventTeam';

const event = (id: string, teamRole?: 'owner' | 'co_manager'): Event =>
  ({ id, organizerId: 'owner-1', teamRole }) as Event;

const member = (patch: Partial<EventTeamMember>): EventTeamMember => ({
  id: 'm1',
  eventId: 'e1',
  userId: null,
  role: 'co_manager',
  status: 'invited',
  email: 'ola@example.com',
  name: null,
  inviteExpiresAt: null,
  invitedBy: 'owner-1',
  createdAt: '2026-10-01 10:00:00',
  acceptedAt: null,
  revokedAt: null,
  ...patch,
});

describe('isEventOwnerLevel', () => {
  it('is true for the Owner and for admin/superadmin, false for everyone else', () => {
    const e = { organizerId: 'owner-1' };
    expect(isEventOwnerLevel({ id: 'owner-1', role: 'organizer' }, e)).toBe(true);
    expect(isEventOwnerLevel({ id: 'a', role: 'admin' }, e)).toBe(true);
    expect(isEventOwnerLevel({ id: 'a', role: 'superadmin' }, e)).toBe(true);
    expect(isEventOwnerLevel({ id: 'co', role: 'participant' }, e)).toBe(false);
    expect(isEventOwnerLevel({ id: 'co', role: 'organizer' }, e)).toBe(false);
    expect(isEventOwnerLevel({ id: 'mod', role: 'moderator' }, e)).toBe(false);
    expect(isEventOwnerLevel(null, e)).toBe(false);
    expect(isEventOwnerLevel({ id: 'owner-1', role: 'organizer' }, null)).toBe(false);
  });
});

describe('route guard logic', () => {
  const owned = event('e1', 'owner');
  const shared = event('e2', 'co_manager');

  it('lets an organizer in regardless of the list', () => {
    expect(canReachEventManagement('organizer', [])).toBe(true);
    expect(canReachEventManagement('organizer', undefined)).toBe(true);
  });

  it('lets a participant in only with at least one co-managed Event', () => {
    expect(canReachEventManagement('participant', [])).toBe(false);
    expect(canReachEventManagement('participant', undefined)).toBe(false);
    expect(canReachEventManagement('participant', [owned])).toBe(false);
    expect(canReachEventManagement('participant', [shared])).toBe(true);
  });

  it('lists co-managed Events and recognises one by id', () => {
    expect(coManagedEvents([owned, shared]).map((e) => e.id)).toEqual(['e2']);
    expect(isCoManagerOf([owned, shared], 'e2')).toBe(true);
    expect(isCoManagerOf([owned, shared], 'e1')).toBe(false);
    expect(isCoManagerOf(undefined, 'e2')).toBe(false);
  });
});

describe('team members', () => {
  it('hides revoked rows', () => {
    const rows = [member({ id: 'a' }), member({ id: 'b', status: 'revoked' })];
    expect(visibleTeamMembers(rows).map((m) => m.id)).toEqual(['a']);
  });

  it('detects an expired pending invitation only', () => {
    const now = new Date('2026-10-20T12:00:00');
    expect(isInvitationExpired(member({ inviteExpiresAt: '2026-10-19 12:00:00' }), now)).toBe(true);
    expect(isInvitationExpired(member({ inviteExpiresAt: '2026-10-21 12:00:00' }), now)).toBe(
      false,
    );
    expect(
      isInvitationExpired(
        member({ status: 'active', inviteExpiresAt: '2026-10-19 12:00:00' }),
        now,
      ),
    ).toBe(false);
    expect(isInvitationExpired(member({ inviteExpiresAt: null }), now)).toBe(false);
  });
});
