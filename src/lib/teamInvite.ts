/**
 * The captain's invitation link for a Drużyna. The team id is public; the
 * `invite` parameter carries the secret token that the server requires to join someone else's team.
 */
export const buildTeamInviteLink = (
  origin: string,
  slug: string,
  teamId: string,
  inviteToken: string,
): string =>
  `${origin}/events/${slug}/register?joinTeam=${encodeURIComponent(teamId)}&invite=${encodeURIComponent(inviteToken)}`;
