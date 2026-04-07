import { describe, it, expect } from 'vitest';
import { parseEventDate } from '../googleCalendarUtils';

describe('parseEventDate', () => {
  it('parses Polish date format', () => {
    expect(parseEventDate('15 września 2026')).toBe('2026-09-15');
  });

  it('parses January date', () => {
    expect(parseEventDate('1 stycznia 2026')).toBe('2026-01-01');
  });

  it('parses December date', () => {
    expect(parseEventDate('25 grudnia 2026')).toBe('2026-12-25');
  });

  it('pads single-digit days', () => {
    expect(parseEventDate('5 marca 2026')).toBe('2026-03-05');
  });

  it('falls back to today for invalid format', () => {
    const result = parseEventDate('invalid');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
