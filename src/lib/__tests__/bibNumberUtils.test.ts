import { describe, it, expect } from 'vitest';
import {
  getNextAvailableNumber,
  isBibNumberTaken,
  getAvailableNumbersString,
  bibRangeFieldErrors,
} from '../bibNumberUtils';
import { Registration } from '@/types';

const makeReg = (id: string, bib?: string): Registration => ({
  id,
  eventId: 'e1',
  eventName: 'Test Event',
  userId: 'u1',
  userName: 'Test',
  userEmail: 'test@test.pl',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
  status: 'confirmed',
  registeredAt: '2026-01-01',
  bibNumber: bib,
});

describe('getNextAvailableNumber', () => {
  it('returns 1 when no registrations', () => {
    expect(getNextAvailableNumber([])).toBe(1);
  });

  it('returns next number after used ones', () => {
    const regs = [makeReg('1', '1'), makeReg('2', '2'), makeReg('3', '3')];
    expect(getNextAvailableNumber(regs)).toBe(4);
  });

  it('finds gaps', () => {
    const regs = [makeReg('1', '1'), makeReg('2', '3')];
    expect(getNextAvailableNumber(regs)).toBe(2);
  });

  it('respects startFrom', () => {
    const regs = [makeReg('1', '1')];
    expect(getNextAvailableNumber(regs, 5)).toBe(5);
  });
});

describe('isBibNumberTaken', () => {
  const regs = [makeReg('r1', '10'), makeReg('r2', '20')];

  it('returns true for taken number', () => {
    expect(isBibNumberTaken(regs, '10')).toBe(true);
  });

  it('returns false for free number', () => {
    expect(isBibNumberTaken(regs, '15')).toBe(false);
  });

  it('excludes specific registration', () => {
    expect(isBibNumberTaken(regs, '10', 'r1')).toBe(false);
  });

  it('returns false for NaN input', () => {
    expect(isBibNumberTaken(regs, 'abc')).toBe(false);
  });
});

describe('getAvailableNumbersString', () => {
  it('returns "1 i więcej" when no registrations', () => {
    expect(getAvailableNumbersString([])).toBe('1 i więcej');
  });

  it('returns ranges for used numbers', () => {
    const regs = [makeReg('1', '3'), makeReg('2', '5')];
    const result = getAvailableNumbersString(regs);
    expect(result).toContain('1');
  });
});

describe('bibRangeFieldErrors', () => {
  const d = (name: string, from: string, to: string) => ({
    name,
    bibRangeFrom: from,
    bibRangeTo: to,
  });

  it('accepts blank and disjoint ranges', () => {
    const list = [d('10 km', '1', '99'), d('5 km', '100', '199'), d('1 km', '', '')];
    expect(bibRangeFieldErrors(list, 0)).toEqual({});
    expect(bibRangeFieldErrors(list, 1)).toEqual({});
    expect(bibRangeFieldErrors(list, 2)).toEqual({});
  });

  it('flags an overlap with an earlier distance and names it', () => {
    const list = [d('10 km', '1', '100'), d('5 km', '100', '200')];
    const errors = bibRangeFieldErrors(list, 1);
    expect(errors.distance_1_bibRangeFrom).toContain('10 km');
  });

  it('requires both bounds', () => {
    expect(bibRangeFieldErrors([d('a', '5', '')], 0)).toHaveProperty('distance_0_bibRangeTo');
    expect(bibRangeFieldErrors([d('a', '', '5')], 0)).toHaveProperty('distance_0_bibRangeFrom');
  });

  it('rejects reversed, zero and fractional ranges', () => {
    expect(bibRangeFieldErrors([d('a', '10', '5')], 0)).toHaveProperty('distance_0_bibRangeTo');
    expect(bibRangeFieldErrors([d('a', '0', '5')], 0)).toHaveProperty('distance_0_bibRangeTo');
    expect(bibRangeFieldErrors([d('a', '1.5', '5')], 0)).toHaveProperty('distance_0_bibRangeTo');
  });
});
