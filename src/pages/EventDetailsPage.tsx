import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockEvents, mockRegistrations, mockResults, disciplineLabels } from '@/data/mockData';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Mail, Phone, Globe, Radio, Images, Route } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LiveResultsEmbed } from '@/components/LiveResultsEmbed';
import { ImageGallery } from '@/components/ImageGallery';
import { RouteMap } from '@/components/RouteMap';

const EventDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const event = mockEvents.find(e => e.slug === slug);

  if (!event) {
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
  const isRegistrationOpen = !isPast && new Date(event.registrationDeadline) > new Date();
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

  return (
    <Layout>
      {/* Clean Header (no hero image) */}
      <div className="bg-muted/30 border-b">
        <div className="container py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wszystkie wydarzenia
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="flex items-center gap-1.5">
              <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
              {disciplineLabels[event.discipline]}
            </Badge>
            {isPast && <Badge variant="secondary">Zakończone</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Data</div>
                      <div className="font-medium">
                        {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Miejsce</div>
                      <div className="font-medium">{event.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Zapisanych</div>
                      <div className="font-medium">{totalParticipants.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Zapisy do</div>
                      <div className="font-medium">
                        {format(new Date(event.registrationDeadline), 'd MMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="info">
              <TabsList className="w-full justify-start flex-wrap h-auto">
                <TabsTrigger value="info">Informacje</TabsTrigger>
                {event.routeMapUrl && (
                  <TabsTrigger value="route">
                    <Route className="h-4 w-4 mr-1" />
                    Trasa
                  </TabsTrigger>
                )}
                {event.gallery && event.gallery.length > 0 && (
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
                    
                    <div>
                      <h4 className="font-semibold mb-2">Lokalizacja</h4>
                      <p className="text-muted-foreground">{event.location}, {event.city}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Organizator</h4>
                      <p className="font-medium mb-3">{event.organizerName}</p>
                      
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
              {event.gallery && event.gallery.length > 0 && (
                <TabsContent value="gallery" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Images className="h-5 w-5 text-primary" />
                        Galeria wydarzenia
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Zdjęcia z poprzednich edycji i przygotowań
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ImageGallery images={event.gallery} />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="distances" className="mt-6">
                <div className="space-y-4">
                  {event.distances.map((distance) => {
                    const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
                    const isFull = spotsLeft !== null && spotsLeft <= 0;
                    
                    return (
                      <Card key={distance.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-lg">{distance.name}</h4>
                              <div className="text-2xl font-bold text-primary">
                                {distance.length} {distance.unit}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Kategorie: {distance.categories.join(', ')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{distance.price} zł</div>
                              <div className="text-sm text-muted-foreground">
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
                <TabsContent value="results" className="mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      {eventResults.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Poz.</TableHead>
                              <TableHead>Uczestnik</TableHead>
                              <TableHead>Dystans</TableHead>
                              <TableHead>Czas</TableHead>
                              <TableHead>Kat.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventResults
                              .sort((a, b) => a.position - b.position)
                              .map((result) => (
                                <TableRow key={result.id}>
                                  <TableCell className="font-bold">{result.position}</TableCell>
                                  <TableCell>
                                    <Link 
                                      to={`/athlete/${result.userId}`}
                                      className="font-medium hover:text-primary hover:underline transition-colors"
                                    >
                                      {result.userName}
                                    </Link>
                                  </TableCell>
                                  <TableCell>{result.distanceName}</TableCell>
                                  <TableCell className="font-mono">{result.time}</TableCell>
                                  <TableCell>
                                    {result.categoryPosition}. {result.category}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Wyniki będą dostępne wkrótce.
                        </p>
                      )}
                    </CardContent>
                  </Card>
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
                ) : isRegistrationOpen ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Ceny od <span className="font-bold text-foreground">{Math.min(...event.distances.map(d => d.price))} zł</span>
                    </p>
                    <Button onClick={handleRegister} className="w-full" size="lg">
                      Zapisz się teraz
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Zapisy do {format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {isPast ? 'Zawody zakończone' : 'Zapisy zamknięte'}
                  </p>
                )}

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Udostępnij
                  </Button>
                </div>
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
