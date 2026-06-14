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

const SectionTitle = ({
  title,
  linkTo,
  linkLabel,
}: {
  title: string;
  linkTo?: string;
  linkLabel?: string;
}) => (
  <div className="mb-6 flex items-center justify-between gap-4">
    <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h2>
    {linkTo && linkLabel && (
      <Link
        to={linkTo}
        className="flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/70"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    )}
  </div>
);

const EventMeta = ({ event, compact = false }: { event: Event; compact?: boolean }) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-1 text-white/50',
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
      className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] transition hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="relative h-36 overflow-hidden md:h-40">
        <img
          src={eventImage(event)}
          alt=""
          className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/40 to-transparent" />
        <div className="absolute left-3 top-3 rounded border border-white/12 bg-[#080d15]/90 px-2.5 py-1.5 text-center">
          <div className="text-lg font-semibold leading-none text-white">{tile.day}</div>
          <div className="mt-0.5 text-[9px] font-bold uppercase text-white/55">{tile.month}</div>
        </div>
      </div>
      <div className="p-4 pt-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{event.name}</h3>
        <div className="mt-2">
          <EventMeta event={event} compact />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
          <Badge
            variant="outline"
            className="border-white/12 bg-transparent text-[11px] text-white/50"
          >
            {disciplineLabels[event.discipline]}
          </Badge>
          <ChevronRight className="h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/55" />
        </div>
      </div>
    </Link>
  );
};

/* ─── Najważniejsze teraz ─────────────────────────────────────────────────── */

const variantLine: Record<string, string> = {
  live: 'bg-primary',
  closing: 'bg-amber-400',
  done: 'bg-white/25',
};

const variantIcon: Record<string, string> = {
  live: 'text-primary',
  closing: 'text-amber-400',
  done: 'text-white/45',
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
  <div className="flex flex-col rounded-lg border border-white/10 bg-white/[0.025]">
    {/* header */}
    <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className={cn('h-4 w-0.5 rounded-full', variantLine[variant])} />
        <span className={cn('flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest', variantIcon[variant])}>
          {icon}
          {title}
        </span>
      </div>
      <span className="text-xs tabular-nums text-white/30">{events.length}</span>
    </div>

    {/* rows */}
    <div className="flex flex-col divide-y divide-white/8">
      {events.length === 0 ? (
        <div className="px-4 py-5 text-sm text-white/30">Brak wydarzen w tej kategorii.</div>
      ) : (
        events.slice(0, 3).map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.slug}${variant === 'done' ? '?tab=results' : ''}`}
            className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]"
          >
            <DisciplineIcon discipline={event.discipline} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-medium leading-snug text-white">
                {event.name}
              </div>
              <div className="mt-0.5 text-xs text-white/40">
                {event.city}
                {variant === 'closing'
                  ? ` · ${deadlineText(event).replace('Do konca zapisow: ', 'za ')}`
                  : ` · ${shortDate(eventDate(event))}`}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {variant === 'done' && (
                <span className="hidden text-xs text-white/40 sm:block">Wyniki dostepne</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
            </div>
          </Link>
        ))
      )}
    </div>
  </div>
);

/* ─── Nadchodzące wydarzenia ──────────────────────────────────────────────── */

const TableHeader = () => (
  <div className="hidden grid-cols-[80px_1fr_160px_140px_160px_24px] items-center gap-4 border-b border-white/8 px-4 py-2.5 md:grid">
    {['Data', 'Wydarzenie', 'Dyscyplina', 'Miasto', 'Status', ''].map((label) => (
      <span key={label} className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </span>
    ))}
  </div>
);

const UpcomingTable = ({ events }: { events: Event[] }) => (
  <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
    <TableHeader />
    <div className="divide-y divide-white/8">
      {events.slice(0, 5).map((event) => {
        const tile = dateTile(eventDate(event));
        const open = registrationLabel(event) === 'Zapisy otwarte';

        return (
          <Link
            key={event.id}
            to={`/events/${event.slug}`}
            className="group grid grid-cols-[64px_1fr] items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] md:grid-cols-[80px_1fr_160px_140px_160px_24px] md:gap-4"
          >
            {/* date tile */}
            <div className="flex h-11 w-11 flex-col items-center justify-center rounded border border-white/10 bg-[#0a0f1a]">
              <span className="text-sm font-semibold leading-none text-white">{tile.day}</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase text-white/45">{tile.month}</span>
            </div>

            {/* name */}
            <div className="min-w-0">
              <div className="line-clamp-1 text-sm font-medium text-white">{event.name}</div>
              <div className="mt-0.5 text-xs text-white/40 md:hidden">
                {event.city} · {disciplineLabels[event.discipline]} ·{' '}
                <span className={open ? 'text-emerald-400/80' : 'text-white/30'}>
                  {registrationLabel(event)}
                </span>
              </div>
            </div>

            {/* discipline */}
            <div className="hidden md:block">
              <Badge
                variant="outline"
                className="border-white/10 bg-transparent text-[11px] text-white/45"
              >
                {disciplineLabels[event.discipline]}
              </Badge>
            </div>

            {/* city */}
            <div className="hidden text-sm text-white/50 md:block">{event.city}</div>

            {/* status */}
            <div
              className={cn(
                'hidden text-sm md:block',
                open ? 'text-emerald-400' : 'text-white/30',
              )}
            >
              <span className="flex items-center gap-1.5">
                {open && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                {registrationLabel(event)}
              </span>
            </div>

            {/* chevron */}
            <ChevronRight className="hidden h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50 md:block" />
          </Link>
        );
      })}
    </div>
  </div>
);

/* ─── Partnerzy ───────────────────────────────────────────────────────────── */

const PartnersStrip = ({ partners }: { partners: Partner[] }) => {
  const featured = partners.filter((partner) => partner.featured).slice(0, 6);
  if (featured.length === 0) return null;

  return (
    <div className="border-t border-white/8 pt-10">
      <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
        Nasi partnerzy
      </p>
      <div className="grid grid-cols-3 items-center gap-8 md:grid-cols-6">
        {featured.map((partner) => (
          <a
            key={partner.id}
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center opacity-40 grayscale transition duration-200 hover:opacity-[0.82] hover:-translate-y-0.5"
            style={{ filter: 'grayscale(1)' }}
          >
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-h-8 max-w-full object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────────────────── */

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
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.10),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.04),transparent_24%)]" />

        <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-center lg:py-16">
            <div>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="h-px w-3 bg-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
                  Platforma sportowa
                </span>
              </div>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.06] tracking-tight text-white md:text-5xl">
                Znajdz wydarzenie. Zapisz sie. Sprawdz wyniki.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/45">
                Biegi, kolarstwo, triathlon i wiecej. Jedna platforma, wszystkie sportowe emocje.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                  className="gap-2 border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.10]"
                >
                  <Link to="/wyniki">
                    <Trophy className="h-4 w-4" />
                    Sprawdz wyniki
                  </Link>
                </Button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: <Radio className="h-3.5 w-3.5" />, title: 'Trwaja teraz', value: view.counts.active },
                  { icon: <Clock3 className="h-3.5 w-3.5" />, title: 'Koncza sie zapisy', value: view.counts.closing },
                  { icon: <CalendarDays className="h-3.5 w-3.5" />, title: 'Najblizsze starty', value: view.counts.upcoming },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-white/8 bg-white/[0.025] px-4 py-3.5"
                  >
                    <div className="mb-1.5 text-primary/70">{item.icon}</div>
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <div className="text-xs text-white/35">{item.value} wydarzen</div>
                  </div>
                ))}
              </div>
            </div>

            {hero && (
              <Link
                to={`/events/${hero.slug}`}
                className="group w-full max-w-[440px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/40 lg:justify-self-end"
              >
                <div className="relative min-h-[400px]">
                  <img
                    src={eventImage(hero)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/40 to-transparent" />
                  <div className="absolute left-4 top-4 rounded border border-white/10 bg-[#080d15]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/55">
                    Wyroznione
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{hero.name}</h2>
                    <div className="mt-3">
                      <EventMeta event={hero} />
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-3 border-white/12 bg-transparent text-white/55"
                    >
                      {disciplineLabels[hero.discipline]}
                    </Badge>
                    <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3.5 text-sm">
                      <span className={registrationLabel(hero) === 'Zapisy otwarte' ? 'text-emerald-400' : 'text-white/40'}>
                        {registrationLabel(hero)}
                      </span>
                      <span className="text-white/35">{deadlineText(hero)}</span>
                    </div>
                    <div className="mt-4 flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition group-hover:border-white/20 group-hover:bg-white/[0.07]">
                      Zobacz wydarzenie
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </section>

          {/* ── Wyróżnione wydarzenia ─────────────────────────────────────── */}
          <section className="mt-4">
            <SectionTitle title="Wyroznione wydarzenia" linkTo="/wydarzenia" linkLabel="Zobacz wszystkie" />
            <div className="grid gap-4 md:grid-cols-3">
              {view.featured.map((event) => (
                <FeaturedCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          {/* ── Najważniejsze teraz ───────────────────────────────────────── */}
          <section className="mt-16">
            <SectionTitle title="Najwazniejsze teraz" />
            <div className="grid gap-4 lg:grid-cols-3">
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

          {/* ── Nadchodzące wydarzenia ────────────────────────────────────── */}
          <section className="mt-16">
            <SectionTitle
              title="Nadchodzace wydarzenia"
              linkTo="/wydarzenia"
              linkLabel="Zobacz wszystkie wydarzenia"
            />
            <UpcomingTable events={view.upcoming} />
          </section>

          {/* ── CTA organizatorzy ─────────────────────────────────────────── */}
          <section className="mt-16">
            <div className="flex flex-col gap-4 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Organizujesz wydarzenie?</h2>
                  <p className="mt-0.5 text-sm text-white/40">
                    Stworz zapisy, zbieraj platnosci i publikuj wyniki w jednym miejscu.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="shrink-0 border-white/15 bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white md:min-w-48"
              >
                <Link to="/organizer">
                  Dla organizatorow
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          {/* ── Partnerzy ─────────────────────────────────────────────────── */}
          <section className="mt-16 pb-4">
            <PartnersStrip partners={partners} />
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Index;
