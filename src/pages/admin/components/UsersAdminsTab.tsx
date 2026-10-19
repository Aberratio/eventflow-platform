import { getAllUsers } from '@/api/fetchAllPages';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserViewEditDialog } from '@/components/admin/UserViewEditDialog';
import { MoreHorizontal, Pencil, Plus, Search, ShieldCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types';
import { appLogger } from '@/lib/logger';

const roleLabels: Record<Extract<UserRole, 'admin' | 'superadmin'>, string> = {
  admin: 'Administrator',
  superadmin: 'Superadmin',
};

/** Staff accounts listed here: admins and (umowa §5.8) moderators. */
const staffRoleLabel = (role: UserRole): string =>
  role === 'superadmin' ? 'Superadmin' : role === 'moderator' ? 'Moderator' : 'Administrator';
const formatLastLogin = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : 'Nigdy';

export const UsersAdminsTab = () => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createdAdmins, setCreatedAdmins] = useState<User[]>([]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, UserRole>>({});
  const [selectedRole, setSelectedRole] =
    useState<Extract<UserRole, 'admin' | 'superadmin'>>('admin');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '' });
  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'admins'],
    queryFn: () => getAllUsers(),
  });

  const admins = [
    ...(usersResponse?.data ?? [])
      .filter(
        (user) => user.role === 'admin' || user.role === 'superadmin' || user.role === 'moderator',
      )
      .map((user) => ({ ...user, role: roleOverrides[user.id] ?? user.role })),
    ...createdAdmins,
  ];
  const filteredAdmins = admins.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role === 'superadmin' ? 'superadmin' : 'admin');
    setRoleDialogOpen(true);
  };

  const handleAddAdmin = () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      toast.error('Podaj imie i email administratora');
      return;
    }

    appLogger.user('user_edit', `Utworzono konto administratora ${newAdmin.name}`, {
      targetType: 'user',
      targetName: newAdmin.name,
      metadata: { role: 'admin', email: newAdmin.email },
    });
    setCreatedAdmins((current) => [
      ...current,
      {
        id: `admin-${Date.now()}`,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone || undefined,
        role: 'admin',
        status: 'active',
      },
    ]);
    toast.success(`Konto administratora ${newAdmin.name} zostalo utworzone`);
    setNewAdmin({ name: '', email: '', phone: '' });
    setAddDialogOpen(false);
  };

  const handleChangeRole = () => {
    if (!selectedUser) return;

    appLogger.user(
      'role_change',
      `Zmieniono role administratora ${selectedUser.name} na ${roleLabels[selectedRole]}`,
      {
        targetType: 'user',
        targetId: selectedUser.id,
        targetName: selectedUser.name,
        metadata: { oldRole: selectedUser.role, newRole: selectedRole },
      },
    );
    setRoleOverrides((current) => ({ ...current, [selectedUser.id]: selectedRole }));
    setCreatedAdmins((current) =>
      current.map((admin) =>
        admin.id === selectedUser.id ? { ...admin, role: selectedRole } : admin,
      ),
    );
    toast.success(
      `Rola konta ${selectedUser.name} zostala zmieniona na ${roleLabels[selectedRole]}`,
    );
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu lub emailu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj admina
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ostatnie logowanie</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'superadmin' ? 'destructive' : 'default'}>
                    {staffRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    {user.status === 'blocked' ? 'Zablokowany' : 'Aktywny'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatLastLogin(user.lastLoginAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setProfileDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Podglad / Edycja
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Zmien role
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
        Znaleziono {filteredAdmins.length} kont administracyjnych
      </div>

      <UserViewEditDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedUser}
        extraViewContent={
          selectedUser && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Konto z uprawnieniami:{' '}
                <span className="font-medium">{staffRoleLabel(selectedUser.role)}</span>
              </span>
            </div>
          )
        }
      />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj konto administratora</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imie i nazwisko</Label>
              <Input
                value={newAdmin.name}
                onChange={(event) => setNewAdmin({ ...newAdmin, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={newAdmin.phone}
                onChange={(event) => setNewAdmin({ ...newAdmin, phone: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddAdmin}>Utworz konto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmien role: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nowa rola</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as typeof selectedRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleChangeRole}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
