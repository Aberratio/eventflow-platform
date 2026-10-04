import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { requestEmailChange } from '@/api';

/**
 * PP.7: self-service e-mail change. The new address only takes effect after the user clicks
 * the link mailed to it; until then they keep signing in with the current address.
 */
export const ChangeEmailCard = () => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !password) {
      setError('Podaj nowy adres e-mail i obecne hasło.');
      setPendingEmail(null);
      return;
    }

    setSaving(true);
    try {
      const response = await requestEmailChange({
        newEmail: newEmail.trim(),
        currentPassword: password,
      });
      setPendingEmail(response.data?.pendingEmail ?? newEmail.trim());
      setNewEmail('');
      setPassword('');
      setError(null);
    } catch (err) {
      setPendingEmail(null);
      setError(err instanceof Error ? err.message : 'Nie udało się wysłać linku.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Zmień adres e-mail</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="change-email-new">Nowy adres e-mail</Label>
            <Input
              id="change-email-new"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="change-email-password">Obecne hasło</Label>
            <Input
              id="change-email-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {pendingEmail && (
            <p role="status" className="text-sm text-muted-foreground">
              Wysłaliśmy link na {pendingEmail}. Kliknij go, aby dokończyć zmianę. Do tego czasu
              logujesz się dotychczasowym adresem.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Wyślij link potwierdzający
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
