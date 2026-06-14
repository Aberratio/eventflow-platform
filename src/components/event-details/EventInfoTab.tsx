import { Event, EventLogisticsInfo } from '@/types';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

type LogisticsKey = keyof EventLogisticsInfo;

const LOGISTICS_DISPLAY: {
  key: LogisticsKey;
  icon: React.ReactNode;
  label: string;
  locationLabel: string;
}[] = [
  {
    key: 'parking',
    icon: <ParkingSquare className="h-4 w-4" />,
    label: 'Parkingi',
    locationLabel: 'Parking',
  },
  {
    key: 'changingRooms',
    icon: <ShirtIcon className="h-4 w-4" />,
    label: 'Szatnie',
    locationLabel: 'Szatnia',
  },
  {
    key: 'luggage',
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Depozyty bagażu',
    locationLabel: 'Depozyt',
  },
  {
    key: 'toilets',
    icon: <Toilet className="h-4 w-4" />,
    label: 'Toalety',
    locationLabel: 'Punkt toaletowy',
  },
  {
    key: 'buffet',
    icon: <Coffee className="h-4 w-4" />,
    label: 'Bufet / napoje',
    locationLabel: 'Punkt odżywczy',
  },
  {
    key: 'meals',
    icon: <Utensils className="h-4 w-4" />,
    label: 'Posiłki / catering',
    locationLabel: 'Punkt',
  },
  {
    key: 'medicalPoint',
    icon: <HeartPulse className="h-4 w-4" />,
    label: 'Punkt medyczny',
    locationLabel: 'Punkt medyczny',
  },
  {
    key: 'showers',
    icon: <ShowerHead className="h-4 w-4" />,
    label: 'Prysznice',
    locationLabel: 'Prysznice',
  },
  {
    key: 'merchandise',
    icon: <ShoppingBag className="h-4 w-4" />,
    label: 'Gadżety / merchandise',
    locationLabel: 'Strefa',
  },
  {
    key: 'baggage',
    icon: <Package className="h-4 w-4" />,
    label: 'Pakiety startowe',
    locationLabel: 'Punkt odbioru',
  },
  {
    key: 'raceOffice',
    icon: <ClipboardList className="h-4 w-4" />,
    label: 'Biuro zawodów',
    locationLabel: 'Termin biura',
  },
  {
    key: 'timeMeasurement',
    icon: <Timer className="h-4 w-4" />,
    label: 'Pomiar czasu',
    locationLabel: 'Punkt',
  },
  {
    key: 'awardsClassifications',
    icon: <Trophy className="h-4 w-4" />,
    label: 'Nagrody i klasyfikacje',
    locationLabel: 'Punkt',
  },
  {
    key: 'additionalInfo',
    icon: <Info className="h-4 w-4" />,
    label: 'Dodatkowe informacje',
    locationLabel: 'Punkt',
  },
];

type InfoSectionTone = 'amber' | 'sky' | 'emerald' | 'violet' | 'rose' | 'slate';

const INFO_SECTION_TONES: Record<InfoSectionTone, string> = {
  amber: 'border-l-amber-400 shadow-[inset_3px_0_0_rgba(251,191,36,0.95)]',
  sky: 'border-l-sky-500 shadow-[inset_3px_0_0_rgba(14,165,233,0.95)]',
  emerald: 'border-l-emerald-500 shadow-[inset_3px_0_0_rgba(16,185,129,0.95)]',
  violet: 'border-l-violet-500 shadow-[inset_3px_0_0_rgba(139,92,246,0.95)]',
  rose: 'border-l-rose-500 shadow-[inset_3px_0_0_rgba(244,63,94,0.95)]',
  slate: 'border-l-slate-400 shadow-[inset_3px_0_0_rgba(148,163,184,0.95)]',
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

const LogisticsInfoSection = ({ info }: { info: EventLogisticsInfo }) => {
  const visible = LOGISTICS_DISPLAY.filter(
    (f) => info[f.key]?.status === 'yes' || info[f.key]?.status === 'no',
  );
  if (visible.length === 0) return null;

  return (
    <InfoSection
      title="Logistyka zawodów"
      icon={<ClipboardList className="h-4 w-4" />}
      tone="emerald"
    >
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
                <span className="text-muted-foreground/80">{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
                {isYes ? (
                  <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
              </div>

              {isYes && field.infoHtml && (
                <RichTextDisplay html={field.infoHtml} className="text-sm text-muted-foreground" />
              )}

              {isYes && field.locations && field.locations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {field.locations.map((loc, idx) => (
                    <div key={loc.id} className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <span className="font-medium">
                          {loc.label || `${f.locationLabel} ${idx + 1}`}
                        </span>
                        {loc.address && (
                          <p className="text-xs text-muted-foreground">{loc.address}</p>
                        )}
                        {(loc.date || loc.openFrom || loc.openTo) && (
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {loc.date && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {loc.date}
                              </span>
                            )}
                            {(loc.openFrom || loc.openTo) && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {[loc.openFrom, loc.openTo].filter(Boolean).join(' - ')}
                              </span>
                            )}
                          </div>
                        )}
                        {loc.note && (
                          <p className="mt-1 text-xs text-muted-foreground">{loc.note}</p>
                        )}
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
}

export const EventInfoTab = ({ event }: EventInfoTabProps) => (
  <div className="space-y-6">
    <InfoSection title="O wydarzeniu" icon={<Info className="h-4 w-4" />} tone="amber">
      <RichTextDisplay html={event.description} className="text-muted-foreground" />
    </InfoSection>

    {event.organizersHtml && (
      <InfoSection title="Organizatorzy" icon={<Users className="h-4 w-4" />} tone="sky">
        <RichTextDisplay html={event.organizersHtml} />
      </InfoSection>
    )}

    {event.rulesHtml && (
      <InfoSection title="Regulamin" icon={<FileText className="h-4 w-4" />} tone="slate">
        <RichTextDisplay html={event.rulesHtml} />
      </InfoSection>
    )}

    {event.logisticsInfo && <LogisticsInfoSection info={event.logisticsInfo} />}

    {!event.organizersHtml && (
      <InfoSection title="Lokalizacja" icon={<MapPin className="h-4 w-4" />} tone="sky">
        <p className="text-muted-foreground">
          {event.location}, {event.city}
        </p>
      </InfoSection>
    )}

    {event.insuranceOption?.enabled && (
      <InfoSection title="Ubezpieczenie NNW" icon={<Shield className="h-4 w-4" />} tone="rose">
        <p className="text-sm text-muted-foreground">
          Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
        </p>
      </InfoSection>
    )}

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

    <InfoSection title="Organizator" icon={<Globe className="h-4 w-4" />} tone="slate">
      {!event.organizersHtml && <p className="mb-3 font-medium">{event.organizerName}</p>}
      {event.organizerContact && (
        <div className="space-y-2">
          <a
            href={`mailto:${event.organizerContact.email}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            {event.organizerContact.email}
          </a>
          {event.organizerContact.phone && (
            <a
              href={`tel:${event.organizerContact.phone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {event.organizerContact.website.replace('https://', '')}
            </a>
          )}
        </div>
      )}
    </InfoSection>
  </div>
);
