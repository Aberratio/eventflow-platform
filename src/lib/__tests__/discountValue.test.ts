import { describe, it, expect } from 'vitest';
import {
  roundToCents,
  formatDiscountValue,
  formatDiscountBadge,
  formatMoney,
  parseDiscountValueInput,
  isDiscountInputAllowed,
} from '../discountValue';

describe('roundToCents', () => {
  it('rounds to two decimal places', () => {
    expect(roundToCents(25.555)).toBe(25.56);
    expect(roundToCents(25.554)).toBe(25.55);
  });

  it('handles whole numbers', () => {
    expect(roundToCents(100)).toBe(100);
  });

  it('handles zero', () => {
    expect(roundToCents(0)).toBe(0);
  });
});

describe('formatDiscountValue', () => {
  it('formats fixed type with two decimal places', () => {
    expect(formatDiscountValue(25.5, 'fixed')).toBe('25,50');
    expect(formatDiscountValue(100, 'fixed')).toBe('100,00');
  });

  it('formats percent type as plain number string', () => {
    expect(formatDiscountValue(10, 'percent')).toBe('10');
    expect(formatDiscountValue(0, 'percent')).toBe('0');
  });

  it('handles null and undefined as 0', () => {
    expect(formatDiscountValue(null, 'fixed')).toBe('0,00');
    expect(formatDiscountValue(undefined, 'percent')).toBe('0');
  });

  it('handles non-finite values gracefully', () => {
    expect(formatDiscountValue(NaN, 'fixed')).toBe('0,00');
    expect(formatDiscountValue(NaN, 'percent')).toBe('0');
  });

  it('accepts string numbers', () => {
    expect(formatDiscountValue('25.50', 'fixed')).toBe('25,50');
  });
});

describe('formatDiscountBadge', () => {
  it('appends zł suffix for fixed type', () => {
    expect(formatDiscountBadge(25.5, 'fixed')).toBe('25,50 zł');
  });

  it('appends % suffix for percent type', () => {
    expect(formatDiscountBadge(10, 'percent')).toBe('10%');
  });
});

describe('formatMoney', () => {
  it('formats value as Polish currency', () => {
    expect(formatMoney(80)).toBe('80,00 zł');
    expect(formatMoney(0)).toBe('0,00 zł');
  });

  it('handles null', () => {
    expect(formatMoney(null)).toBe('0,00 zł');
  });
});

describe('parseDiscountValueInput', () => {
  it('returns null for empty string', () => {
    expect(parseDiscountValueInput('', 'fixed')).toBeNull();
    expect(parseDiscountValueInput('   ', 'percent')).toBeNull();
  });

  it('parses valid fixed decimal input', () => {
    const result = parseDiscountValueInput('25.50', 'fixed');
    expect(result).not.toBeNull();
    expect(result!.value).toBe(25.5);
  });

  it('parses fixed input with comma separator', () => {
    const result = parseDiscountValueInput('25,50', 'fixed');
    expect(result).not.toBeNull();
    expect(result!.value).toBe(25.5);
    expect(result!.normalized).toBe('25.50');
  });

  it('returns null for invalid fixed pattern', () => {
    expect(parseDiscountValueInput('25.555', 'fixed')).toBeNull();
    expect(parseDiscountValueInput('abc', 'fixed')).toBeNull();
    expect(parseDiscountValueInput('25.5.5', 'fixed')).toBeNull();
  });

  it('parses valid percent integer', () => {
    const result = parseDiscountValueInput('10', 'percent');
    expect(result).not.toBeNull();
    expect(result!.value).toBe(10);
  });

  it('returns null for decimal percent input', () => {
    expect(parseDiscountValueInput('10.5', 'percent')).toBeNull();
  });

  it('rounds fixed value to cents', () => {
    const result = parseDiscountValueInput('25.555', 'fixed');
    // Pattern /^\d+(?:[,.]\d{0,2})?$/ does NOT allow 3 decimal places
    expect(result).toBeNull();
  });

  it('parses whole number as fixed', () => {
    const result = parseDiscountValueInput('50', 'fixed');
    expect(result).not.toBeNull();
    expect(result!.value).toBe(50);
  });
});

describe('isDiscountInputAllowed', () => {
  it('allows empty input for both types', () => {
    expect(isDiscountInputAllowed('', 'fixed')).toBe(true);
    expect(isDiscountInputAllowed('   ', 'percent')).toBe(true);
  });

  it('allows valid fixed decimal', () => {
    expect(isDiscountInputAllowed('25', 'fixed')).toBe(true);
    expect(isDiscountInputAllowed('25.5', 'fixed')).toBe(true);
    expect(isDiscountInputAllowed('25,50', 'fixed')).toBe(true);
  });

  it('rejects invalid fixed input', () => {
    expect(isDiscountInputAllowed('abc', 'fixed')).toBe(false);
    expect(isDiscountInputAllowed('25.555', 'fixed')).toBe(false);
  });

  it('allows integer percent input', () => {
    expect(isDiscountInputAllowed('10', 'percent')).toBe(true);
    expect(isDiscountInputAllowed('0', 'percent')).toBe(true);
  });

  it('rejects decimal percent input', () => {
    expect(isDiscountInputAllowed('10.5', 'percent')).toBe(false);
    expect(isDiscountInputAllowed('abc', 'percent')).toBe(false);
  });
});
