import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Plus, CheckCircle2, Clock, XCircle, Target, Users, Eye, ExternalLink, Pencil, Trash2, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { mockChallenges, mockChallengeParticipations, mockSeries, mockEvents } from '@/data/mockData';
import { Challenge, ChallengeEvent, ChallengeReward, ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusRowClass: Record<ChallengeEntryStatus, string> = {
  approved: 'bg-green-50 dark:bg-green-950/30',
  pending: 'bg-yellow-50 dark:bg-yellow-950/30',
  rejected: 'bg-red-50 dark:bg-red-950/30',
  not_submitted: '',
};

const statusIcon: Record<ChallengeEntryStatus, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  not_submitted: <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />,
};

const generateSlug = (name: string) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

interface FormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  seriesId: string;
  startDate: string;
  endDate: string;
  minCompleted: number;
  maxTime: string;
  events: ChallengeEvent[];
  rewards: ChallengeReward[];
}

const emptyForm: FormData = {
  name: '', slug: '', description: '', imageUrl: '', seriesId: '',
  startDate: '', endDate: '', minCompleted: 1, maxTime: '',
  events: [], rewards: [],
};

const ChallengeFormDialog = ({
  open, onOpenChange, initialData, title,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initialData?: FormData; title: string;
}) => {
  const [form, setForm] = useState<FormData>(initialData || emptyForm);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name') next.slug = generateSlug(value as string);
      return next;
    });
  };

  const addEvent = () => setForm(prev => ({
    ...prev,
    events: [...prev.events, { eventId: crypto.randomUUID(), eventName: '', eventDate: '' }],
  }));

  const removeEvent = (idx: number) => setForm(prev => ({
    ...prev, events: prev.events.filter((_, i) => i !== idx),
  }));

  const updateEvent = (idx: number, field: keyof ChallengeEvent, val: string) =>
    setForm(prev => ({
      ...prev,
      events: prev.events.map((e, i) => i === idx ? { ...e, [field]: val } : e),
    }));

  const addReward = () => setForm(prev => ({
    ...prev,
    rewards: [...prev.rewards, { id: crypto.randomUUID(), name: '', type: 'free' as const }],
  }));

  const removeReward = (idx: number) => setForm(prev => ({
    ...prev, rewards: prev.rewards.filter((_, i) => i !== idx),
  }));

  const updateReward = (idx: number, field: string, val: any) =>
    setForm(prev => ({
      ...prev,
      rewards: prev.rewards.map((r, i) => i === idx ? { ...r, [field]: val } : r),
    }));

  const loadEventsFromSeries = () => {
    if (!form.seriesId) return;
    const series = mockSeries.find(s => s.id === form.seriesId);
    if (!series) return;
    const seriesEvents = series.eventIds
      .map(id => mockEvents.find(ev => ev.id === id))
      .filter(Boolean);
    const events: ChallengeEvent[] = seriesEvents.map(e => ({
      eventId: e!.id,
      eventName: e!.name,
      eventDate: e!.date,
    }));
    setForm(prev => ({ ...prev, events }));
    toast({ title: `Załadowano ${events.length} biegów z serii` });
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: 'Podaj nazwę wyzwania', variant: 'destructive' }); return; }
    onOpenChange(false);
    toast({ title: initialData ? 'Wyzwanie zaktualizowane!' : 'Wyzwanie utworzone!' });
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {/* Basic */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Podstawowe</h4>
            <div><Label>Nazwa</Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="np. Korona Półmaratonów 2026" /></div>
            <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="korona-polmaratonow-2026" className="font-mono text-sm" /></div>
            <div><Label>Opis</Label><Textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Opis wyzwania..." /></div>
            <div><Label>URL obrazka</Label><Input value={form.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} placeholder="https://..." /></div>
          </div>

          {/* Series & dates */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seria i daty</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Powiązanie z serią (opcjonalne)</Label>
                <Select value={form.seriesId} onValueChange={v => updateField('seriesId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak</SelectItem>
                    {mockSeries.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.seriesId && (
                <Button type="button" variant="outline" size="sm" onClick={loadEventsFromSeries}>
                  <Download className="h-3 w-3 mr-1" /> Załaduj biegi
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data startu</Label><Input type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} /></div>
              <div><Label>Data końca</Label><Input type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} /></div>
            </div>
          </div>

          {/* Rule */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Reguła</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min. biegów do zaliczenia</Label><Input type="number" min={1} value={form.minCompleted} onChange={e => updateField('minCompleted', parseInt(e.target.value) || 1)} /></div>
              <div><Label>Limit czasu (opcjonalnie)</Label><Input value={form.maxTime} onChange={e => updateField('maxTime', e.target.value)} placeholder="HH:MM:SS" /></div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Wydarzenia ({form.events.length})</h4>
              <Button type="button" variant="outline" size="sm" onClick={addEvent}><Plus className="h-3 w-3 mr-1" /> Dodaj</Button>
            </div>
            {form.events.length === 0 && <p className="text-sm text-muted-foreground">Brak wydarzeń. Dodaj ręcznie lub załaduj z serii.</p>}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.events.map((ev, idx) => (
                <div key={ev.eventId} className="flex gap-2 items-center">
                  <Input className="flex-1" placeholder="Nazwa biegu" value={ev.eventName} onChange={e => updateEvent(idx, 'eventName', e.target.value)} />
                  <Input type="date" className="w-40" value={ev.eventDate} onChange={e => updateEvent(idx, 'eventDate', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeEvent(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nagrody ({form.rewards.length})</h4>
              <Button type="button" variant="outline" size="sm" onClick={addReward}><Plus className="h-3 w-3 mr-1" /> Dodaj</Button>
            </div>
            {form.rewards.length === 0 && <p className="text-sm text-muted-foreground">Brak nagród.</p>}
            <div className="space-y-3">
              {form.rewards.map((rw, idx) => (
                <Card key={rw.id} className="p-3">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Nazwa nagrody" value={rw.name} onChange={e => updateReward(idx, 'name', e.target.value)} />
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={rw.type} onValueChange={v => updateReward(idx, 'type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Darmowa</SelectItem>
                            <SelectItem value="product">Płatna</SelectItem>
                          </SelectContent>
                        </Select>
                        {rw.type === 'product' && (
                          <Input type="number" placeholder="Cena (zł)" value={rw.price || ''} onChange={e => updateReward(idx, 'price', parseFloat(e.target.value) || 0)} />
                        )}
                        <Input placeholder="Rozmiary (S,M,L)" value={rw.sizes?.join(',') || ''} onChange={e => updateReward(idx, 'sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                      </div>
                      <Input placeholder="Opis nagrody (opcjonalnie)" value={rw.description || ''} onChange={e => updateReward(idx, 'description', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeReward(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleSave}>{initialData ? 'Zapisz zmiany' : 'Utwórz wyzwanie'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Verification card per challenge ───
const VerificationChallengeCard = ({
  challenge, statusFilter,
}: {
  challenge: typeof mockChallenges[0];
  statusFilter: string;
}) => {
  const participants = mockChallengeParticipations.filter(p => p.challengeId === challenge.id);
  const allEntries = participants.flatMap(p => p.entries);
  const pendingCount = allEntries.filter(e => e.status === 'pending').length;
  const approvedCount = allEntries.filter(e => e.status === 'approved').length;
  const rejectedCount = allEntries.filter(e => e.status === 'rejected').length;
  const [open, setOpen] = useState(pendingCount > 0);

  const filteredParticipants = participants.filter(p => {
    if (statusFilter === 'all') return p.entries.length > 0;
    return p.entries.some(e => e.status === statusFilter);
  });

  if (filteredParticipants.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{challenge.name}</span>
              <div className="flex gap-1.5 ml-auto">
                {pendingCount > 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-300">⏳ {pendingCount}</Badge>}
                <Badge variant="outline" className="text-green-600 border-green-300">✅ {approvedCount}</Badge>
                {rejectedCount > 0 && <Badge variant="outline" className="text-red-600 border-red-300">❌ {rejectedCount}</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {filteredParticipants.map(p => {
              const filteredEntries = statusFilter === 'all'
                ? p.entries
                : p.entries.filter(e => e.status === statusFilter);

              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{p.userName}</span>
                    <span className="text-muted-foreground">(postęp: {p.completedCount}/{challenge.rule.minCompleted})</span>
                    {p.isCompleted && <Badge variant="default" className="text-xs">✅ Ukończone</Badge>}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Bieg</TableHead>
                        <TableHead className="hidden sm:table-cell">Czas</TableHead>
                        <TableHead className="hidden sm:table-cell">Miejsce</TableHead>
                        <TableHead className="hidden sm:table-cell">Dowód</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map(entry => {
                        const event = challenge.events.find(e => e.eventId === entry.eventId);
                        return (
                          <TableRow key={entry.id} className={cn(statusRowClass[entry.status])}>
                            <TableCell className="w-8">{statusIcon[entry.status]}</TableCell>
                            <TableCell className="text-sm">{event?.eventName || '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm font-mono">{entry.submittedTime || '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{entry.submittedPosition ? `#${entry.submittedPosition}` : '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {entry.proofUrl && (
                                <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> Link
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.status === 'pending' && (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="default" onClick={() => toast({ title: 'Zatwierdzone!' })}>
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Zatwierdź
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => toast({ title: 'Odrzucone', variant: 'destructive' })}>
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {entry.status === 'approved' && <span className="text-xs text-green-600">Zatwierdzone</span>}
                              {entry.status === 'rejected' && <span className="text-xs text-red-600">Odrzucone</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// ─── Main component ───
export const AdminChallengesTab = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const allEntries = mockChallengeParticipations.flatMap(p => p.entries);
  const pendingTotal = allEntries.filter(e => e.status === 'pending').length;
  const approvedTotal = allEntries.filter(e => e.status === 'approved').length;
  const rejectedTotal = allEntries.filter(e => e.status === 'rejected').length;

  const editFormData = useMemo<FormData | undefined>(() => {
    if (!editingChallenge) return undefined;
    return {
      name: editingChallenge.name,
      slug: editingChallenge.slug,
      description: editingChallenge.description,
      imageUrl: editingChallenge.imageUrl || '',
      seriesId: editingChallenge.seriesId || '',
      startDate: editingChallenge.startDate || '',
      endDate: editingChallenge.endDate || '',
      minCompleted: editingChallenge.rule.minCompleted,
      maxTime: editingChallenge.rule.maxTime || '',
      events: editingChallenge.events,
      rewards: editingChallenge.rewards,
    };
  }, [editingChallenge]);

  const handleStatusChange = (challengeId: string, newStatus: string) => {
    toast({ title: `Status zmieniony na: ${newStatus === 'active' ? 'Aktywne' : newStatus === 'completed' ? 'Zakończone' : 'Nadchodzące'}` });
  };

  const handleDelete = (challengeId: string) => {
    toast({ title: 'Wyzwanie usunięte', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="challenges">
        <TabsList>
          <TabsTrigger value="challenges" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Wyzwania
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-1.5">
            <Clock className="h-4 w-4" /> Weryfikacja
            {pendingTotal > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {pendingTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-4 w-4" /> Uczestnicy
          </TabsTrigger>
        </TabsList>

        {/* ─── Challenges CRUD ─── */}
        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista wyzwań</h3>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nowe wyzwanie
            </Button>
          </div>

          <ChallengeFormDialog open={createOpen} onOpenChange={setCreateOpen} title="Utwórz wyzwanie" />
          <ChallengeFormDialog
            open={!!editingChallenge}
            onOpenChange={o => { if (!o) setEditingChallenge(null); }}
            initialData={editFormData}
            title="Edytuj wyzwanie"
          />

          {mockChallenges.map(challenge => {
            const participantCount = mockChallengeParticipations.filter(p => p.challengeId === challenge.id).length;
            return (
              <Card key={challenge.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        {challenge.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{challenge.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" />{challenge.rule.minCompleted}/{challenge.events.length} biegów</span>
                        <span>{challenge.startDate} – {challenge.endDate}</span>
                        <span>{participantCount} uczestników</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Select defaultValue={challenge.status} onValueChange={v => handleStatusChange(challenge.id, v)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktywne</SelectItem>
                          <SelectItem value="upcoming">Nadchodzące</SelectItem>
                          <SelectItem value="completed">Zakończone</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingChallenge(challenge)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć wyzwanie?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Czy na pewno chcesz usunąć „{challenge.name}"? Tej operacji nie można cofnąć.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(challenge.id)}>Usuń</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── Verification per challenge ─── */}
        <TabsContent value="verification" className="space-y-4">
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'Wszystkie', count: pendingTotal + approvedTotal + rejectedTotal },
              { key: 'pending', label: 'Oczekujące', count: pendingTotal },
              { key: 'approved', label: 'Zatwierdzone', count: approvedTotal },
              { key: 'rejected', label: 'Odrzucone', count: rejectedTotal },
            ] as const).map(f => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label} <Badge variant="secondary" className="ml-1.5">{f.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Per-challenge cards */}
          {mockChallenges.map(challenge => (
            <VerificationChallengeCard
              key={challenge.id}
              challenge={challenge}
              statusFilter={statusFilter}
            />
          ))}
        </TabsContent>

        {/* ─── Participants tab (unchanged) ─── */}
        <TabsContent value="participants" className="space-y-4">
          {mockChallenges.map(challenge => {
            const participants = mockChallengeParticipations.filter(p => p.challengeId === challenge.id);
            if (participants.length === 0) return null;

            return (
              <Card key={challenge.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    {challenge.name}
                    <Badge variant="secondary">{participants.length} uczestników</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Uczestnik</TableHead>
                        <TableHead>Postęp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nagroda</TableHead>
                        <TableHead>Nr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-sm">{p.userName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(p.completedCount / challenge.rule.minCompleted) * 100} className="h-2 w-20" />
                              <span className="text-xs">{p.completedCount}/{challenge.rule.minCompleted}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {p.isCompleted ? (
                              <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Ukończone</Badge>
                            ) : (
                              <Badge variant="outline">W trakcie</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {p.rewardGranted ? (
                              <Badge variant="secondary">Przyznana</Badge>
                            ) : p.isCompleted ? (
                              <Button size="sm" variant="outline" onClick={() => toast({ title: 'Nagroda przyznana!' })}>
                                Przyznaj
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {p.assignedNumber ? `#${p.assignedNumber}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};
