import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockEvents, mockRegistrations, mockResults, disciplineLabels, disciplineIcons } from '@/data/mockData';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const EventDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  const currentDistance = event.distances.find(d => d.id === selectedDistance);

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Wymagane logowanie',
        description: 'Zaloguj się, aby zapisać się na zawody.',
      });
      navigate('/login');
      return;
    }
    setRegistrationDialog(true);
  };

  const handleConfirmRegistration = () => {
    toast({
      title: 'Zapisano na zawody!',
      description: `Zostałeś zapisany na ${event.name} - ${currentDistance?.name}.`,
    });
    setRegistrationDialog(false);
    setSelectedDistance('');
    setSelectedCategory('');
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
      {/* Hero */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wszystkie wydarzenia
              </Link>
            </Button>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>
                {disciplineIcons[event.discipline]} {disciplineLabels[event.discipline]}
              </Badge>
              {isPast && <Badge variant="secondary">Zakończone</Badge>}
              {event.featured && !isPast && <Badge variant="default">⭐ Wyróżnione</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
          </div>
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
              <TabsList className="w-full justify-start">
                <TabsTrigger value="info">Informacje</TabsTrigger>
                <TabsTrigger value="distances">Dystanse</TabsTrigger>
                <TabsTrigger value="startlist">Lista startowa</TabsTrigger>
                {isPast && <TabsTrigger value="results">Wyniki</TabsTrigger>}
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">O wydarzeniu</h3>
                    <p className="text-muted-foreground mb-6">{event.description}</p>
                    
                    <h4 className="font-semibold mb-2">Lokalizacja</h4>
                    <p className="text-muted-foreground mb-4">{event.location}, {event.city}</p>
                    
                    <h4 className="font-semibold mb-2">Organizator</h4>
                    <p className="text-muted-foreground">{event.organizerName}</p>
                  </CardContent>
                </Card>
              </TabsContent>

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
                              <TableCell className="font-medium">{reg.userName}</TableCell>
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
                                  <TableCell className="font-medium">{result.userName}</TableCell>
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
          </div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={registrationDialog} onOpenChange={setRegistrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zapisz się na zawody</DialogTitle>
            <DialogDescription>
              Wybierz dystans i kategorię, w której chcesz startować.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dystans</Label>
              <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz dystans" />
                </SelectTrigger>
                <SelectContent>
                  {event.distances.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.length}{d.unit}) - {d.price} zł
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentDistance && (
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentDistance.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {currentDistance && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Opłata startowa</span>
                  <span className="font-bold">{currentDistance.price} zł</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistrationDialog(false)}>
              Anuluj
            </Button>
            <Button 
              onClick={handleConfirmRegistration}
              disabled={!selectedDistance || !selectedCategory}
            >
              Zapisz się
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventDetailsPage;
