import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flag,
  MapPin,
  Radio,
  Timer,
  Trophy,
} from 'lucide-react';
import { differenceInCalendarDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

import { getEvents, getFeaturedPartners } from '@/api';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { QUERY_KEYS } from '@/constants';
import type { Event, Partner, SportDiscipline } from '@/types';
import { cn } from '@/lib/utils';

const disciplineLabels: Record<SportDiscipline, string> = {
  running: 'Bieganie',
  cycling: 'Kolarstwo',
  triathlon: 'Triathlon',
  multisport: 'Multisport',
};

const today = new Date();

const toDate = (value?: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const eventDate = (event: Event) => toDate(event.startDate || event.date) ?? new Date(event.date);

const eventEndDate = (event: Event) => toDate(event.endDate || event.date) ?? eventDate(event);

const isPublicEvent = (event: Event) =>
  !event.isPrivate && event.status !== 'draft' && event.status !== 'deleted';

const isOngoing = (event: Event) =>
  event.isLive ||
  (isPublicEvent(event) &&
    !isBefore(today, eventDate(event)) &&
    !isAfter(today, eventEndDate(event)) &&
    event.status !== 'past' &&
    event.status !== 'archived');

const isUpcoming = (event: Event) =>
  isPublicEvent(event) &&
  ['active', 'approved'].includes(event.status) &&
  isAfter(eventDate(event), today);

const registrationLabel = (event: Event) => {
  const deadline = toDate(event.registrationDeadline);
  if (event.registrationStatus === 'closed' || (deadline && isBefore(deadline, today)))
    return 'Zapisy zamkniete';
  if (event.registrationStatus === 'none') return 'Wkrotce';
  return 'Zapisy otwarte';
};

const deadlineText = (event: Event) => {
  const deadline = toDate(event.registrationDeadline);
  if (!deadline) return 'Termin zapisow wkrotce';
  const days = differenceInCalendarDays(deadline, today);
  if (days < 0) return 'Zapisy zakonczone';
  if (days === 0) return 'Do konca zapisow: dzis';
  if (days === 1) return 'Do konca zapisow: 1 dzien';
  return `Do konca zapisow: ${days} dni`;
};

const shortDate = (value: Date) => format(value, 'dd.MM.yyyy', { locale: pl });

const dateTile = (value: Date) => ({
  day: format(value, 'dd', { locale: pl }),
  month: format(value, 'LLL', { locale: pl }).replace('.', '').toUpperCase(),
});

const eventImage = (event: Event) =>
  event.bannerUrl ||
  event.originalBannerUrl ||
  event.imageUrl ||
  event.originalImageUrl ||
  '/placeholder.svg';

const byDateAsc = (a: Event, b: Event) => eventDate(a).getTime() - eventDate(b).getTime();

const byDateDesc = (a: Event, b: Event) => eventDate(b).getTime() - eventDate(a).getTime();

const SectionTitle = ({ title }: { title: string }) => (
  <div className="mb-5 flex items-center gap-3">
    <span className="h-px w-4 bg-primary" />
    <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h2>
  </div>
);

const EventMeta = ({ event, compact = false }: { event: Event; compact?: boolean }) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground',
      compact ? 'text-xs' : 'text-sm',
    )}
  >
    <span className="flex items-center gap-1.5">
      <MapPin className="h-3.5 w-3.5" />
      {event.city || event.location}
    </span>
    <span className="flex items-center gap-1.5">
      <CalendarDays className="h-3.5 w-3.5" />
      {shortDate(eventDate(event))}
    </span>
  </div>
);

const FeaturedCard = ({ event }: { event: Event }) => {
  const tile = dateTile(eventDate(event));

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group overflow-hidden rounded-lg border border-white/15 bg-white/[0.035] transition hover:border-primary/50 hover:bg-white/[0.055]"
    >
      <div className="relative h-36 overflow-hidden md:h-40">
        <img
          src={eventImage(event)}
          alt=""
          className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/35 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md border border-white/15 bg-[#080d15]/85 px-3 py-2 text-center shadow-lg">
          <div className="text-xl font-semibold leading-none text-white">{tile.day}</div>
          <div className="mt-1 text-[10px] font-bold text-white/75">{tile.month}</div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-white">{event.name}</h3>
        <div className="mt-2">
          <EventMeta event={event} compact />
        </div>
        <Badge
          variant="outline"
          className="mt-3 border-white/15 bg-white/5 text-[11px] text-white/70"
        >
          {disciplineLabels[event.discipline]}
        </Badge>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm text-white/80">
          Zobacz wydarzenie
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

const StatusList = ({
  title,
  icon,
  events,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  events: Event[];
  variant: 'live' | 'closing' | 'done';
}) => (
  <div className="border-white/12 rounded-lg border bg-white/[0.03]">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            variant === 'live' && 'bg-primary/15 text-primary',
            variant === 'closing' && 'bg-amber-500/15 text-amber-400',
            variant === 'done' && 'bg-emerald-500/15 text-emerald-400',
          )}
        >
          {icon}
        </span>
        {title}
      </div>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/65">
        {events.length}
      </span>
    </div>
    <div className="divide-y divide-white/10">
      {events.length === 0 ? (
        <div className="px-4 py-5 text-sm text-muted-foreground">
          Brak wydarzen w tej kategorii.
        </div>
      ) : (
        events.slice(0, 3).map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.slug}${variant === 'done' ? '?tab=results' : ''}`}
            className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.035]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <DisciplineIcon discipline={event.discipline} size="sm" />
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-medium text-white">{event.name}</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">
                  {event.city} <span className="mx-1">-</span>{' '}
                  {variant === 'closing'
                    ? deadlineText(event).replace('Do konca zapisow: ', 'za ')
                    : shortDate(eventDate(event))}
                </div>
              </div>
            </div>
            {variant === 'done' && (
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 sm:block">
                Wyniki dostepne
              </span>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-white/45 transition group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        ))
      )}
    </div>
  </div>
);

const UpcomingTable = ({ events }: { events: Event[] }) => (
  <div className="border-white/12 overflow-hidden rounded-lg border bg-white/[0.03]">
    <div className="divide-y divide-white/10">
      {events.slice(0, 5).map((event) => {
        const tile = dateTile(eventDate(event));
        const open = registrationLabel(event) === 'Zapisy otwarte';

        return (
          <Link
            key={event.id}
            to={`/events/${event.slug}`}
            className="group grid grid-cols-[64px_1fr] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.035] md:grid-cols-[76px_1.4fr_180px_160px_160px_24px]"
          >
            <div className="border-white/12 flex h-12 w-12 flex-col items-center justify-center rounded-md border bg-[#080d15]">
              <span className="text-base font-semibold leading-none text-white">{tile.day}</span>
              <span className="mt-1 text-[10px] font-bold text-white/65">{tile.month}</span>
            </div>
            <div className="min-w-0">
              <div className="line-clamp-1 font-medium text-white">{event.name}</div>
              <div className="mt-1 text-xs text-muted-foreground md:hidden">
                {event.city} - {disciplineLabels[event.discipline]} - {registrationLabel(event)}
              </div>
            </div>
            <div className="hidden md:block">
              <Badge variant="outline" className="border-white/15 text-white/65">
                {disciplineLabels[event.discipline]}
              </Badge>
            </div>
            <div className="hidden text-sm text-muted-foreground md:block">{event.city}</div>
            <div
              className={cn(
                'hidden text-sm font-medium md:block',
                open ? 'text-emerald-400' : 'text-white/45',
              )}
            >
              {registrationLabel(event)}
            </div>
            <ChevronRight className="hidden h-4 w-4 text-white/50 transition group-hover:translate-x-1 group-hover:text-white md:block" />
          </Link>
        );
      })}
    </div>
  </div>
);

const PartnersStrip = ({ partners }: { partners: Partner[] }) => {
  const featured = partners.filter((partner) => partner.featured).slice(0, 6);
  if (featured.length === 0) return null;

  return (
    <div className="border-t border-white/10 pt-7">
      <div className="mb-5 text-center text-xs text-muted-foreground">Nasi partnerzy</div>
      <div className="grid grid-cols-2 items-center gap-6 md:grid-cols-6">
        {featured.map((partner) => (
          <a
            key={partner.id}
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center opacity-45 grayscale transition hover:opacity-85 hover:grayscale-0"
          >
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-h-10 max-w-full object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const { data: eventsData } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getEvents(),
  });

  const { data: partnersData } = useQuery({
    queryKey: QUERY_KEYS.featuredPartners,
    queryFn: () => getFeaturedPartners(),
  });

  const events = useMemo(() => eventsData?.data ?? [], [eventsData?.data]);
  const partners = useMemo(() => partnersData?.data ?? [], [partnersData?.data]);

  const view = useMemo(() => {
    const publicEvents = events.filter(isPublicEvent);
    const ongoing = publicEvents.filter(isOngoing).sort(byDateAsc);
    const upcoming = publicEvents.filter(isUpcoming).sort(byDateAsc);
    const closing = upcoming
      .filter((event) => registrationLabel(event) === 'Zapisy otwarte')
      .sort(
        (a, b) =>
          (toDate(a.registrationDeadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (toDate(b.registrationDeadline)?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );
    const finished = publicEvents.filter((event) => event.status === 'past').sort(byDateDesc);
    const featured = publicEvents
      .filter(
        (event) => event.featured && (event.status === 'active' || event.status === 'approved'),
      )
      .sort(byDateAsc);
    const fallbackFeatured = featured.length > 0 ? featured : upcoming;

    return {
      hero: fallbackFeatured[0] ?? publicEvents[0],
      featured: fallbackFeatured.slice(0, 3),
      ongoing,
      closing,
      finished,
      upcoming,
      counts: {
        active: publicEvents.filter((event) => event.status === 'active' || isOngoing(event))
          .length,
        closing: closing.length,
        upcoming: upcoming.length,
      },
    };
  }, [events]);

  const hero = view.hero;

  return (
    <Layout>
      <div className="min-h-screen bg-[#070b12] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.08),transparent_24%)]" />
        <div className="relative mx-auto w-full max-w-[1040px] px-4 py-10 sm:px-6 lg:px-8">
          <section className="grid gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-center lg:py-8">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-4 bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                  Platforma sportowa
                </span>
              </div>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.04] tracking-tight text-white md:text-6xl">
                Znajdz wydarzenie. Zapisz sie. Sprawdz wyniki.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                Biegi, kolarstwo, triathlon i wiecej. Jedna platforma, wszystkie sportowe emocje.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/wydarzenia">
                    <CalendarDays className="h-4 w-4" />
                    Przegladaj wydarzenia
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/15"
                >
                  <Link to="/wyniki">
                    <Trophy className="h-4 w-4" />
                    Sprawdz wyniki
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: <Radio className="h-4 w-4" />,
                    title: 'Trwaja teraz',
                    value: view.counts.active,
                  },
                  {
                    icon: <Clock3 className="h-4 w-4" />,
                    title: 'Koncza sie zapisy',
                    value: view.counts.closing,
                  },
                  {
                    icon: <CalendarDays className="h-4 w-4" />,
                    title: 'Najblizsze starty',
                    value: view.counts.upcoming,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="border-white/12 rounded-lg border bg-white/[0.035] px-5 py-4"
                  >
                    <div className="mb-2 text-primary">{item.icon}</div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.value} wydarzen</div>
                  </div>
                ))}
              </div>
            </div>

            {hero && (
              <Link
                to={`/events/${hero.slug}`}
                className="group w-full max-w-[460px] overflow-hidden rounded-lg border border-white/15 bg-white/[0.035] shadow-2xl shadow-black/30 lg:justify-self-end"
              >
                <div className="relative min-h-[440px]">
                  <img
                    src={eventImage(hero)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/35 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-[#080d15]/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/75">
                    Wyroznione wydarzenie
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                    <h2 className="text-3xl font-bold tracking-tight text-white">{hero.name}</h2>
                    <div className="mt-4">
                      <EventMeta event={hero} />
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-4 border-white/15 bg-white/5 text-white/75"
                    >
                      {disciplineLabels[hero.discipline]}
                    </Badge>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                      <span className="font-medium text-emerald-400">
                        {registrationLabel(hero)}
                      </span>
                      <span className="text-muted-foreground">{deadlineText(hero)}</span>
                    </div>
                    <div className="mt-4 flex h-12 items-center justify-center rounded-md border border-white/15 bg-white/[0.035] font-medium text-white transition group-hover:border-primary/50 group-hover:bg-primary/15">
                      Zobacz wydarzenie
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle title="Wyroznione wydarzenia" />
              <Button
                asChild
                variant="ghost"
                className="hidden gap-2 text-muted-foreground hover:text-white sm:flex"
              >
                <Link to="/wydarzenia">
                  Zobacz wszystkie
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {view.featured.map((event) => (
                <FeaturedCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <SectionTitle title="Najwazniejsze teraz" />
            <div className="grid gap-5 lg:grid-cols-3">
              <StatusList
                title="Trwajace teraz"
                icon={<Radio className="h-3 w-3" />}
                events={view.ongoing}
                variant="live"
              />
              <StatusList
                title="Koncza sie zapisy"
                icon={<Timer className="h-3 w-3" />}
                events={view.closing}
                variant="closing"
              />
              <StatusList
                title="Ostatnio zakonczone"
                icon={<CheckCircle2 className="h-3 w-3" />}
                events={view.finished}
                variant="done"
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionTitle title="Nadchodzace wydarzenia" />
              <Button
                asChild
                variant="ghost"
                className="hidden gap-2 text-muted-foreground hover:text-white sm:flex"
              >
                <Link to="/wydarzenia">
                  Zobacz wszystkie wydarzenia
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <UpcomingTable events={view.upcoming} />
          </section>

          <section className="border-white/12 mt-6 rounded-lg border bg-white/[0.035] px-5 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/15 text-primary">
                  <Flag className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Organizujesz wydarzenie?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stworz zapisy, zbieraj platnosci i publikuj wyniki w jednym miejscu.
                  </p>
                </div>
              </div>
              <Button asChild className="gap-2 md:min-w-56">
                <Link to="/organizer">
                  Dla organizatorow
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="mt-8 pb-2">
            <PartnersStrip partners={partners} />
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
