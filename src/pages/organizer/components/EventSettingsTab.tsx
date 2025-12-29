import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface EventSettingsTabProps {
  event: Event;
}

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'cancelled'>('draft');

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
      cancelled: 'Anulowane'
    };
    
    toast({
      title: 'Status zmieniony',
      description: `Wydarzenie jest teraz: ${statusLabels[newStatus]}`,
    });
    setStatusDialogOpen(false);
  };

  const handleDelete = () => {
    toast({
      title: 'Wydarzenie usunięte',
      description: 'Wydarzenie zostało trwale usunięte.',
      variant: 'destructive'
    });
    setDeleteDialogOpen(false);
    navigate('/organizer');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-600">Opublikowane</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
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
          <CardDescription>
            Zmień szczegóły wydarzenia, dystanse i kategorie
          </CardDescription>
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
          <CardDescription>
            Aktualny status: {getStatusBadge(event.status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-colors hover:border-primary ${
                event.status === 'draft' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleStatusChange('draft')}
            >
              <CardContent className="pt-6 text-center">
                <EyeOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Szkic</h4>
                <p className="text-sm text-muted-foreground">
                  Widoczne tylko dla Ciebie
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors hover:border-primary ${
                event.status === 'published' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleStatusChange('published')}
            >
              <CardContent className="pt-6 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium">Opublikowane</h4>
                <p className="text-sm text-muted-foreground">
                  Widoczne dla wszystkich
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors hover:border-destructive ${
                event.status === 'cancelled' ? 'border-destructive bg-destructive/5' : ''
              }`}
              onClick={() => handleStatusChange('cancelled')}
            >
              <CardContent className="pt-6 text-center">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <h4 className="font-medium">Anulowane</h4>
                <p className="text-sm text-muted-foreground">
                  Wydarzenie odwołane
                </p>
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

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Strefa niebezpieczna
          </CardTitle>
          <CardDescription>
            Te akcje są nieodwracalne. Zachowaj ostrożność.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
          >
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
              {newStatus === 'draft' ? 'Szkic' : 
               newStatus === 'published' ? 'Opublikowane' : 'Anulowane'}?
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
              Ta akcja jest nieodwracalna. Wszystkie dane wydarzenia, zapisy uczestników 
              i wyniki zostaną trwale usunięte.
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
