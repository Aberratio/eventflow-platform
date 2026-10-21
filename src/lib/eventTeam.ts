import type { Event, EventTeamMember, EventTeamMemberStatus, UserRole } from '@/types';

/**
 * R-01 (zakres P2, do potwierdzenia przez Zamawiającego): who is who in an Event's Team, for the UI.
 * The server enforces every rule; these helpers only decide what to show.
 */

/** Owner-level = the Event's Owner or an admin/superadmin (the roster, payments, delete, hand-over). */
export function isEventOwnerLevel(
  user: { id: string; role: UserRole } | null | undefined,
  event: Pick<Event, 'organizerId'> | null | undefined,
): boolean {
  if (!user || !event) return false;
  return user.role === 'admin' || user.role === 'superadmin' || user.id === event.organizerId;
}

/** The Events the Account only co-manages (not owns), from the organizer-panel list. */
export function coManagedEvents(events: readonly Event[] | undefined): Event[] {
  return (events ?? []).filter((event) => event.teamRole === 'co_manager');
}

/**
 * May this Account open the organizer's event-management pages? An organizer always may; any other
 * role only when it co-manages at least one Event. Creating Events stays organizer-only.
 */
export function canReachEventManagement(
  role: UserRole | undefined,
  events: readonly Event[] | undefined,
): boolean {
  if (role === 'organizer') return true;
  return coManagedEvents(events).length > 0;
}

/** Is this Account a Co-manager of this Event (listed as such by the organizer-panel endpoint)? */
export function isCoManagerOf(
  events: readonly Event[] | undefined,
  eventId: string | undefined,
): boolean {
  return (events ?? []).some((event) => event.id === eventId && event.teamRole === 'co_manager');
}

export const teamStatusLabels: Record<EventTeamMemberStatus, string> = {
  invited: 'Zaproszony',
  active: 'Aktywny',
  revoked: 'Dostęp odebrany',
};

/** Revoked rows are history; the Team tab lists only people who have or may get access. */
export function visibleTeamMembers(members: readonly EventTeamMember[]): EventTeamMember[] {
  return members.filter((member) => member.status !== 'revoked');
}

/** A pending invitation whose link has run out (a resend issues a fresh one). */
export function isInvitationExpired(member: EventTeamMember, now: Date = new Date()): boolean {
  if (member.status !== 'invited' || !member.inviteExpiresAt) return false;
  const expires = new Date(member.inviteExpiresAt.replace(' ', 'T'));
  return !Number.isNaN(expires.getTime()) && expires.getTime() < now.getTime();
}
