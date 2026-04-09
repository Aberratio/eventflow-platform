import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { appLogger } from '@/lib/logger';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordChanged: () => void;
}

interface PasswordStrengthResult {
  strength: number;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  return { strength, checks };
}

function getStrengthLabel(strength: number): string {
  if (strength <= 2) return 'Słabe';
  if (strength <= 3) return 'Średnie';
  if (strength <= 4) return 'Dobre';
  return 'Bardzo dobre';
}

function getStrengthColor(strength: number, index: number): string {
  if (index > strength) return 'bg-muted';
  if (strength <= 2) return 'bg-destructive';
  if (strength <= 3) return 'bg-warning';
  return 'bg-success';
}

export const PasswordChangeDialog = ({
  open,
  onOpenChange,
  onPasswordChanged,
}: PasswordChangeDialogProps) => {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { strength, checks } = calculatePasswordStrength(form.new);

  const handleSubmit = () => {
    if (form.new !== form.confirm) {
      toast({ title: 'Błąd', description: 'Hasła nie są identyczne.', variant: 'destructive' });
      return;
    }
    if (strength < 4) {
      toast({
        title: 'Słabe hasło',
        description: 'Hasło nie spełnia wymagań bezpieczeństwa.',
        variant: 'destructive',
      });
      return;
    }
    appLogger.auth('password_change', 'Zmieniono hasło użytkownika');
    onPasswordChanged();
    onOpenChange(false);
    setForm({ current: '', new: '', confirm: '' });
    toast({
      title: 'Hasło zmienione',
      description: 'Twoje hasło zostało pomyślnie zaktualizowane.',
    });
  };

  const renderPasswordField = (id: string, label: string, field: 'current' | 'new' | 'confirm') => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPasswords[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))}
        >
          {showPasswords[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const strengthChecks = [
    { key: 'length' as const, label: 'Min. 8 znaków' },
    { key: 'uppercase' as const, label: 'Wielka litera' },
    { key: 'lowercase' as const, label: 'Mała litera' },
    { key: 'number' as const, label: 'Cyfra' },
    { key: 'special' as const, label: 'Znak specjalny' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zmiana hasła</DialogTitle>
          <DialogDescription>Wprowadź obecne hasło oraz nowe hasło.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {renderPasswordField('current-password', 'Obecne hasło', 'current')}
          {renderPasswordField('new-password', 'Nowe hasło', 'new')}

          {form.new && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${getStrengthColor(strength, i)}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Siła hasła: {getStrengthLabel(strength)}
              </p>
              <ul className="space-y-1 text-xs">
                {strengthChecks.map(({ key, label }) => (
                  <li key={key} className={checks[key] ? 'text-success' : 'text-muted-foreground'}>
                    {checks[key] ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {renderPasswordField('confirm-password', 'Potwierdź nowe hasło', 'confirm')}
          {form.confirm && form.new !== form.confirm && (
            <p className="text-xs text-destructive">Hasła nie są identyczne</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!form.current || !form.new || !form.confirm}>
            Zmień hasło
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
