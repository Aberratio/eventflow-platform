import { describe, expect, it } from 'vitest';
import {
  buildTransferPayload,
  canSubmitTransfer,
  canTransferRegistration,
  describeTransferOutcome,
} from '../registrationTransfer';
import { describeRegistrationChange } from '../registrationChanges';

const person = {
  firstName: ' Anna ',
  lastName: 'Nowak ',
  birthDate: '',
  gender: '' as const,
  email: '',
};

describe('registration transfer helpers', () => {
  it('offers live individual registrations only', () => {
    expect(canTransferRegistration({ status: 'pending' })).toBe(true);
    expect(canTransferRegistration({ status: 'confirmed' })).toBe(true);
    expect(canTransferRegistration({ status: 'confirmed', teamId: 't1' })).toBe(false);
    expect(canTransferRegistration({ status: 'cancelled' })).toBe(false);
    expect(canTransferRegistration({ status: 'expired' })).toBe(false);
  });

  it('sends an existing Zawodnik by id only', () => {
    expect(buildTransferPayload('c9', person)).toEqual({ competitorId: 'c9' });
  });

  it('sends a new person trimmed, without the empty optional fields', () => {
    expect(buildTransferPayload(null, person)).toEqual({
      newPerson: { firstName: 'Anna', lastName: 'Nowak' },
    });
    expect(
      buildTransferPayload(null, {
        ...person,
        birthDate: '1990-05-01',
        gender: 'K',
        email: ' a@x.pl ',
      }),
    ).toEqual({
      newPerson: {
        firstName: 'Anna',
        lastName: 'Nowak',
        birthDate: '1990-05-01',
        gender: 'K',
        email: 'a@x.pl',
      },
    });
  });

  it('needs a chosen Zawodnik or both names', () => {
    expect(canSubmitTransfer('c9', { ...person, firstName: '', lastName: '' })).toBe(true);
    expect(canSubmitTransfer(null, person)).toBe(true);
    expect(canSubmitTransfer(null, { ...person, lastName: ' ' })).toBe(false);
  });

  it('words the outcome: balance due, overpayment or nothing to settle', () => {
    expect(describeTransferOutcome({ balanceDueMinor: 1000, overpaymentMinor: 0 })).toMatch(
      /do dopłaty/,
    );
    expect(describeTransferOutcome({ balanceDueMinor: 0, overpaymentMinor: 500 })).toMatch(
      /nie został złożony automatycznie/,
    );
    expect(describeTransferOutcome({ balanceDueMinor: 0, overpaymentMinor: 0 })).toMatch(
      /Kod startowy został zmieniony/,
    );
  });

  it('keeps the history wording of a transfer', () => {
    expect(
      describeRegistrationChange({
        id: 'c1',
        registrationId: 'r1',
        type: 'transferred',
        from: null,
        to: null,
        actorId: null,
        actorRole: 'manager',
        createdAt: '2030-01-01 10:00:00',
      }),
    ).toBe('Zapis przeniesiono na inną osóbę');
  });
});
