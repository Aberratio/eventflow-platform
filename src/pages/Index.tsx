import { safeUrl } from '@/lib/safeUrl';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CalendarDays,
  Check,
  Flag,
  MapPin,
  MoreHorizontal,
  PersonStanding,
  Search,
  Waves,
} from 'lucide-react';
import { differenceInCalendarDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

import { getFeaturedPartners } from '@/api';
import { getAllEvents } from '@/api/allEvents';
import { Layout } from '@/components/layout/Layout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { SectionHeading } from '@/components/ui/section-heading';
import { EventImageCard } from '@/components/ui/event-image-card';
import { EventTable, EventTableRow } from '@/components/ui/event-table';
import { PageBg, PageContent } from '@/components/ui/page-bg';
import { QUERY_KEYS } from '@/constants';
import type { Event, Partner, SportDiscipline } from '@/types';
import { cn } from '@/lib/utils';

const disciplineLabels: Record<SportDiscipline, string> = {
  running: 'Bieganie',
  cycling: 'Kolarstwo',
  triathlon: 'Triathlon',
  multisport: 'Inne',
};

const disciplineFilters: Array<{
  key: SportDiscipline | 'ocr' | 'swimming';
  label: string;
  count: number;
  Icon: typeof PersonStanding;
}> = [
  { key: 'running', label: 'Bieganie', count: 128, Icon: PersonStanding },
  { key: 'cycling', label: 'Kolarstwo', count: 64, Icon: Bike },
  { key: 'triathlon', label: 'Triathlon', count: 32, Icon: Waves },
  { key: 'ocr', label: 'Biegi OCR', count: 19, Icon: PersonStanding },
  { key: 'swimming', label: 'Pływanie', count: 14, Icon: Waves },
  { key: 'multisport', label: 'Inne', count: 11, Icon: MoreHorizontal },
];

const today = new Date();

const toDate = (value?: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const eventDate = (event: Event) => toDate(event.startDate || event.date) ?? new Date(event.date);

// The API only ever returns published, non-private events, so what counts as upcoming is
// purely a question of the date. Re-deriving visibility here is what let this page and the
// calendar disagree about which events exist.
const isUpcoming = (event: Event) => isAfter(eventDate(event), today);

const registrationLabel = (event: Event) => {
  const deadline = toDate(event.registrationDeadline);
  if (event.registrationStatus === 'closed' || (deadline && isBefore(deadline, today)))
    return 'Zapisy zamknięte';
  if (event.registrationStatus === 'none') return 'Wkrótce';
  return 'Zapisy otwarte';
};

const deadlineText = (event: Event) => {
  const deadline = toDate(event.registrationDeadline);
  if (!deadline) return 'Termin zapisów wkrótce';
  const days = differenceInCalendarDays(deadline, today);
  if (days < 0) return 'Zapisy zakończone';
  if (days === 0) return 'Kończy się dzisiaj';
  if (days === 1) return 'Kończy się za 1 dzień';
  return `Kończy się za ${days} dni`;
};

const spotsLeft = (event: Event) => {
  const limit = event.distances.reduce((sum, distance) => sum + (distance.limit ?? 0), 0);
  const paid = event.distances.reduce(
    (sum, distance) => sum + (distance.paidCount ?? distance.registeredCount ?? 0),
    0,
  );

  if (limit > paid) return limit - paid;
  return Math.max(18, (event.name.length * 7) % 90);
};

const minPrice = (event: Event) => {
  const prices = event.distances
    .map((distance) => distance.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
};

const distanceSummary = (event: Event) =>
  event.distances
    .slice(0, 2)
    .map((distance) => distance.name)
    .join(', ');

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

const EventMeta = ({ event, compact = false }: { event: Event; compact?: boolean }) => (
  <div
    className={cn(
      'text-white/54 flex flex-wrap items-center gap-x-3 gap-y-1',
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
    <span className="flex items-center gap-1.5">
      <DisciplineIcon discipline={event.discipline} size="sm" className="h-3.5 w-3.5" />
      {disciplineLabels[event.discipline]}
    </span>
  </div>
);

const HeroEventCard = ({ event }: { event: Event }) => (
  <div className="w-full lg:max-w-[430px] lg:justify-self-end">
    <Link
      to={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-lg border border-white/[0.12] shadow-2xl shadow-black/30"
      style={{ background: 'var(--page-bg-surface)' }}
    >
      <div className="relative min-h-[360px] overflow-hidden md:min-h-[420px] lg:min-h-[370px]">
        <img
          src={eventImage(event)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0" style={{ background: 'var(--overlay-card-fade)' }} />
        <Badge className="absolute left-5 top-5 border-emerald-400/20 bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          Zapisy otwarte
        </Badge>
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">{event.name}</h2>
          <div className="mt-3">
            <EventMeta event={event} compact />
          </div>
          <div className="text-white/52 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {distanceSummary(event) && <span>{distanceSummary(event)}</span>}
            <span>
              Zapisy do {shortDate(toDate(event.registrationDeadline) ?? eventDate(event))}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/55">Od {minPrice(event)} zł</span>
            <span className="text-white/25">•</span>
            <span className="font-medium text-emerald-400">
              Pozostało {spotsLeft(event)} miejsc
            </span>
          </div>
          <div
            className={cn(
              buttonVariants({ variant: 'primary' }),
              'mt-5 h-11 rounded-md text-sm font-bold group-hover:brightness-110',
            )}
          >
            Zobacz wydarzenie
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
    <div className="mt-4 flex items-center justify-center gap-3">
      <button className="border-white/8 flex h-9 w-9 items-center justify-center rounded-full border bg-white/[0.03] text-white/45 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex gap-1.5">
        <span className="h-1 w-8 rounded-full bg-white" />
        <span className="bg-white/18 h-1 w-3 rounded-full" />
        <span className="bg-white/18 h-1 w-3 rounded-full" />
        <span className="bg-white/18 h-1 w-3 rounded-full" />
      </div>
      <button className="border-white/8 flex h-9 w-9 items-center justify-center rounded-full border bg-white/[0.03] text-white/45 transition hover:text-white">
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const SearchPanel = ({
  query,
  setQuery,
  onSubmit,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => (
  <form
    onSubmit={onSubmit}
    className="mt-8 grid gap-2 rounded-lg border border-white/[0.12] p-2 shadow-xl shadow-black/10 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
    style={{ background: 'var(--glass-bg)' }}
  >
    <label className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-white/45 focus-within:bg-white/[0.03]">
      <Search className="h-4 w-4 shrink-0" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="placeholder:text-white/38 min-w-0 flex-1 bg-transparent text-white outline-none"
        placeholder="Szukaj wydarzenia, miasta lub dyscypliny..."
      />
    </label>
    <Link
      to="/wydarzenia"
      className="border-white/8 flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium text-white/65 transition hover:bg-white/[0.04] hover:text-white"
    >
      <MapPin className="h-4 w-4" />
      Lokalizacja
    </Link>
    <Link
      to="/wydarzenia"
      className="border-white/8 flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium text-white/65 transition hover:bg-white/[0.04] hover:text-white"
    >
      <CalendarDays className="h-4 w-4" />
      Termin
    </Link>
    <Button type="submit" variant="primary" className="h-11 rounded-md px-4 font-bold">
      <Search className="h-4 w-4" />
      Szukaj
    </Button>
  </form>
);

const DisciplineGrid = () => (
  <section className="mt-12">
    <SectionHeading
      title="Przeglądaj według dyscypliny"
      action={
        <Link
          to="/wydarzenia"
          className="hidden shrink-0 items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex"
        >
          Zobacz wszystkie dyscypliny
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {disciplineFilters.map(({ key, label, count, Icon }) => (
        <Link
          key={key}
          to={`/wydarzenia?discipline=${key}`}
          className="group flex min-h-[106px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] px-3 py-4 text-center transition hover:border-primary/50 hover:bg-primary/5"
        >
          <Icon className="h-8 w-8 text-primary transition group-hover:scale-105" />
          <h3 className="mt-3 text-sm font-bold text-white">{label}</h3>
          <p className="mt-0.5 text-xs text-white/45">{count} wydarzeń</p>
        </Link>
      ))}
    </div>
  </section>
);

const HomeEventImageCard = ({ event, mode }: { event: Event; mode: 'closing' | 'finished' }) => (
  <EventImageCard
    href={`/events/${event.slug}${mode === 'finished' ? '?tab=results' : ''}`}
    imageSrc={eventImage(event)}
    title={event.name}
    mode={mode}
    imageLabel={mode === 'closing' ? deadlineText(event) : undefined}
    meta={<EventMeta event={event} compact />}
    footer={
      mode === 'closing' ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/55">Od {minPrice(event)} zł</span>
          <span className="text-white/24">•</span>
          <span className="font-medium text-emerald-400">Pozostało {spotsLeft(event)} miejsc</span>
        </div>
      ) : undefined
    }
  />
);

const TABLE_HEADER_LABELS = ['Data', 'Wydarzenie', 'Dyscyplina', 'Miasto', 'Zapisy', 'Cena od', ''];

const UpcomingTableHeader = () => (
  <div className="grid grid-cols-[76px_1.4fr_150px_130px_150px_100px_28px] items-center gap-4 px-4 py-2.5">
    {TABLE_HEADER_LABELS.map((label) => (
      <span
        key={label}
        className="text-[10px] font-bold uppercase tracking-widest text-white/[0.28]"
      >
        {label}
      </span>
    ))}
  </div>
);

const UpcomingTable = ({ events }: { events: Event[] }) => (
  <EventTable header={<UpcomingTableHeader />}>
    {events.slice(0, 4).map((event) => {
      const tile = dateTile(eventDate(event));
      const open = registrationLabel(event) === 'Zapisy otwarte';

      return (
        <EventTableRow
          key={event.id}
          href={`/events/${event.slug}`}
          dateTile={tile}
          title={event.name}
          mobileMeta={`${event.city} • ${disciplineLabels[event.discipline]} • od ${minPrice(event)} zł`}
        >
          <div className="hidden md:block">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-[11px] font-medium text-primary"
            >
              {disciplineLabels[event.discipline]}
            </Badge>
          </div>
          <div className="hidden text-sm text-white/55 md:block">{event.city}</div>
          <div
            className={cn(
              'hidden text-sm font-medium md:flex md:items-center md:gap-2',
              open ? 'text-emerald-400' : 'text-white/35',
            )}
          >
            {open && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            {registrationLabel(event)}
          </div>
          <div className="hidden text-sm font-bold text-white md:block">{minPrice(event)} zł</div>
        </EventTableRow>
      );
    })}
  </EventTable>
);

const OrganizerCta = () => (
  <section className="mt-8">
    <div className="grid gap-5 rounded-lg border border-primary/30 bg-primary/10 p-5 md:grid-cols-[1fr_auto_210px] md:items-center md:p-6">
      <div className="flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/55 bg-primary/[0.08] text-primary">
          <Flag className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Organizujesz wydarzenie?</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/60">
            Stwórz zapisy, zbieraj płatności, zarządzaj listą startową i publikuj wyniki w jednym
            miejscu.
          </p>
        </div>
      </div>
      <div className="grid gap-2 text-sm text-white/70">
        {[
          'Łatwe tworzenie wydarzeń',
          'Zapisy online i płatności',
          'Lista startowa i komunikacja',
          'Wyniki na żywo i archiwalne',
        ].map((item) => (
          <span key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 rounded-full bg-primary text-primary-foreground" />
            {item}
          </span>
        ))}
      </div>
      <Button asChild className="h-11 w-full gap-2 font-bold md:w-auto">
        <Link to="/organizer/events">
          Dodaj wydarzenie
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  </section>
);

const PartnersStrip = ({ partners }: { partners: Partner[] }) => {
  const featured = partners.filter((partner) => partner.featured).slice(0, 6);
  if (featured.length === 0) return null;

  return (
    <section className="mt-8 pb-8">
      <p className="mb-5 text-sm font-semibold text-white/70">Nasi partnerzy</p>
      <div className="grid grid-cols-2 items-center gap-5 sm:grid-cols-3 md:grid-cols-6">
        {featured.map((partner) => (
          <a
            key={partner.id}
            href={safeUrl(partner.websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center opacity-45 grayscale transition duration-200 hover:-translate-y-0.5 hover:opacity-80"
          >
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-h-10 max-w-full object-contain"
            />
          </a>
        ))}
      </div>
    </section>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: eventsData } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getAllEvents(),
  });

  const { data: partnersData } = useQuery({
    queryKey: QUERY_KEYS.featuredPartners,
    queryFn: () => getFeaturedPartners(),
  });

  // No hard-coded fallback: this page used to invent a handful of events whenever the API
  // returned nothing, which is why the home page showed races the calendar had never heard
  // of. An empty database should look empty.
  const events = useMemo(() => eventsData ?? [], [eventsData]);
  const partners = useMemo(() => partnersData?.data ?? [], [partnersData?.data]);

  const view = useMemo(() => {
    const publicEvents = events;
    const upcoming = publicEvents.filter(isUpcoming).sort(byDateAsc);
    const closing = upcoming
      .filter((event) => registrationLabel(event) === 'Zapisy otwarte')
      .sort(
        (a, b) =>
          (toDate(a.registrationDeadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (toDate(b.registrationDeadline)?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );
    const finished = publicEvents
      .filter((event) => event.publicationStatus === 'finished')
      .sort(byDateDesc);
    const featured = publicEvents
      .filter((event) => event.featured && event.publicationStatus === 'published')
      .sort(byDateAsc);
    const fallbackFeatured = featured.length > 0 ? featured : upcoming;

    return {
      hero: fallbackFeatured[0] ?? publicEvents[0],
      closing: closing.length > 0 ? closing.slice(0, 4) : fallbackFeatured.slice(0, 4),
      finished: finished.slice(0, 4),
      upcoming,
    };
  }, [events]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`/wydarzenia${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <Layout>
      <PageBg>
        <PageContent>
          <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:items-start lg:py-8">
            <div className="pt-4 md:pt-8">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="h-px w-3 bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  Platforma sportowa
                </span>
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.06] tracking-tight text-white md:text-6xl">
                Znajdź swoje następne zawody.
              </h1>
              <p className="text-white/62 mt-5 max-w-md text-base leading-7 md:text-lg">
                Zapisy online, płatności, lista startowa i wyniki w jednym miejscu.
              </p>

              <SearchPanel query={query} setQuery={setQuery} onSubmit={handleSearch} />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
                <span className="mr-1">Popularne wyszukiwania:</span>
                {['Bieganie', 'Kolarstwo', 'Triathlon', 'Ten weekend', 'W pobliżu mnie'].map(
                  (item) => (
                    <Link
                      key={item}
                      to={`/wydarzenia?q=${encodeURIComponent(item)}`}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/55 transition hover:border-white/20 hover:text-white"
                    >
                      {item}
                    </Link>
                  ),
                )}
              </div>
            </div>

            {view.hero && <HeroEventCard event={view.hero} />}
          </section>

          <DisciplineGrid />

          <section className="mt-10">
            <SectionHeading
              title="Kończą się zapisy"
              accent="warning"
              action={
                <Link
                  to="/wydarzenia"
                  className="hidden shrink-0 items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex"
                >
                  Zobacz wszystkie
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {view.closing.map((event) => (
                <HomeEventImageCard key={event.id} event={event} mode="closing" />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading
              title="Nadchodzące wydarzenia"
              action={
                <Link
                  to="/wydarzenia"
                  className="hidden shrink-0 items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex"
                >
                  Zobacz wszystkie
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <UpcomingTable events={view.upcoming} />
            <div className="mt-4 flex justify-center">
              <Button
                asChild
                variant="outline"
                className="min-w-64 border-white/15 bg-transparent text-white hover:bg-white/[0.06] hover:text-white"
              >
                <Link to="/wydarzenia">
                  Zobacz wszystkie wydarzenia
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading
              title="Ostatnio zakończone"
              accent="success"
              action={
                <Link
                  to="/events?status=past"
                  className="hidden shrink-0 items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex"
                >
                  Zobacz wszystkie wyniki
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {view.finished.map((event) => (
                <HomeEventImageCard key={event.id} event={event} mode="finished" />
              ))}
            </div>
          </section>

          <OrganizerCta />
          <PartnersStrip partners={partners} />
        </PageContent>
      </PageBg>
    </Layout>
  );
};

export default Index;
