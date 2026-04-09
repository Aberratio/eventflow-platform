import {
  EventsPageSkeleton,
  ShopPageSkeleton,
  EventDetailsSkeleton,
  DashboardSkeleton,
  AdminDashboardSkeleton,
  AuthPageSkeleton,
  ListPageSkeleton,
  ProfilePageSkeleton,
  FormPageSkeleton,
} from '@/components/skeletons';
import { useState } from 'react';

const skeletons = [
  { id: 'events', label: 'Events', Component: EventsPageSkeleton },
  { id: 'shop', label: 'Shop', Component: ShopPageSkeleton },
  { id: 'event-details', label: 'Event Details', Component: EventDetailsSkeleton },
  { id: 'dashboard', label: 'Dashboard', Component: DashboardSkeleton },
  { id: 'admin', label: 'Admin', Component: AdminDashboardSkeleton },
  { id: 'auth', label: 'Auth', Component: AuthPageSkeleton },
  { id: 'list', label: 'List (Series/Challenges)', Component: ListPageSkeleton },
  { id: 'profile', label: 'Profile', Component: ProfilePageSkeleton },
  { id: 'form', label: 'Form/Edit', Component: FormPageSkeleton },
] as const;

const SkeletonShowcase = () => {
  const [active, setActive] = useState('events');
  const ActiveSkeleton = skeletons.find((s) => s.id === active)!.Component;

  return (
    <div>
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {skeletons.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active === s.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ActiveSkeleton />
    </div>
  );
};

export default SkeletonShowcase;
