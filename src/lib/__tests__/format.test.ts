import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate, formatDuration, formatPace } from '../format';

describe('formatPace', () => {
  it('formats the average pace as M:SS min/km', () => {
    expect(formatPace(1500, 5)).toBe('5:00 min/km');
    expect(formatPace(2537, 10)).toBe('4:14 min/km');
  });

  it('rounds the whole pace, so seconds never reach 60', () => {
    expect(formatPace(1499, 5)).toBe('5:00 min/km');
    expect(formatPace(299.6, 1)).toBe('5:00 min/km');
    expect(formatPace(239.5, 1)).toBe('4:00 min/km');
  });
});

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

describe('formatDuration', () => {
  it('formats seconds as H:MM:SS', () => {
    expect(formatDuration(0)).toBe('0:00:00');
    expect(formatDuration(59)).toBe('0:00:59');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(36000)).toBe('10:00:00');
  });

  it('rounds to a whole second', () => {
    expect(formatDuration(59.4)).toBe('0:00:59');
    expect(formatDuration(59.5)).toBe('0:01:00');
  });

  it('leaves out the hour under one hour with hours: auto', () => {
    expect(formatDuration(65, { hours: 'auto' })).toBe('1:05');
    expect(formatDuration(3599, { hours: 'auto' })).toBe('59:59');
    expect(formatDuration(3600, { hours: 'auto' })).toBe('1:00:00');
  });
});
