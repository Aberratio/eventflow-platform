import { describe, expect, it } from 'vitest';
import { buildTeamInviteLink } from '@/lib/teamInvite';

describe('buildTeamInviteLink', () => {
  it('builds the registration link with the team id and the invite token', () => {
    expect(
      buildTeamInviteLink('https://zmierzymyczas.pl', 'bieg-wiosenny', 'team-1', 'tok-1'),
    ).toBe('https://zmierzymyczas.pl/events/bieg-wiosenny/register?joinTeam=team-1&invite=tok-1');
  });

  it('encodes both parameters', () => {
    expect(buildTeamInviteLink('http://localhost', 'e', 'a b&c', 'x/y?z=1')).toBe(
      'http://localhost/events/e/register?joinTeam=a%20b%26c&invite=x%2Fy%3Fz%3D1',
    );
  });
});
