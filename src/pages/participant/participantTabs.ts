export const PARTICIPANT_TAB_IDS = [
  'overview',
  'registrations',
  'history',
  'records',
  'challenges',
  'tickets',
  'orders',
  'profile',
  'authorizations',
] as const;
export type ParticipantTabId = (typeof PARTICIPANT_TAB_IDS)[number];

const isTabId = (v: string | null | undefined): v is ParticipantTabId =>
  !!v && (PARTICIPANT_TAB_IDS as readonly string[]).includes(v);

/** ?tab= wins; else the first segment of the /participant/* splat; else 'overview'. */
export function resolveParticipantTab(
  tabParam: string | null,
  splat: string | undefined,
): ParticipantTabId {
  if (isTabId(tabParam)) return tabParam;
  const segment = splat?.split('/').filter(Boolean)[0];
  if (isTabId(segment)) return segment;
  return 'overview';
}
