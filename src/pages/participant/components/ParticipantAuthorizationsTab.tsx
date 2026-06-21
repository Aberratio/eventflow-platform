import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthorizations, grantAuthorization, revokeAuthorization } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, UserPlus, Users, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { AuthorizationGrantedByMe, AuthorizationGrantedToMe } from '@/types';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const ParticipantAuthorizationsTab = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['authorizations'],
    queryFn: () => getAuthorizations(),
    select: (r) => r.data,
  });

  const grantMutation = useMutation({
    mutationFn: (e: string) => grantAuthorization(e),
    onSuccess: () => {
      toast({ title: 'Upoważnienie udzielone', description: `Użytkownik może teraz zapisywać Cię na zawody.` });
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Błąd', description: err.message, variant: 'destructive' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeAuthorization(id),
    onSuccess: () => {
      toast({ title: 'Upoważnienie cofnięte' });
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Błąd', description: err.message, variant: 'destructive' });
    },
  });

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    grantMutation.mutate(trimmed);
  };

  const grantedByMe: AuthorizationGrantedByMe[] = data?.grantedByMe ?? [];
  const grantedToMe: AuthorizationGrantedToMe[] = data?.grantedToMe ?? [];

  return (
    <div className="space-y-6">
      {/* Dodaj upoważnienie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Upoważnij osobę do zapisywania Cię
          </CardTitle>
          <CardDescription>
            Podaj adres e-mail osoby, która będzie mogła zapisywać Cię na zawody i do sztafet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrant} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="auth-email" className="sr-only">
                Adres e-mail
              </Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="adres@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={grantMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={grantMutation.isPending || !email.trim()}>
              {grantMutation.isPending ? (
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
          {/* Osoby, które ja upoważniłem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Upoważnione przeze mnie
                {grantedByMe.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {grantedByMe.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Osoby, które mogą zapisywać Cię na zawody i do sztafet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grantedByMe.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nie upoważniłeś jeszcze żadnej osoby.
                </p>
              ) : (
                <ul className="divide-y">
                  {grantedByMe.map((auth) => (
                    <li key={auth.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={auth.granteeAvatar} />
                          <AvatarFallback className="text-xs">
                            {initials(auth.granteeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{auth.granteeName}</p>
                          <p className="text-xs text-muted-foreground">{auth.granteeEmail}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(auth.id)}
                        title="Cofnij upoważnienie"
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

          {/* Osoby, które mnie upoważniły */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Upoważnienia do zapisywania innych
                {grantedToMe.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {grantedToMe.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Osoby, które udzieliły Ci upoważnienia — możesz zapisywać je na zawody.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grantedToMe.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nikt jeszcze Cię nie upoważnił.
                </p>
              ) : (
                <ul className="divide-y">
                  {grantedToMe.map((auth) => (
                    <li key={auth.id} className="flex items-center gap-3 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={auth.grantorAvatar} />
                        <AvatarFallback className="text-xs">
                          {initials(auth.grantorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{auth.grantorName}</p>
                        <p className="text-xs text-muted-foreground">{auth.grantorEmail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ParticipantAuthorizationsTab;
