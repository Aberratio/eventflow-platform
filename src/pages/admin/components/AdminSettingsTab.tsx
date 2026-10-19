import {
  getGlobalInsuranceSettings,
  updateGlobalInsuranceSettings,
  getCalendarSettings,
  updateCalendarSettings,
  getChallengePointsSettings,
  updateChallengePointsSettings,
} from '@/api';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appLogger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Save,
  Calculator,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type {
  ChallengePointsSettings,
  GlobalInsuranceSettings,
  GoogleCalendarSettings,
} from '@/types';

export const AdminSettingsTab = () => {
  const queryClient = useQueryClient();

  const { data: remoteInsurance } = useQuery({
    queryKey: ['insurance-settings'],
    queryFn: getGlobalInsuranceSettings,
    select: (r) => r.data,
  });

  const { data: remoteCalendar } = useQuery({
    queryKey: ['calendar-settings'],
    queryFn: getCalendarSettings,
    select: (r) => r.data,
  });

  const { data: remoteChallengePoints } = useQuery({
    queryKey: ['challenge-points-settings'],
    queryFn: getChallengePointsSettings,
    select: (r) => r.data,
  });

  const [localInsurance, setLocalInsurance] = useState<GlobalInsuranceSettings | null>(null);
  const [localCalendarId, setLocalCalendarId] = useState<string | null>(null);
  const [localChallengePoints, setLocalChallengePoints] = useState<ChallengePointsSettings | null>(
    null,
  );

  const ins = localInsurance ?? remoteInsurance;
  const cal = remoteCalendar;
  const pts = localChallengePoints ?? remoteChallengePoints;

  const insuranceMutation = useMutation({
    mutationFn: updateGlobalInsuranceSettings,
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['insurance-settings'] });
      setLocalInsurance(null);
      appLogger.settings('insurance_save', 'Zapisano ustawienia ubezpieczeń NNW', {
        targetType: 'settings',
        metadata: { baseFee: data.baseFee, ageMultiplier: data.ageMultiplier, maxAge: data.maxAge },
      });
      toast({ title: 'Zapisano', description: 'Ustawienia ubezpieczeń zostały zaktualizowane' });
    },
  });

  const calendarMutation = useMutation({
    mutationFn: updateCalendarSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-settings'] });
      setLocalCalendarId(null);
    },
  });

  const challengePointsMutation = useMutation({
    mutationFn: updateChallengePointsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-points-settings'] });
      setLocalChallengePoints(null);
      appLogger.settings('challenge_points_save', 'Zapisano tabelę punktacji Wyzwań', {
        targetType: 'settings',
      });
      toast({ title: 'Zapisano', description: 'Tabela punktacji Wyzwań została zaktualizowana' });
    },
  });

  const handleSaveInsurance = () => {
    if (!ins) return;
    insuranceMutation.mutate(ins);
  };

  const handleSaveChallengePoints = () => {
    if (!pts) return;
    challengePointsMutation.mutate(pts);
  };

  const updatePointsTablePlace = (index: number, value: number) => {
    if (!pts) return;
    const pointsTable = [...pts.pointsTable];
    pointsTable[index] = Math.max(0, value);
    setLocalChallengePoints({ ...pts, pointsTable });
  };

  const addPointsTablePlace = () => {
    if (!pts) return;
    const last = pts.pointsTable[pts.pointsTable.length - 1] ?? pts.floorPoints;
    setLocalChallengePoints({ ...pts, pointsTable: [...pts.pointsTable, Math.max(0, last)] });
  };

  const removePointsTablePlace = (index: number) => {
    if (!pts) return;
    setLocalChallengePoints({
      ...pts,
      pointsTable: pts.pointsTable.filter((_, i) => i !== index),
    });
  };

  const handleSaveCalendar = (patch: Partial<GoogleCalendarSettings>) => {
    calendarMutation.mutate(patch, {
      onSuccess: () => {
        appLogger.settings('calendar_save', 'Zapisano ustawienia Kalendarza Google');
        toast({ title: 'Zapisano', description: 'Ustawienia Kalendarza Google zostały zapisane' });
      },
      onError: () => {
        toast({
          title: 'Nie zapisano',
          description: 'Sprawdź ID kalendarza i spróbuj ponownie',
          variant: 'destructive',
        });
      },
    });
  };

  const calculateExamplePrice = (age: number): number => {
    if (!ins || age > ins.maxAge) return 0;
    const ageAddition = Math.max(0, age - 18) * ins.ageMultiplier;
    return Math.round(ins.baseFee + ageAddition);
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
        {ins && (
          <CardContent className="space-y-6">
            {/* Info HTML Editor */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Tekst informacyjny dla uczestników</Label>
              <p className="text-sm text-muted-foreground">
                Ten tekst będzie wyświetlany w formularzu rejestracji przy opcji wykupienia
                ubezpieczenia.
              </p>
              <RichTextEditor
                value={ins.infoHtml}
                onChange={(html) =>
                  setLocalInsurance((prev) => ({ ...(prev ?? ins), infoHtml: html }))
                }
                placeholder="Opisz szczegóły ubezpieczenia NNW..."
                ariaLabel="Tekst informacyjny o ubezpieczeniu"
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
                    value={ins.baseFee}
                    onChange={(e) =>
                      setLocalInsurance((prev) => ({
                        ...(prev ?? ins),
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
                    value={ins.ageMultiplier}
                    onChange={(e) =>
                      setLocalInsurance((prev) => ({
                        ...(prev ?? ins),
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
                    value={ins.maxAge}
                    onChange={(e) =>
                      setLocalInsurance((prev) => ({
                        ...(prev ?? ins),
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
                    const isOver = age > ins.maxAge;

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
              <Button onClick={handleSaveInsurance} disabled={insuranceMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {insuranceMutation.isPending ? 'Zapisywanie...' : 'Zapisz ustawienia ubezpieczeń'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* E6.2 (issue 15 §2): global points-per-place table for Wyzwania */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Punktacja Wyzwań
          </CardTitle>
          <CardDescription>
            Globalna tabela punktów za miejsce w klasyfikacji, używana przez próg punktowy w
            regułach ukończenia Wyzwania (Korona / Grand Prix)
          </CardDescription>
        </CardHeader>
        {pts && (
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Punkty wg miejsca</Label>
              <p className="text-sm text-muted-foreground">
                Miejsce 1. daje najwięcej punktów, każde kolejne wiersz niżej. Miejsca spoza tabeli
                dostają punktację awaryjną (poniżej).
              </p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {pts.pointsTable.map((points, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label htmlFor={`challenge-points-place-${index}`} className="w-20 shrink-0">
                      Miejsce {index + 1}
                    </Label>
                    <Input
                      id={`challenge-points-place-${index}`}
                      type="number"
                      min={0}
                      value={points}
                      onChange={(e) =>
                        updatePointsTablePlace(index, parseInt(e.target.value, 10) || 0)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Usuń miejsce ${index + 1}`}
                      onClick={() => removePointsTablePlace(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPointsTablePlace}>
                <Plus className="mr-2 h-4 w-4" /> Dodaj miejsce
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="challenge-points-floor">
                Punkty za miejsce poza tabelą (wartość awaryjna)
              </Label>
              <Input
                id="challenge-points-floor"
                type="number"
                min={0}
                value={pts.floorPoints}
                onChange={(e) =>
                  setLocalChallengePoints({
                    ...pts,
                    floorPoints: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Zawodnik na miejscu dalszym niż długość tabeli powyżej otrzymuje tyle punktów.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveChallengePoints}
                disabled={challengePointsMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {challengePointsMutation.isPending ? 'Zapisywanie...' : 'Zapisz tabelę punktacji'}
              </Button>
            </div>
          </CardContent>
        )}
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
        {cal && (
          <CardContent className="space-y-6">
            {/* Key status (the key itself lives only in the server environment) */}
            <div className="flex items-center gap-3 rounded-lg border p-4">
              {cal.credentialsConfigured ? (
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
                  {cal.credentialsConfigured
                    ? 'Klucz konta usługi Google skonfigurowany'
                    : 'Brak klucza konta usługi Google'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {cal.credentialsConfigured
                    ? cal.connected && cal.enabled
                      ? 'Integracja aktywna'
                      : 'Wpisz ID kalendarza i włącz integrację'
                    : 'Skontaktuj się z administratorem serwera. Do czasu skonfigurowania klucza integracja jest nieaktywna.'}
                </p>
                {cal.lastSyncAt && (
                  <p className="text-sm text-muted-foreground">
                    Ostatnia synchronizacja: {new Date(cal.lastSyncAt).toLocaleString('pl-PL')}
                  </p>
                )}
              </div>
            </div>

            {/* Calendar id */}
            <div className="space-y-2">
              <Label htmlFor="calendar-id">ID kalendarza Google</Label>
              <div className="flex gap-2">
                <Input
                  id="calendar-id"
                  placeholder="np. zawody@group.calendar.google.com"
                  value={localCalendarId ?? cal.calendarId ?? ''}
                  onChange={(e) => setLocalCalendarId(e.target.value)}
                />
                <Button
                  onClick={() => handleSaveCalendar({ calendarId: (localCalendarId ?? '').trim() })}
                  disabled={
                    calendarMutation.isPending ||
                    localCalendarId === null ||
                    localCalendarId.trim() === (cal.calendarId ?? '')
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz
                </Button>
              </div>
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
                aria-label="Automatyczne dodawanie wydarzeń"
                checked={cal.enabled}
                onCheckedChange={(checked) => handleSaveCalendar({ enabled: checked })}
                disabled={calendarMutation.isPending || (!cal.enabled && !cal.calendarId)}
              />
            </div>

            <Separator />

            {/* Info about what gets synced */}
            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Po włączeniu, każde zatwierdzone wydarzenie zostanie automatycznie dodane do
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
        )}
      </Card>
    </div>
  );
};

export default AdminSettingsTab;
