import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { mockEvents, disciplineLabels, mockGoogleCalendarSettings } from '@/data/mockData';
import { Event, GoogleCalendarSettings } from '@/types';
import { addEventToGoogleCalendar } from '@/lib/googleCalendarUtils';
import { 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [calendarSettings] = useState<GoogleCalendarSettings>(mockGoogleCalendarSettings);

  const pendingEvents = events.filter(e => e.status === 'awaiting_approval');
  const rejectedEvents = events.filter(e => e.status === 'draft' && e.rejectionReason);

  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    setEvents(prev => prev.map(e => 
      e.id === selectedEvent.id 
        ? { ...e, status: 'published' as const, rejectionReason: undefined }
        : e
    ));
    
    // Add to Google Calendar if connected and enabled
    if (calendarSettings.enabled && calendarSettings.connected) {
      const result = await addEventToGoogleCalendar(selectedEvent, calendarSettings.calendarId);
      if (result.success) {
        toast.success('Wydarzenie dodane do Google Calendar');
      } else {
        toast.error('Nie udało się dodać wydarzenia do kalendarza', {
          description: result.error
        });
      }
    }
    
    toast.success('Wydarzenie zostało zatwierdzone', {
      description: `"${selectedEvent.name}" jest teraz widoczne publicznie.`
    });
    
    setApproveOpen(false);
    setDetailsOpen(false);
    setSelectedEvent(null);
  };

  const handleReject = () => {
    if (!selectedEvent || !rejectionReason.trim()) return;
    
    setEvents(prev => prev.map(e => 
      e.id === selectedEvent.id 
        ? { ...e, status: 'draft' as const, rejectionReason: rejectionReason.trim() }
        : e
    ));
    
    toast.error('Wydarzenie zostało odrzucone', {
      description: 'Organizator otrzyma powiadomienie z powodem odrzucenia.'
    });
    
    setRejectOpen(false);
    setDetailsOpen(false);
    setRejectionReason('');
    setSelectedEvent(null);
  };

  const EventCard = ({ event, showRejection = false }: { event: Event; showRejection?: boolean }) => (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-48 h-32 md:h-auto">
          <img 
            src={event.imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{event.name}</h3>
                <Badge variant="outline" className="mt-1">
                  {disciplineLabels[event.discipline]}
                </Badge>
              </div>
              {showRejection && event.rejectionReason && (
                <Badge variant="destructive" className="shrink-0">
                  Odrzucone
                </Badge>
              )}
              {!showRejection && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  Oczekuje
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{event.organizerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{event.distances.length} dystans(ów)</span>
              </div>
            </div>

            {showRejection && event.rejectionReason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Powód odrzucenia:
                </div>
                <p className="text-muted-foreground">{event.rejectionReason}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedEvent(event);
                  setDetailsOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Szczegóły
              </Button>
              {!showRejection && (
                <>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setApproveOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Zatwierdź
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setRejectOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Odrzuć
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Moderacja wydarzeń</h2>
        <p className="text-muted-foreground">Przegląd i zatwierdzanie nowych wydarzeń zgłoszonych przez organizatorów</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingEvents.length}</div>
                <div className="text-sm text-muted-foreground">Oczekujących na akceptację</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{rejectedEvents.length}</div>
                <div className="text-sm text-muted-foreground">Odrzuconych (do poprawy)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Oczekujące ({pendingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Odrzucone ({rejectedEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Brak wydarzeń do moderacji</h3>
                <p className="text-muted-foreground">
                  Wszystkie zgłoszenia zostały rozpatrzone
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Brak odrzuconych wydarzeń</h3>
                <p className="text-muted-foreground">
                  Nie ma wydarzeń oczekujących na poprawki
                </p>
              </CardContent>
            </Card>
          ) : (
            rejectedEvents.map(event => (
              <EventCard key={event.id} event={event} showRejection />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
                <DialogDescription>
                  Szczegóły wydarzenia zgłoszonego do moderacji
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <img 
                  src={selectedEvent.imageUrl} 
                  alt={selectedEvent.name}
                  className="w-full h-48 object-cover rounded-lg"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dyscyplina</Label>
                    <p className="font-medium">{disciplineLabels[selectedEvent.discipline]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data</Label>
                    <p className="font-medium">{selectedEvent.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lokalizacja</Label>
                    <p className="font-medium">{selectedEvent.location}, {selectedEvent.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Termin rejestracji</Label>
                    <p className="font-medium">{selectedEvent.registrationDeadline}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Organizator</Label>
                  <p className="font-medium">{selectedEvent.organizerName}</p>
                  {selectedEvent.organizerContact && (
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.organizerContact.email}
                      {selectedEvent.organizerContact.phone && ` • ${selectedEvent.organizerContact.phone}`}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Opis</Label>
                  <p className="text-sm mt-1">{selectedEvent.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Dystanse</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEvent.distances.map(distance => (
                      <div key={distance.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="font-medium">{distance.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {distance.price} zł • Limit: {distance.limit || '∞'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Zamknij
                </Button>
                {selectedEvent.status === 'awaiting_approval' && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setDetailsOpen(false);
                        setRejectOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Odrzuć
                    </Button>
                    <Button
                      onClick={() => {
                        setDetailsOpen(false);
                        setApproveOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Zatwierdź
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zatwierdź wydarzenie</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zatwierdzić wydarzenie "{selectedEvent?.name}"? 
              Będzie ono widoczne publicznie dla wszystkich użytkowników.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Zatwierdź
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(open) => {
        setRejectOpen(open);
        if (!open) setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć wydarzenie</DialogTitle>
            <DialogDescription>
              Podaj powód odrzucenia. Organizator otrzyma to wyjaśnienie i będzie mógł poprawić zgłoszenie.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedEvent?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedEvent?.organizerName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Powód odrzucenia *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Np. Prosimy o uzupełnienie regulaminu zawodów oraz dodanie mapy trasy..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                Organizator otrzyma powiadomienie z powodem odrzucenia i będzie mógł poprawić zgłoszenie.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Anuluj
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Odrzuć wydarzenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
