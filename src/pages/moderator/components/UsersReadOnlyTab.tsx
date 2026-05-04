import {
  getOrganizerEventLimit,
  mockEvents,
  mockRegistrations,
  mockUsers,
  updateOrganizerEventLimit,
} from '@/api';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Users, Building2, Eye, Lock, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { OrganizerEventLimit } from '@/types';
import { toast } from 'sonner';

interface UsersReadOnlyTabProps {
  userType: 'participant' | 'organizer';
}

export const UsersReadOnlyTab = ({ userType }: UsersReadOnlyTabProps) => {
  const [search, setSearch] = useState('');
  const [eventLimits, setEventLimits] = useState<Record<string, OrganizerEventLimit>>({});
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);

  const users = useMemo(() => mockUsers.filter((u) => u.role === userType), [userType]);

  useEffect(() => {
    if (userType !== 'organizer') return;
    users.forEach((organizer) => {
      getOrganizerEventLimit(organizer.id).then((response) => {
        setEventLimits((prev) => ({ ...prev, [organizer.id]: response.data }));
        setLimitDrafts((prev) => ({ ...prev, [organizer.id]: String(response.data.limit) }));
      });
    });
  }, [userType, users]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getUserRegistrations = (userId: string) => {
    return mockRegistrations.filter((r) => r.userId === userId).length;
  };

  const getOrganizerEvents = (organizerId: string) => {
    return mockEvents.filter((e) => e.organizerId === organizerId && e.status !== 'deleted').length;
  };

  const saveLimit = async (organizerId: string) => {
    const nextLimit = Number(limitDrafts[organizerId] ?? 0);
    if (!Number.isInteger(nextLimit) || nextLimit < 0) {
      toast.error('Limit musi być liczbą całkowitą większą lub równą 0');
      return;
    }

    try {
      setSavingLimitId(organizerId);
      const response = await updateOrganizerEventLimit(organizerId, nextLimit);
      setEventLimits((prev) => ({ ...prev, [organizerId]: response.data }));
      setLimitDrafts((prev) => ({ ...prev, [organizerId]: String(response.data.limit) }));
      toast.success('Limit wydarzeń został zapisany');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać limitu');
    } finally {
      setSavingLimitId(null);
    }
  };

  const isParticipant = userType === 'participant';
  const Icon = isParticipant ? Users : Building2;
  const title = isParticipant ? 'Uczestnicy' : 'Organizatorzy';

  return (
    <div className="space-y-4">
      <Alert className="border-muted bg-muted/50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Widok moderatora pozostaje ograniczony. Moderator może jednak zmieniać limit wydarzeń
          organizatora.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title} ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Email</TableHead>
                  {isParticipant ? (
                    <>
                      <TableHead>Klub</TableHead>
                      <TableHead>Rejestracje</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Firma</TableHead>
                      <TableHead>Wydarzenia</TableHead>
                      <TableHead>Limit wydarzeń</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const limit = eventLimits[user.id];
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      {isParticipant ? (
                        <>
                          <TableCell>{user.club || '-'}</TableCell>
                          <TableCell>{getUserRegistrations(user.id)}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{user.companyName || '-'}</TableCell>
                          <TableCell>{getOrganizerEvents(user.id)}</TableCell>
                          <TableCell>
                            <div className="flex min-w-56 items-center gap-2">
                              <Input
                                type="number"
                                min={limit?.used ?? 0}
                                value={limitDrafts[user.id] ?? ''}
                                onChange={(event) =>
                                  setLimitDrafts((prev) => ({
                                    ...prev,
                                    [user.id]: event.target.value,
                                  }))
                                }
                                className="w-24"
                              />
                              <span className="text-xs text-muted-foreground">
                                {limit ? `${limit.used}/${limit.limit}` : '...'}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveLimit(user.id)}
                                disabled={savingLimitId === user.id}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/10 text-primary"
                        >
                          Aktywny
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Nie znaleziono użytkowników</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
