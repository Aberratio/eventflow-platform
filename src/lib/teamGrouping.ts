import type { RelayTeam } from '@/types';

/**
 * E7.4 (issue 23 Answer §4, "Numer startowy: per członek, jak każdy inny
 * Zapis"): numbering/QR is already per-Zapis regardless of team membership
 * (RegistrationRepository::create() generates a code unconditionally) — the
 * only thing this ticket still owes is the VIEW-level grouping the spec asks
 * for ("lista startowa pogrupowana po Drużynie ... widok, nie osobny byt
 * numeracji").
 *
 * A "block" is either one real Drużyna's cluster of members, or a single
 * ungrouped Zapis. Grouping is keyed strictly on a `teamId` that resolves to
 * an actual entry in `teamsById` (a real `teams` row from E7.1/E7.2's
 * `GET /events/{eventId}/distances/{distanceId}/teams`) — never on the
 * free-text `teamName`. That free-text field is also written by the older,
 * unrelated `collectTeam` classification feature (out of E7.1's scope), and
 * a stale/legacy value there could coincidentally collide with a real team's
 * display name; keying on `teamId` (and requiring it to resolve) means that
 * collision can never cause two unrelated registrations to cluster together,
 * and a registration whose `teamId` is missing or doesn't resolve (deleted
 * team, data from before E7.1, or simply no team at all) always renders as
 * an individual block, exactly as it does today.
 */
export type StartListBlock<T> =
  | { type: 'team'; teamId: string; team: RelayTeam; members: T[] }
  | { type: 'individual'; registration: T };

/**
 * Clusters `items` (in their given order) into contiguous team blocks —
 * every member of a resolvable team is pulled into one block, positioned at
 * that team's first occurrence in `items`; everything else stays an
 * `individual` block in its original position. Pure and order-stable: for
 * inputs with no groupable team at all, the result is exactly
 * `items.map((registration) => ({ type: 'individual', registration }))`.
 *
 * @param items registrations (or any teamId-bearing row) to arrange
 * @param teamsById real Drużyny for the relevant distance(s), keyed by id —
 *   typically the combined results of `getTeamsForDistance()` for every
 *   distinct `distanceId` present in `items`
 */
export function groupStartListByTeam<T extends { teamId?: string }>(
  items: T[],
  teamsById: Record<string, RelayTeam>,
): StartListBlock<T>[] {
  const blocks: StartListBlock<T>[] = [];
  const blockByTeamId = new Map<string, StartListBlock<T> & { type: 'team' }>();

  for (const item of items) {
    const team = item.teamId ? teamsById[item.teamId] : undefined;
    if (!team) {
      blocks.push({ type: 'individual', registration: item });
      continue;
    }

    const existing = blockByTeamId.get(team.id);
    if (existing) {
      existing.members.push(item);
      continue;
    }

    const block: StartListBlock<T> & { type: 'team' } = {
      type: 'team',
      teamId: team.id,
      team,
      members: [item],
    };
    blockByTeamId.set(team.id, block);
    blocks.push(block);
  }

  return blocks;
}

/** "3/4 zawodników" when the Dystans declares a target size, else just the raw count. */
export function formatTeamCompleteness(team: RelayTeam): string {
  if (team.maxSize === null) {
    return `${team.memberCount} ${team.memberCount === 1 ? 'zawodnik' : 'zawodników'}`;
  }
  return `${team.memberCount}/${team.maxSize} zawodników`;
}
