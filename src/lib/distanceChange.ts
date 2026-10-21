import type { DistanceChangeQuote, Registration } from '@/types';
import { formatMinorMoney } from '@/lib/format';

/**
 * Helpers of the "Zmień dystans" flow. The server computes every number and decides
 * who may do what (`blockedReason`); this only words them for the participant / the organizer.
 */

/** A Zapis that can change Dystans at all: live, and not a relay-team member (the captain handles those). */
export const canChangeDistance = (registration: Pick<Registration, 'status' | 'teamId'>): boolean =>
  (registration.status === 'pending' || registration.status === 'confirmed') &&
  !registration.teamId;

export type BalanceTone = 'neutral' | 'refund' | 'due' | 'blocked';

export interface BalanceNotice {
  tone: BalanceTone;
  text: string;
}

/** The line under the new price: nothing to settle, a refund request, an extra to pay, or why the owner cannot go on. */
export function describeBalance(quote: DistanceChangeQuote, isManager: boolean): BalanceNotice {
  if (quote.blockedReason === 'balance_due_requires_organizer' && !isManager) {
    return {
      tone: 'blocked',
      text: `Ten dystans jest droższy o ${formatMinorMoney(quote.balanceDueMinor)}. Dopłatę rozlicza organizator — skontaktuj się z nim, żeby zmienić dystans.`,
    };
  }
  if (quote.blockedReason) {
    return { tone: 'blocked', text: quote.blockedMessage ?? 'Tej zmiany nie można teraz wykonać.' };
  }
  if (quote.refundDueMinor > 0) {
    return {
      tone: 'refund',
      text: `Nadpłata ${formatMinorMoney(quote.refundDueMinor)} — złożymy wniosek o jej zwrot, organizator rozpatrzy go zgodnie z zasadami wydarzenia.`,
    };
  }
  if (quote.balanceDueMinor > 0) {
    return {
      tone: 'due',
      text: `Do dopłaty ${formatMinorMoney(quote.balanceDueMinor)} — rozlicz ją z uczestnikiem ręcznie (płatności online za dopłatę jeszcze nie ma).`,
    };
  }
  return { tone: 'neutral', text: 'Zmiana nie wymaga żadnych rozliczeń.' };
}
