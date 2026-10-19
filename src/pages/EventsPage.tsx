import { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  Bike,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleX,
  Clock3,
  ListFilter,
  Lock,
  MapPin,
  Search,
  SlidersHorizontal,
  Trophy,
  Users,
} from 'lucide-react';
import { differenceInCalendarDays, format, getYear, isToday, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Layout } from '@/components/layout/Layout';
import { QueryErrorState } from '@/components/ui/query-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EventFiltersSidebar,
  EventFiltersDrawerTrigger,
} from '@/components/filters/EventFiltersSidebar';
import { getAllEvents } from '@/api/allEvents';
import { QUERY_KEYS } from '@/constants';
import { useEventFilters, distanceRangeOptions } from '@/hooks/useEventFilters';
import { cn } from '@/lib/utils';
import { Event, SportDiscipline } from '@/types';

type EventStatusKey = 'live' | 'open' | 'ending' | 'closed' | 'past' | 'cancelled';
type EventSectionKey = 'live' | 'ending' | 'upcoming' | 'past';
type EventMonthGroup = {
  key: string;
  title: string;
  events: Event[];
};

// Flat item list fed to the virtualizer: either a sticky month header or an event row.
type VirtualItem =
  | { type: 'header'; monthKey: string; title: string; count: number; accentClass: string }
  | { type: 'event'; event: Event };

const HEADER_HEIGHT = 40;
const FULL_ROW_HEIGHT = 76;
const COMPACT_ROW_HEIGHT = 44;

const disciplineSelectLabels: Record<'all' | SportDiscipline, string> = {
  all: 'Wszystkie',
  running: 'Bieganie',
  cycling: 'Kolarstwo',
  triathlon: 'Triathlon',
  multisport: 'Multisport',
};

const statusMeta: Record<EventStatusKey, { label: string; tone: string; icon: React.ElementType }> =
  {
    live: {
      label: 'Trwa teraz',
      tone: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
      icon: Activity,
    },
    open: {
      label: 'Zapisy otwarte',
      tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      icon: CalendarDays,
    },
    ending: {
      label: 'Kończą się zapisy',
      tone: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      icon: Clock3,
    },
    closed: {
      label: 'Zapisy zamknięte',
      tone: 'border-slate-400/20 bg-white/[0.04] text-slate-200',
      icon: Lock,
    },
    past: {
      label: 'Zakończone / wyniki',
      tone: 'border-violet-500/25 bg-violet-500/10 text-violet-300',
      icon: Trophy,
    },
    cancelled: {
      label: 'Odwołane',
      tone: 'border-red-500/25 bg-red-500/10 text-red-300',
      icon: CircleX,
    },
  };

const _sectionMeta: Record<EventSectionKey, { title: string; colorClass: string }> = {
  live: { title: 'Trwa teraz', colorClass: 'bg-blue-400' },
  ending: { title: 'Kończą się zapisy (w najbliższym czasie)', colorClass: 'bg-amber-400' },
  upcoming: { title: 'Najbliższe wydarzenia', colorClass: 'bg-emerald-400' },
  past: { title: 'Zakończone - wyniki dostępne', colorClass: 'bg-violet-400' },
};

const isCancelledEvent = (event: Event) => event.publicationStatus === 'cancelled';

const getTotalParticipants = (event: Event) =>
  event.distances.reduce((sum, distance) => sum + distance.registeredCount, 0);

const getEventStatusKey = (event: Event): EventStatusKey => {
  if (isCancelledEvent(event)) return 'cancelled';

  const now = new Date();
  const today = startOfDay(now);
  const eventDate = new Date(event.date);

  if (event.isLive || isToday(eventDate)) return 'live';
  if (event.publicationStatus === 'finished' || eventDate < today) return 'past';

  const registrationDeadline = new Date(event.registrationDeadline);
  const deadlineDays = differenceInCalendarDays(registrationDeadline, today);

  if (event.registrationStatus === 'open' && deadlineDays >= 0 && deadlineDays <= 7) {
    return 'ending';
  }
  if (event.registrationStatus === 'open') return 'open';
  if (event.registrationStatus === 'closed') return 'closed';

  return 'closed';
};

const _getSectionKey = (event: Event): EventSectionKey => {
  const status = getEventStatusKey(event);
  if (status === 'live') return 'live';
  if (status === 'ending') return 'ending';
  if (status === 'past') return 'past';
  return 'upcoming';
};

const getStatusDescription = (event: Event) => {
  const status = getEventStatusKey(event);
  const deadline = new Date(event.registrationDeadline);
  const today = startOfDay(new Date());
  const daysToDeadline = differenceInCalendarDays(deadline, today);

  if (status === 'live') return 'Wyniki live dostępne';
  if (status === 'ending') {
    const daysLabel = daysToDeadline === 0 ? 'dziś' : `za ${daysToDeadline} dni`;
    return `${daysLabel} (${format(deadline, 'dd.MM.yyyy, HH:mm', { locale: pl })})`;
  }
  if (status === 'open') {
    const eventDate = new Date(event.date);
    const daysToStart = differenceInCalendarDays(eventDate, today);
    return daysToStart > 0
      ? `Start za ${daysToStart} dni (${format(eventDate, 'dd.MM.yyyy', { locale: pl })})`
      : 'Zapisy aktywne';
  }
  if (status === 'past') return `Zakończone ${format(new Date(event.date), 'dd.MM.yyyy')}`;
  if (status === 'cancelled') return 'Wydarzenie odwołane';
  return 'Zapisy nie są dostępne';
};

const distancesText = (event: Event) =>
  event.distances
    .slice(0, 3)
    .map((distance) => distance.name)
    .join(', ');

const getMobileStatusLabel = (event: Event) => {
  const status = getEventStatusKey(event);
  const today = startOfDay(new Date());

  if (status === 'live') return 'TRWA';
  if (status === 'past') return 'Wyniki dostępne';
  if (status === 'open') return 'Zapisy otwarte';
  if (status === 'cancelled') return 'Odwołane';
  if (status === 'closed') return 'Zamknięte';

  const daysToDeadline = differenceInCalendarDays(new Date(event.registrationDeadline), today);
  if (daysToDeadline <= 0) return 'Kończy się dziś';
  return `Kończy się za ${daysToDeadline} dni`;
};

const getMobileStatusClass = (event: Event) => {
  const status = getEventStatusKey(event);
  if (status === 'live') return 'text-blue-300';
  if (status === 'ending') return 'text-amber-300';
  if (status === 'past') return 'text-violet-300';
  if (status === 'cancelled') return 'text-red-300';
  if (status === 'closed') return 'text-slate-300';
  return 'text-emerald-300';
};

const getMonthAccentClass = (events: Event[]) => {
  const status = events[0] ? getEventStatusKey(events[0]) : 'open';
  if (status === 'live') return 'bg-blue-400';
  if (status === 'ending') return 'bg-amber-400';
  if (status === 'past') return 'bg-violet-400';
  if (status === 'cancelled') return 'bg-red-400';
  if (status === 'closed') return 'bg-slate-400';
  return 'bg-emerald-400';
};

const groupEventsByMonth = (events: Event[]): EventMonthGroup[] => {
  const groups = new Map<string, EventMonthGroup>();

  events.forEach((event) => {
    const date = new Date(event.date);
    const key = format(date, 'yyyy-MM');
    const title = format(date, 'LLLL yyyy', { locale: pl }).toUpperCase();

    if (!groups.has(key)) {
      groups.set(key, { key, title, events: [] });
    }

    groups.get(key)!.events.push(event);
  });

  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
};

// Build a flat list of virtual items (headers + event rows) from month groups.
const buildVirtualItems = (groups: EventMonthGroup[]): VirtualItem[] => {
  const items: VirtualItem[] = [];
  for (const group of groups) {
    items.push({
      type: 'header',
      monthKey: group.key,
      title: group.title,
      count: group.events.length,
      accentClass: getMonthAccentClass(group.events),
    });
    for (const event of group.events) {
      items.push({ type: 'event', event });
    }
  }
  return items;
};

const EventRow = ({ event, compact }: { event: Event; compact: boolean }) => {
  const status = getEventStatusKey(event);
  const StatusIcon = statusMeta[status].icon;
  const totalParticipants = getTotalParticipants(event);
  const eventDate = new Date(event.date);

  if (compact) {
    return (
      <Link
        to={`/events/${event.slug}`}
        className="group flex h-[44px] items-center overflow-hidden border-b border-white/[0.07] bg-white/[0.025] transition-colors last:border-b-0 hover:bg-white/[0.055]"
      >
        <div className="flex w-[78px] shrink-0 flex-col items-center justify-center border-r border-white/[0.07] px-2 text-center">
          <span className="text-sm font-bold leading-none text-foreground">
            {format(eventDate, 'd MMM', { locale: pl })}
          </span>
        </div>
        <div className="min-w-0 flex-1 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{event.name}</h3>
            {status === 'live' && (
              <span className="shrink-0 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                Trwa
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.isVirtual ? 'Wirtualnie' : event.location}</span>
          </div>
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 px-4 text-xs font-semibold',
            statusMeta[status].tone,
          )}
        >
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{statusMeta[status].label}</span>
        </div>
        <div className="flex w-[48px] shrink-0 items-center justify-center border-l border-white/[0.07]">
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group grid min-h-[76px] grid-cols-[78px_116px_minmax(0,1fr)_150px_260px_48px] overflow-hidden border-b border-white/[0.07] bg-white/[0.025] transition-colors last:border-b-0 hover:bg-white/[0.055]"
    >
      <div className="flex flex-col items-center justify-center border-r border-white/[0.07] px-2 text-center">
        <span className="text-2xl font-bold leading-none text-foreground">
          {format(eventDate, 'd', { locale: pl })}
        </span>
        <span className="mt-1 text-xs font-medium uppercase text-muted-foreground">
          {format(eventDate, 'MMM', { locale: pl })}
        </span>
      </div>

      <img
        src={event.imageUrl}
        alt=""
        className="h-full min-h-[76px] w-full object-cover opacity-80"
        loading="lazy"
      />

      <div className="min-w-0 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-semibold text-foreground">{event.name}</h3>
          {status === 'live' && (
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-300">
              Trwa
            </span>
          )}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.isVirtual ? 'Wirtualnie' : event.location}</span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Bike className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{distancesText(event)}</span>
        </div>
      </div>

      <div className="flex items-center border-l border-white/[0.07] px-8 text-sm">
        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-semibold text-foreground">
            {totalParticipants.toLocaleString('pl-PL')}
          </div>
          <div className="text-xs text-muted-foreground">
            {status === 'open' || status === 'ending' ? 'zapisanych' : 'uczestników'}
          </div>
        </div>
      </div>

      <div className="flex items-center border-l border-white/[0.07] px-6">
        <div
          className={cn('flex items-start gap-2 text-sm font-semibold', statusMeta[status].tone)}
        >
          <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div>{statusMeta[status].label}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {getStatusDescription(event)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center border-l border-white/[0.07]">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
};

const MonthHeader = ({
  title,
  count,
  accentClass,
}: {
  title: string;
  count: number;
  accentClass: string;
}) => (
  <div className="sticky top-0 z-10 flex h-[40px] items-center gap-3 border-b border-white/[0.07] bg-[hsl(var(--background)/0.92)] px-1 backdrop-blur-sm">
    <span className={cn('h-4 w-0.5 rounded-full', accentClass)} />
    <span className="text-sm font-bold uppercase text-muted-foreground">{title}</span>
    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-muted-foreground">
      {count}
    </span>
  </div>
);

// Desktop virtualised list — one scroll container, sticky month headers.
const DesktopVirtualList = ({
  groups,
  compact,
}: {
  groups: EventMonthGroup[];
  compact: boolean;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = compact ? COMPACT_ROW_HEIGHT : FULL_ROW_HEIGHT;

  const items = useMemo(() => buildVirtualItems(groups), [groups]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (items[index].type === 'header' ? HEADER_HEIGHT : rowHeight),
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto overflow-x-hidden rounded-lg border border-white/[0.09] bg-[hsl(var(--surface-elevated)/0.55)] shadow-xl shadow-black/20"
      style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index];
          return (
            <div
              key={vItem.key}
              style={{
                position: 'absolute',
                top: vItem.start,
                left: 0,
                right: 0,
                height: vItem.size,
              }}
            >
              {item.type === 'header' ? (
                <MonthHeader title={item.title} count={item.count} accentClass={item.accentClass} />
              ) : (
                <EventRow event={item.event} compact={compact} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileEventRow = ({ event }: { event: Event }) => {
  const status = getEventStatusKey(event);
  const eventDate = new Date(event.date);
  const distanceLabel = distancesText(event);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group grid min-h-[76px] grid-cols-[72px_minmax(0,1fr)_auto] border-b border-white/[0.07] bg-white/[0.025] last:border-b-0 sm:min-h-[92px] sm:grid-cols-[100px_minmax(0,1fr)_auto]"
    >
      <div className="relative flex items-center justify-center border-r border-white/[0.07]">
        <span
          className={cn(
            'absolute left-0 top-0 h-full w-1',
            status === 'live' && 'bg-blue-400',
            status === 'ending' && 'bg-amber-400',
            status === 'open' && 'bg-emerald-400',
            status === 'past' && 'bg-violet-400',
            status === 'closed' && 'bg-slate-400',
            status === 'cancelled' && 'bg-red-400',
          )}
        />
        <div className="text-center">
          <div className="text-2xl font-bold leading-none text-foreground sm:text-3xl">
            {format(eventDate, 'd', { locale: pl })}
          </div>
          <div className="mt-1 text-xs font-medium uppercase text-muted-foreground sm:mt-2 sm:text-base">
            {format(eventDate, 'MMM', { locale: pl })}
          </div>
        </div>
      </div>

      <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
        <h3 className="truncate text-base font-semibold leading-tight text-foreground sm:text-xl">
          {event.name}
        </h3>
        <div className="mt-1 truncate text-sm text-muted-foreground sm:mt-2 sm:text-lg">
          {event.isVirtual ? 'Wirtualnie' : event.city}
          {distanceLabel && <span className="px-2 text-muted-foreground/70">·</span>}
          {distanceLabel}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 sm:gap-5 sm:px-6">
        <span
          className={cn(
            'hidden whitespace-nowrap text-sm font-semibold sm:block sm:text-lg',
            getMobileStatusClass(event),
          )}
        >
          {getMobileStatusLabel(event)}
        </span>
        <ChevronRight className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-foreground sm:h-7 sm:w-7" />
      </div>
    </Link>
  );
};

// Mobile renders plain map — no virtualiser needed, native scroll is fine on mobile.
const MobileMonthGroup = ({ group }: { group: EventMonthGroup }) => (
  <section className="space-y-3">
    <h2 className="px-3 text-base font-bold uppercase text-muted-foreground sm:px-4 sm:text-xl">
      {group.title}
    </h2>
    <div className="overflow-hidden rounded-xl border border-white/[0.10] bg-[hsl(var(--surface-elevated)/0.52)] shadow-xl shadow-black/20">
      {group.events.map((event) => (
        <MobileEventRow key={event.id} event={event} />
      ))}
    </div>
  </section>
);

const MobileStatCard = ({
  label,
  count,
  status,
  onClick,
  active,
}: {
  label: string;
  count: number;
  status: EventStatusKey;
  onClick: () => void;
  active: boolean;
}) => {
  const Icon = statusMeta[status].icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[92px] items-center gap-3 rounded-xl border px-4 text-left transition-colors sm:min-h-[98px] sm:gap-5 sm:px-6',
        statusMeta[status].tone,
        active && 'ring-current/40 ring-1',
      )}
    >
      <span className="bg-current/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-sm text-foreground/75 sm:text-lg">{label}</span>
        <span className="mt-1 block text-2xl font-bold leading-none text-foreground sm:text-3xl">
          {count.toLocaleString('pl-PL')}
        </span>
      </span>
    </button>
  );
};

const EventsPage = () => {
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters,
  } = useEventFilters();

  const {
    data: allEvents,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getAllEvents(),
  });

  const [compact, setCompact] = useState(false);

  // The API already returns only published, non-private events, so there is nothing left
  // to filter out here — doing it again is how this page and the home page drifted apart.
  const visibleEvents = useMemo(() => allEvents ?? [], [allEvents]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    visibleEvents.forEach((event) => years.add(getYear(new Date(event.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [visibleEvents]);

  const statusCounts = useMemo(() => {
    return visibleEvents.reduce(
      (acc, event) => {
        acc[getEventStatusKey(event)] += 1;
        return acc;
      },
      { live: 0, open: 0, ending: 0, closed: 0, past: 0, cancelled: 0 } as Record<
        EventStatusKey,
        number
      >,
    );
  }, [visibleEvents]);

  const cityOptions = useMemo(
    () => Array.from(new Set(visibleEvents.map((event) => event.city))).sort(),
    [visibleEvents],
  );

  const filteredEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => getYear(new Date(event.date)) === filters.selectedYear)
      .filter((event) => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return [event.name, event.city, event.location, event.organizerName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchLower));
      })
      .filter(
        (event) =>
          filters.disciplines.length === 0 || filters.disciplines.includes(event.discipline),
      )
      .filter((event) => filters.cities.length === 0 || filters.cities.includes(event.city))
      .filter((event) => {
        if (filters.statuses.length === 0) return true;
        const status = getEventStatusKey(event);
        return filters.statuses.includes(status);
      })
      .filter((event) => {
        if (filters.eventTypes.length === 0) return true;
        const isVirtual = event.isVirtual || false;
        if (filters.eventTypes.includes('virtual') && isVirtual) return true;
        if (filters.eventTypes.includes('standard') && !isVirtual) return true;
        return false;
      })
      .filter((event) => !filters.seriesId || event.seriesId === filters.seriesId)
      .filter((event) => {
        if (filters.distanceRanges.length === 0) return true;
        return event.distances.some((distance) => {
          if (!distance.length) return false;
          const distanceKm = distance.unit === 'km' ? distance.length : distance.length / 1000;
          return filters.distanceRanges.some((rangeId) => {
            const range = distanceRangeOptions.find((item) => item.id === rangeId);
            if (!range) return false;
            const min = 'min' in range ? range.min : 0;
            const max = 'max' in range ? range.max : Infinity;
            return distanceKm >= min && distanceKm <= max;
          });
        });
      })
      .filter((event) => !filters.organizerId || event.organizerId === filters.organizerId)
      .filter((event) => {
        if (!filters.hasEarlyBird) return true;
        return event.distances.some((distance) =>
          distance.priceTiers?.some(
            (tier) =>
              tier.name.toLowerCase().includes('wczesn') &&
              tier.endDate &&
              new Date(tier.endDate) > new Date(),
          ),
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filters, visibleEvents]);

  const eventMonthGroups = useMemo(() => groupEventsByMonth(filteredEvents), [filteredEvents]);

  const selectedDiscipline = filters.disciplines.length === 1 ? filters.disciplines[0] : 'all';

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-[radial-gradient(circle_at_80%_0%,rgba(38,116,217,0.10),transparent_32%),linear-gradient(180deg,#070b10_0%,#05070a_100%)]">
        <div className="flex min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
          <EventFiltersSidebar
            filters={filters}
            updateFilter={updateFilter}
            toggleArrayFilter={toggleArrayFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFiltersCount={activeFiltersCount}
            filteredCount={filteredEvents.length}
            statusCounts={statusCounts}
          />

          <main className="min-w-0 flex-1 overflow-hidden">
            {/* ── Mobile ── */}
            <div className="lg:hidden">
              <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-8">
                <div className="mb-8 flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-foreground hover:bg-white/[0.06]"
                    asChild
                  >
                    <Link to="/" aria-label="Wróć do strony głównej">
                      <ArrowLeft className="h-8 w-8" />
                    </Link>
                  </Button>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Wydarzenia sportowe
                  </h1>
                </div>

                <div className="mb-7 grid grid-cols-[minmax(0,1fr)_72px] gap-3 sm:grid-cols-[minmax(0,1fr)_76px]">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-input"
                      placeholder="Szukaj wydarzeń..."
                      value={filters.search}
                      onChange={(event) => updateFilter('search', event.target.value)}
                      className="h-16 rounded-xl border-white/10 bg-white/[0.03] pl-16 text-lg shadow-xl shadow-black/10 placeholder:text-muted-foreground sm:h-[68px] sm:text-2xl"
                    />
                  </div>
                  <EventFiltersDrawerTrigger
                    filters={filters}
                    updateFilter={updateFilter}
                    toggleArrayFilter={toggleArrayFilter}
                    clearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFiltersCount={activeFiltersCount}
                    filteredCount={filteredEvents.length}
                    statusCounts={statusCounts}
                    triggerMode="icon"
                  />
                </div>

                <div className="mb-9 grid gap-3 sm:grid-cols-3">
                  <Select
                    value={String(filters.selectedYear)}
                    onValueChange={(value) => updateFilter('selectedYear', Number(value))}
                  >
                    <SelectTrigger className="h-16 rounded-xl border-white/10 bg-white/[0.03] px-5 text-left sm:h-[78px]">
                      <CalendarDays className="mr-4 h-7 w-7 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground sm:text-lg">Rok</div>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.cities.length === 1 ? filters.cities[0] : 'all'}
                    onValueChange={(value) =>
                      updateFilter('cities', value === 'all' ? [] : [value])
                    }
                  >
                    <SelectTrigger className="h-16 rounded-xl border-white/10 bg-white/[0.03] px-5 text-left sm:h-[78px]">
                      <MapPin className="mr-4 h-7 w-7 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground sm:text-lg">Lokalizacja</div>
                        <SelectValue placeholder="Cała Polska" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cała Polska</SelectItem>
                      {cityOptions.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    className="h-16 justify-between rounded-xl border-white/10 bg-white/[0.03] px-5 text-left hover:bg-white/[0.055] sm:h-[78px]"
                  >
                    <span className="flex min-w-0 items-center">
                      <ArrowDownUp className="mr-4 h-7 w-7 text-muted-foreground" />
                      <span>
                        <span className="block text-sm font-normal text-muted-foreground sm:text-lg">
                          Sortuj
                        </span>
                        <span className="block text-xl font-semibold text-foreground sm:text-2xl">
                          Data
                        </span>
                      </span>
                    </span>
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full rounded-xl bg-white/[0.05]" />
                    ))}
                  </div>
                ) : isError ? (
                  <QueryErrorState onRetry={() => void refetch()} />
                ) : filteredEvents.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 text-center">
                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                      Nie znaleziono wydarzeń
                    </h2>
                    <Button variant="outline" className="mt-5" onClick={clearFilters}>
                      Wyczyść filtry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {eventMonthGroups.map((group) => (
                      <MobileMonthGroup key={group.key} group={group} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Desktop ── */}
            <div className="hidden px-8 py-7 lg:block">
              <div className="mx-auto max-w-[1540px] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-1 rounded-full bg-warning" />
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Wydarzenia sportowe
                      </h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Znajdź idealne zawody dla siebie
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[hsl(var(--surface-elevated)/0.50)] p-4 shadow-xl shadow-black/10 xl:flex-row xl:items-center xl:justify-between">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      value={String(filters.selectedYear)}
                      onValueChange={(value) => updateFilter('selectedYear', Number(value))}
                    >
                      <SelectTrigger className="h-11 min-w-[150px] border-white/10 bg-background/50">
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            Rok {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.cities.length === 1 ? filters.cities[0] : 'all'}
                      onValueChange={(value) =>
                        updateFilter('cities', value === 'all' ? [] : [value])
                      }
                    >
                      <SelectTrigger className="h-11 min-w-[190px] border-white/10 bg-background/50">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Lokalizacja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cała Polska</SelectItem>
                        {cityOptions.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedDiscipline}
                      onValueChange={(value) =>
                        updateFilter(
                          'disciplines',
                          value === 'all' ? [] : [value as SportDiscipline],
                        )
                      }
                    >
                      <SelectTrigger className="h-11 min-w-[180px] border-white/10 bg-background/50">
                        <Bike className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(disciplineSelectLabels) as Array<'all' | SportDiscipline>
                        ).map((discipline) => (
                          <SelectItem key={discipline} value={discipline}>
                            {disciplineSelectLabels[discipline]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <Button
                      variant="outline"
                      className={cn(
                        'h-10 border-white/10 bg-background/50',
                        compact && 'border-primary/50 text-foreground',
                      )}
                      onClick={() => setCompact((v) => !v)}
                    >
                      <ListFilter className="mr-2 h-4 w-4" />
                      Widok kompaktowy
                    </Button>
                    <span>Znaleziono {filteredEvents.length.toLocaleString('pl-PL')} wydarzeń</span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full rounded-lg bg-white/[0.05]" />
                    ))}
                  </div>
                ) : isError ? (
                  <QueryErrorState onRetry={() => void refetch()} />
                ) : filteredEvents.length === 0 ? (
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                      Nie znaleziono wydarzeń
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Spróbuj zmienić kryteria wyszukiwania.
                    </p>
                    <Button variant="outline" className="mt-5" onClick={clearFilters}>
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Wyczyść filtry
                    </Button>
                  </div>
                ) : (
                  <DesktopVirtualList groups={eventMonthGroups} compact={compact} />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;
