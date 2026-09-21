import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { STORAGE_KEYS } from '@/constants';

interface SeedEventDialogProps {
  open: boolean;
  onClose: () => void;
}

type TriState = 'yes' | 'no' | 'random';

function triToForce(v: TriState): boolean | null {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

interface SeedLog {
  type: 'info' | 'success' | 'warn' | 'error';
  text: string;
}

export function SeedEventDialog({ open, onClose }: SeedEventDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff =
    user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';
  const isOrganizer = user?.role === 'organizer';
  const canRun = isStaff || isOrganizer;

  const [participantCount, setParticipantCount] = useState(30);
  const [discipline, setDiscipline] = useState<string>('random');
  const [isVirtual, setIsVirtual] = useState<TriState>('random');
  const [isPrivate, setIsPrivate] = useState<TriState>('random');

  // Feature toggles
  const [merchandise, setMerchandise] = useState<TriState>('random');
  const [parking, setParking] = useState<TriState>('random');
  const [raceOffice, setRaceOffice] = useState<TriState>('random');
  const [changingRooms, setChangingRooms] = useState<TriState>('random');
  const [buffet, setBuffet] = useState<TriState>('random');
  const [medical, setMedical] = useState<TriState>('random');
  const [showers, setShowers] = useState<TriState>('random');
  const [priceTiers, setPriceTiers] = useState<TriState>('random');
  const [ageCategories, setAgeCategories] = useState<TriState>('random');
  const [organizersHtml, setOrganizersHtml] = useState<TriState>('random');
  const [rulesHtml, setRulesHtml] = useState<TriState>('random');
  const [discountCodes, setDiscountCodes] = useState<TriState>('random');
  const [paymentMethods, setPaymentMethods] = useState<TriState>('random');

  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<SeedLog[]>([]);
  const [done, setDone] = useState(false);
  const [createdEventUrl, setCreatedEventUrl] = useState<string | null>(null);

  function addLog(type: SeedLog['type'], text: string) {
    setLogs((prev) => [...prev, { type, text }]);
  }

  function reset() {
    setRunning(false);
    setDone(false);
    setLogs([]);
    setCreatedEventUrl(null);
  }

  async function handleGenerate() {
    reset();
    setRunning(true);

    try {
      addLog('info', `Wywołuję endpoint /dev/seed-event...`);
      addLog(
        'info',
        `Parametry: ${participantCount} uczestników | dyscyplina: ${discipline} | wirtualne: ${isVirtual} | prywatne: ${isPrivate}`,
      );

      const token = localStorage.getItem(STORAGE_KEYS.API_TOKEN);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
      const resp = await fetch(`${API_BASE}/dev/seed-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          participantCount,
          discipline: discipline === 'random' ? null : discipline,
          isVirtual: triToForce(isVirtual),
          isPrivate: triToForce(isPrivate),
          callerId: user?.id ?? null,
          callerRole: user?.role ?? null,
        }),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        const msg = json?.error?.message ?? json?.message ?? `HTTP ${resp.status}`;
        throw new Error(msg);
      }

      const data = json.data as {
        event: {
          id: string;
          name: string;
          slug: string;
          discipline: string;
          date: string;
          city: string;
        };
        organizerEmail?: string;
        participantsCreated: number;
        registrationsCreated: number;
        resultsCreated: number;
        eventUrl: string;
      };

      addLog(
        'success',
        `Wydarzenie: "${data.event.name}" | ${data.event.city} | ${data.event.date}`,
      );
      addLog('success', `Dyscyplina: ${data.event.discipline} | Status: past`);
      if (data.organizerEmail) {
        addLog('success', `Organizator: ${data.organizerEmail} (hasło: demo123)`);
      } else {
        addLog('success', `Organizator: ${user?.name ?? 'Twoje konto'} (zalogowane konto)`);
      }
      addLog('success', `Uczestnicy: ${data.participantsCreated} kont`);
      addLog('success', `Zapisy: ${data.registrationsCreated}`);
      addLog('success', `Wyniki: ${data.resultsCreated}`);
      addLog('success', `✓ Gotowe! Hasło wszystkich nowych kont: demo123`);

      setCreatedEventUrl(data.eventUrl);
      setDone(true);
      toast.success(`Wydarzenie "${data.event.name}" zostało wygenerowane!`);
      // Invalidate all event-related queries so lists refresh without a page reload
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', `Błąd: ${msg}`);
      toast.error('Generowanie nie powiodło się');
    } finally {
      setRunning(false);
    }
  }

  const TriStateToggle = ({
    value,
    onChange,
    label,
  }: {
    value: TriState;
    onChange: (v: TriState) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-1">
        {(['yes', 'no', 'random'] as TriState[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
              value === v
                ? v === 'yes'
                  ? 'border-green-500 bg-green-500 text-white'
                  : v === 'no'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-blue-500 bg-blue-500 text-white'
                : 'border-border bg-muted text-foreground hover:bg-accent'
            }`}
          >
            {v === 'yes' ? 'Tak' : v === 'no' ? 'Nie' : 'Losuj'}
          </button>
        ))}
      </div>
    </div>
  );

  const logColor = (type: SeedLog['type']) => {
    if (type === 'success') return 'text-green-400';
    if (type === 'warn') return 'text-yellow-400';
    if (type === 'error') return 'text-red-400';
    return 'text-foreground/70';
  };

  const sectionLabel =
    'text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-2 block';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !running) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 bg-background p-0 text-foreground">
        <DialogHeader className="border-b px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <span>Wygeneruj przeszłe wydarzenie</span>
            <Badge variant="outline" className="border-amber-400 font-mono text-xs text-amber-500">
              DEV
            </Badge>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-1 space-y-2">
              <p className="text-sm text-foreground/70">
                Tworzy losowe wydarzenie z przeszłości, uczestnikami, zapisami i wynikami. Nowe
                konta mają hasło{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                  demo123
                </code>
                .
              </p>
              <div
                className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                  !user
                    ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                    : isStaff
                      ? 'border border-green-500/20 bg-green-500/10 text-green-400'
                      : 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                }`}
              >
                <span className="mt-0.5">{!user ? '✕' : isStaff ? '✓' : '⚠'}</span>
                <span>
                  {!user
                    ? 'Nie jesteś zalogowany/a. Zaloguj się, żeby użyć tego narzędzia.'
                    : isStaff
                      ? `Zalogowano jako ${user.role} (${user.name}) — pełny dostęp: tworzenie kont, ustawianie statusu "past".`
                      : `Zalogowano jako organizer (${user.name}) — ograniczony tryb: wydarzenie zostanie zapisane jako draft (status "past" wymaga admina/moderatora), nowe konta uczestników będą tworzone przez rejestrację.`}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 divide-x divide-border overflow-hidden">
          {/* Left: Config */}
          <ScrollArea className="w-72 shrink-0 bg-muted/20">
            <div className="space-y-4 px-5 py-4">
              {/* Participants */}
              <div>
                <Label className={sectionLabel}>Liczba uczestników</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={500}
                    value={participantCount}
                    onChange={(e) =>
                      setParticipantCount(Math.max(5, Math.min(500, Number(e.target.value))))
                    }
                    className="h-8 w-24 bg-background text-foreground"
                  />
                  <span className="text-xs text-foreground/60">osób (5–500)</span>
                </div>
              </div>

              <Separator />

              {/* Discipline */}
              <div>
                <Label className={sectionLabel}>Dyscyplina</Label>
                <Select value={discipline} onValueChange={setDiscipline}>
                  <SelectTrigger className="mt-1.5 h-8 bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Losuj</SelectItem>
                    <SelectItem value="running">Bieganie</SelectItem>
                    <SelectItem value="cycling">Kolarstwo</SelectItem>
                    <SelectItem value="triathlon">Triathlon</SelectItem>
                    <SelectItem value="multisport">Multisport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Event type */}
              <div>
                <Label className={sectionLabel}>Typ wydarzenia</Label>
                <TriStateToggle value={isVirtual} onChange={setIsVirtual} label="Wirtualne" />
                <TriStateToggle value={isPrivate} onChange={setIsPrivate} label="Prywatne" />
              </div>

              <Separator />

              {/* Features */}
              <div>
                <Label className={sectionLabel}>Elementy logistyki</Label>
                <TriStateToggle value={parking} onChange={setParking} label="Parking" />
                <TriStateToggle value={raceOffice} onChange={setRaceOffice} label="Biuro zawodów" />
                <TriStateToggle
                  value={changingRooms}
                  onChange={setChangingRooms}
                  label="Przebieralnie"
                />
                <TriStateToggle value={buffet} onChange={setBuffet} label="Bufet/żywienie" />
                <TriStateToggle value={medical} onChange={setMedical} label="Punkt med." />
                <TriStateToggle value={showers} onChange={setShowers} label="Prysznice" />
              </div>

              <Separator />

              {/* Registration features */}
              <div>
                <Label className={sectionLabel}>Rejestracja i wyniki</Label>
                <TriStateToggle
                  value={ageCategories}
                  onChange={setAgeCategories}
                  label="Kategorie wiekowe"
                />
                <TriStateToggle value={priceTiers} onChange={setPriceTiers} label="Progi cenowe" />
                <TriStateToggle
                  value={merchandise}
                  onChange={setMerchandise}
                  label="Gadżety (merch)"
                />
                <TriStateToggle
                  value={discountCodes}
                  onChange={setDiscountCodes}
                  label="Kody rabatowe"
                />
                <TriStateToggle
                  value={paymentMethods}
                  onChange={setPaymentMethods}
                  label="Metody płatności"
                />
              </div>

              <Separator />

              {/* Content */}
              <div>
                <Label className={sectionLabel}>Treści</Label>
                <TriStateToggle
                  value={organizersHtml}
                  onChange={setOrganizersHtml}
                  label="Organizatorzy"
                />
                <TriStateToggle value={rulesHtml} onChange={setRulesHtml} label="Regulamin" />
              </div>
            </div>
          </ScrollArea>

          {/* Right: Log output */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-muted/20 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                {running ? 'Generowanie...' : done ? 'Gotowe' : 'Konsola'}
              </span>
            </div>
            <ScrollArea className="flex-1 bg-muted/10">
              <div className="space-y-0.5 p-4 font-mono text-xs">
                {logs.length === 0 && !running && (
                  <p className="text-foreground/50">
                    Skonfiguruj opcje i kliknij &quot;Generuj&quot; aby stworzyć losowe wydarzenie.
                  </p>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-2 ${logColor(log.type)}`}>
                    <span className="shrink-0 opacity-40">[{String(i + 1).padStart(2, '0')}]</span>
                    <span>{log.text}</span>
                  </div>
                ))}
                {running && (
                  <div className="mt-1 flex items-center gap-2 text-blue-500">
                    <span className="animate-pulse">▶</span>
                    <span>Pracuję...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
            {done && createdEventUrl && (
              <div className="border-t border-green-500/30 bg-green-500/10 px-4 py-3">
                <a
                  href={createdEventUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-green-400 hover:text-green-300 hover:underline"
                >
                  Otwórz wygenerowane wydarzenie →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
            }}
            disabled={running}
          >
            Wyczyść log
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={running}>
              Zamknij
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={running || !user}
              title={!user ? 'Zaloguj się, żeby użyć tego narzędzia' : undefined}
              className="min-w-24"
            >
              {running ? 'Generuję...' : 'Generuj'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
