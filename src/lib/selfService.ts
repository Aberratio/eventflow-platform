import type { Event, Registration } from '@/types';

/**
 * The owner's view of the server's SelfServicePolicy. The server stays the
 * authority (a closed window answers 409); this only decides whether to OFFER the action and what
 * to tell the participant. Shared by every self-service action (rezygnacja now; zmiana dystansu later).
 */

/** By default self-service ends this many days before the start, unless the organizer set a date. */
export const DEFAULT_SELF_SERVICE_LEAD_DAYS = 7;

export type SelfServiceVerdict =
  | { allowed: true; deadline: Date | null }
  | { allowed: false; reason: SelfServiceDeniedReason; deadline: Date | null };

export type SelfServiceDeniedReason =
  | 'disabled'
  | 'closed'
  | 'event_over'
  | 'registration_not_active';

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** The cut-off that applies: the server-computed one, else the organizer's own, else 7 days before the start. */
export function selfServiceDeadline(event: Event): Date | null {
  const effective = toDate(event.selfServiceEffectiveDeadline);
  if (effective) return effective;
  const own = toDate(event.selfServiceDeadline);
  if (own) return own;
  const start = toDate(event.date);
  if (!start) return null;
  return new Date(start.getTime() - DEFAULT_SELF_SERVICE_LEAD_DAYS * 24 * 60 * 60 * 1000);
}

export function evaluateSelfService(
  event: Event,
  registration: Pick<Registration, 'status'>,
  now: Date = new Date(),
): SelfServiceVerdict {
  const deadline = selfServiceDeadline(event);
  if (event.selfServiceEnabled === false) return { allowed: false, reason: 'disabled', deadline };
  const start = toDate(event.date);
  if (
    event.publicationStatus === 'cancelled' ||
    event.publicationStatus === 'finished' ||
    (start !== null && start.getTime() <= now.getTime())
  ) {
    return { allowed: false, reason: 'event_over', deadline };
  }
  if (registration.status !== 'pending' && registration.status !== 'confirmed') {
    return { allowed: false, reason: 'registration_not_active', deadline };
  }
  if (deadline !== null && now.getTime() >= deadline.getTime()) {
    return { allowed: false, reason: 'closed', deadline };
  }
  return { allowed: true, deadline };
}

/** Polish explanation shown instead of the button when the action is not offered. */
export function selfServiceDeniedMessage(
  reason: SelfServiceDeniedReason,
  deadlineLabel: string | null,
): string | null {
  switch (reason) {
    case 'disabled':
      return 'Organizator wyłączył samodzielną rezygnację — skontaktuj się z organizatorem.';
    case 'closed':
      return deadlineLabel
        ? `Termin samodzielnej rezygnacji minął (${deadlineLabel}). Skontaktuj się z organizatorem.`
        : 'Termin samodzielnej rezygnacji minął. Skontaktuj się z organizatorem.';
    default:
      return null;
  }
}

/** A paid Zapis (confirmed, with something to give back) turns into a refund request on cancel. */
export const hasPaidAmount = (
  registration: Pick<Registration, 'status' | 'totalAmount'>,
): boolean => registration.status === 'confirmed' && (registration.totalAmount ?? 0) > 0;
