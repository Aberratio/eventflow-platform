import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Event, Registration } from '@/types';
import { Search, Download, Mail, UserCheck, UserX, Hash } from 'lucide-react';

interface ParticipantsTabProps {
  event: Event;
  registrations: Registration[];
}

export const ParticipantsTab = ({ event, registrations }: ParticipantsTabProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);
  const [bibDialogOpen, setBibDialogOpen] = useState(false);
  const [bibNumber, setBibNumber] = useState('');

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.userName.toLowerCase().includes(search.toLowerCase()) ||
      reg.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      reg.bibNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesDistance = distanceFilter === 'all' || reg.distanceId === distanceFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    return matchesSearch && matchesDistance && matchesStatus;
  });

  const handleStatusChange = (registration: Registration, newStatus: 'confirmed' | 'cancelled') => {
    toast({
      title: 'Status zaktualizowany',
      description: `Zmieniono status ${registration.userName} na ${newStatus === 'confirmed' ? 'potwierdzony' : 'anulowany'}.`,
    });
  };

  const handleAssignBib = () => {
    if (!selectedParticipant || !bibNumber) return;
    toast({
      title: 'Numer startowy przypisany',
      description: `Przypisano numer ${bibNumber} dla ${selectedParticipant.userName}.`,
    });
    setBibDialogOpen(false);
    setBibNumber('');
    setSelectedParticipant(null);
  };

  const handleExport = () => {
    toast({
      title: 'Eksport rozpoczęty',
      description: 'Lista uczestników zostanie pobrana jako plik CSV.',
    });
  };

  const handleSendMessage = () => {
    toast({
      title: 'Funkcja w przygotowaniu',
      description: 'Wysyłanie wiadomości będzie dostępne wkrótce.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Potwierdzony</Badge>;
      case 'pending':
        return <Badge variant="secondary">Oczekujący</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Anulowany</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po imieniu, email lub numerze startowym..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dystans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie dystanse</SelectItem>
                {event.distances.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="confirmed">Potwierdzony</SelectItem>
                <SelectItem value="pending">Oczekujący</SelectItem>
                <SelectItem value="cancelled">Anulowany</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Eksport
              </Button>
              <Button variant="outline" onClick={handleSendMessage}>
                <Mail className="mr-2 h-4 w-4" /> Wiadomość
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Uczestnicy ({filteredRegistrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak uczestników spełniających kryteria wyszukiwania.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer</TableHead>
                    <TableHead>Uczestnik</TableHead>
                    <TableHead>Dystans</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data zapisu</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map(reg => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <span className="font-mono font-medium">
                          {reg.bibNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reg.userName}</div>
                          <div className="text-sm text-muted-foreground">{reg.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{reg.distanceName}</TableCell>
                      <TableCell>{reg.category}</TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString('pl-PL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Przypisz numer startowy"
                            onClick={() => {
                              setSelectedParticipant(reg);
                              setBibNumber(reg.bibNumber || '');
                              setBibDialogOpen(true);
                            }}
                          >
                            <Hash className="h-4 w-4" />
                          </Button>
                          {reg.status !== 'confirmed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Potwierdź"
                              onClick={() => handleStatusChange(reg, 'confirmed')}
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {reg.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Anuluj"
                              onClick={() => handleStatusChange(reg, 'cancelled')}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bib number dialog */}
      <Dialog open={bibDialogOpen} onOpenChange={setBibDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz numer startowy</DialogTitle>
            <DialogDescription>
              Przypisz numer startowy dla {selectedParticipant?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Wpisz numer startowy"
              value={bibNumber}
              onChange={e => setBibNumber(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBibDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAssignBib} disabled={!bibNumber}>
              Przypisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
