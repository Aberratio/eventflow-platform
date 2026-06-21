import { getSecuritySettings, updateSecuritySettings } from '@/api';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Shield,
  Key,
  Laptop,
  Smartphone,
  Monitor,
  History,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { TwoFASetupDialog } from './TwoFASetupDialog';

function getDeviceIcon(os: string) {
  const lower = os.toLowerCase();
  if (lower.includes('ios') || lower.includes('android')) return <Smartphone className="h-5 w-5" />;
  if (lower.includes('mac')) return <Laptop className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export const SecuritySection = () => {
  const queryClient = useQueryClient();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [removeDeviceId, setRemoveDeviceId] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['security-settings'],
    queryFn: getSecuritySettings,
    select: (r) => r.data,
  });

  const patchMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-settings'] }),
  });

  if (!settings) return null;

  const daysSincePasswordChange = Math.floor(
    (Date.now() - new Date(settings.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24),
  );

  const handlePasswordChanged = () => {
    patchMutation.mutate({ lastPasswordChange: new Date().toISOString().split('T')[0] });
  };

  const handle2FASetup = (method: 'app' | 'sms') => {
    patchMutation.mutate({ twoFactorEnabled: true, twoFactorMethod: method });
  };

  const handleDisable2FA = () => {
    patchMutation.mutate({ twoFactorEnabled: false, twoFactorMethod: undefined });
    toast({
      title: '2FA wyłączone',
      description: 'Uwierzytelnianie dwuskładnikowe zostało wyłączone.',
    });
  };

  const handleRemoveDevice = (deviceId: string) => {
    patchMutation.mutate({
      trustedDevices: settings.trustedDevices.filter((d) => d.id !== deviceId),
    });
    setRemoveDeviceId(null);
    toast({
      title: 'Urządzenie usunięte',
      description: 'Urządzenie zostało usunięte z listy zaufanych.',
    });
  };

  const handleSessionTimeoutChange = (value: string) => {
    patchMutation.mutate({ sessionTimeoutMinutes: parseInt(value) });
    toast({ title: 'Zapisano', description: `Limit sesji ustawiony na ${value} minut.` });
  };

  return (
    <>
      {/* Role Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Uprawnienia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rola w systemie</p>
              <p className="text-sm text-muted-foreground">
                Pełny dostęp do wszystkich funkcji platformy
              </p>
            </div>
            <Badge variant="destructive">Administrator</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            Bezpieczeństwo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Hasło</p>
              <p className="text-sm text-muted-foreground">
                Ostatnia zmiana: {daysSincePasswordChange} dni temu
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Zmień hasło
            </Button>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Uwierzytelnianie dwuskładnikowe (2FA)</p>
                <p className="text-sm text-muted-foreground">
                  {settings.twoFactorEnabled
                    ? `Włączone (${settings.twoFactorMethod === 'app' ? 'Aplikacja' : 'SMS'})`
                    : 'Dodatkowa warstwa bezpieczeństwa dla Twojego konta'}
                </p>
              </div>
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked) setShow2FADialog(true);
                  else handleDisable2FA();
                }}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Limit sesji</p>
                <p className="text-sm text-muted-foreground">
                  Automatyczne wylogowanie po czasie bezczynności
                </p>
              </div>
              <Select
                value={settings.sessionTimeoutMinutes.toString()}
                onValueChange={handleSessionTimeoutChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 godz.</SelectItem>
                  <SelectItem value="120">2 godz.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Laptop className="h-5 w-5 text-primary" />
            Zaufane urządzenia
          </CardTitle>
          <CardDescription>Urządzenia, z których logowałeś się do systemu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.trustedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{getDeviceIcon(device.os)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {device.browser} / {device.os}
                      </p>
                      {device.isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          To urządzenie
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ostatnio:{' '}
                      {formatDistanceToNow(new Date(device.lastUsed), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </p>
                  </div>
                </div>
                {!device.isCurrent && (
                  <Button variant="ghost" size="icon" onClick={() => setRemoveDeviceId(device.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historia logowań
          </CardTitle>
          <CardDescription>Ostatnie próby logowania do Twojego konta</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data i czas</TableHead>
                <TableHead>Lokalizacja</TableHead>
                <TableHead>Urządzenie</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.loginHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(new Date(entry.timestamp), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{entry.location}</p>
                      <p className="text-xs text-muted-foreground">{entry.ipAddress}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.browser} / {entry.os}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.success ? (
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/10 text-success"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Sukces
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 bg-destructive/10 text-destructive"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Nieudana
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordChanged={handlePasswordChanged}
      />
      <TwoFASetupDialog
        open={show2FADialog}
        onOpenChange={setShow2FADialog}
        onSetupComplete={handle2FASetup}
      />
      <AlertDialog open={!!removeDeviceId} onOpenChange={() => setRemoveDeviceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć urządzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Urządzenie zostanie usunięte z listy zaufanych. Przy następnym logowaniu z tego
              urządzenia może być wymagana dodatkowa weryfikacja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeDeviceId && handleRemoveDevice(removeDeviceId)}>
              Usuń urządzenie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
