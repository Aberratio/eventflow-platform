import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Download, Trophy } from 'lucide-react';
import { mockChallenges, mockSeries, mockEvents } from '@/data/mockData';
import { ChallengeEvent, ChallengeReward } from '@/types';
import { toast } from 'sonner';

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

interface FormErrors {
  name?: string;
  slug?: string;
  minCompleted?: string;
  endDate?: string;
}

export const AdminChallengeEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const challenge = isEditing ? mockChallenges.find(c => c.id === id) : null;

  const [form, setForm] = useState<FormData>(() => {
    if (challenge) {
      return {
        name: challenge.name,
        slug: challenge.slug,
        description: challenge.description,
        imageUrl: challenge.imageUrl || '',
        seriesId: challenge.seriesId || '',
        startDate: challenge.startDate || '',
        endDate: challenge.endDate || '',
        minCompleted: challenge.rule.minCompleted,
        maxTime: challenge.rule.maxTime || '',
        events: [...challenge.events],
        rewards: [...challenge.rewards],
      };
    }
    return {
      name: '', slug: '', description: '', imageUrl: '', seriesId: '',
      startDate: '', endDate: '', minCompleted: 1, maxTime: '',
      events: [], rewards: [],
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name') next.slug = generateSlug(value as string);
      return next;
    });
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
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

  const updateReward = (idx: number, field: string, val: string | number | boolean) =>
    setForm(prev => ({
      ...prev,
      rewards: prev.rewards.map((r, i) => i === idx ? { ...r, [field]: val } : r),
    }));

  const loadEventsFromSeries = () => {
    if (!form.seriesId) return;
    const series = mockSeries.find(s => s.id === form.seriesId);
    if (!series) return;
    const seriesEvents = series.eventIds
      .map(eid => mockEvents.find(ev => ev.id === eid))
      .filter(Boolean);
    const events: ChallengeEvent[] = seriesEvents.map(e => ({
      eventId: e!.id,
      eventName: e!.name,
      eventDate: e!.date,
    }));
    setForm(prev => ({ ...prev, events }));
    toast.success(`Załadowano ${events.length} biegów z serii`);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 3) newErrors.name = 'Nazwa musi mieć min. 3 znaki';
    if (!form.slug.trim()) newErrors.slug = 'Slug jest wymagany';
    if (form.minCompleted < 1) newErrors.minCompleted = 'Min. biegów musi być >= 1';
    if (form.startDate && form.endDate && form.endDate < form.startDate) newErrors.endDate = 'Data końca musi być późniejsza niż startu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast.success(isEditing ? 'Wyzwanie zaktualizowane!' : 'Wyzwanie utworzone!');
    navigate(-1);
  };

  if (isEditing && !challenge) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Wyzwanie nie zostało znalezione.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Powrót
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                {isEditing ? `Edytuj: ${challenge?.name}` : 'Nowe wyzwanie'}
              </h1>
            </div>
          </div>
          <Button onClick={handleSave}>{isEditing ? 'Zapisz zmiany' : 'Utwórz wyzwanie'}</Button>
        </div>

        <div className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Podstawowe</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa wyzwania *</Label>
                  <Input id="name" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="np. Korona Półmaratonów 2026" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input id="slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="korona-polmaratonow-2026" className="font-mono text-sm" />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea id="description" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Opis wyzwania..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL obrazka</Label>
                <Input id="imageUrl" value={form.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
            </CardContent>
          </Card>

          {/* Series & dates */}
          <Card>
            <CardHeader><CardTitle className="text-base">Seria i daty</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Powiązanie z serią (opcjonalne)</Label>
                  <Select value={form.seriesId || 'none'} onValueChange={v => updateField('seriesId', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak</SelectItem>
                      {mockSeries.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.seriesId && (
                  <Button variant="outline" size="sm" onClick={loadEventsFromSeries}>
                    <Download className="h-4 w-4 mr-1" /> Załaduj biegi
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data startu</Label>
                  <Input id="startDate" type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data końca</Label>
                  <Input id="endDate" type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rule */}
          <Card>
            <CardHeader><CardTitle className="text-base">Reguła</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCompleted">Min. biegów do zaliczenia *</Label>
                  <Input id="minCompleted" type="number" min={1} value={form.minCompleted} onChange={e => updateField('minCompleted', parseInt(e.target.value) || 1)} />
                  {errors.minCompleted && <p className="text-sm text-destructive">{errors.minCompleted}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTime">Limit czasu (opcjonalnie)</Label>
                  <Input id="maxTime" value={form.maxTime} onChange={e => updateField('maxTime', e.target.value)} placeholder="HH:MM:SS" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Wydarzenia ({form.events.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={addEvent}><Plus className="h-4 w-4 mr-1" /> Dodaj</Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Brak wydarzeń. Dodaj ręcznie lub załaduj z serii.</p>
              ) : (
                <div className="space-y-2">
                  {form.events.map((ev, idx) => (
                    <div key={ev.eventId} className="flex gap-2 items-center">
                      <Input className="flex-1" placeholder="Nazwa biegu" value={ev.eventName} onChange={e => updateEvent(idx, 'eventName', e.target.value)} />
                      <Input type="date" className="w-44" value={ev.eventDate} onChange={e => updateEvent(idx, 'eventDate', e.target.value)} />
                      <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeEvent(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Nagrody ({form.rewards.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={addReward}><Plus className="h-4 w-4 mr-1" /> Dodaj</Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Brak nagród.</p>
              ) : (
                <div className="space-y-4">
                  {form.rewards.map((rw, idx) => (
                    <Card key={rw.id} className="p-4">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1">
                            <Label>Nazwa nagrody *</Label>
                            <Input placeholder="np. Medal pamiątkowy" value={rw.name} onChange={e => updateReward(idx, 'name', e.target.value)} />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label>Typ</Label>
                              <Select value={rw.type} onValueChange={v => updateReward(idx, 'type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Darmowa</SelectItem>
                                  <SelectItem value="product">Płatna</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {rw.type === 'product' && (
                              <div className="space-y-1">
                                <Label>Cena (zł)</Label>
                                <Input type="number" placeholder="0.00" value={rw.price || ''} onChange={e => updateReward(idx, 'price', parseFloat(e.target.value) || 0)} />
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label>Rozmiary</Label>
                              <Input placeholder="S, M, L, XL" value={rw.sizes?.join(', ') || ''} onChange={e => updateReward(idx, 'sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label>Opis (opcjonalnie)</Label>
                            <Input placeholder="Opis nagrody..." value={rw.description || ''} onChange={e => updateReward(idx, 'description', e.target.value)} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeReward(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
