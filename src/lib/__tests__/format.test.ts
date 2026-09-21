import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate } from '../format';

describe('formatMoney', () => {
  it('formats value as Polish currency', () => {
    expect(formatMoney(80)).toBe('80,00 zł');
    expect(formatMoney(0)).toBe('0,00 zł');
  });

  it('handles null and undefined as 0', () => {
    expect(formatMoney(null)).toBe('0,00 zł');
    expect(formatMoney(undefined)).toBe('0,00 zł');
  });

  it('handles non-finite values gracefully', () => {
    expect(formatMoney(NaN)).toBe('0,00 zł');
    expect(formatMoney(Infinity)).toBe('0,00 zł');
  });

  it('accepts string numbers', () => {
    expect(formatMoney('25.50')).toBe('25,50 zł');
  });

  it('rounds to two decimal places', () => {
    expect(formatMoney(25.555)).toBe('25,56 zł');
    expect(formatMoney(25.554)).toBe('25,55 zł');
  });

  it('always shows two decimal places for whole numbers', () => {
    expect(formatMoney(100)).toBe('100,00 zł');
  });

  it('handles negative amounts', () => {
    expect(formatMoney(-25.5)).toBe('-25,50 zł');
  });

  it('handles large numbers, grouped per pl-PL locale conventions', () => {
    const expected = `${(1000000).toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} zł`;
    expect(formatMoney(1000000)).toBe(expected);
    expect(formatMoney(1000000)).toContain('zł');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string as pl-PL date', () => {
    expect(formatDate('2026-01-05')).toBe(new Date('2026-01-05').toLocaleDateString('pl-PL'));
  });

  it('formats a Date instance', () => {
    const d = new Date(2026, 8, 21);
    expect(formatDate(d)).toBe(d.toLocaleDateString('pl-PL'));
  });

  it('formats a timestamp number', () => {
    const ts = Date.now();
    expect(formatDate(ts)).toBe(new Date(ts).toLocaleDateString('pl-PL'));
  });

  it('returns "Invalid Date" text for unparsable input, matching native behavior', () => {
    expect(formatDate('not-a-date')).toBe(new Date('not-a-date').toLocaleDateString('pl-PL'));
  });
});
