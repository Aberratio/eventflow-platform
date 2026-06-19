import { Event, EventLogisticsInfo, EventDocumentType, EVENT_DOCUMENT_TYPE_LABELS, EventSponsor } from '@/types';
import { Result } from '@/types/result';
import {
  Mail,
  Phone,
  Globe,
  Shield,
  ShoppingBag,
  ParkingSquare,
  ShirtIcon,
  Briefcase,
  Toilet,
  Coffee,
  Utensils,
  HeartPulse,
  ShowerHead,
  Package,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Timer,
  Trophy,
  Info,
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  AlertCircle,
  Link2,
  Building2,
  ChevronRight,
  Medal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type LogisticsKey = keyof EventLogisticsInfo;

const LOGISTICS_DISPLAY: {
  key: LogisticsKey;
  icon: React.ReactNode;
  label: string;
  locationLabel: string;
}[] = [
  { key: 'parking', icon: <ParkingSquare className="h-4 w-4" />, label: 'Parkingi', locationLabel: 'Parking' },
  { key: 'changingRooms', icon: <ShirtIcon className="h-4 w-4" />, label: 'Szatnie', locationLabel: 'Szatnia' },
  { key: 'luggage', icon: <Briefcase className="h-4 w-4" />, label: 'Depozyty bagażu', locationLabel: 'Depozyt' },
  { key: 'toilets', icon: <Toilet className="h-4 w-4" />, label: 'Toalety', locationLabel: 'Punkt toaletowy' },
  { key: 'buffet', icon: <Coffee className="h-4 w-4" />, label: 'Bufet / napoje', locationLabel: 'Punkt odżywczy' },
  { key: 'meals', icon: <Utensils className="h-4 w-4" />, label: 'Posiłki / catering', locationLabel: 'Punkt' },
  { key: 'medicalPoint', icon: <HeartPulse className="h-4 w-4" />, label: 'Punkt medyczny', locationLabel: 'Punkt medyczny' },
  { key: 'showers', icon: <ShowerHead className="h-4 w-4" />, label: 'Prysznice', locationLabel: 'Prysznice' },
  { key: 'merchandise', icon: <ShoppingBag className="h-4 w-4" />, label: 'Gadżety / merchandise', locationLabel: 'Strefa' },
  { key: 'timeMeasurement', icon: <Timer className="h-4 w-4" />, label: 'Pomiar czasu', locationLabel: 'Punkt' },
  { key: 'awardsClassifications', icon: <Trophy className="h-4 w-4" />, label: 'Nagrody i klasyfikacje', locationLabel: 'Punkt' },
  { key: 'additionalInfo', icon: <Info className="h-4 w-4" />, label: 'Dodatkowe informacje', locationLabel: 'Punkt' },
];

type InfoSectionTone = 'amber' | 'sky' | 'emerald' | 'violet' | 'rose' | 'slate' | 'indigo' | 'orange';

const INFO_SECTION_TONES: Record<InfoSectionTone, string> = {
  amber: 'border-l-amber-400 shadow-[inset_3px_0_0_rgba(251,191,36,0.95)]',
  sky: 'border-l-sky-500 shadow-[inset_3px_0_0_rgba(14,165,233,0.95)]',
  emerald: 'border-l-emerald-500 shadow-[inset_3px_0_0_rgba(16,185,129,0.95)]',
  violet: 'border-l-violet-500 shadow-[inset_3px_0_0_rgba(139,92,246,0.95)]',
  rose: 'border-l-rose-500 shadow-[inset_3px_0_0_rgba(244,63,94,0.95)]',
  slate: 'border-l-slate-400 shadow-[inset_3px_0_0_rgba(148,163,184,0.95)]',
  indigo: 'border-l-indigo-500 shadow-[inset_3px_0_0_rgba(99,102,241,0.95)]',
  orange: 'border-l-orange-400 shadow-[inset_3px_0_0_rgba(251,146,60,0.95)]',
};

const InfoSection = ({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  tone: InfoSectionTone;
  children: React.ReactNode;
}) => (
  <section
    className={`overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-5 ${INFO_SECTION_TONES[tone]}`}
  >
    <div className="mb-4 flex items-center gap-2.5 border-b border-white/10 pb-4">
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-[0_0_18px_rgba(38,116,217,0.16)] ring-1 ring-primary/20">
          {icon}
        </span>
      )}
      <h3 className="text-base font-semibold leading-none text-foreground">{title}</h3>
    </div>
    <div>{children}</div>
  </section>
);

const LocationDetail = ({
  label,
  locationLabel,
  locations,
}: {
  label: string;
  locationLabel: string;
  locations: NonNullable<EventLogisticsInfo[LogisticsKey]>['locations'];
}) => {
  if (!locations || locations.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-1">
      {locations.map((loc, idx) => (
        <div key={loc.id} className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <span className="font-medium">{loc.label || `${locationLabel} ${idx + 1}`}</span>
            {loc.address && <p className="text-xs text-foreground/65">{loc.address}</p>}
            {(loc.date || loc.openFrom || loc.openTo) && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/65">
                {loc.date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {loc.date}
                  </span>
                )}
                {(loc.openFrom || loc.openTo) && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {[loc.openFrom, loc.openTo].filter(Boolean).join(' – ')}
                  </span>
                )}
              </div>
            )}
            {loc.note && <p className="mt-1 text-xs text-foreground/65">{loc.note}</p>}
            {loc.mapsUrl && (
              <a
                href={loc.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Zobacz na mapie <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const DOCUMENT_TYPE_ICONS: Record<EventDocumentType, React.ReactNode> = {
  regulamin: <FileText className="h-4 w-4" />,
  harmonogram: <Calendar className="h-4 w-4" />,
  mapa: <MapPin className="h-4 w-4" />,
  informacje: <Info className="h-4 w-4" />,
  wyniki: <Trophy className="h-4 w-4" />,
  inne: <FileText className="h-4 w-4" />,
};

const LogisticsInfoSection = ({ info }: { info: EventLogisticsInfo }) => {
  const visible = LOGISTICS_DISPLAY.filter(
    (f) => info[f.key]?.status === 'yes' || info[f.key]?.status === 'no',
  );
  if (visible.length === 0) return null;

  return (
    <InfoSection title="Logistyka zawodów" icon={<ClipboardList className="h-4 w-4" />} tone="emerald">
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((f) => {
          const field = info[f.key]!;
          const isYes = field.status === 'yes';
          return (
            <div
              key={f.key}
              className="space-y-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-foreground/60">{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
                {isYes ? (
                  <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
              </div>
              {isYes && field.infoHtml && (
                <RichTextDisplay html={field.infoHtml} className="text-sm text-foreground/70" />
              )}
              {isYes && (
                <LocationDetail
                  label={f.label}
                  locationLabel={f.locationLabel}
                  locations={field.locations}
                />
              )}
            </div>
          );
        })}
      </div>
    </InfoSection>
  );
};

interface EventInfoTabProps {
  event: Event;
  isPast?: boolean;
  eventResults?: Result[];
  onGoToResults?: () => void;
}

const MEDAL_COLORS = [
  'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]',
  'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.5)]',
  'text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]',
];

const ResultsAnnouncementBanner = ({
  onGoToResults,
}: {
  onGoToResults?: () => void;
}) => (
  <div className="relative overflow-hidden rounded-xl border border-yellow-400/25 bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-transparent p-5 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07]">
      <Trophy className="h-28 w-28 text-yellow-400" />
    </div>
    <div className="relative flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/15 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
        <Trophy className="h-6 w-6 text-yellow-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-tight text-foreground">
          Wyniki są już dostępne!
        </p>
        <p className="mt-0.5 text-sm text-foreground/65">
          Zawody się zakończyły — sprawdź pełne wyniki i klasyfikacje.
        </p>
      </div>
      {onGoToResults && (
        <button
          type="button"
          onClick={onGoToResults}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-sm font-semibold text-yellow-300 transition-colors hover:bg-yellow-400/20"
        >
          Zobacz wyniki
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);

const WinnersWidget = ({ results }: { results: Result[] }) => {
  const finished = results.filter((r) => r.status === 'finished');
  if (finished.length === 0) return null;

  const distances = Array.from(new Set(finished.map((r) => r.distanceName)));
  const manyDistancesOrCategories =
    distances.length > 2 ||
    Array.from(new Set(finished.map((r) => r.category))).length > 4;

  if (manyDistancesOrCategories) {
    // Jedno pierwsze miejsce z klasyfikacji generalnej każdego dystansu
    const generalWinners = distances
      .map((dist) => {
        const distResults = finished
          .filter((r) => r.distanceName === dist)
          .sort((a, b) => a.position - b.position);
        return distResults[0] ?? null;
      })
      .filter(Boolean) as Result[];

    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Zwycięzcy — klasyfikacja generalna
        </p>
        <div className="space-y-2">
          {generalWinners.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <Medal className="h-4 w-4 shrink-0 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{r.userName}</p>
                <p className="text-xs text-foreground/50">{r.distanceName}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-primary">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Kilka kategorii — top 3 z każdej
  const categories = Array.from(new Set(finished.map((r) => r.category))).filter(Boolean);
  if (categories.length === 0) {
    // Brak kategorii — top 3 ogółem
    const top3 = [...finished].sort((a, b) => a.position - b.position).slice(0, 3);
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Podium
        </p>
        <div className="space-y-2">
          {top3.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <Medal className={`h-4 w-4 shrink-0 ${MEDAL_COLORS[i]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{r.userName}</p>
                {r.distanceName && (
                  <p className="text-xs text-foreground/50">{r.distanceName}</p>
                )}
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-primary">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const top3 = finished
          .filter((r) => r.category === cat)
          .sort((a, b) => a.categoryPosition - b.categoryPosition)
          .slice(0, 3);
        if (top3.length === 0) return null;
        return (
          <div key={cat} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
              {cat}
            </p>
            <div className="space-y-1.5">
              {top3.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
                >
                  <Medal className={`h-4 w-4 shrink-0 ${MEDAL_COLORS[i]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{r.userName}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-primary">
                    {r.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const EventInfoTab = ({ event, isPast, eventResults, onGoToResults }: EventInfoTabProps) => {
  const hasResults = isPast && eventResults && eventResults.length > 0;
  const raceOffice = event.logisticsInfo?.raceOffice;
  const baggage = event.logisticsInfo?.baggage;

  const scheduleDoc = event.documents?.find((d) => d.type === 'harmonogram');
  const rulesDoc = event.documents?.find((d) => d.type === 'regulamin');
  const otherDocs = event.documents?.filter(
    (d) => d.type !== 'harmonogram' && d.type !== 'regulamin',
  ) ?? [];

  const hasRulesContent = event.rulesHtml || rulesDoc;
  const hasDocuments = event.documents && event.documents.length > 0;

  const totalLimit = event.distances.reduce<number | null>((acc, d) => {
    if (d.limit == null) return acc;
    return (acc ?? 0) + d.limit;
  }, null);

  const totalRegistered = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);

  return (
    <div className="space-y-6">
      {hasResults && (
        <ResultsAnnouncementBanner onGoToResults={onGoToResults} />
      )}

      {/* ── Najważniejsze przed startem ──────────────────────── */}
      <InfoSection
        title="Najważniejsze przed startem"
        icon={<AlertCircle className="h-4 w-4" />}
        tone="amber"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Data i godzina */}
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                {event.isVirtual ? 'Okno startowe' : 'Data startu'}
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {event.isVirtual && event.startDate && event.endDate
                  ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} – ${format(new Date(event.endDate), 'd MMM yyyy', { locale: pl })}`
                  : format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
              </p>
            </div>
          </div>

          {/* Lokalizacja */}
          {!event.isVirtual && (
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                  Miejsce startu
                </p>
                <p className="mt-0.5 text-sm font-semibold">{event.location}</p>
                <p className="text-xs text-foreground/60">{event.city}</p>
                {(event.locationMapsUrl || (raceOffice?.status === 'yes' && raceOffice.locations && raceOffice.locations.length > 0 && raceOffice.locations[0].mapsUrl)) && (
                  <a
                    href={event.locationMapsUrl || raceOffice!.locations![0].mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" />
                    Otwórz w Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Terminy rejestracji */}
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                Terminy rejestracji
              </p>
              {event.registrationOpenDate && (
                <p className="mt-0.5 text-sm">
                  <span className="text-foreground/55">Otwarcie: </span>
                  <span className="font-semibold">
                    {format(new Date(event.registrationOpenDate), 'd MMMM yyyy', { locale: pl })}
                  </span>
                </p>
              )}
              <p className="text-sm">
                <span className="text-foreground/55">Zamknięcie: </span>
                <span className="font-semibold">
                  {event.registrationUntilEventStart
                    ? `dzień startu (${format(new Date(event.date), 'd MMMM yyyy', { locale: pl })})`
                    : format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })}
                </span>
              </p>
            </div>
          </div>

          {/* Limit uczestników */}
          {totalLimit != null && (
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                  Limit uczestników
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {totalRegistered.toLocaleString()} / {totalLimit.toLocaleString()} miejsc
                </p>
                {event.distances.length > 1 && (
                  <div className="mt-1 space-y-0.5">
                    {event.distances
                      .filter((d) => d.limit != null)
                      .map((d) => (
                        <p key={d.id} className="text-xs text-foreground/60">
                          {d.name}: {d.registeredCount} / {d.limit}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Harmonogram (dokument) */}
          {scheduleDoc && (
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:col-span-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                  Harmonogram
                </p>
                <a
                  href={scheduleDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {scheduleDoc.name}
                </a>
              </div>
            </div>
          )}
        </div>
      </InfoSection>

      {/* ── O wydarzeniu ─────────────────────────────────────── */}
      <InfoSection title="O wydarzeniu" icon={<Info className="h-4 w-4" />} tone="sky">
        <RichTextDisplay html={event.description} className="text-foreground/75" />
      </InfoSection>

      {/* ── Biuro zawodów i pakiety startowe ─────────────────── */}
      {(raceOffice?.status === 'yes' || baggage?.status === 'yes') && (
        <InfoSection
          title="Biuro zawodów i pakiety startowe"
          icon={<Package className="h-4 w-4" />}
          tone="orange"
        >
          <div className="space-y-4">
            {raceOffice?.status === 'yes' && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/80">Biuro zawodów</p>
                {raceOffice.infoHtml && (
                  <RichTextDisplay html={raceOffice.infoHtml} className="mb-2 text-sm text-foreground/70" />
                )}
                <LocationDetail
                  label="Biuro zawodów"
                  locationLabel="Termin biura"
                  locations={raceOffice.locations}
                />
              </div>
            )}
            {baggage?.status === 'yes' && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/80">Odbiór pakietów startowych</p>
                {baggage.infoHtml && (
                  <RichTextDisplay html={baggage.infoHtml} className="mb-2 text-sm text-foreground/70" />
                )}
                <LocationDetail
                  label="Pakiety startowe"
                  locationLabel="Punkt odbioru"
                  locations={baggage.locations}
                />
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {/* ── Regulamin i dokumenty ────────────────────────────── */}
      {hasRulesContent && (
        <InfoSection
          title="Regulamin i dokumenty"
          icon={<FileText className="h-4 w-4" />}
          tone="slate"
        >
          <div className="space-y-4">
            {event.rulesHtml && (
              <RichTextDisplay html={event.rulesHtml} />
            )}
            {(rulesDoc || otherDocs.length > 0) && (
              <div className={event.rulesHtml ? 'border-t border-white/10 pt-4' : ''}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
                  Pliki do pobrania
                </p>
                <div className="space-y-1.5">
                  {rulesDoc && (
                    <DocumentRow doc={rulesDoc} />
                  )}
                  {otherDocs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {/* Dokumenty bez regulaminu gdy nie ma rulesHtml */}
      {!hasRulesContent && hasDocuments && (
        <InfoSection
          title="Dokumenty"
          icon={<FileText className="h-4 w-4" />}
          tone="slate"
        >
          <div className="space-y-1.5">
            {event.documents!.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </div>
        </InfoSection>
      )}

      {/* ── Logistyka zawodów ────────────────────────────────── */}
      {event.logisticsInfo && <LogisticsInfoSection info={event.logisticsInfo} />}

      {/* ── Organizatorzy ────────────────────────────────────── */}
      {event.organizersHtml && (
        <InfoSection title="Organizatorzy" icon={<Users className="h-4 w-4" />} tone="sky">
          <RichTextDisplay html={event.organizersHtml} />
        </InfoSection>
      )}

      {/* ── Ubezpieczenie NNW ────────────────────────────────── */}
      {event.insuranceOption?.enabled && (
        <InfoSection title="Ubezpieczenie NNW" icon={<Shield className="h-4 w-4" />} tone="rose">
          <p className="text-sm text-foreground/75">
            Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
          </p>
        </InfoSection>
      )}

      {/* ── Gadżety przy rejestracji ─────────────────────────── */}
      {event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0 && (
        <InfoSection
          title="Gadżety dostępne przy rejestracji"
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="violet"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {event.merchandise.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <span className="truncate text-sm">{item.name}</span>
                </div>
                <Badge variant="secondary">{item.price} zł</Badge>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {/* ── Kontakt ──────────────────────────────────────────── */}
      <InfoSection title="Kontakt z organizatorem" icon={<Mail className="h-4 w-4" />} tone="indigo">
        {!event.organizersHtml && <p className="mb-3 font-medium">{event.organizerName}</p>}

        {/* New multi-contact list */}
        {event.organizerInfo?.contacts && event.organizerInfo.contacts.length > 0 ? (
          <div className="space-y-4">
            {event.organizerInfo.contacts.map((contact, idx) => (
              <div key={idx} className="space-y-1.5">
                {contact.name && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                    {contact.name}
                  </p>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : event.organizerContact ? (
          /* Legacy single contact fallback */
          <div className="space-y-2">
            <a
              href={`mailto:${event.organizerContact.email}`}
              className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              {event.organizerContact.email}
            </a>
            {event.organizerContact.phone && (
              <a
                href={`tel:${event.organizerContact.phone}`}
                className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {event.organizerContact.phone}
              </a>
            )}
            {event.organizerContact.website && (
              <a
                href={event.organizerContact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {event.organizerContact.website.replace('https://', '')}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">{event.organizerName}</p>
        )}
      </InfoSection>

      {/* ── Sponsorzy ────────────────────────────────────────── */}
      {event.organizerInfo?.sponsors && event.organizerInfo.sponsors.length > 0 && (
        <InfoSection title="Sponsorzy i partnerzy" icon={<Link2 className="h-4 w-4" />} tone="violet">
          <div className="flex flex-wrap gap-3">
            {event.organizerInfo.sponsors.map((sponsor, idx) => (
              <SponsorBadge key={idx} sponsor={sponsor} />
            ))}
          </div>
        </InfoSection>
      )}
    </div>
  );
};

const SponsorBadge = ({ sponsor }: { sponsor: EventSponsor }) => {
  const inner = (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 transition-colors hover:bg-white/[0.06]">
      {sponsor.logoUrl && (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="h-6 w-auto max-w-[60px] object-contain opacity-90"
        />
      )}
      <span className="text-sm font-medium text-foreground/80">{sponsor.name}</span>
      {sponsor.url && <Link2 className="h-3.5 w-3.5 shrink-0 text-foreground/40" />}
    </div>
  );

  if (sponsor.url) {
    return (
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
};

const DocumentRow = ({ doc }: { doc: NonNullable<Event['documents']>[number] }) => (
  <a
    href={doc.fileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-2.5 transition-colors hover:bg-white/[0.06]"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      {DOCUMENT_TYPE_ICONS[doc.type]}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{doc.name}</p>
      <p className="text-xs text-foreground/50">{EVENT_DOCUMENT_TYPE_LABELS[doc.type]}</p>
    </div>
    <Download className="h-4 w-4 shrink-0 text-foreground/40" />
  </a>
);
