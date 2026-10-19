import { describe, expect, it, vi } from 'vitest';
import {
  allowedSystemStates,
  answersToSubmit,
  moveFieldId,
  validateFormFieldAnswers,
} from '../formFields';
import { submitFormFieldAnswers } from '../submitFormFieldAnswers';
import type { FormField } from '@/types';

vi.mock('@/api', () => ({
  saveFormFieldAnswer: vi.fn(async (_r: string, fieldId: string) => {
    if (fieldId === 'bad') throw new Error('Wartość musi być liczbą.');
    return { success: true, data: {} };
  }),
}));

const f = (over: Partial<FormField>): FormField =>
  ({
    id: 'x',
    kind: 'custom',
    fieldKey: 'custom_x',
    state: 'shown',
    labelOverride: 'X',
    fieldType: 'short_text',
    validationConfig: null,
    options: null,
    ...over,
  }) as FormField;

describe('form field helpers', () => {
  it('validates required, consent and max length like the server', () => {
    const fields = [
      f({ id: 'a', state: 'required' }),
      f({ id: 'b', state: 'required', fieldType: 'consent' }),
      f({ id: 'c', validationConfig: { maxLength: 3 } }),
      f({ id: 'd', fieldType: 'number', validationConfig: { min: 1 } }),
    ];
    expect(validateFormFieldAnswers(fields, { a: '', b: false, c: 'abcd', d: '0' })).toEqual({
      a: 'To pole jest wymagane.',
      b: 'Ta zgoda jest wymagana.',
      c: 'Tekst może mieć maksymalnie 3 znaków.',
      d: 'Wartość nie może być mniejsza niż 1.',
    });
    expect(validateFormFieldAnswers(fields, { a: 'x', b: true, c: 'abc', d: '2' })).toEqual({});
  });

  it('submits only filled visible custom answers, numbers as numbers', () => {
    const fields = [
      f({ id: 'a' }),
      f({ id: 'n', fieldType: 'number' }),
      f({ id: 'c', fieldType: 'consent' }),
      f({ id: 'h', state: 'hidden' }),
      f({ id: 'e' }),
    ];
    expect(answersToSubmit(fields, { a: 'tak', n: '12', c: false, h: 'ukryte', e: '' })).toEqual({
      a: 'tak',
      n: 12,
    });
  });

  it('mirrors the catalogue states for system positions', () => {
    expect(allowedSystemStates('first_name')).toEqual(['required']);
    expect(allowedSystemStates('anonymization')).toEqual(['hidden', 'shown']);
    expect(allowedSystemStates('phone')).toEqual(['hidden', 'shown', 'required']);
  });

  it('moves an id one slot and refuses to leave the list', () => {
    const fields = [f({ id: 'a' }), f({ id: 'b' }), f({ id: 'c' })];
    expect(moveFieldId(fields, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveFieldId(fields, 'a', -1)).toBeNull();
    expect(moveFieldId(fields, 'c', 1)).toBeNull();
  });

  it('reports failed answers without throwing', async () => {
    const failures = await submitFormFieldAnswers('r1', { ok: 'x', bad: '1' });
    expect(failures).toEqual([{ fieldId: 'bad', message: 'Wartość musi być liczbą.' }]);
  });
});
