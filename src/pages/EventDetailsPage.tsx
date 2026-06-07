import { getEventBySlug, mockRegistrations, mockResults } from '@/api';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Clock, Globe, Radio, Images, Route, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LiveResultsEmbed } from '@/components/LiveResultsEmbed';
import { GalleryAlbumsList } from '@/components/GalleryAlbumsList';
import { RouteMap } from '@/components/RouteMap';
import {
  DraftBanner,
  PrivateBanner,
  ResultsSection,
  EventHeroBanner,
  EventSidebar,
  EventInfoTab,
  EventDistancesTab,
  EventStartListTab,
  getEditUrl,
} from '@/components/event-details';

interface EventDetailsPageProps {
  previewMode?: boolean;
}

const EventDetailsPage = ({ previewMode = false }: EventDetailsPageProps) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const defaultTab = searchParams.get('tab') || 'info';
  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event-by-slug', slug],
    queryFn: () => getEventBySlug(slug || ''),
    enabled: Boolean(slug),
  });
  const event = eventResponse?.data ?? null;

  const isUnpublished = event && event.status === 'draft';
  const isAdminLike = user?.role === 'admin' || user?.role === 'superadmin';
  const canViewDraft =
    isAdminLike ||
    user?.role === 'moderator' ||
    (user?.role === 'organizer' && event?.organizerId === user?.id);

  const accessCodeFromUrl = searchParams.get('access');
  const isPrivateEvent = event?.isPrivate;

  const hasPrivateAccess = (() => {
    if (!isPrivateEvent || !event) return !isPrivateEvent;
    if (isAdminLike || user?.role === 'moderator') return true;
    if (user?.role === 'organizer' && event.organizerId === user?.id) return true;
    if (
      isAuthenticated &&
      mockRegistrations.some((r) => r.eventId === event.id && r.userId === user?.id)
    )
      return true;
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
  const allDistancesFull =
    event.distances.length > 0 &&
    event.distances.every((d) => d.limit != null && d.registeredCount >= d.limit);
  const isDraftPreview = previewMode && Boolean(isUnpublished);
  const isRegistrationOpen = isDraftPreview
    ? event.distances.length > 0 && !allDistancesFull
    : !isPast && !deadlinePassed && !isClosedByOrganizer && !allDistancesFull;

  const getClosedReason = (): string | null => {
    if (isPast) return 'Zawody już się odbyły';
    if (deadlinePassed)
      return `Termin zapisów minął (${format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })})`;
    if (isClosedByOrganizer) return 'Zapisy zamknięte przez organizatora';
    if (allDistancesFull) return 'Wszystkie miejsca zajęte';
    return null;
  };

  const eventResults = mockResults.filter((r) => r.eventId === event.id);
  const eventRegistrations = mockRegistrations.filter((r) => r.eventId === event.id);
  const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);

  const userRegistration = isAuthenticated
    ? (mockRegistrations.find((r) => r.eventId === event.id && r.userId === user?.id) ?? null)
    : null;

  const showLiveResultsTab = !isPast && event.liveResultsUrl;

  const handleRegister = () => {
    if (isDraftPreview) {
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

  return (
    <Layout>
      {isDraftPreview ? (
        <PreviewBanner settingsUrl={`${getEditUrl(event, user)}?tab=settings`} />
      ) : (
        isUnpublished && <DraftBanner event={event} user={user} />
      )}
      {isPrivateEvent && !isUnpublished && <PrivateBanner />}

      <EventHeroBanner event={event} isPast={isPast} onBack={() => navigate(-1)} />

      <div className="container py-5 sm:py-8">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-5 sm:space-y-8 lg:col-span-2">
            {/* Stats Strip */}
            <Card className="border-border/50 shadow-sm">
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

                {event.isVirtual && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Wydarzenie wirtualne</p>
                        <p className="text-sm text-muted-foreground">
                          Wykonaj aktywność samodzielnie w dowolnym miejscu na świecie, a następnie
                          wprowadź swój wynik w panelu uczestnika.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
                <TabsTrigger value="info">Informacje</TabsTrigger>
                {event.routeMapUrl && (
                  <TabsTrigger value="route">
                    <Route className="mr-1 h-4 w-4" />
                    Trasa
                  </TabsTrigger>
                )}
                {event.galleryAlbums && event.galleryAlbums.length > 0 && (
                  <TabsTrigger value="gallery">
                    <Images className="mr-1 h-4 w-4" />
                    Galeria
                  </TabsTrigger>
                )}
                <TabsTrigger value="distances">Dystanse</TabsTrigger>
                <TabsTrigger value="startlist">Lista startowa</TabsTrigger>
                {showLiveResultsTab && (
                  <TabsTrigger value="live" className="text-destructive">
                    <Radio className="mr-1 h-4 w-4" />
                    Na żywo
                  </TabsTrigger>
                )}
                {isPast && <TabsTrigger value="results">Wyniki</TabsTrigger>}
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <EventInfoTab event={event} />
              </TabsContent>

              {event.routeMapUrl && (
                <TabsContent value="route" className="mt-6">
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
                <TabsContent value="gallery" className="mt-6">
                  <GalleryAlbumsList albums={event.galleryAlbums} />
                </TabsContent>
              )}

              <TabsContent value="distances" className="mt-6">
                <EventDistancesTab event={event} />
              </TabsContent>

              <TabsContent value="startlist" className="mt-6">
                <EventStartListTab registrations={eventRegistrations} />
              </TabsContent>

              {showLiveResultsTab && (
                <TabsContent value="live" className="mt-6">
                  <LiveResultsEmbed url={event.liveResultsUrl} eventName={event.name} />
                </TabsContent>
              )}

              {isPast && (
                <TabsContent value="results" className="mt-6 space-y-6">
                  <ResultsSection event={event} eventResults={eventResults} />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <EventSidebar
            event={event}
            user={user}
            userRegistration={userRegistration}
            isRegistrationOpen={isRegistrationOpen}
            closedReason={getClosedReason()}
            onRegister={handleRegister}
            onShare={handleShare}
            previewMode={isDraftPreview}
          />
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
  <div className="flex items-center gap-2.5 sm:gap-3">
    <div className="rounded-lg bg-warning/10 p-2">{icon}</div>
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  </div>
);

const PreviewBanner = ({ settingsUrl }: { settingsUrl: string }) => (
  <div className="border-b border-primary/20 bg-primary/10 text-primary">
    <div className="container flex flex-col gap-2 py-2 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Tryb podglądu szkicu - widok uczestnika. Wydarzenie nie jest widoczne publicznie.
        </span>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 w-fit border-primary/30 bg-background/80 text-foreground hover:bg-accent"
      >
        <Link to={settingsUrl}>Wróć do ustawień</Link>
      </Button>
    </div>
  </div>
);

export default EventDetailsPage;
