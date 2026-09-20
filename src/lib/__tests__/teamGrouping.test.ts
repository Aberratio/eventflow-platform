import { describe, expect, it } from 'vitest';
import { formatTeamCompleteness, groupStartListByTeam } from '../teamGrouping';
import type { RelayTeam } from '@/types';

const relayTeam = (overrides: Partial<RelayTeam> = {}): RelayTeam => ({
  id: 'team-1',
  eventId: 'event-1',
  distanceId: 'distance-1',
  name: 'Sokoły',
  memberCount: 3,
  minSize: 2,
  maxSize: 4,
  complete: false,
  ...overrides,
});

interface Row {
  id: string;
  teamId?: string;
  teamName?: string;
}

describe('groupStartListByTeam', () => {
  it('clusters registrations sharing a real teamId into one team block', () => {
    const team = relayTeam();
    const items: Row[] = [
      { id: 'r1', teamId: 'team-1' },
      { id: 'r2' },
      { id: 'r3', teamId: 'team-1' },
    ];

    const blocks = groupStartListByTeam(items, { 'team-1': team });

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: 'team',
      teamId: 'team-1',
      team,
      members: [items[0], items[2]],
    });
    expect(blocks[1]).toEqual({ type: 'individual', registration: items[1] });
  });

  it('leaves registrations with no teamId as individual blocks, in order', () => {
    const items: Row[] = [{ id: 'r1' }, { id: 'r2' }];

    const blocks = groupStartListByTeam(items, {});

    expect(blocks).toEqual([
      { type: 'individual', registration: items[0] },
      { type: 'individual', registration: items[1] },
    ]);
  });

  it('does not group on a matching free-text teamName alone', () => {
    // Two registrations share a legacy collectTeam-style teamName label but
    // neither carries a teamId that resolves to a real team — must not
    // cluster, since a stale/coincidental label collision is not a real
    // relay Drużyna.
    const items: Row[] = [
      { id: 'r1', teamName: 'Biegacze Poranni' },
      { id: 'r2', teamName: 'Biegacze Poranni' },
    ];

    const blocks = groupStartListByTeam(items, {});

    expect(blocks).toEqual([
      { type: 'individual', registration: items[0] },
      { type: 'individual', registration: items[1] },
    ]);
  });

  it('treats a teamId that does not resolve in teamsById as ungrouped', () => {
    const items: Row[] = [
      { id: 'r1', teamId: 'stale-team' },
      { id: 'r2', teamId: 'stale-team' },
    ];

    const blocks = groupStartListByTeam(items, { 'team-1': relayTeam() });

    expect(blocks).toEqual([
      { type: 'individual', registration: items[0] },
      { type: 'individual', registration: items[1] },
    ]);
  });

  it("positions a team block at its first member's spot and keeps later members out of place", () => {
    const team = relayTeam({ id: 'team-2' });
    const items: Row[] = [
      { id: 'r1' },
      { id: 'r2', teamId: 'team-2' },
      { id: 'r3' },
      { id: 'r4', teamId: 'team-2' },
    ];

    const blocks = groupStartListByTeam(items, { 'team-2': team });

    expect(
      blocks.map((b) =>
        b.type === 'team'
          ? `team:${b.members.map((m) => m.id).join(',')}`
          : `ind:${b.registration.id}`,
      ),
    ).toEqual(['ind:r1', 'team:r2,r4', 'ind:r3']);
  });
});

describe('formatTeamCompleteness', () => {
  it('formats a partial team against its declared max size', () => {
    expect(formatTeamCompleteness(relayTeam({ memberCount: 3, maxSize: 4 }))).toBe(
      '3/4 zawodników',
    );
  });

  it('formats a full team the same way, no special casing', () => {
    expect(formatTeamCompleteness(relayTeam({ memberCount: 4, maxSize: 4, complete: true }))).toBe(
      '4/4 zawodników',
    );
  });

  it('falls back to a bare count when the Dystans has no declared max size', () => {
    expect(
      formatTeamCompleteness(relayTeam({ memberCount: 3, maxSize: null, complete: null })),
    ).toBe('3 zawodników');
  });

  it('uses singular form for a lone member with no declared max size', () => {
    expect(
      formatTeamCompleteness(relayTeam({ memberCount: 1, maxSize: null, complete: null })),
    ).toBe('1 zawodnik');
  });
});
