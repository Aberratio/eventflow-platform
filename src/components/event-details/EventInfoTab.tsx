import { Card, CardContent } from '@/components/ui/card';
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

const LogisticsInfoSection = ({ info }: { info: EventLogisticsInfo }) => {
  const visible = LOGISTICS_DISPLAY.filter(
    (f) => info[f.key]?.status === 'yes' || info[f.key]?.status === 'no',
  );
  if (visible.length === 0) return null;

  return (
    <div>
      <h4 className="mb-3 font-semibold">Logistyka zawodów</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((f) => {
          const field = info[f.key]!;
          const isYes = field.status === 'yes';
          return (
            <div key={f.key} className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{f.icon}</span>
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
    </div>
  );
};

interface EventInfoTabProps {
  event: Event;
}

export const EventInfoTab = ({ event }: EventInfoTabProps) => (
  <Card>
    <CardContent className="space-y-6 pt-6">
      <div>
        <h3 className="mb-4 font-semibold">O wydarzeniu</h3>
        <RichTextDisplay html={event.description} className="text-muted-foreground" />
      </div>

      {event.organizersHtml && (
        <div>
          <h4 className="mb-3 font-semibold">Organizatorzy</h4>
          <RichTextDisplay html={event.organizersHtml} />
        </div>
      )}

      {event.rulesHtml && (
        <div>
          <h4 className="mb-3 font-semibold">Regulamin</h4>
          <RichTextDisplay html={event.rulesHtml} />
        </div>
      )}

      {event.logisticsInfo && <LogisticsInfoSection info={event.logisticsInfo} />}

      {!event.organizersHtml && (
        <div>
          <h4 className="mb-2 font-semibold">Lokalizacja</h4>
          <p className="text-muted-foreground">
            {event.location}, {event.city}
          </p>
        </div>
      )}

      {event.insuranceOption?.enabled && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Ubezpieczenie NNW
          </h4>
          <p className="text-sm text-muted-foreground">
            Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
          </p>
        </div>
      )}

      {event.enableMerchandiseInRegistration &&
        event.merchandise &&
        event.merchandise.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Gadżety dostępne przy rejestracji
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {event.merchandise.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-2"
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
          </div>
        )}

      <div>
        <h4 className="mb-3 font-semibold">Organizator</h4>
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
      </div>
    </CardContent>
  </Card>
);
