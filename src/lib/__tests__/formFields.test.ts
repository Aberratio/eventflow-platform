import { describe, expect, it } from 'vitest';
import {
  allowedSystemStates,
  answersToPayload,
  answersToSubmit,
  formStepFields,
  identityToSubmit,
  mapServerFieldErrors,
  modifierPreviewTotal,
  moveFieldId,
  validateFormFieldAnswers,
  VOIVODESHIPS,
} from '../formFields';
import type { FormField } from '@/types';

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

  it('turns the answers map into the create-payload array (nothing when empty)', () => {
    expect(answersToPayload({ a: 'x', b: ['k1', 'k2'], c: true })).toEqual([
      { fieldId: 'a', value: 'x' },
      { fieldId: 'b', value: ['k1', 'k2'] },
      { fieldId: 'c', value: true },
    ]);
    expect(answersToPayload({})).toBeUndefined();
    expect(answersToPayload(undefined)).toBeUndefined();
  });
});

const sys = (key: string, state: FormField['state'], id = `s-${key}`): FormField =>
  f({ id, kind: 'system', fieldKey: key, state, fieldType: null, labelOverride: null });

describe('identity section by tri-state', () => {
  const fields = [
    sys('phone', 'required'),
    sys('club', 'shown'),
    sys('city', 'hidden'),
    sys('postal_code', 'shown'),
    sys('anonymization', 'shown'),
    sys('first_name', 'required'),
    f({ id: 'c1' }),
  ];

  it('renders only visible identity positions plus custom ones, never first_name or hidden', () => {
    expect(formStepFields(fields).map((x) => x.fieldKey)).toEqual([
      'phone',
      'club',
      'postal_code',
      'anonymization',
      'custom_x',
    ]);
  });

  it('requires a required identity position and ignores optional ones', () => {
    const errors = validateFormFieldAnswers(formStepFields(fields), { 's-club': '' });
    expect(errors).toEqual({ 's-phone': 'To pole jest wymagane.' });
  });

  it('sends only visible, filled identity values under the server keys', () => {
    expect(
      identityToSubmit(fields, {
        's-phone': ' +48 600 100 200 ',
        's-club': '',
        's-city': 'Gdańsk',
        's-postal_code': '80-001',
        's-anonymization': false,
        's-first_name': 'Jan',
      }),
    ).toEqual({ phone: '+48 600 100 200', postalCode: '80-001', isAnonymized: false });
    expect(identityToSubmit(fields, {})).toBeUndefined();
  });

  it('offers the closed list of 16 voivodeships', () => {
    expect(VOIVODESHIPS).toHaveLength(16);
    expect(VOIVODESHIPS).toContain('warmińsko-mazurskie');
  });
});

describe('server field errors', () => {
  const fields = [sys('phone', 'required'), f({ id: 'c1', fieldKey: 'custom_size' })];

  it('maps by fieldId, falls back to fieldKey and reports the rest', () => {
    const { byFieldId, unmatched } = mapServerFieldErrors(fields, [
      {
        fieldId: 'c1',
        fieldKey: 'custom_size',
        code: 'required',
        message: 'To pole jest wymagane.',
      },
      { fieldId: '', fieldKey: 'phone', code: 'required', message: 'Podaj telefon.' },
      { fieldId: 'zz', fieldKey: 'birth_date', code: 'invalid_value', message: 'Zła data.' },
    ]);
    expect(byFieldId).toEqual({ c1: 'To pole jest wymagane.', 's-phone': 'Podaj telefon.' });
    expect(unmatched.map((e) => e.fieldKey)).toEqual(['birth_date']);
  });
});

describe('modifier preview (display only)', () => {
  it('sums signed variant prices of the picked options', () => {
    const meal = f({
      id: 'm',
      fieldType: 'single_choice',
      options: [
        { key: 'veg', label: 'Veg', price: 5 },
        { key: 'draw', label: 'Losowanie', price: -2 },
      ],
    });
    const extras = f({
      id: 'x',
      fieldType: 'multi_choice',
      options: [
        { key: 'a', label: 'A', price: 3 },
        { key: 'b', label: 'B', price: 4 },
      ],
    });
    expect(modifierPreviewTotal([meal, extras], { m: 'draw', x: ['a', 'b'] })).toBe(5);
    expect(modifierPreviewTotal([meal, extras], {})).toBe(0);
  });
});
