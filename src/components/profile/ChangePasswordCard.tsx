import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { changePassword } from '@/api';

const MIN_LENGTH = 8;

export const ChangePasswordCard = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (): string | null => {
    if (!current || !next || !confirm) return 'Wypełnij wszystkie pola.';
    if (next.length < MIN_LENGTH) return 'Nowe hasło musi mieć co najmniej 8 znaków.';
    if (next !== confirm) return 'Hasła nie są identyczne.';
    if (next === current) return 'Nowe hasło musi różnić się od obecnego.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      await changePassword({ oldPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setError(null);
      toast.success('Hasło zostało zmienione');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się zmienić hasła.';
      setError(message);
      toast.error('Nie udało się zmienić hasła', { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Zmiana hasła</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Obecne hasło</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nowe hasło</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <p id="new-password-hint" className="text-xs text-muted-foreground">
              Co najmniej 8 znaków.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Powtórz nowe hasło</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zmień hasło
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
