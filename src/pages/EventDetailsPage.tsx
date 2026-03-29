import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockEvents, mockRegistrations, mockResults, mockResultDocuments, mockTeamResults, disciplineLabels } from '@/data/mockData';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Mail, Phone, Globe, Radio, Images, Route, Trophy, Medal, Shield, ShoppingBag, Eye, Pencil, ShieldCheck, Map, Download, Mountain } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LiveResultsEmbed } from '@/components/LiveResultsEmbed';
import { GalleryAlbumsList } from '@/components/GalleryAlbumsList';
import { RouteMap } from '@/components/RouteMap';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { ResultDocumentsList } from '@/components/results/ResultDocumentsList';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { Event, Result } from '@/types';
import { DistanceRouteDialog, hasRouteArtifacts } from '@/components/DistanceRouteDialog';
import { getCurrentPrice } from '@/data/mockData';
import { applyDiscount } from '@/api/mock/helpers';
import { AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper to get edit URL based on role
const getEditUrl = (event: Event, user: any) => {
  if (user?.role === 'admin') return `/admin/events/${event.id}`;
  if (user?.role === 'moderator') return `/moderator/events/${event.id}`;
  return `/organizer/events/${event.id}`;
};

// Draft/unpublished status banner — full-width yellow bar
const DraftBanner = ({ event, user, onApprove, onReject }: { 
  event: Event; 
  user: any;
  onApprove?: () => void;
  onReject?: () => void;
}) => {
  const isAdminOrMod = user?.role === 'admin' || user?.role === 'moderator';
  
  const messages: Record<string, string> = {
    draft: 'Podgląd — wydarzenie nie jest widoczne publicznie',
    awaiting_approval: 'Podgląd — wydarzenie oczekuje na akceptację',
    rejected: 'Podgląd — wydarzenie zostało odrzucone',
  };

  const message = messages[event.status];
  if (!message) return null;

  return (
    <div className="bg-warning text-warning-foreground">
      <div className="container py-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>{message}</span>
          {event.status === 'rejected' && event.rejectionReason && (
            <span className="font-normal">— {event.rejectionReason}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrMod && event.status === 'awaiting_approval' && (
            <>
              {onApprove && (
                <Button size="sm" variant="outline" className="h-7 text-xs bg-background/20 border-warning-foreground/30 hover:bg-background/40" onClick={onApprove}>
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Zatwierdź
                </Button>
              )}
              {onReject && (
                <Button size="sm" variant="outline" className="h-7 text-xs bg-background/20 border-warning-foreground/30 hover:bg-background/40" onClick={onReject}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Odrzuć
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs bg-background/20 border-warning-foreground/30 hover:bg-background/40" asChild>
            <Link to={getEditUrl(event, user)}>
              <Pencil className="h-3 w-3 mr-1" />
              Edytuj
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Private event banner
const PrivateBanner = () => (
  <div className="container pt-4">
    <Alert className="border-primary/30 bg-primary/5">
      <Lock className="h-4 w-4" />
      <AlertTitle>Wydarzenie prywatne</AlertTitle>
      <AlertDescription>
        To wydarzenie jest dostępne tylko przez zaproszenie i nie jest widoczne publicznie.
      </AlertDescription>
    </Alert>
  </div>
);

// Results Section Component
const ResultsSection = ({ event, eventResults }: { event: Event; eventResults: Result[] }) => {
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const eventDocuments = mockResultDocuments.filter(d => d.eventId === event.id);
  const eventTeamResults = mockTeamResults.filter(t => t.eventId === event.id);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(eventResults.map(r => r.category));
    return Array.from(cats).sort();
  }, [eventResults]);

  // Filter results
  const filteredResults = useMemo(() => {
    return eventResults.filter(r => {
      if (selectedDistance !== 'all' && r.distanceId !== selectedDistance) return false;
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (selectedGender !== 'all' && r.gender !== selectedGender) return false;
      if (searchQuery && !r.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => a.position - b.position);
  }, [eventResults, selectedDistance, selectedCategory, selectedGender, searchQuery]);

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="h-4 w-4 text-warning" />;
    if (position === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (position === 3) return <Medal className="h-4 w-4 text-warning/70" />;
    return null;
  };

  return (
    <>
      {/* Filters */}
      <ResultsFilters
        distances={event.distances}
        selectedDistance={selectedDistance}
        onDistanceChange={setSelectedDistance}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
      />

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Wyniki oficjalne
            <Badge variant="secondary" className="ml-2">{filteredResults.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead className="hidden sm:table-cell">Dystans</TableHead>
                  <TableHead>Czas</TableHead>
                  <TableHead className="hidden md:table-cell">Kat.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getMedalIcon(result.position)}
                        <span className="font-bold">{result.position}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/athlete/${result.userId}`}
                        className="font-medium hover:text-primary hover:underline transition-colors"
                      >
                        {result.userName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{result.distanceName}</TableCell>
                    <TableCell className="font-mono">{result.time}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {result.categoryPosition}. {result.category}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {eventResults.length === 0 ? 'Wyniki będą dostępne wkrótce.' : 'Brak wyników spełniających kryteria.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Results */}
      {eventTeamResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Klasyfikacja drużynowa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Drużyna</TableHead>
                  <TableHead className="hidden sm:table-cell">Członkowie</TableHead>
                  <TableHead>Łączny czas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventTeamResults.sort((a, b) => a.position - b.position).map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getMedalIcon(team.position)}
                        <span className="font-bold">{team.position}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {team.members.map((m) => (
                          <Badge key={m.userId} variant="outline" className="text-xs">
                            {m.userName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{team.totalTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Documents */}
      {eventDocuments.length > 0 && (
        <ResultDocumentsList documents={eventDocuments} />
      )}
    </>
  );
};

const EventDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const defaultTab = searchParams.get('tab') || 'info';

  const event = mockEvents.find(e => e.slug === slug);

  // Access control for draft/unpublished events
  const isUnpublished = event && ['draft', 'awaiting_approval', 'rejected'].includes(event.status);
  const canViewDraft = user?.role === 'admin' || user?.role === 'moderator' || 
    (user?.role === 'organizer' && event?.organizerId === user?.id);

  // Private event access control
  const accessCodeFromUrl = searchParams.get('access');
  const isPrivateEvent = event?.isPrivate;
  
  const hasPrivateAccess = (() => {
    if (!isPrivateEvent) return true;
    if (!event) return false;
    // Admin/moderator/organizer bypass
    if (user?.role === 'admin' || user?.role === 'moderator') return true;
    if (user?.role === 'organizer' && event.organizerId === user?.id) return true;
    // User has registration for this event
    if (isAuthenticated && mockRegistrations.some(r => r.eventId === event.id && r.userId === user?.id)) return true;
    // URL access code matches
    if (accessCodeFromUrl && accessCodeFromUrl === event.accessCode) {
      sessionStorage.setItem(`private-event-${event.id}`, accessCodeFromUrl);
      return true;
    }
    // Session storage has valid code
    const storedCode = sessionStorage.getItem(`private-event-${event.id}`);
    if (storedCode && storedCode === event.accessCode) return true;
    return false;
  })();

  if (!event || (isUnpublished && !canViewDraft) || (isPrivateEvent && !hasPrivateAccess)) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Wydarzenie nie zostało znalezione</h1>
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
  const allDistancesFull = event.distances.length > 0 && event.distances.every(d => d.limit != null && d.registeredCount >= d.limit);
  const isRegistrationOpen = !isPast && !deadlinePassed && !isClosedByOrganizer && !allDistancesFull;
  
  const getClosedReason = (): string | null => {
    if (isPast) return 'Zawody już się odbyły';
    if (deadlinePassed) return `Termin zapisów minął (${format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })})`;
    if (isClosedByOrganizer) return 'Zapisy zamknięte przez organizatora';
    if (allDistancesFull) return 'Wszystkie miejsca zajęte';
    return null;
  };
  const eventResults = mockResults.filter(r => r.eventId === event.id);
  const eventRegistrations = mockRegistrations.filter(r => r.eventId === event.id);
  const totalParticipants = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);

  const userRegistration = isAuthenticated 
    ? mockRegistrations.find(r => r.eventId === event.id && r.userId === user?.id)
    : null;

  // Show live results tab if event is upcoming or ongoing (has liveResultsUrl)
  const showLiveResultsTab = !isPast && event.liveResultsUrl;

  const handleRegister = () => {
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

  // Calculate banner position based on crop area
  const getBannerStyle = () => {
    if (!event.bannerCropArea) return {};
    const { y, height } = event.bannerCropArea;
    return {
      objectPosition: `center ${y + height / 2}%`,
    };
  };

  return (
    <Layout>
      {/* Draft status banner — full width under header */}
      {isUnpublished && <DraftBanner event={event} user={user} />}
      {/* Private event banner */}
      {isPrivateEvent && !isUnpublished && <PrivateBanner />}

      {/* Header with optional banner */}
      {event.bannerUrl ? (
        <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
          <img
            src={event.bannerUrl}
            alt={event.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={getBannerStyle()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Organizer logo */}
          {event.organizerLogoUrl && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <img
                src={event.organizerLogoUrl}
                alt={event.organizerName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-background shadow-lg"
              />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container pb-6">
              <Button variant="ghost" size="sm" className="mb-4 bg-background/20 backdrop-blur-sm hover:bg-background/40" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wróć
              </Button>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm">
                  <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
                  {disciplineLabels[event.discipline]}
                </Badge>
                {event.isVirtual && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 backdrop-blur-sm">
                    <Globe className="h-3 w-3 mr-1" />
                    Wirtualny
                  </Badge>
                )}
                {isPast && <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">Zakończone</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-md">{event.name}</h1>
              <p className="text-muted-foreground mt-1">Organizator: {event.organizerName}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Clean Header (no banner) */
        <div className="bg-muted/30 border-b">
          <div className="container py-6">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć
            </Button>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="flex items-center gap-1.5">
                <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
                {disciplineLabels[event.discipline]}
              </Badge>
              {event.isVirtual && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Globe className="h-3 w-3 mr-1" />
                  Wirtualny
                </Badge>
              )}
              {isPast && <Badge variant="secondary">Zakończone</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
          </div>
        </div>
      )}

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Calendar className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {event.isVirtual ? 'Okno startowe' : 'Data'}
                      </div>
                      <div className="font-medium">
                        {event.isVirtual && event.startDate && event.endDate 
                          ? `${format(new Date(event.startDate), 'd MMM', { locale: pl })} - ${format(new Date(event.endDate), 'd MMM', { locale: pl })}`
                          : format(new Date(event.date), 'd MMMM yyyy', { locale: pl })
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      {event.isVirtual ? (
                        <Globe className="h-5 w-5 text-warning" />
                      ) : (
                        <MapPin className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {event.isVirtual ? 'Zasięg' : 'Miejsce'}
                      </div>
                      <div className="font-medium">
                        {event.isVirtual ? 'Cały świat' : event.city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Users className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Zapisanych</div>
                      <div className="font-medium">{totalParticipants.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Zapisy do</div>
                      <div className="font-medium">
                        {format(new Date(event.registrationDeadline), 'd MMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virtual event info banner */}
                {event.isVirtual && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Wydarzenie wirtualne</p>
                        <p className="text-sm text-muted-foreground">
                          Wykonaj aktywność samodzielnie w dowolnym miejscu na świecie, a następnie wprowadź swój wynik w panelu uczestnika.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab}>
              <TabsList className="w-full justify-start flex-wrap h-auto">
                <TabsTrigger value="info">Informacje</TabsTrigger>
                {event.routeMapUrl && (
                  <TabsTrigger value="route">
                    <Route className="h-4 w-4 mr-1" />
                    Trasa
                  </TabsTrigger>
                )}
                {event.galleryAlbums && event.galleryAlbums.length > 0 && (
                  <TabsTrigger value="gallery">
                    <Images className="h-4 w-4 mr-1" />
                    Galeria
                  </TabsTrigger>
                )}
                <TabsTrigger value="distances">Dystanse</TabsTrigger>
                <TabsTrigger value="startlist">Lista startowa</TabsTrigger>
                {showLiveResultsTab && (
                  <TabsTrigger value="live" className="text-destructive">
                    <Radio className="h-4 w-4 mr-1" />
                    Na żywo
                  </TabsTrigger>
                )}
                {isPast && <TabsTrigger value="results">Wyniki</TabsTrigger>}
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">O wydarzeniu</h3>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                    
                    {/* Organizers HTML */}
                    {event.organizersHtml && (
                      <div>
                        <h4 className="font-semibold mb-3">Organizatorzy</h4>
                        <RichTextDisplay html={event.organizersHtml} />
                      </div>
                    )}

                    {/* Rules HTML */}
                    {event.rulesHtml && (
                      <div>
                        <h4 className="font-semibold mb-3">Regulamin</h4>
                        <RichTextDisplay html={event.rulesHtml} />
                      </div>
                    )}
                    
                    {!event.organizersHtml && (
                      <div>
                        <h4 className="font-semibold mb-2">Lokalizacja</h4>
                        <p className="text-muted-foreground">{event.location}, {event.city}</p>
                      </div>
                    )}

                    {/* Insurance info */}
                    {event.insuranceOption?.enabled && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Ubezpieczenie NNW
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
                        </p>
                      </div>
                    )}

                    {/* Merchandise info */}
                    {event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-primary" />
                          Gadżety dostępne przy rejestracji
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {event.merchandise.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <span className="text-sm">{item.name}</span>
                              <Badge variant="secondary">{item.price} zł</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-3">Organizator</h4>
                      {!event.organizersHtml && (
                        <p className="font-medium mb-3">{event.organizerName}</p>
                      )}
                      
                      {event.organizerContact && (
                        <div className="space-y-2">
                          <a 
                            href={`mailto:${event.organizerContact.email}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            {event.organizerContact.email}
                          </a>
                          {event.organizerContact.phone && (
                            <a 
                              href={`tel:${event.organizerContact.phone}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              </TabsContent>

              {/* Route Tab */}
              {event.routeMapUrl && (
                <TabsContent value="route" className="mt-6">
                  <RouteMap 
                    mapUrl={event.routeMapUrl}
                    elevationProfileUrl={event.routeElevationProfile}
                    gpxUrl={event.routeGpxUrl}
                    distanceInfo={event.distances.length > 0 ? {
                      length: event.distances[0].length,
                      unit: event.distances[0].unit,
                      elevation: '+4500m'
                    } : undefined}
                  />
                </TabsContent>
              )}

              {/* Gallery Tab */}
              {event.galleryAlbums && event.galleryAlbums.length > 0 && (
                <TabsContent value="gallery" className="mt-6">
                  <GalleryAlbumsList albums={event.galleryAlbums} />
                </TabsContent>
              )}

              <TabsContent value="distances" className="mt-6">
                <div className="space-y-4">
                  {event.distances.map((distance) => {
                    const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
                    const isFull = spotsLeft !== null && spotsLeft <= 0;
                    const { price: currentPrice, tierName } = getCurrentPrice(distance);
                    
                    return (
                      <Card key={distance.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div>
                                <h4 className="font-semibold text-lg">{distance.name}</h4>
                                <div className="text-2xl font-bold text-primary">
                                  {distance.length} {distance.unit}
                                </div>
                              </div>

                              {/* Age categories */}
                              {distance.ageCategories && distance.ageCategories.length > 0 ? (
                                <div>
                                  <p className="text-sm font-medium mb-1">Kategorie wiekowe:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {distance.ageCategories.map(cat => (
                                      <Badge key={cat.id} variant="outline" className="text-xs">
                                        {cat.name} ({cat.gender}) {cat.birthYearFrom}–{cat.birthYearTo}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Kategorie: {distance.categories.join(', ')}
                                </div>
                              )}

                              {/* Price tiers */}
                              {distance.priceTiers && distance.priceTiers.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Progi cenowe:</p>
                                  <div className="space-y-1">
                                    {distance.priceTiers.map(tier => {
                                      const tierPrice = applyDiscount(distance.price, tier.discountType, tier.discountValue);
                                      const mode = distance.priceTierMode || 'date';
                                      const isPastTier = mode === 'date' && tier.endDate ? new Date(tier.endDate) < new Date() : false;
                                      return (
                                        <div key={tier.id} className={`text-xs flex justify-between ${isPastTier ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                                          <span>{tier.name}</span>
                                          <span>
                                            {tierPrice} zł
                                            {mode === 'date' && tier.endDate && ` do ${format(new Date(tier.endDate), 'd MMM yyyy', { locale: pl })}`}
                                            {mode === 'participants' && tier.participantLimit != null && ` (do ${tier.participantLimit} os.)`}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* VIP prices */}
                              {distance.vipPrices && distance.vipPrices.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Ceny specjalne:</p>
                                  <div className="space-y-1">
                                    {distance.vipPrices.map(vip => {
                                      const vipPrice = applyDiscount(distance.price, vip.discountType, vip.discountValue);
                                      return (
                                        <div key={vip.id} className="text-xs flex justify-between text-muted-foreground">
                                          <span>{vip.name}</span>
                                          <span className="text-primary font-medium">{vipPrice} zł</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right min-w-[120px]">
                              <div className="text-2xl font-bold">{currentPrice} zł</div>
                              <Badge variant="secondary" className="text-xs">{tierName}</Badge>
                              <div className="text-sm text-muted-foreground mt-1">
                                {distance.registeredCount.toLocaleString()} 
                                {distance.limit && ` / ${distance.limit.toLocaleString()}`} zapisanych
                              </div>
                              {spotsLeft !== null && spotsLeft <= 100 && spotsLeft > 0 && (
                                <Badge variant="destructive" className="mt-1">
                                  Ostatnie {spotsLeft} miejsc!
                                </Badge>
                              )}
                              {isFull && (
                                <Badge variant="secondary" className="mt-1">Brak miejsc</Badge>
                              )}
                            </div>
                          </div>

                          {/* Route artifacts */}
                          {hasRouteArtifacts(distance) && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex flex-wrap items-center gap-3">
                                {distance.routeMapUrl && (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={distance.routeMapUrl}
                                      alt={`Mapa ${distance.name}`}
                                      className="h-12 w-20 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                {distance.routeElevationProfile && (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={distance.routeElevationProfile}
                                      alt={`Profil ${distance.name}`}
                                      className="h-12 w-20 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                {distance.routeGpxUrl && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={distance.routeGpxUrl} download className="gap-1.5">
                                      <Download className="h-3.5 w-3.5" />
                                      GPX
                                    </a>
                                  </Button>
                                )}
                                <DistanceRouteDialog distance={distance} />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="startlist" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    {eventRegistrations.length > 0 ? (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nr</TableHead>
                            <TableHead>Uczestnik</TableHead>
                            <TableHead>Dystans</TableHead>
                            <TableHead>Kategoria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventRegistrations.filter(r => r.status === 'confirmed').map((reg) => (
                            <TableRow key={reg.id}>
                              <TableCell className="font-mono">{reg.bibNumber || '-'}</TableCell>
                              <TableCell>
                                <Link 
                                  to={`/athlete/${reg.userId}`}
                                  className="font-medium hover:text-primary hover:underline transition-colors"
                                >
                                  {reg.userName}
                                </Link>
                              </TableCell>
                              <TableCell>{reg.distanceName}</TableCell>
                              <TableCell>{reg.category}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Lista startowa będzie dostępna wkrótce.
                      </p>
                    )}
                  </CardContent>
                </Card>
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
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>
                  {userRegistration ? 'Jesteś zapisany!' : 'Zapisz się'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRegistration ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-accent rounded-lg">
                      <div className="text-sm text-muted-foreground">Twój dystans</div>
                      <div className="font-semibold">{userRegistration.distanceName}</div>
                      {userRegistration.bibNumber && (
                        <>
                          <div className="text-sm text-muted-foreground mt-2">Numer startowy</div>
                          <div className="font-semibold text-2xl">{userRegistration.bibNumber}</div>
                        </>
                      )}
                    </div>
                    <Badge variant={userRegistration.status === 'confirmed' ? 'default' : 'secondary'}>
                      {userRegistration.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
                    </Badge>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Ceny od <span className="font-bold text-foreground">{Math.min(...event.distances.map(d => d.price))} zł</span>
                    </p>
                    <Button onClick={handleRegister} className="w-full" size="lg" disabled={!isRegistrationOpen}>
                      Zapisz się teraz
                    </Button>
                    {isRegistrationOpen ? (
                      <p className="text-xs text-muted-foreground text-center">
                        Zapisy do {format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })}
                      </p>
                    ) : (
                      <p className="text-sm text-destructive text-center font-medium">
                        {getClosedReason()}
                      </p>
                    )}
                  </>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Udostępnij
                  </Button>
                </div>

                {/* Edit button for admin/moderator/organizer */}
                {(user?.role === 'admin' || user?.role === 'moderator' || (user?.role === 'organizer' && event.organizerId === user?.id)) && (
                  <div className="pt-4 border-t">
                    <Button variant="secondary" className="w-full" asChild>
                      <Link to={getEditUrl(event, user)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edytuj wydarzenie
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Contact Card */}
            {event.organizerContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kontakt z organizatorem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium">{event.organizerName}</p>
                  <div className="space-y-2">
                    <a 
                      href={`mailto:${event.organizerContact.email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      Napisz do organizatora
                    </a>
                    {event.organizerContact.phone && (
                      <a 
                        href={`tel:${event.organizerContact.phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {event.organizerContact.phone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailsPage;
