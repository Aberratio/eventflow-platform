import { describe, it, expect } from 'vitest';
import { getNextAvailableNumber, isBibNumberTaken, getAvailableNumbersString } from '../bibNumberUtils';
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
