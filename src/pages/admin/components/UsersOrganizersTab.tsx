import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { UserViewEditDialog } from '@/components/admin/UserViewEditDialog';
import { mockEvents } from '@/api/mock/events.mock';
import { mockUsers } from '@/api/mock/users.mock';
import { Search, MoreHorizontal, Ban, Trash2, Pencil, UserPlus, Calendar, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { User, UserRole } from '@/types';
import { AddOrganizerDialog } from './AddOrganizerDialog';

export const UsersOrganizersTab = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('organizer');

  const organizers = mockUsers.filter(u => u.role === 'organizer');
  const nonOrganizers = mockUsers.filter(u => u.role !== 'organizer');

  const filteredOrganizers = organizers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getOrganizerEvents = (organizerId: string) => mockEvents.filter(e => e.organizerId === organizerId);

  const handleBlock = () => {
    if (!selectedUser) return;
    toast.success(`Organizator ${selectedUser.name} został zablokowany`);
    setBlockDialogOpen(false); setSelectedUser(null);
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    toast.success(`Organizator ${selectedUser.name} został usunięty`);
    setDeleteDialogOpen(false); setSelectedUser(null);
  };

  const handleChangeRole = () => {
    if (!selectedUser) return;
    const roleLabels: Record<UserRole, string> = { participant: 'Uczestnik', organizer: 'Organizator', moderator: 'Moderator', admin: 'Administrator' };
    toast.success(`Rola użytkownika ${selectedUser.name} została zmieniona na: ${roleLabels[selectedRole]}`);
    setRoleDialogOpen(false); setSelectedUser(null);
  };

  const openAction = (user: User, action: 'profile' | 'events' | 'role' | 'block' | 'delete') => {
    setSelectedUser(user);
    if (action === 'role') setSelectedRole(user.role);
    const setters = { profile: setProfileDialogOpen, events: setEventsDialogOpen, role: setRoleDialogOpen, block: setBlockDialogOpen, delete: setDeleteDialogOpen };
    setters[action](true);
  };

  const organizerEvents = selectedUser ? getOrganizerEvents(selectedUser.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Szukaj po nazwie lub emailu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            <SelectItem value="active">Aktywni</SelectItem>
            <SelectItem value="blocked">Zablokowani</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsAddDialogOpen(true)}><UserPlus className="h-4 w-4 mr-2" />Dodaj organizatora</Button>
      </div>

      <AddOrganizerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} nonOrganizers={nonOrganizers} />

      <div className="border border-border/50 rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead><TableHead>Email</TableHead>
              <TableHead>Liczba wydarzeń</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{getOrganizerEvents(user.id).length}</div>
                </TableCell>
                <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Aktywny</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openAction(user, 'profile')}><Pencil className="h-4 w-4 mr-2" />Podgląd / Edycja</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'events')}><Calendar className="h-4 w-4 mr-2" />Zobacz wydarzenia</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'role')}><UserCog className="h-4 w-4 mr-2" />Zmień rolę</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'block')}><Ban className="h-4 w-4 mr-2" />Zablokuj</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => openAction(user, 'delete')}><Trash2 className="h-4 w-4 mr-2" />Usuń</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">Znaleziono {filteredOrganizers.length} organizatorów</div>

      <UserViewEditDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} user={selectedUser}
        extraViewContent={selectedUser && (
          <div><Label className="text-muted-foreground">Liczba wydarzeń</Label><p className="font-medium">{getOrganizerEvents(selectedUser.id).length}</p></div>
        )} />

      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Wydarzenia organizatora: {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-2 max-h-[400px] overflow-y-auto">
            {organizerEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Brak wydarzeń</p>
            ) : organizerEvents.map(event => (
              <Link key={event.id} to={`/events/${event.slug}`}
                className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 transition-colors"
                onClick={() => setEventsDialogOpen(false)}>
                <div><p className="font-medium text-sm">{event.name}</p><p className="text-xs text-muted-foreground">{event.date} · {event.location}</p></div>
                <Badge variant="outline" className="text-xs">{event.status === 'published' ? 'Nadchodzące' : event.status === 'completed' ? 'Zakończone' : event.status === 'draft' ? 'Szkic' : event.status}</Badge>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Zmień rolę: {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nowa rola</Label>
              <Select value={selectedRole} onValueChange={v => setSelectedRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Uczestnik</SelectItem>
                  <SelectItem value="organizer">Organizator</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleChangeRole}>Zmień rolę</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zablokować organizatora?</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz zablokować <span className="font-medium">{selectedUser?.name}</span>? Organizator nie będzie mógł się zalogować ani zarządzać wydarzeniami.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Anuluj</AlertDialogCancel><AlertDialogAction onClick={handleBlock}>Zablokuj</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć organizatora?</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć <span className="font-medium">{selectedUser?.name}</span>? Ta operacja jest nieodwracalna.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Anuluj</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Usuń</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
