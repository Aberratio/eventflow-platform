import { mockGoogleCalendarSettings, mockGlobalInsuranceSettings } from '@/api';
import { useState } from 'react';
import { appLogger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, Calculator, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { GlobalInsuranceSettings, GoogleCalendarSettings } from '@/types';

export const AdminSettingsTab = () => {
  const [insuranceSettings, setInsuranceSettings] = useState<GlobalInsuranceSettings>(
    mockGlobalInsuranceSettings,
  );
  const [calendarSettings, setCalendarSettings] = useState<GoogleCalendarSettings>(
    mockGoogleCalendarSettings,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSaveInsurance = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    appLogger.settings('insurance_save', 'Zapisano ustawienia ubezpieczeń NNW', {
      targetType: 'settings',
      metadata: { baseFee: insuranceSettings.baseFee, ageMultiplier: insuranceSettings.ageMultiplier, maxAge: insuranceSettings.maxAge },
    });
    toast({
      title: 'Zapisano',
      description: 'Ustawienia ubezpieczeń zostały zaktualizowane',
    });
  };

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    // Simulate connection - in real app, this would trigger OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCalendarSettings((prev) => ({
      ...prev,
      connected: true,
      lastSyncAt: new Date().toISOString(),
    }));
    setIsConnecting(false);
    appLogger.settings('calendar_connect', 'Połączono z Google Calendar');
    toast({
      title: 'Połączono',
      description: 'Google Calendar został podłączony',
    });
  };

  const handleDisconnectCalendar = () => {
    setCalendarSettings((prev) => ({ ...prev, connected: false, lastSyncAt: undefined }));
    appLogger.settings('calendar_disconnect', 'Rozłączono z Google Calendar');
    toast({
      title: 'Rozłączono',
      description: 'Google Calendar został odłączony',
    });
  };

  // Calculate example prices for preview
  const calculateExamplePrice = (age: number): number => {
    if (age > insuranceSettings.maxAge) return 0;
    const ageAddition = Math.max(0, age - 18) * insuranceSettings.ageMultiplier;
    return Math.round(insuranceSettings.baseFee + ageAddition);
  };

  const exampleAges = [18, 25, 30, 40, 50, 60, 70];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ustawienia platformy</h2>
        <p className="text-muted-foreground">Globalne konfiguracje systemu</p>
      </div>

      {/* Insurance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ubezpieczenia NNW
          </CardTitle>
          <CardDescription>
            Konfiguracja tekstu informacyjnego i kalkulatora składek ubezpieczeniowych
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info HTML Editor */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Tekst informacyjny dla uczestników</Label>
            <p className="text-sm text-muted-foreground">
              Ten tekst będzie wyświetlany w formularzu rejestracji przy opcji wykupienia
              ubezpieczenia.
            </p>
            <RichTextEditor
              value={insuranceSettings.infoHtml}
              onChange={(html) => setInsuranceSettings((prev) => ({ ...prev, infoHtml: html }))}
              placeholder="Opisz szczegóły ubezpieczenia NNW..."
            />
          </div>

          <Separator />

          {/* Calculator Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">Kalkulator składek</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Wzór:{' '}
              <span className="rounded bg-muted px-2 py-1 font-mono">
                składka = opłata_bazowa + max(0, wiek - 18) × mnożnik_wiekowy
              </span>
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseFee">Opłata bazowa (zł)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  min={0}
                  step={1}
                  value={insuranceSettings.baseFee}
                  onChange={(e) =>
                    setInsuranceSettings((prev) => ({
                      ...prev,
                      baseFee: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Minimalna składka dla osób 18 lat</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMultiplier">Mnożnik wiekowy (zł/rok)</Label>
                <Input
                  id="ageMultiplier"
                  type="number"
                  min={0}
                  step={0.1}
                  value={insuranceSettings.ageMultiplier}
                  onChange={(e) =>
                    setInsuranceSettings((prev) => ({
                      ...prev,
                      ageMultiplier: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Dodatek za każdy rok powyżej 18</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAge">Maksymalny wiek (lat)</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min={18}
                  max={100}
                  step={1}
                  value={insuranceSettings.maxAge}
                  onChange={(e) =>
                    setInsuranceSettings((prev) => ({
                      ...prev,
                      maxAge: parseInt(e.target.value) || 70,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Osoby starsze nie mogą wykupić ubezpieczenia
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Example Prices Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Przykładowe składki</Label>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
                {exampleAges.map((age) => {
                  const price = calculateExamplePrice(age);
                  const isOver = age > insuranceSettings.maxAge;

                  return (
                    <div
                      key={age}
                      className={`rounded p-2 text-center ${isOver ? 'bg-destructive/10 text-muted-foreground' : 'bg-background'}`}
                    >
                      <div className="text-sm text-muted-foreground">{age} lat</div>
                      <div
                        className={`font-bold ${isOver ? 'text-destructive line-through' : 'text-primary'}`}
                      >
                        {isOver ? 'N/D' : `${price} zł`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveInsurance} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia ubezpieczeń'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Integracja Google Calendar
          </CardTitle>
          <CardDescription>
            Automatyczne dodawanie zatwierdzonych wydarzeń do kalendarza Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {calendarSettings.connected ? (
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="rounded-full bg-muted p-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {calendarSettings.connected
                    ? 'Połączono z Google Calendar'
                    : 'Nie połączono z Google Calendar'}
                </p>
                {calendarSettings.connected && calendarSettings.lastSyncAt && (
                  <p className="text-sm text-muted-foreground">
                    Ostatnia synchronizacja:{' '}
                    {new Date(calendarSettings.lastSyncAt).toLocaleString('pl-PL')}
                  </p>
                )}
              </div>
            </div>
            {calendarSettings.connected ? (
              <Button variant="outline" onClick={handleDisconnectCalendar}>
                Rozłącz
              </Button>
            ) : (
              <Button onClick={handleConnectCalendar} disabled={isConnecting}>
                <Calendar className="mr-2 h-4 w-4" />
                {isConnecting ? 'Łączenie...' : 'Połącz Google Calendar'}
              </Button>
            )}
          </div>

          {/* Auto-add setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Automatyczne dodawanie wydarzeń</Label>
              <p className="text-sm text-muted-foreground">
                Zatwierdzone wydarzenia będą automatycznie dodawane do kalendarza
              </p>
            </div>
            <Switch
              checked={calendarSettings.enabled}
              onCheckedChange={(checked) =>
                setCalendarSettings((prev) => ({ ...prev, enabled: checked }))
              }
              disabled={!calendarSettings.connected}
            />
          </div>

          <Separator />

          {/* Info about what gets synced */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">
              Po połączeniu, każde zatwierdzone wydarzenie zostanie automatycznie dodane do
              kalendarza z:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Tytuł: Nazwa wydarzenia</li>
              <li>Data: Data wydarzenia</li>
              <li>Lokalizacja: Miejsce i miasto</li>
              <li>Opis: Link do strony wydarzenia</li>
              <li>Przypomnienia: 1 dzień i 1 tydzień przed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTab;
