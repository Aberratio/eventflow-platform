import {
  getOrganizerEventLimit,
  mockEvents,
  mockUsers,
  updateOrganizerEventLimit,
} from '@/api';
import { useEffect, useMemo, useState } from 'react';
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
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { UserViewEditDialog } from '@/components/admin/UserViewEditDialog';
import {
  Search,
  MoreHorizontal,
  Ban,
  Trash2,
  Pencil,
  UserPlus,
  Calendar,
  UserCog,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { OrganizerEventLimit, User, UserRole } from '@/types';
import { AddOrganizerDialog } from './AddOrganizerDialog';
import { appLogger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels = {
  draft: 'Szkic',
  active: 'Aktywne',
  past: 'Przeszłe',
  archived: 'Archiwum',
  deleted: 'Usunięte',
} as const;

export const UsersOrganizersTab = () => {
  const { user: currentUser } = useAuth();
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
  const [eventLimits, setEventLimits] = useState<Record<string, OrganizerEventLimit>>({});
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);

  const organizers = useMemo(() => mockUsers.filter((u) => u.role === 'organizer'), []);
  const nonOrganizers = useMemo(() => mockUsers.filter((u) => u.role !== 'organizer'), []);
  const canManageAdmins = currentUser?.role === 'superadmin';

  useEffect(() => {
    organizers.forEach((organizer) => {
      getOrganizerEventLimit(organizer.id).then((response) => {
        setEventLimits((prev) => ({ ...prev, [organizer.id]: response.data }));
        setLimitDrafts((prev) => ({ ...prev, [organizer.id]: String(response.data.limit) }));
      });
    });
  }, [organizers]);

  const filteredOrganizers = organizers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || statusFilter === 'active';
    return matchesSearch && matchesStatus;
  });

  const getOrganizerEvents = (organizerId: string) =>
    mockEvents.filter((e) => e.organizerId === organizerId);

  const saveLimit = async (organizerId: string) => {
    const draft = Number(limitDrafts[organizerId] ?? 0);
    if (!Number.isInteger(draft) || draft < 0) {
      toast.error('Limit musi być liczbą całkowitą większą lub równą 0');
      return;
    }

    try {
      setSavingLimitId(organizerId);
      const response = await updateOrganizerEventLimit(organizerId, draft);
      setEventLimits((prev) => ({ ...prev, [organizerId]: response.data }));
      setLimitDrafts((prev) => ({ ...prev, [organizerId]: String(response.data.limit) }));
      toast.success('Limit wydarzeń został zapisany');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać limitu');
    } finally {
      setSavingLimitId(null);
    }
  };

  const handleBlock = () => {
    if (!selectedUser) return;
    appLogger.user('user_block', `Zablokowano organizatora ${selectedUser.name}`, {
      targetType: 'user',
      targetId: selectedUser.id,
      targetName: selectedUser.name,
    });
    toast.success(`Organizator ${selectedUser.name} został zablokowany`);
    setBlockDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    appLogger.user('user_delete', `Usunięto organizatora ${selectedUser.name}`, {
      targetType: 'user',
      targetId: selectedUser.id,
      targetName: selectedUser.name,
    });
    toast.success(`Organizator ${selectedUser.name} został usunięty`);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleChangeRole = () => {
    if (!selectedUser) return;
    const roleLabels: Record<UserRole, string> = {
      participant: 'Uczestnik',
      organizer: 'Organizator',
      moderator: 'Moderator',
      admin: 'Administrator',
      superadmin: 'Superadmin',
    };
    appLogger.user('role_change', `Zmieniono rolę użytkownika ${selectedUser.name} na ${roleLabels[selectedRole]}`, {
      targetType: 'user',
      targetId: selectedUser.id,
      targetName: selectedUser.name,
      metadata: { oldRole: selectedUser.role, newRole: selectedRole },
    });
    toast.success(`Rola użytkownika ${selectedUser.name} została zmieniona na: ${roleLabels[selectedRole]}`);
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };

  const openAction = (user: User, action: 'profile' | 'events' | 'role' | 'block' | 'delete') => {
    setSelectedUser(user);
    if (action === 'role') setSelectedRole(user.role);
    const setters = {
      profile: setProfileDialogOpen,
      events: setEventsDialogOpen,
      role: setRoleDialogOpen,
      block: setBlockDialogOpen,
      delete: setDeleteDialogOpen,
    };
    setters[action](true);
  };

  const organizerEvents = selectedUser ? getOrganizerEvents(selectedUser.id) : [];
  const currentEvents = organizerEvents.filter((e) => e.status !== 'archived' && e.status !== 'deleted');
  const archivedEvents = organizerEvents.filter((e) => e.status === 'archived');
  const deletedEvents = organizerEvents.filter((e) => e.status === 'deleted');

  const renderLimitEditor = (organizer: User) => {
    const limit = eventLimits[organizer.id];
    return (
      <div className="space-y-3 rounded-md border p-3">
        <div>
          <Label className="text-muted-foreground">Limit wydarzeń</Label>
          <p className="text-sm">
            {limit
              ? `Wykorzystano ${limit.used} z ${limit.limit}. Dostępne: ${limit.available}.`
              : 'Ładowanie limitu...'}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`event-limit-${organizer.id}`}>Nowy limit</Label>
            <Input
              id={`event-limit-${organizer.id}`}
              type="number"
              min={limit?.used ?? 0}
              value={limitDrafts[organizer.id] ?? ''}
              onChange={(event) =>
                setLimitDrafts((prev) => ({ ...prev, [organizer.id]: event.target.value }))
              }
            />
          </div>
          <Button onClick={() => saveLimit(organizer.id)} disabled={savingLimitId === organizer.id}>
            <Save className="mr-2 h-4 w-4" />
            {savingLimitId === organizer.id ? 'Zapis...' : 'Zapisz'}
          </Button>
        </div>
      </div>
    );
  };

  const renderEventList = (events: typeof organizerEvents) => {
    if (events.length === 0) {
      return <p className="py-4 text-center text-sm text-muted-foreground">Brak wydarzeń</p>;
    }

    return events.map((event) => (
      <Link
        key={event.id}
        to={event.status === 'draft' ? `/events/${event.slug}/preview` : `/events/${event.slug}`}
        className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent/50"
        onClick={() => setEventsDialogOpen(false)}
      >
        <div>
          <p className="text-sm font-medium">{event.name}</p>
          <p className="text-xs text-muted-foreground">
            {event.date} · {event.location}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {statusLabels[event.status]}
        </Badge>
      </Link>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Dodaj organizatora
        </Button>
      </div>

      <AddOrganizerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nonOrganizers={nonOrganizers}
      />

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Wydarzenia</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizers.map((user) => {
              const limit = eventLimits[user.id];
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getOrganizerEvents(user.id).filter((event) => event.status !== 'deleted').length}
                    </div>
                  </TableCell>
                  <TableCell>
                    {limit ? `${limit.used}/${limit.limit} (${limit.available} dostępne)` : 'Ładowanie...'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
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
                        <DropdownMenuItem onClick={() => openAction(user, 'profile')}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Podgląd / Edycja
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAction(user, 'events')}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Zobacz wydarzenia
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAction(user, 'role')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Zmień rolę
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAction(user, 'block')}>
                          <Ban className="mr-2 h-4 w-4" />
                          Zablokuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openAction(user, 'delete')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">Znaleziono {filteredOrganizers.length} organizatorów</div>

      <UserViewEditDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedUser}
        extraViewContent={selectedUser && renderLimitEditor(selectedUser)}
      />

      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wydarzenia organizatora: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="current" className="pt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Bieżące ({currentEvents.length})</TabsTrigger>
              <TabsTrigger value="archive">Archiwum ({archivedEvents.length})</TabsTrigger>
              <TabsTrigger value="deleted">Usunięte ({deletedEvents.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="max-h-[400px] space-y-2 overflow-y-auto pt-3">
              {renderEventList(currentEvents)}
            </TabsContent>
            <TabsContent value="archive" className="max-h-[400px] space-y-2 overflow-y-auto pt-3">
              {renderEventList(archivedEvents)}
            </TabsContent>
            <TabsContent value="deleted" className="max-h-[400px] space-y-2 overflow-y-auto pt-3">
              {renderEventList(deletedEvents)}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień rolę: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nowa rola</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Uczestnik</SelectItem>
                  <SelectItem value="organizer">Organizator</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  {canManageAdmins && <SelectItem value="admin">Administrator</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleChangeRole}>Zmień rolę</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zablokować organizatora?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zablokować <span className="font-medium">{selectedUser?.name}</span>?
              Organizator nie będzie mógł się zalogować ani zarządzać wydarzeniami.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock}>Zablokuj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć organizatora?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć <span className="font-medium">{selectedUser?.name}</span>?
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
