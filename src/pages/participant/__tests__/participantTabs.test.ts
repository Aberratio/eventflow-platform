import { describe, expect, it } from 'vitest';
import { resolveParticipantTab } from '../participantTabs';

describe('resolveParticipantTab', () => {
  it.each([
    ['profile', undefined, 'profile'],
    [null, 'profile', 'profile'],
    [null, 'profile/extra', 'profile'],
    ['orders', 'profile', 'orders'],
    ['bogus', undefined, 'overview'],
    [null, 'bogus', 'overview'],
    [null, undefined, 'overview'],
  ] as const)('(%s, %s) -> %s', (tabParam, splat, expected) => {
    expect(resolveParticipantTab(tabParam, splat)).toBe(expected);
  });
});
