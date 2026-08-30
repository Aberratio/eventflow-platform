import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import {
  cancelEvent,
  deleteEvent,
  setEventVisibility,
  submitEvent,
  updateEvent,
  updateEventStatus,
} from '@/api';
import type { Event } from '@/types';
import { appLogger } from '@/lib/logger';
import {
  AlertTriangle,
  Archive,
  Ban,
  Copy,
  Edit,
  FlaskConical,
  Lock,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { PrivacyChangeConfirmDialog } from './PrivacyChangeConfirmDialog';
import { EventActivityLogCard } from './EventActivityLogCard';

interface EventSettingsTabProps {
  event: Event;
}

const statusLabels: Record<Event['publicationStatus'], string> = {
  draft: 'Szkic',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Opublikowane',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
  archived: 'Zarchiwizowane',
  deleted: 'Usuniete',
};

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(event.visibility === 'private');
  const [accessCode, setAccessCode] = useState(event.accessCode || '');
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingIsPrivate, setPendingIsPrivate] = useState<boolean | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  const [isTestSaving, setIsTestSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const eventEndDate = (event.endDate || event.date).slice(0, 10);
  const hasEnded = eventEndDate < today;
  const hasRegistrations = event.distances.some((distance) => distance.registeredCount > 0);
  const canDeleteUpcoming =
    !['finished', 'archived', 'deleted', 'cancelled'].includes(event.publicationStatus) &&
    event.date.slice(0, 10) >= today &&
    !hasRegistrations;
  const canArchive =
    event.publicationStatus !== 'archived' && (event.publicationStatus === 'finished' || hasEnded);
  const canSubmitReview =
    event.publicationStatus === 'draft' || event.publicationStatus === 'rejected';
  const canCancel = event.publicationStatus === 'published';
  const isDraft = event.publicationStatus === 'draft';

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  useEffect(() => {
    setIsPrivate(event.visibility === 'private');
    setAccessCode(event.accessCode || '');
  }, [event.accessCode, event.visibility]);

  const invalidateEventQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
      queryClient.invalidateQueries({ queryKey: ['organizer-events', event.organizerId] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ]);
  };

  const requestPrivacyChange = (checked: boolean) => {
    if (checked === isPrivate) return;
    setPendingIsPrivate(checked);
    setPrivacyDialogOpen(true);
  };

  const handlePrivacyChange = async () => {
    if (pendingIsPrivate === null) return;

    const nextAccessCode =
      pendingIsPrivate && !accessCode ? generateAccessCode() : accessCode || undefined;

    try {
      setIsPrivacySaving(true);
      const response = await setEventVisibility(
        event.id,
        pendingIsPrivate ? 'private' : 'public',
        nextAccessCode,
      );
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie zmienic prywatnosci wydarzenia.');
      }
      setIsPrivate(pendingIsPrivate);
      setAccessCode(response.data.accessCode || nextAccessCode || '');
      appLogger.event(
        'event_privacy_change',
        pendingIsPrivate
          ? `Ustawiono wydarzenie "${event.name}" jako prywatne`
          : `Ustawiono wydarzenie "${event.name}" jako publiczne`,
        {
          targetType: 'event',
          targetId: event.id,
          targetName: event.name,
          metadata: { visibility: pendingIsPrivate ? 'private' : 'public' },
        },
      );
      await invalidateEventQueries();
      toast({
        title: pendingIsPrivate ? 'Wydarzenie prywatne' : 'Wydarzenie publiczne',
        description: pendingIsPrivate
          ? 'Wydarzenie nie bedzie widoczne publicznie.'
          : 'Wydarzenie bedzie widoczne dla wszystkich.',
      });
      setPrivacyDialogOpen(false);
      setPendingIsPrivate(null);
    } catch (error) {
      toast({
        title: 'Nie udalo sie zmienic prywatnosci',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsPrivacySaving(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      const response = await submitEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie oddac wydarzenia do sprawdzenia.');
      }
      await invalidateEventQueries();
      toast({
        title: 'Wydarzenie oddane do sprawdzenia',
        description: 'Admin lub moderator musi je zatwierdzic przed publikacja.',
      });
    } catch (error) {
      toast({
        title: 'Nie udalo sie oddac wydarzenia do sprawdzenia',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelEvent = async () => {
    try {
      setIsCancelling(true);
      const response = await cancelEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie odwolac wydarzenia.');
      }
      appLogger.event('status_change', `Odwolano wydarzenie "${event.name}"`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
        metadata: { oldStatus: event.publicationStatus, newStatus: 'cancelled' },
      });
      await invalidateEventQueries();
      toast({
        title: 'Wydarzenie odwolane',
        description: 'Uczestnicy zobacza informacje o odwolaniu wydarzenia.',
        variant: 'destructive',
      });
      setCancelDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Nie udalo sie odwolac wydarzenia',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleToggleIsTest = async (checked: boolean) => {
    try {
      setIsTestSaving(true);
      const response = await updateEvent(event.id, { isTest: checked });
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie zmienic trybu testowego.');
      }
      await invalidateEventQueries();
      toast({
        title: checked ? 'Tryb testowy wlaczony' : 'Tryb testowy wylaczony',
        description: checked
          ? 'Mozesz teraz przetestowac formularz zapisu przez bezposredni link.'
          : undefined,
      });
    } catch (error) {
      toast({
        title: 'Nie udalo sie zmienic trybu testowego',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsTestSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await updateEventStatus(event.id, 'archived');
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie zarchiwizowac wydarzenia.');
      }
      appLogger.event('status_change', `Zarchiwizowano wydarzenie "${event.name}"`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
        metadata: { oldStatus: event.publicationStatus, newStatus: 'archived' },
      });
      await invalidateEventQueries();
      toast({ title: 'Wydarzenie zarchiwizowane' });
      setArchiveDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Nie udalo sie zarchiwizowac wydarzenia',
        description:
          error instanceof Error
            ? error.message
            : 'Archiwizowac mozna tylko wydarzenia, ktore juz sie zakonczyly.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie usunac wydarzenia.');
      }
      appLogger.event('event_delete', `Oznaczono wydarzenie "${event.name}" jako usuniete`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
      });
      await Promise.all([
        invalidateEventQueries(),
        queryClient.invalidateQueries({ queryKey: ['organizer-event-limit', event.organizerId] }),
      ]);
      toast({
        title: 'Wydarzenie usuniete',
        description: 'Wydarzenie zniknie z panelu organizatora i list publicznych.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      navigate('/organizer');
    } catch (error) {
      toast({
        title: 'Nie udalo sie usunac wydarzenia',
        description:
          error instanceof Error
            ? error.message
            : 'Usunac mozna tylko nadchodzace wydarzenie bez zapisow.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Event['publicationStatus']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-success/10 text-success">Opublikowane</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
      case 'submitted':
        return <Badge variant="outline">Do sprawdzenia</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Odrzucone</Badge>;
      case 'finished':
        return <Badge variant="outline">Zakończone</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Odwołane</Badge>;
      case 'archived':
        return <Badge variant="outline">Zarchiwizowane</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Usuniete</Badge>;
      default:
        return <Badge variant="outline">{statusLabels[status]}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edycja wydarzenia</CardTitle>
          <CardDescription>Zmien szczegoly wydarzenia, dystanse i kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate(`/organizer/events/${event.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edytuj wydarzenie
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status wydarzenia</CardTitle>
          <CardDescription>
            Aktualny status: {getStatusBadge(event.publicationStatus)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Po oddaniu do sprawdzenia admin lub moderator zatwierdza wydarzenie — zatwierdzenie
            publikuje je od razu, bez dodatkowego kroku po stronie organizatora.
          </p>
          {event.publicationStatus === 'rejected' && event.rejectionReason && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Powod odrzucenia:</strong> {event.rejectionReason}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canSubmitReview && (
              <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingReview
                  ? 'Wysylanie...'
                  : event.publicationStatus === 'rejected'
                    ? 'Popraw i oddaj ponownie do sprawdzenia'
                    : 'Oddaj do sprawdzenia'}
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Odwolaj wydarzenie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Tryb testowy
            </CardTitle>
            <CardDescription>
              Pozwala przetestowac formularz zapisu przez bezposredni link, zanim oddasz wydarzenie
              do sprawdzenia. Dostepny tylko dla szkicu — po oddaniu do sprawdzenia znika
              bezpowrotnie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-test-toggle" className="cursor-pointer">
                Wydarzenie testowe
              </Label>
              <Switch
                id="is-test-toggle"
                checked={event.isTest ?? false}
                onCheckedChange={handleToggleIsTest}
                disabled={isTestSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {canArchive && (
        <Card>
          <CardHeader>
            <CardTitle>Archiwum</CardTitle>
            <CardDescription>
              Przeszle wydarzenie mozesz przeniesc do archiwum organizatora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(true)}>
              <Archive className="mr-2 h-4 w-4" /> Przenies do archiwum
            </Button>
          </CardContent>
        </Card>
      )}

      {event.publicationStatus === 'published' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Widocznosc
            </CardTitle>
            <CardDescription>
              Prywatne wydarzenie nie jest widoczne publicznie. Uczestnicy moga dolaczyc tylko przez
              specjalny link. Widocznosc mozna zmieniac tylko po publikacji wydarzenia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="privacy-toggle" className="cursor-pointer">
                Wydarzenie prywatne
              </Label>
              <Switch
                id="privacy-toggle"
                checked={isPrivate}
                onCheckedChange={requestPrivacyChange}
                disabled={isPrivacySaving}
              />
            </div>
            {isPrivate && (
              <div className="space-y-3 border-t pt-2">
                <div className="space-y-2">
                  <Label>Kod dostepu</Label>
                  <div className="flex gap-2">
                    <Input value={accessCode} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAccessCode(generateAccessCode())}
                      title="Wygeneruj nowy kod"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Link do wydarzenia</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/events/${event.slug}?access=${accessCode}`}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const url = `${window.location.origin}/events/${event.slug}?access=${accessCode}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: 'Skopiowano', description: 'Link skopiowany do schowka.' });
                      }}
                      title="Kopiuj link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canDeleteUpcoming && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Usuniecie nadchodzacego wydarzenia
            </CardTitle>
            <CardDescription>
              Wydarzenie bez zapisow moze zostac usuniete przed terminem. Przeszle wydarzenia
              przenos do archiwum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Usun wydarzenie
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zarchiwizowac wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie przeniesione do archiwum organizatora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? 'Archiwizowanie...' : 'Archiwizuj'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odwolac wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              To dzialanie jest nieodwracalne. Wydarzenie zostanie oznaczone jako odwolane, a
              wszyscy uzytkownicy zobacza o tym informacje na stronie wydarzenia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelEvent}
              disabled={isCancelling}
            >
              {isCancelling ? 'Odwolywanie...' : 'Tak, odwolaj wydarzenie'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunac to wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie oznaczone jako usuniete i zniknie z panelu organizatora oraz list
              publicznych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Usuwanie...' : 'Usun wydarzenie'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventActivityLogCard eventId={event.id} />

      {pendingIsPrivate !== null && (
        <PrivacyChangeConfirmDialog
          open={privacyDialogOpen}
          nextIsPrivate={pendingIsPrivate}
          isConfirming={isPrivacySaving}
          onOpenChange={(open) => {
            setPrivacyDialogOpen(open);
            if (!open && !isPrivacySaving) {
              setPendingIsPrivate(null);
            }
          }}
          onConfirm={handlePrivacyChange}
        />
      )}
    </div>
  );
};
