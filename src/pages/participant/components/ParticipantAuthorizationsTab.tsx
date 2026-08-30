import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCare, grantCareByEmail, addCompetitor, revokeCare } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, UserPlus, Users, ShieldCheck, Baby, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { MyCompetitor, Caregiver } from '@/types';

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const ParticipantAuthorizationsTab = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['care'],
    queryFn: () => getCare(),
    select: (r) => r.data,
  });

  const grantByEmailMutation = useMutation({
    mutationFn: (e: string) => grantCareByEmail(e),
    onSuccess: () => {
      toast({ title: 'Opieka nadana', description: `Konto może teraz zapisywać Cię na zawody.` });
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['care'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Błąd', description: err.message, variant: 'destructive' });
    },
  });

  const addCompetitorMutation = useMutation({
    mutationFn: () =>
      addCompetitor({
        firstName: childFirstName.trim(),
        lastName: childLastName.trim(),
        birthDate: childBirthDate || undefined,
      }),
    onSuccess: (r) => {
      const warnings = r.data.duplicateWarnings ?? [];
      if (warnings.length > 0) {
        toast({
          title: 'Zawodnik dodany — uwaga na duplikat',
          description: `Znaleźliśmy już profil o takim imieniu, nazwisku i dacie urodzenia. Jeśli to ta sama osoba, poproś drugiego opiekuna o nadanie Ci opieki nad istniejącym profilem zamiast tworzenia nowego.`,
        });
      } else {
        toast({ title: 'Zawodnik dodany', description: 'Możesz teraz zapisywać go na zawody.' });
      }
      setChildFirstName('');
      setChildLastName('');
      setChildBirthDate('');
      queryClient.invalidateQueries({ queryKey: ['care'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Błąd', description: err.message, variant: 'destructive' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeCare(id),
    onSuccess: () => {
      toast({ title: 'Opieka cofnięta' });
      queryClient.invalidateQueries({ queryKey: ['care'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Błąd', description: err.message, variant: 'destructive' });
    },
  });

  const handleGrantByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    grantByEmailMutation.mutate(trimmed);
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFirstName.trim() || !childLastName.trim()) return;
    addCompetitorMutation.mutate();
  };

  const myCompetitors: MyCompetitor[] = data?.myCompetitors ?? [];
  const caregivers: Caregiver[] = data?.caregivers ?? [];

  return (
    <div className="space-y-6">
      {/* Dodaj Zawodnika (np. dziecko) pod moją opiekę */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Baby className="h-4 w-4" />
            Dodaj osobę pod swoją opiekę
          </CardTitle>
          <CardDescription>
            Dla dziecka lub innej osoby bez konta — podaj imię, nazwisko i datę urodzenia. Będziesz
            mógł/mogła zapisywać tę osobę na zawody.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAddCompetitor}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <Label htmlFor="child-first-name" className="sr-only">
                Imię
              </Label>
              <Input
                id="child-first-name"
                placeholder="Imię"
                value={childFirstName}
                onChange={(e) => setChildFirstName(e.target.value)}
                disabled={addCompetitorMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="child-last-name" className="sr-only">
                Nazwisko
              </Label>
              <Input
                id="child-last-name"
                placeholder="Nazwisko"
                value={childLastName}
                onChange={(e) => setChildLastName(e.target.value)}
                disabled={addCompetitorMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="child-birth-date" className="sr-only">
                Data urodzenia
              </Label>
              <Input
                id="child-birth-date"
                type="date"
                value={childBirthDate}
                onChange={(e) => setChildBirthDate(e.target.value)}
                disabled={addCompetitorMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={
                addCompetitorMutation.isPending || !childFirstName.trim() || !childLastName.trim()
              }
            >
              {addCompetitorMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span className="ml-1.5">Dodaj</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upoważnij istniejące konto do zapisywania mnie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Upoważnij konto do zapisywania Cię
          </CardTitle>
          <CardDescription>
            Podaj adres e-mail osoby, która będzie mogła zapisywać Cię na zawody i do sztafet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrantByEmail} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="care-email" className="sr-only">
                Adres e-mail
              </Label>
              <Input
                id="care-email"
                type="email"
                placeholder="adres@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={grantByEmailMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={grantByEmailMutation.isPending || !email.trim()}>
              {grantByEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span className="ml-1.5">Upoważnij</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Zawodnicy pod moją opieką */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Osoby pod moją opieką
                {myCompetitors.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {myCompetitors.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Zawodnicy, których możesz zapisywać na zawody i do sztafet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCompetitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nie masz jeszcze nikogo pod opieką.</p>
              ) : (
                <ul className="divide-y">
                  {myCompetitors.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials(c.firstName, c.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.email || (c.competitorUserId ? 'Ma własne konto' : 'Bez konta')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(c.id)}
                        title="Cofnij opiekę"
                      >
                        {revokeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Konta, które mają opiekę nade mną */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Konta, które mogą zapisywać mnie
                {caregivers.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {caregivers.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Osoby, które udzieliłeś/aś sobie upoważnienia — mogą zapisywać Cię na zawody.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caregivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nikt nie ma nad Tobą opieki.</p>
              ) : (
                <ul className="divide-y">
                  {caregivers.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={g.kontoAvatar} />
                        <AvatarFallback className="text-xs">
                          {g.kontoName
                            .split(' ')
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{g.kontoName}</p>
                        <p className="text-xs text-muted-foreground">{g.kontoEmail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Jeśli dwie osoby dodadzą tę samą osobę (np. oboje rodzice to samo dziecko) osobno,
              system ostrzeże o możliwym duplikacie przy dodawaniu — scalanie takich profili nie
              jest jeszcze dostępne z tego ekranu.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ParticipantAuthorizationsTab;
