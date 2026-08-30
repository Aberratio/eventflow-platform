import {
  getEventBySlug,
  getPublicStartList,
  getRegistrationsByEvent,
  getResultsByEvent,
} from '@/api';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Globe,
  Radio,
  Images,
  Route,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import type { Event } from '@/types';
import { toast } from '@/hooks/use-toast';
import { LiveResultsEmbed } from '@/components/LiveResultsEmbed';
import { GalleryAlbumsList } from '@/components/GalleryAlbumsList';
import { RouteMap } from '@/components/RouteMap';
import {
  DraftBanner,
  PrivateBanner,
  CancelledBanner,
  ModerationReviewBar,
  ResultsSection,
  EventHeroBanner,
  EventSidebar,
  EventInfoTab,
  EventDistancesTab,
  EventStartListTab,
  ExternalRegistrationFrame,
  getEditUrl,
  isExternalRegistrationActive,
  isExternalRegistrationEvent,
} from '@/components/event-details';

interface EventDetailsPageProps {
  previewMode?: boolean;
}

const EventDetailsPage = ({ previewMode = false }: EventDetailsPageProps) => {
  const { slug, tab } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const activeTab = tab || searchParams.get('tab') || 'info';
  const setActiveTab = (value: string) => {
    const base = previewMode ? `/events/${slug}/preview` : `/events/${slug}`;
    navigate(`${base}/${value}`, { replace: true });
  };
  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event-by-slug', slug],
    queryFn: () => getEventBySlug(slug || ''),
    enabled: Boolean(slug),
  });
  const event = eventResponse?.data ?? null;

  const { data: registrationsResponse } = useQuery({
    queryKey: ['event-registrations', event?.id],
    queryFn: () => getRegistrationsByEvent(event!.id),
    enabled: Boolean(event?.id) && isAuthenticated,
  });
  const eventRegistrations = registrationsResponse?.data ?? [];

  const { data: startListResponse } = useQuery({
    queryKey: ['event-start-list', event?.id],
    queryFn: () => getPublicStartList(event!.id),
    enabled: Boolean(event?.id) && !previewMode,
  });
  const startListRegistrations = previewMode
    ? eventRegistrations.filter((r) => r.status !== 'removed' && r.status !== 'cancelled')
    : (startListResponse?.data ?? []);

  const { data: resultsResponse } = useQuery({
    queryKey: ['event-results', event?.id],
    queryFn: () => getResultsByEvent(event!.id),
    enabled: Boolean(event?.id),
  });
  const eventResults = resultsResponse?.data ?? [];

  const nonPublicStatuses: Array<Event['publicationStatus']> = ['draft', 'submitted', 'rejected'];
  const isUnpublished = event && nonPublicStatuses.includes(event.publicationStatus);
  const isAdminLike = user?.role === 'admin' || user?.role === 'superadmin';
  const isModeratorLike = isAdminLike || user?.role === 'moderator';
  // A moderator has no access to a Szkic (draft) — their access starts at `submitted`
  // (spec 08, "Co widzi każda rola"). Admins keep full access to every status.
  const canViewDraft =
    isAdminLike ||
    (user?.role === 'moderator' && event?.publicationStatus !== 'draft') ||
    (user?.role === 'organizer' && event?.organizerId === user?.id);

  const accessCodeFromUrl = searchParams.get('access');
  const isPrivateEvent = event?.visibility === 'private';
  const isCancelled = event?.publicationStatus === 'cancelled';

  const hasPrivateAccess = (() => {
    if (!isPrivateEvent || !event) return !isPrivateEvent;
    if (isAdminLike || user?.role === 'moderator') return true;
    if (user?.role === 'organizer' && event.organizerId === user?.id) return true;
    if (isAuthenticated && eventRegistrations.some((r) => r.userId === user?.id)) return true;
    if (accessCodeFromUrl && accessCodeFromUrl === event.accessCode) {
      sessionStorage.setItem(`private-event-${event.id}`, accessCodeFromUrl);
      return true;
    }
    const storedCode = sessionStorage.getItem(`private-event-${event.id}`);
    return storedCode === event.accessCode;
  })();

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Ładowanie wydarzenia...</p>
        </div>
      </Layout>
    );
  }

  if (
    !event ||
    (previewMode && !canViewDraft) ||
    (isUnpublished && !canViewDraft) ||
    (isPrivateEvent && !hasPrivateAccess)
  ) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Wydarzenie nie zostało znalezione</h1>
          <Button asChild>
            <Link to="/events">Wróć do listy wydarzeń</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isClosedByOrganizer = event.registrationStatus === 'closed';
  const registrationStartDate = event.registrationEmbed?.startDate
    ? new Date(event.registrationEmbed.startDate)
    : null;
  const registrationNotStarted =
    event.registrationStatus === 'none' ||
    (registrationStartDate !== null && registrationStartDate > new Date());
  const allDistancesFull =
    event.distances.length > 0 &&
    event.distances.every((d) => d.limit != null && d.registeredCount >= d.limit);
  const isPreview = previewMode;
  const detailsUrl = getEditUrl(event, user);
  const isRegistrationOpen = isPreview
    ? event.distances.length > 0 && !allDistancesFull
    : !isPast &&
      !deadlinePassed &&
      !isClosedByOrganizer &&
      !registrationNotStarted &&
      !allDistancesFull;
  const hasExternalRegistration = isExternalRegistrationEvent(event);
  const externalRegistrationActive = hasExternalRegistration
    ? isExternalRegistrationActive(event)
    : false;
  const canUseRegistration = hasExternalRegistration
    ? isRegistrationOpen && externalRegistrationActive
    : isRegistrationOpen;

  const daysUntilDeadline = Math.ceil(
    (new Date(event.registrationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const getRegistrationStatusBadge = () => {
    if (isPast) return null;
    if (isClosedByOrganizer)
      return {
        label: 'Zapisy zamknięte',
        icon: XCircle,
        cls: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
    if (registrationNotStarted)
      return {
        label: 'Zapisy wkrótce',
        icon: Clock,
        cls: 'border-primary/30 bg-primary/10 text-primary',
      };
    if (allDistancesFull)
      return {
        label: 'Wszystkie miejsca zajęte',
        icon: XCircle,
        cls: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
    if (deadlinePassed)
      return {
        label: 'Zapisy zakończone',
        icon: XCircle,
        cls: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
    if (daysUntilDeadline <= 3)
      return {
        label: `Zapisy kończą się za ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'dzień' : 'dni'}`,
        icon: AlertCircle,
        cls: 'border-warning/30 bg-warning/10 text-warning',
      };
    return {
      label: 'Zapisy otwarte',
      icon: CheckCircle2,
      cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    };
  };

  const registrationStatusBadge = getRegistrationStatusBadge();

  const getClosedReason = (): string | null => {
    if (isPast) return 'Zawody już się odbyły';
    if (deadlinePassed)
      return `Termin zapisów minął (${format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })})`;
    if (isClosedByOrganizer) return 'Zapisy zamknięte przez organizatora';
    if (registrationNotStarted) return 'Zapisy jeszcze nieaktywne';
    if (allDistancesFull) return 'Wszystkie miejsca zajęte';
    return null;
  };

  const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
  const manageSettingsUrl =
    user?.role === 'admin' || user?.role === 'superadmin'
      ? `/admin/events/${event.id}?tab=settings`
      : user?.role === 'moderator'
        ? `/moderator/events/${event.id}/settings`
        : `/organizer/events/${event.id}/settings`;

  const userRegistration = isAuthenticated
    ? (eventRegistrations.find((r) => r.userId === user?.id) ?? null)
    : null;

  const showLiveResultsTab = !isPast && event.liveResultsUrl;
  const showResultsTab =
    isPast || event.publicationStatus === 'published' || event.publicationStatus === 'finished';

  const handleRegister = () => {
    if (hasExternalRegistration) {
      document.getElementById('zapisy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (isPreview) {
      navigate(`/events/${slug}/register/preview`);
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Wymagane logowanie',
        description: 'Zaloguj się, aby zapisać się na zawody.',
      });
      navigate('/login');
      return;
    }
    navigate(`/events/${slug}/register`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link skopiowany',
      description: 'Link do wydarzenia został skopiowany do schowka.',
    });
  };

  const registrationClosedReason =
    hasExternalRegistration && !externalRegistrationActive
      ? 'Zewnętrzny formularz zapisów nie jest teraz aktywny'
      : getClosedReason();

  return (
    <Layout>
      {isCancelled && <CancelledBanner event={event} />}
      {isModeratorLike && isUnpublished ? (
        <ModerationReviewBar event={event} />
      ) : isPreview ? (
        <PreviewBanner detailsUrl={detailsUrl} settingsUrl={manageSettingsUrl} />
      ) : (
        isUnpublished && <DraftBanner event={event} user={user} />
      )}
      {isPrivateEvent && !isUnpublished && <PrivateBanner />}

      <EventHeroBanner event={event} isPast={isPast} />

      <div className="relative -mt-28 bg-[radial-gradient(circle_at_15%_12%,rgba(38,116,217,0.14),transparent_30%),radial-gradient(circle_at_82%_32%,rgba(245,158,11,0.08),transparent_24%)] pb-10">
        <div className="container py-5 sm:py-8">
          <div className="space-y-5 sm:space-y-8">
            {/* Stats Strip */}
            <Card className="border-white/10 bg-white/[0.045] shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
              <CardContent className="pt-5 sm:pt-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  <StatItem
                    icon={<Calendar className="h-5 w-5 text-warning" />}
                    label={event.isVirtual ? 'Okno startowe' : 'Data'}
                    value={
                      event.isVirtual && event.startDate && event.endDate
                        ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
                        : format(new Date(event.date), 'd MMMM yyyy', { locale: pl })
                    }
                  />
                  <StatItem
                    icon={
                      event.isVirtual ? (
                        <Globe className="h-5 w-5 text-warning" />
                      ) : (
                        <MapPin className="h-5 w-5 text-warning" />
                      )
                    }
                    label={event.isVirtual ? 'Zasięg' : 'Miejsce'}
                    value={event.isVirtual ? 'Cały świat' : event.city}
                  />
                  <StatItem
                    icon={<Users className="h-5 w-5 text-warning" />}
                    label="Zapisanych"
                    value={totalParticipants.toLocaleString()}
                  />
                  <StatItem
                    icon={<Clock className="h-5 w-5 text-warning" />}
                    label="Zapisy do"
                    value={format(new Date(event.registrationDeadline), 'd MMM yyyy', {
                      locale: pl,
                    })}
                  />
                </div>

                {registrationStatusBadge && (
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${registrationStatusBadge.cls}`}
                    >
                      <registrationStatusBadge.icon className="h-4 w-4 shrink-0" />
                      {registrationStatusBadge.label}
                    </span>
                  </div>
                )}

                {event.isVirtual && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Wydarzenie wirtualne</p>
                        <p className="text-sm text-foreground/70">
                          Wykonaj aktywność samodzielnie w dowolnym miejscu na świecie, a następnie
                          wprowadź swój wynik w panelu uczestnika.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasExternalRegistration && (
              <ExternalRegistrationFrame
                event={event}
                active={canUseRegistration}
                closedReason={registrationClosedReason}
              />
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/5 bg-white/[0.035] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] [&_button[data-state=inactive]]:text-foreground/60">
                <TabsTrigger
                  value="info"
                  className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                >
                  Informacje
                </TabsTrigger>
                {event.routeMapUrl && (
                  <TabsTrigger
                    value="route"
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                  >
                    <Route className="mr-1 h-4 w-4" />
                    Trasa
                  </TabsTrigger>
                )}
                {event.galleryAlbums && event.galleryAlbums.length > 0 && (
                  <TabsTrigger
                    value="gallery"
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                  >
                    <Images className="mr-1 h-4 w-4" />
                    Galeria
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="distances"
                  className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                >
                  Dystanse
                </TabsTrigger>
                {!(isPast && eventResults.length > 0) || canViewDraft ? (
                  <TabsTrigger
                    value="startlist"
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                  >
                    Lista startowa
                  </TabsTrigger>
                ) : null}
                {showLiveResultsTab && (
                  <TabsTrigger
                    value="live"
                    className="text-destructive data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Radio className="mr-1 h-4 w-4" />
                    Na żywo
                  </TabsTrigger>
                )}
                {showResultsTab && (
                  <TabsTrigger
                    value="results"
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-[-7px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                  >
                    Wyniki
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="mt-6 grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
                <div className="min-w-0">
                  <TabsContent value="info" className="mt-0">
                    <EventInfoTab
                      event={event}
                      isPast={isPast}
                      eventResults={eventResults}
                      onGoToResults={() => setActiveTab('results')}
                    />
                  </TabsContent>

                  {event.routeMapUrl && (
                    <TabsContent value="route" className="mt-0">
                      <RouteMap
                        mapUrl={event.routeMapUrl}
                        elevationProfileUrl={event.routeElevationProfile}
                        gpxUrl={event.routeGpxUrl}
                        distanceInfo={
                          event.distances.length > 0
                            ? {
                                length: event.distances[0].length,
                                unit: event.distances[0].unit,
                                elevation: '+4500m',
                              }
                            : undefined
                        }
                      />
                    </TabsContent>
                  )}

                  {event.galleryAlbums && event.galleryAlbums.length > 0 && (
                    <TabsContent value="gallery" className="mt-0">
                      <GalleryAlbumsList albums={event.galleryAlbums} />
                    </TabsContent>
                  )}

                  <TabsContent value="distances" className="mt-0">
                    <EventDistancesTab event={event} />
                  </TabsContent>

                  <TabsContent value="startlist" className="mt-0">
                    <EventStartListTab
                      event={event}
                      registrations={startListRegistrations}
                      overrideShowAll={isPreview ? true : undefined}
                      sidebarEnabled={activeTab === 'startlist'}
                    />
                  </TabsContent>

                  {showLiveResultsTab && (
                    <TabsContent value="live" className="mt-0">
                      <LiveResultsEmbed url={event.liveResultsUrl} eventName={event.name} />
                    </TabsContent>
                  )}

                  {showResultsTab && (
                    <TabsContent value="results" className="mt-0 space-y-6">
                      <ResultsSection event={event} eventResults={eventResults} />
                    </TabsContent>
                  )}
                </div>

                <EventSidebar
                  event={event}
                  user={user}
                  userRegistration={userRegistration}
                  isRegistrationOpen={canUseRegistration}
                  closedReason={registrationClosedReason}
                  onRegister={handleRegister}
                  onShare={handleShare}
                  previewMode={isPreview}
                  hideRegistrationCard={activeTab === 'startlist'}
                  isPast={isPast}
                  eventResults={eventResults}
                  onGoToResults={() => setActiveTab('results')}
                />
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

/** Small stat widget used in the event stats strip */
const StatItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-warning/15 bg-warning/10 shadow-[0_0_22px_rgba(245,158,11,0.12)]">
      {icon}
    </div>
    <div>
      <div className="text-sm leading-tight text-foreground/65">{label}</div>
      <div className="mt-0.5 font-semibold leading-tight text-foreground">{value}</div>
    </div>
  </div>
);

const PreviewBanner = ({
  detailsUrl,
  settingsUrl,
}: {
  detailsUrl: string;
  settingsUrl: string;
}) => (
  <div className="border-b border-primary/20 bg-primary/10 text-primary">
    <div className="container flex flex-col gap-2 py-2 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          To jest tylko podgląd strony wydarzenia w widoku uczestnika. Dane nie są publikowane ani
          zapisywane z tego ekranu; służą do sprawdzenia treści, formularza i wgranych materiałów.
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 w-fit border-primary/30 bg-background/80 text-foreground hover:bg-accent"
        >
          <Link to={detailsUrl}>Wróć do szczegółów</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 w-fit border-primary/30 bg-background/80 text-foreground hover:bg-accent"
        >
          <Link to={settingsUrl}>Ustawienia</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default EventDetailsPage;
