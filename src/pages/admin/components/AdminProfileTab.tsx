import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, 
  Key, 
  Clock, 
  Laptop, 
  Smartphone,
  Monitor,
  History,
  Activity,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  UserCog,
  UserX,
  Package,
  ShoppingBag,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  QrCode
} from 'lucide-react';
import { mockAdminActivityLogs, mockSecuritySettings } from '@/data/mockData';
import { AdminActionType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const AdminProfileTab = () => {
  const { user } = useAuth();
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState(mockSecuritySettings);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showRemoveDeviceDialog, setShowRemoveDeviceDialog] = useState<string | null>(null);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // 2FA setup state
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms'>('app');
  const [twoFAStep, setTwoFAStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Activity logs state
  const [activityLogs] = useState(mockAdminActivityLogs);
  const [logFilter, setLogFilter] = useState<AdminActionType | 'all'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [visibleLogsCount, setVisibleLogsCount] = useState(5);

  if (!user) return null;

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    return { strength, checks };
  };

  const { strength, checks } = calculatePasswordStrength(passwordForm.new);

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: 'Błąd',
        description: 'Hasła nie są identyczne.',
        variant: 'destructive',
      });
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

    setSecuritySettings(prev => ({
      ...prev,
      lastPasswordChange: new Date().toISOString().split('T')[0],
    }));
    
    setShowPasswordDialog(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
    
    toast({
      title: 'Hasło zmienione',
      description: 'Twoje hasło zostało pomyślnie zaktualizowane.',
    });
  };

  const handle2FASetup = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Błąd',
        description: 'Wprowadź 6-cyfrowy kod weryfikacyjny.',
        variant: 'destructive',
      });
      return;
    }

    // Mock verification - accept any 6-digit code
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: true,
      twoFactorMethod: twoFAMethod,
    }));
    
    setShow2FADialog(false);
    setTwoFAStep(1);
    setVerificationCode('');
    
    toast({
      title: '2FA włączone',
      description: `Uwierzytelnianie dwuskładnikowe zostało aktywowane (${twoFAMethod === 'app' ? 'aplikacja' : 'SMS'}).`,
    });
  };

  const handleDisable2FA = () => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: false,
      twoFactorMethod: undefined,
    }));
    
    toast({
      title: '2FA wyłączone',
      description: 'Uwierzytelnianie dwuskładnikowe zostało wyłączone.',
    });
  };

  const handleRemoveDevice = (deviceId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      trustedDevices: prev.trustedDevices.filter(d => d.id !== deviceId),
    }));
    setShowRemoveDeviceDialog(null);
    
    toast({
      title: 'Urządzenie usunięte',
      description: 'Urządzenie zostało usunięte z listy zaufanych.',
    });
  };

  const handleSessionTimeoutChange = (value: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      sessionTimeoutMinutes: parseInt(value),
    }));
    
    toast({
      title: 'Zapisano',
      description: `Limit sesji ustawiony na ${value} minut.`,
    });
  };

  // Filter and search activity logs
  const filteredLogs = activityLogs.filter(log => {
    const matchesFilter = logFilter === 'all' || log.action === logFilter;
    const matchesSearch = logSearch === '' || 
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(logSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getActionIcon = (action: AdminActionType) => {
    const icons: Record<AdminActionType, React.ReactNode> = {
      login: <LogIn className="h-4 w-4 text-success" />,
      logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
      user_edit: <UserCog className="h-4 w-4 text-info" />,
      user_delete: <UserX className="h-4 w-4 text-destructive" />,
      event_approve: <CheckCircle className="h-4 w-4 text-success" />,
      event_reject: <XCircle className="h-4 w-4 text-destructive" />,
      order_update: <Package className="h-4 w-4 text-muted-foreground" />,
      product_edit: <ShoppingBag className="h-4 w-4 text-warning" />,
      settings_change: <Settings className="h-4 w-4 text-muted-foreground" />,
      password_change: <Key className="h-4 w-4 text-warning" />,
    };
    return icons[action];
  };

  const getActionLabel = (action: AdminActionType) => {
    const labels: Record<AdminActionType, string> = {
      login: 'Logowanie',
      logout: 'Wylogowanie',
      user_edit: 'Edycja użytkownika',
      user_delete: 'Usunięcie użytkownika',
      event_approve: 'Zatwierdzenie wydarzenia',
      event_reject: 'Odrzucenie wydarzenia',
      order_update: 'Aktualizacja zamówienia',
      product_edit: 'Edycja produktu',
      settings_change: 'Zmiana ustawień',
      password_change: 'Zmiana hasła',
    };
    return labels[action];
  };

  const getDeviceIcon = (os: string) => {
    if (os.toLowerCase().includes('ios') || os.toLowerCase().includes('android')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (os.toLowerCase().includes('mac')) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const daysSincePasswordChange = Math.floor(
    (new Date().getTime() - new Date(securitySettings.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-3xl space-y-6">
      <ProfileForm user={user}>
        {/* Role Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
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

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Bezpieczeństwo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password */}
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
              {/* 2FA */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Uwierzytelnianie dwuskładnikowe (2FA)</p>
                  <p className="text-sm text-muted-foreground">
                    {securitySettings.twoFactorEnabled 
                      ? `Włączone (${securitySettings.twoFactorMethod === 'app' ? 'Aplikacja' : 'SMS'})`
                      : 'Dodatkowa warstwa bezpieczeństwa dla Twojego konta'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setShow2FADialog(true);
                      } else {
                        handleDisable2FA();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              {/* Session timeout */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Limit sesji</p>
                  <p className="text-sm text-muted-foreground">
                    Automatyczne wylogowanie po czasie bezczynności
                  </p>
                </div>
                <Select 
                  value={securitySettings.sessionTimeoutMinutes.toString()}
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              Zaufane urządzenia
            </CardTitle>
            <CardDescription>
              Urządzenia, z których logowałeś się do systemu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securitySettings.trustedDevices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {getDeviceIcon(device.os)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{device.browser} / {device.os}</p>
                        {device.isCurrent && (
                          <Badge variant="secondary" className="text-xs">To urządzenie</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ostatnio: {formatDistanceToNow(new Date(device.lastUsed), { addSuffix: true, locale: pl })}
                      </p>
                    </div>
                  </div>
                  {!device.isCurrent && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowRemoveDeviceDialog(device.id)}
                    >
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
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Historia logowań
            </CardTitle>
            <CardDescription>
              Ostatnie próby logowania do Twojego konta
            </CardDescription>
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
                {securitySettings.loginHistory.map((entry) => (
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
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sukces
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          <XCircle className="h-3 w-3 mr-1" />
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

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Logi aktywności
            </CardTitle>
            <CardDescription>
              Historia Twoich działań w systemie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj w logach..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={logFilter} onValueChange={(v) => setLogFilter(v as AdminActionType | 'all')}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtruj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie akcje</SelectItem>
                  <SelectItem value="login">Logowanie</SelectItem>
                  <SelectItem value="logout">Wylogowanie</SelectItem>
                  <SelectItem value="user_edit">Edycja użytkownika</SelectItem>
                  <SelectItem value="user_delete">Usunięcie użytkownika</SelectItem>
                  <SelectItem value="event_approve">Zatwierdzenie wydarzenia</SelectItem>
                  <SelectItem value="event_reject">Odrzucenie wydarzenia</SelectItem>
                  <SelectItem value="order_update">Aktualizacja zamówienia</SelectItem>
                  <SelectItem value="product_edit">Edycja produktu</SelectItem>
                  <SelectItem value="settings_change">Zmiana ustawień</SelectItem>
                  <SelectItem value="password_change">Zmiana hasła</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs list */}
            <div className="space-y-2">
              {filteredLogs.slice(0, visibleLogsCount).map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.description}</span>
                      {log.targetName && (
                        <Badge variant="secondary" className="text-xs">
                          {log.targetName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{format(new Date(log.timestamp), 'dd.MM.yyyy, HH:mm', { locale: pl })}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nie znaleziono logów spełniających kryteria.
                </p>
              )}

              {visibleLogsCount < filteredLogs.length && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setVisibleLogsCount(prev => prev + 5)}
                >
                  Załaduj więcej ({filteredLogs.length - visibleLogsCount} pozostało)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </ProfileForm>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zmiana hasła</DialogTitle>
            <DialogDescription>
              Wprowadź obecne hasło oraz nowe hasło.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Obecne hasło</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nowe hasło</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password strength */}
              {passwordForm.new && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                           i <= strength 
                            ? strength <= 2 ? 'bg-destructive' : strength <= 3 ? 'bg-warning' : 'bg-success'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Siła hasła: {strength <= 2 ? 'Słabe' : strength <= 3 ? 'Średnie' : strength <= 4 ? 'Dobre' : 'Bardzo dobre'}
                  </p>
                  <ul className="text-xs space-y-1">
                    <li className={checks.length ? 'text-success' : 'text-muted-foreground'}>
                      {checks.length ? '✓' : '○'} Min. 8 znaków
                    </li>
                    <li className={checks.uppercase ? 'text-success' : 'text-muted-foreground'}>
                      {checks.uppercase ? '✓' : '○'} Wielka litera
                    </li>
                    <li className={checks.lowercase ? 'text-success' : 'text-muted-foreground'}>
                      {checks.lowercase ? '✓' : '○'} Mała litera
                    </li>
                    <li className={checks.number ? 'text-success' : 'text-muted-foreground'}>
                      {checks.number ? '✓' : '○'} Cyfra
                    </li>
                    <li className={checks.special ? 'text-success' : 'text-muted-foreground'}>
                      {checks.special ? '✓' : '○'} Znak specjalny
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                <p className="text-xs text-destructive">Hasła nie są identyczne</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Anuluj
            </Button>
            <Button 
              onClick={handlePasswordChange}
              disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
            >
              Zmień hasło
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={(open) => {
        setShow2FADialog(open);
        if (!open) {
          setTwoFAStep(1);
          setVerificationCode('');
          setPhoneNumber('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfiguracja 2FA</DialogTitle>
            <DialogDescription>
              {twoFAStep === 1 
                ? 'Wybierz metodę uwierzytelniania dwuskładnikowego.'
                : twoFAMethod === 'app' 
                  ? 'Zeskanuj kod QR lub wprowadź klucz ręcznie.'
                  : 'Wprowadź numer telefonu do otrzymywania kodów SMS.'
              }
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === 1 && (
            <div className="space-y-4 py-4">
              <div 
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  twoFAMethod === 'app' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setTwoFAMethod('app')}
              >
                <QrCode className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Aplikacja</p>
                  <p className="text-sm text-muted-foreground">
                    Google Authenticator, Authy lub podobna
                  </p>
                </div>
              </div>
              <div 
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  twoFAMethod === 'sms' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setTwoFAMethod('sms')}
              >
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">
                    Kody wysyłane na numer telefonu
                  </p>
                </div>
              </div>
            </div>
          )}

          {twoFAStep === 2 && twoFAMethod === 'app' && (
            <div className="space-y-4 py-4">
              {/* Mock QR Code */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-2">Mock QR Code</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Lub wprowadź ręcznie:</p>
                <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                  ABCD-EFGH-IJKL-MNOP
                </code>
              </div>
              <div className="space-y-2">
                <Label>Kod weryfikacyjny z aplikacji</Label>
                <InputOTP 
                  maxLength={6} 
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          {twoFAStep === 2 && twoFAMethod === 'sms' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone-2fa">Numer telefonu</Label>
                <Input
                  id="phone-2fa"
                  type="tel"
                  placeholder="+48 123 456 789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast({ title: 'Kod wysłany', description: 'Kod weryfikacyjny został wysłany na podany numer.' })}
                disabled={!phoneNumber}
              >
                Wyślij kod SMS
              </Button>
              <div className="space-y-2">
                <Label>Kod weryfikacyjny z SMS</Label>
                <InputOTP 
                  maxLength={6} 
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          <DialogFooter>
            {twoFAStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Anuluj
                </Button>
                <Button onClick={() => setTwoFAStep(2)}>
                  Dalej
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setTwoFAStep(1)}>
                  Wstecz
                </Button>
                <Button 
                  onClick={handle2FASetup}
                  disabled={verificationCode.length !== 6}
                >
                  Weryfikuj i włącz
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Device Confirmation */}
      <AlertDialog 
        open={!!showRemoveDeviceDialog} 
        onOpenChange={() => setShowRemoveDeviceDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć urządzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Urządzenie zostanie usunięte z listy zaufanych. Przy następnym logowaniu z tego urządzenia może być wymagana dodatkowa weryfikacja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => showRemoveDeviceDialog && handleRemoveDevice(showRemoveDeviceDialog)}>
              Usuń urządzenie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProfileTab;