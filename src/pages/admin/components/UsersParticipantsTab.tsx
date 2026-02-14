import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { mockUsers, mockRegistrations } from '@/data/mockData';
import { Search, MoreHorizontal, Ban, RefreshCw, Trash2, Eye, UserCog, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types';

export const UsersParticipantsTab = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('participant');

  const isBlocked = (userId: string) => blockedUsers.has(userId);

  const participants = mockUsers.filter((u) => u.role === 'participant');

  const filteredParticipants = participants.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !isBlocked(user.id)) ||
      (statusFilter === 'blocked' && isBlocked(user.id));
    return matchesSearch && matchesStatus;
  });

  const getUserRegistrations = (userId: string) => {
    return mockRegistrations.filter((r) => r.userId === userId).length;
  };

  const openAction = (user: User, action: 'profile' | 'role' | 'reset' | 'block' | 'delete') => {
    setSelectedUser(user);
    if (action === 'role') setSelectedRole(user.role);
    const setters = {
      profile: setProfileDialogOpen,
      role: setRoleDialogOpen,
      reset: setResetPasswordDialogOpen,
      block: setBlockDialogOpen,
      delete: setDeleteDialogOpen,
    };
    setters[action](true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu lub emailu..."
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imię i nazwisko</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rejestracje</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getUserRegistrations(user.id)}</TableCell>
                <TableCell>
                  {isBlocked(user.id) ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Zablokowany
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Aktywny
                    </Badge>
                  )}
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
                        <Eye className="h-4 w-4 mr-2" />
                        Podgląd profilu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'role')}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Zmień rolę
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'reset')}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resetuj hasło
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAction(user, 'block')}>
                        {isBlocked(user.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Odblokuj
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Zablokuj
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openAction(user, 'delete')}
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
        Znaleziono {filteredParticipants.length} uczestników
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil uczestnika</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Imię i nazwisko</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                {selectedUser.phone && (
                  <div>
                    <Label className="text-muted-foreground">Telefon</Label>
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.birthYear && (
                  <div>
                    <Label className="text-muted-foreground">Rok urodzenia</Label>
                    <p className="font-medium">{selectedUser.birthYear}</p>
                  </div>
                )}
                {selectedUser.gender && (
                  <div>
                    <Label className="text-muted-foreground">Płeć</Label>
                    <p className="font-medium">{selectedUser.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}</p>
                  </div>
                )}
                {selectedUser.club && (
                  <div>
                    <Label className="text-muted-foreground">Klub</Label>
                    <p className="font-medium">{selectedUser.club}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Liczba rejestracji</Label>
                <p className="font-medium">{getUserRegistrations(selectedUser.id)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień rolę użytkownika</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Zmiana roli dla: <span className="font-medium text-foreground">{selectedUser.name}</span>
              </p>
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
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Anuluj</Button>
                <Button onClick={() => {
                  toast.success(`Rola użytkownika ${selectedUser.name} zmieniona na ${selectedRole}`);
                  setRoleDialogOpen(false);
                }}>
                  Zapisz
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Alert */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetowanie hasła</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz wysłać link do resetowania hasła do użytkownika {selectedUser?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              toast.success(`Link do resetowania hasła wysłany do ${selectedUser?.name}`);
            }}>
              Wyślij link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Alert */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser && isBlocked(selectedUser.id) ? 'Odblokowanie użytkownika' : 'Blokowanie użytkownika'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && isBlocked(selectedUser.id)
                ? `Czy na pewno chcesz odblokować użytkownika ${selectedUser?.name}? Użytkownik odzyska dostęp do konta.`
                : `Czy na pewno chcesz zablokować użytkownika ${selectedUser?.name}? Zablokowany użytkownik nie będzie mógł się zalogować.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedUser) {
                const blocked = isBlocked(selectedUser.id);
                setBlockedUsers((prev) => {
                  const next = new Set(prev);
                  if (blocked) {
                    next.delete(selectedUser.id);
                  } else {
                    next.add(selectedUser.id);
                  }
                  return next;
                });
                toast.success(
                  blocked
                    ? `Użytkownik ${selectedUser.name} został odblokowany`
                    : `Użytkownik ${selectedUser.name} został zablokowany`
                );
              }
            }}>
              {selectedUser && isBlocked(selectedUser.id) ? 'Odblokuj' : 'Zablokuj'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuwanie użytkownika</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć użytkownika {selectedUser?.name}? Ta operacja jest nieodwracalna i usunie wszystkie dane powiązane z tym kontem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast.success(`Użytkownik ${selectedUser?.name} został usunięty`);
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
