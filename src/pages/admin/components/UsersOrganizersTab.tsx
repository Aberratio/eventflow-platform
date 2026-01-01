import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockUsers, mockEvents } from '@/data/mockData';
import { Search, MoreHorizontal, Ban, Trash2, Eye, UserPlus, Calendar, UserCog } from 'lucide-react';
import { toast } from 'sonner';

export const UsersOrganizersTab = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOrganizerName, setNewOrganizerName] = useState('');
  const [newOrganizerEmail, setNewOrganizerEmail] = useState('');

  const organizers = mockUsers.filter((u) => u.role === 'organizer');

  const filteredOrganizers = organizers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getOrganizerEvents = (organizerId: string) => {
    return mockEvents.filter((e) => e.organizerId === organizerId).length;
  };

  const handleBlock = (userName: string) => {
    toast.success(`Organizator ${userName} został zablokowany`);
  };

  const handleDelete = (userName: string) => {
    toast.success(`Organizator ${userName} został usunięty`);
  };

  const handleChangeRole = (userName: string) => {
    toast.success(`Rola użytkownika ${userName} została zmieniona`);
  };

  const handleAddOrganizer = () => {
    if (newOrganizerName && newOrganizerEmail) {
      toast.success(`Organizator ${newOrganizerName} został dodany`);
      setNewOrganizerName('');
      setNewOrganizerEmail('');
      setIsAddDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie lub emailu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            <SelectItem value="active">Aktywni</SelectItem>
            <SelectItem value="blocked">Zablokowani</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Dodaj organizatora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nowego organizatora</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa</Label>
                <Input
                  id="name"
                  value={newOrganizerName}
                  onChange={(e) => setNewOrganizerName(e.target.value)}
                  placeholder="Nazwa organizatora"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newOrganizerEmail}
                  onChange={(e) => setNewOrganizerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <Button onClick={handleAddOrganizer} className="w-full">
                Dodaj organizatora
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Liczba wydarzeń</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {getOrganizerEvents(user.id)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Aktywny
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Podgląd profilu
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Zobacz wydarzenia
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(user.name)}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Zmień rolę
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBlock(user.name)}>
                        <Ban className="h-4 w-4 mr-2" />
                        Zablokuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(user.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Znaleziono {filteredOrganizers.length} organizatorów
      </div>
    </div>
  );
};
