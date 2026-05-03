import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/types';
import { appLogger } from '@/lib/logger';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface EventSettingsTabProps {
  event: Event;
}

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'cancelled'>('draft');
  const [isPrivate, setIsPrivate] = useState(event.isPrivate || false);
  const [accessCode, setAccessCode] = useState(event.accessCode || '');

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  const handleEdit = () => {
    navigate(`/organizer/events/${event.id}/edit`);
  };

  const handleStatusChange = (status: 'draft' | 'published' | 'cancelled') => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    const statusLabels = {
      draft: 'Szkic',
      published: 'Opublikowane',
      cancelled: 'Anulowane',
    };

    appLogger.event('status_change', `Zmieniono status wydarzenia «${event.name}» na ${statusLabels[newStatus]}`, {
      targetType: 'event', targetId: event.id, targetName: event.name,
      metadata: { oldStatus: event.status, newStatus },
    });
    toast({
      title: 'Status zmieniony',
      description: `Wydarzenie jest teraz: ${statusLabels[newStatus]}`,
    });
    setStatusDialogOpen(false);
  };

  const handleDelete = () => {
    appLogger.event('event_delete', `Usunięto wydarzenie «${event.name}»`, {
      targetType: 'event', targetId: event.id, targetName: event.name,
    });
    toast({
      title: 'Wydarzenie usunięte',
      description: 'Wydarzenie zostało trwale usunięte.',
      variant: 'destructive',
    });
    setDeleteDialogOpen(false);
    navigate('/organizer');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-success/10 text-success">Opublikowane</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
      case 'awaiting_approval':
        return <Badge variant="outline">Oczekuje na akceptację</Badge>;
      case 'approved':
        return <Badge variant="outline">Zatwierdzone</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Odrzucone</Badge>;
      case 'completed':
        return <Badge variant="outline">Zakończone</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Anulowane</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit event */}
      <Card>
        <CardHeader>
          <CardTitle>Edycja wydarzenia</CardTitle>
          <CardDescription>Zmień szczegóły wydarzenia, dystanse i kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edytuj wydarzenie
          </Button>
        </CardContent>
      </Card>

      {/* Status management */}
      <Card>
        <CardHeader>
          <CardTitle>Status wydarzenia</CardTitle>
          <CardDescription>Aktualny status: {getStatusBadge(event.status)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card
              className={`cursor-pointer transition-colors hover:border-primary ${
                event.status === 'draft' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleStatusChange('draft')}
            >
              <CardContent className="pt-6 text-center">
                <EyeOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <h4 className="font-medium">Szkic</h4>
                <p className="text-sm text-muted-foreground">Widoczne tylko dla Ciebie</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-colors hover:border-primary ${
                event.status === 'published' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleStatusChange('published')}
            >
              <CardContent className="pt-6 text-center">
                <Eye className="mx-auto mb-2 h-8 w-8 text-success" />
                <h4 className="font-medium">Opublikowane</h4>
                <p className="text-sm text-muted-foreground">Widoczne dla wszystkich</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-colors hover:border-destructive ${
                event.status === 'cancelled' ? 'border-destructive bg-destructive/5' : ''
              }`}
              onClick={() => handleStatusChange('cancelled')}
            >
              <CardContent className="pt-6 text-center">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                <h4 className="font-medium">Anulowane</h4>
                <p className="text-sm text-muted-foreground">Wydarzenie odwołane</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Complete event */}
      {event.status === 'published' && (
        <Card>
          <CardHeader>
            <CardTitle>Zakończ wydarzenie</CardTitle>
            <CardDescription>
              Po wprowadzeniu wszystkich wyników możesz oznaczyć wydarzenie jako zakończone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Wydarzenie zakończone',
                  description: 'Wydarzenie zostało oznaczone jako zakończone.',
                });
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Oznacz jako zakończone
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Privacy settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Prywatność
          </CardTitle>
          <CardDescription>
            Prywatne wydarzenie nie jest widoczne publicznie — uczestnicy mogą dołączyć tylko przez
            specjalny link.
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
              onCheckedChange={(checked) => {
                setIsPrivate(checked);
                if (checked && !accessCode) {
                  setAccessCode(generateAccessCode());
                }
                toast({
                  title: checked ? 'Wydarzenie prywatne' : 'Wydarzenie publiczne',
                  description: checked
                    ? 'Wydarzenie nie będzie widoczne publicznie.'
                    : 'Wydarzenie będzie widoczne dla wszystkich.',
                });
              }}
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
                    onClick={() => {
                      const newCode = generateAccessCode();
                      setAccessCode(newCode);
                      toast({
                        title: 'Nowy kod',
                        description: 'Wygenerowano nowy kod dostępu. Stary kod przestaje działać.',
                      });
                    }}
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

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Strefa niebezpieczna
          </CardTitle>
          <CardDescription>Te akcje są nieodwracalne. Zachowaj ostrożność.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Usuń wydarzenie
          </Button>
        </CardContent>
      </Card>

      {/* Status change dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień status wydarzenia</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz zmienić status wydarzenia na{' '}
              {newStatus === 'draft'
                ? 'Szkic'
                : newStatus === 'published'
                  ? 'Opublikowane'
                  : 'Anulowane'}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant={newStatus === 'cancelled' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
            >
              Zmień status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć to wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Wszystkie dane wydarzenia, zapisy uczestników i wyniki
              zostaną trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Usuń wydarzenie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
