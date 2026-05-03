export { DraftBanner } from './DraftBanner';
export { PrivateBanner } from './PrivateBanner';
export { ResultsSection } from './ResultsSection';
export { EventHeroBanner } from './EventHeroBanner';
export { EventSidebar } from './EventSidebar';
export { EventInfoTab } from './EventInfoTab';
export { EventDistancesTab } from './EventDistancesTab';
export { EventStartListTab } from './EventStartListTab';

import type { Event, User } from '@/types';

export const getEditUrl = (event: Event, user: User | null): string => {
  if (user?.role === 'admin' || user?.role === 'superadmin') return `/admin/events/${event.id}`;
  if (user?.role === 'moderator') return `/moderator?tab=moderation`;
  return `/organizer/events/${event.id}`;
};
