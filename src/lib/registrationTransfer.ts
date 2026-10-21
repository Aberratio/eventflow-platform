import type { SwapTeamMemberPayload } from '@/api/payloads';
import type { Registration, TransferRegistrationResult } from '@/types';
import { formatMoney } from '@/lib/format';

/**
 * Helpers of the organizer's „Przenieś zapis” flow. The server decides everything
 * (who may, what changes); this only decides when the action is offered and words the outcome.
 */

/** A Zapis that can be moved to another person at all: live, and not a relay-team member (that is the team swap). */
export const canTransferRegistration = (
  registration: Pick<Registration, 'status' | 'teamId'>,
): boolean =>
  (registration.status === 'pending' || registration.status === 'confirmed') &&
  !registration.teamId;

export interface TransferPersonForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'K' | '';
  email: string;
}

/** The request body: an existing Zawodnik by id, or the data of a brand-new person. */
export function buildTransferPayload(
  existingCompetitorId: string | null,
  person: TransferPersonForm,
): SwapTeamMemberPayload {
  if (existingCompetitorId) return { competitorId: existingCompetitorId };
  return {
    newPerson: {
      firstName: person.firstName.trim(),
      lastName: person.lastName.trim(),
      ...(person.birthDate ? { birthDate: person.birthDate } : {}),
      ...(person.gender ? { gender: person.gender } : {}),
      ...(person.email.trim() ? { email: person.email.trim() } : {}),
    },
  };
}

/** Whether the form holds enough to send: a chosen Zawodnik, or at least a first and last name. */
export const canSubmitTransfer = (
  existingCompetitorId: string | null,
  person: TransferPersonForm,
): boolean =>
  !!existingCompetitorId || (person.firstName.trim() !== '' && person.lastName.trim() !== '');

/** What the organizer is told after the transfer about the difference of the Rozliczenie (never moved automatically). */
export function describeTransferOutcome(
  result: Pick<TransferRegistrationResult, 'balanceDueMinor' | 'overpaymentMinor'>,
): string {
  if (result.balanceDueMinor > 0) {
    return `Nowa osoba ma do dopłaty ${formatMoney(result.balanceDueMinor / 100)} (ubezpieczenie liczone od jej wieku) — rozlicz to ręcznie.`;
  }
  if (result.overpaymentMinor > 0) {
    return `Opłata jest wyższa o ${formatMoney(result.overpaymentMinor / 100)} (ubezpieczenie liczone od wieku nowej osoby). Zwrot nie został złożony automatycznie.`;
  }
  return 'Kod startowy został zmieniony; numer startowy i opłata zostają przy zapisie.';
}
