import { describe, expect, it } from 'vitest';
import { formFieldErrorText, parsePrice, toDraftOptions, toPayloadOptions } from '../formFields';
import { ApiRequestError } from '@/api/errors';
import type { FormField } from '@/types';

describe('form field variant drafts', () => {
  it('parses prices with a comma, empty as zero', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice(' ')).toBe(0);
    expect(parsePrice('12,5')).toBe(12.5);
    expect(parsePrice('-5')).toBe(-5);
  });

  it('seeds one blank row when the field has no variants', () => {
    expect(toDraftOptions({ options: [] } as unknown as FormField)).toEqual([
      { label: '', price: '' },
    ]);
  });

  it('keeps keys and drops zero prices when drafting', () => {
    const field = {
      options: [
        { key: 'k1', label: 'A', price: 0 },
        { key: 'k2', label: 'B', price: -5 },
      ],
    } as unknown as FormField;
    expect(toDraftOptions(field)).toEqual([
      { key: 'k1', label: 'A', price: '' },
      { key: 'k2', label: 'B', price: '-5' },
    ]);
  });

  it('builds the payload without blank rows and only with known keys', () => {
    expect(
      toPayloadOptions([
        { key: 'k1', label: ' A ', price: '2,5' },
        { label: '  ', price: '9' },
        { label: 'C', price: '' },
      ]),
    ).toEqual([
      { key: 'k1', label: 'A', price: 2.5 },
      { label: 'C', price: 0 },
    ]);
  });
});

describe('formFieldErrorText', () => {
  it('maps the known 409 codes and falls back to the message', () => {
    expect(formFieldErrorText(new ApiRequestError('x', 'form_field_override_exists'))).toBe(
      'Ten dystans już nadpisuje to pole.',
    );
    expect(formFieldErrorText(new Error('boom'))).toBe('boom');
    expect(formFieldErrorText('nope')).toBe('Nie udało się zapisać zmiany.');
  });
});
