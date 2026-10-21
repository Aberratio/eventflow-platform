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
import { toast } from 'sonner';
import { cancelEvent, deleteEvent, setEventIsTest, setEventVisibility, submitEvent } from '@/api';
import { isEventOwnerLevel } from '@/lib/eventTeam';
import type { Event, UserRole } from '@/types';
import { appLogger } from '@/lib/logger';
import {
  AlertTriangle,
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
import { EventEmbedSettingsCard } from './EventEmbedSettingsCard';

interface EventSettingsTabProps {
  event: Event;
  /** Current user, used to gate role-restricted actions (e.g. cancelling an event). */
  currentUser?: { id: string; role: UserRole } | null;
}

const statusLabels: Record<Event['publicationStatus'], string> = {
  draft: 'Szkic',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Opublikowane',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
};

export const EventSettingsTab = ({ event, currentUser = null }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(event.visibility === 'private');
  const [accessCode, setAccessCode] = useState(event.accessCode || '');
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingIsPrivate, setPendingIsPrivate] = useState<boolean | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  const [isTestSaving, setIsTestSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const hasRegistrations = event.distances.some((distance) => distance.registeredCount > 0);
  const canDeleteUpcoming =
    !['finished', 'cancelled'].includes(event.publicationStatus) &&
    event.date.slice(0, 10) >= today &&
    !hasRegistrations;
  const canSubmitReview =
    event.publicationStatus === 'draft' || event.publicationStatus === 'rejected';
  // The server never rests an event in 'rejected': reject() writes 'draft' and keeps the reason
  //, so a draft with a reason is a draft the moderator sent back.
  const wasSentBack = Boolean(event.rejectionReason) && canSubmitReview;
  // Cancelling is restricted to the owning organizer or an admin/superadmin — never a
  // moderator.
  // A Co-manager is neither - the Owner-only actions below stay hidden for them.
  const isOwnerOrAdmin = isEventOwnerLevel(currentUser, event);
  const canCancel = event.publicationStatus === 'published' && isOwnerOrAdmin;
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
        throw new Error(response.message || 'Nie udało się zmienić prywatności wydarzenia.');
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
      toast.success(pendingIsPrivate ? 'Wydarzenie prywatne' : 'Wydarzenie publiczne', {
        description: pendingIsPrivate
          ? 'Wydarzenie nie będzie widoczne publicznie.'
          : 'Wydarzenie będzie widoczne dla wszystkich.',
      });
      setPrivacyDialogOpen(false);
      setPendingIsPrivate(null);
    } catch (error) {
      toast.error('Nie udało się zmienić prywatności', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
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
        throw new Error(response.message || 'Nie udało się oddać wydarzenia do sprawdzenia.');
      }
      await invalidateEventQueries();
      toast.success('Wydarzenie oddane do sprawdzenia', {
        description: 'Admin lub moderator musi je zatwierdzić przed publikacja.',
      });
    } catch (error) {
      toast.error('Nie udało się oddać wydarzenia do sprawdzenia', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
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
        throw new Error(response.message || 'Nie udało się odwołać wydarzenia.');
      }
      appLogger.event('status_change', `Odwolano wydarzenie "${event.name}"`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
        metadata: { oldStatus: event.publicationStatus, newStatus: 'cancelled' },
      });
      await invalidateEventQueries();
      toast.error('Wydarzenie odwołane', {
        description: 'Uczestnicy zobacza informacje o odwolaniu wydarzenia.',
      });
      setCancelDialogOpen(false);
    } catch (error) {
      toast.error('Nie udało się odwołać wydarzenia', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleToggleIsTest = async (checked: boolean) => {
    try {
      setIsTestSaving(true);
      const response = await setEventIsTest(event.id, checked);
      if (!response.success) {
        throw new Error(response.message || 'Nie udało się zmienić trybu testowego.');
      }
      await invalidateEventQueries();
      toast.success(checked ? 'Tryb testowy wlaczony' : 'Tryb testowy wylaczony', {
        description: checked
          ? 'Możesz teraz przetestować formularz zapisu przez bezpośredni link.'
          : undefined,
      });
    } catch (error) {
      toast.error('Nie udało się zmienić trybu testowego', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
      });
    } finally {
      setIsTestSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udało się usunąć wydarzenia.');
      }
      appLogger.event('event_delete', `Oznaczono wydarzenie "${event.name}" jako usunięte`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
      });
      await Promise.all([
        invalidateEventQueries(),
        queryClient.invalidateQueries({ queryKey: ['organizer-event-limit', event.organizerId] }),
      ]);
      toast.error('Wydarzenie usunięte', {
        description: 'Wydarzenie zniknie z panelu organizatora i list publicznych.',
      });
      setDeleteDialogOpen(false);
      navigate('/organizer');
    } catch (error) {
      toast.error('Nie udało się usunąć wydarzenia', {
        description:
          error instanceof Error
            ? error.message
            : 'Usunąć można tylko nadchodzące wydarzenie bez zapisów.',
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
      default:
        return <Badge variant="outline">{statusLabels[status]}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edycja wydarzenia</CardTitle>
          <CardDescription>Zmień szczegóły wydarzenia, dystanse i kategorie</CardDescription>
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
          {wasSentBack && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Powód odrzucenia:</strong> {event.rejectionReason}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canSubmitReview && (
              <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingReview
                  ? 'Wysylanie...'
                  : wasSentBack
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
              Pozwala przetestować formularz zapisu przez bezpośredni link, zanim oddasz wydarzenie
              do sprawdzenia. Dostępny tylko dla szkicu — po oddaniu do sprawdzenia znika
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

      {event.publicationStatus === 'published' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Widocznosc
            </CardTitle>
            <CardDescription>
              Prywatne wydarzenie nie jest widoczne publicznie. Uczestnicy mogą dołączyć tylko przez
              specjalny link. Widoczność można zmieniać tylko po publikacji wydarzenia.
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
                  <Label>Kod dostępu</Label>
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
                        toast.success('Skopiowano', { description: 'Link skopiowany do schowka.' });
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

      {canDeleteUpcoming && isOwnerOrAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Usunięcie nadchodzącego wydarzenia
            </CardTitle>
            <CardDescription>
              Wydarzenie bez zapisów może zostać usunięte przed terminem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Usun wydarzenie
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odwołać wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              To działanie jest nieodwracalne. Wydarzenie zostanie oznaczone jako odwołane, a
              wszyscy użytkownicy zobacza o tym informacje na stronie wydarzenia.
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
            <AlertDialogTitle>Czy na pewno chcesz usunąć to wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie oznaczone jako usunięte i zniknie z panelu organizatora oraz list
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
              {isDeleting ? 'Usuwanie...' : 'Usuń wydarzenie'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Same organizer-owns-event-or-admin gate the write endpoint
          itself enforces server-side (`isOwnerOrAdmin`, already used above
          for the cancel action) — a moderator can view this tab but should
          not see/manage embed configuration. */}
      {isOwnerOrAdmin && <EventEmbedSettingsCard event={event} />}

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
