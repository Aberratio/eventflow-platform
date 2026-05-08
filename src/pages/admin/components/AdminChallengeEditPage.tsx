import {
  createChallenge,
  getChallengeById,
  getEvents,
  getProducts,
  getSeries,
  updateChallenge,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Trophy } from 'lucide-react';
import { Challenge } from '@/types';
import { toast } from 'sonner';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const AdminChallengeEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const basePath = location.pathname.startsWith('/moderator') ? '/moderator' : '/admin';

  const { data: challengeData } = useQuery({
    queryKey: id ? QUERY_KEYS.challenge(id) : ['challenge', 'new'],
    queryFn: () => getChallengeById(id!),
    enabled: !!id,
  });
  const { data: eventsData } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'staff'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true }),
  });
  const { data: seriesData } = useQuery({
    queryKey: [...QUERY_KEYS.series, 'staff'],
    queryFn: () => getSeries({ includeArchived: true }),
  });
  const { data: productsData } = useQuery({
    queryKey: [...QUERY_KEYS.products, 'staff'],
    queryFn: () => getProducts({ includeArchived: true }),
  });

  const [form, setForm] = useState<Partial<Challenge>>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    seriesId: '',
    events: [],
    products: [],
    rewards: [],
    rule: { minCompleted: 1 },
    status: 'upcoming',
    startDate: '',
    endDate: '',
    createdBy: '',
  });

  useEffect(() => {
    if (challengeData?.data) setForm(challengeData.data);
  }, [challengeData?.data]);

  const events = eventsData?.data ?? [];
  const series = seriesData?.data ?? [];
  const products = productsData?.data ?? [];
  const selectedEventIds = useMemo(
    () => new Set((form.events ?? []).map((event) => event.eventId)),
    [form.events],
  );
  const selectedProductIds = useMemo(
    () => new Set((form.products ?? []).map((product) => product.productId)),
    [form.products],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = form as Omit<Challenge, 'id'>;
      return isNew ? createChallenge(payload) : updateChallenge(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges });
      toast.success(isNew ? 'Wyzwanie zostało utworzone' : 'Wyzwanie zostało zapisane');
      navigate(basePath);
    },
  });

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slugify(name) }));

  const toggleEvent = (eventId: string) =>
    setForm((prev) => {
      const current = prev.events ?? [];
      const exists = current.some((event) => event.eventId === eventId);
      const event = events.find((item) => item.id === eventId);
      return {
        ...prev,
        events: exists
          ? current.filter((item) => item.eventId !== eventId)
          : [
              ...current,
              {
                eventId,
                eventName: event?.name ?? eventId,
                eventDate: event?.date ?? '',
              },
            ],
      };
    });

  const toggleProduct = (productId: string) =>
    setForm((prev) => {
      const current = prev.products ?? [];
      const exists = current.some((product) => product.productId === productId);
      return {
        ...prev,
        products: exists
          ? current.filter((product) => product.productId !== productId)
          : [...current, { productId, purpose: 'reward', sortOrder: current.length }],
      };
    });

  const loadEventsFromSeries = (seriesId: string) => {
    const selectedSeries = series.find((item) => item.id === seriesId);
    const loadedEvents =
      selectedSeries?.eventIds
        .map((eventId) => events.find((event) => event.id === eventId))
        .filter(Boolean)
        .map((event) => ({ eventId: event!.id, eventName: event!.name, eventDate: event!.date })) ??
      [];
    setForm((prev) => ({ ...prev, seriesId, events: loadedEvents }));
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> Zapisz
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {isNew ? 'Nowe wyzwanie' : 'Edycja wyzwania'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nazwa</Label>
                <Input value={form.name ?? ''} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Opis</Label>
                <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>URL obrazka</Label>
                <Input value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as Challenge['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Nadchodzące</SelectItem>
                    <SelectItem value="active">Aktywne</SelectItem>
                    <SelectItem value="completed">Zakończone</SelectItem>
                    <SelectItem value="archived">Archiwalne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seria</Label>
                <Select value={form.seriesId || 'none'} onValueChange={(value) => value === 'none' ? setForm({ ...form, seriesId: '' }) : loadEventsFromSeries(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak</SelectItem>
                    {series.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data startu</Label>
                <Input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Data końca</Label>
                <Input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <Label>Minimum wydarzeń</Label>
                <Input type="number" min={1} value={form.rule?.minCompleted ?? 1} onChange={(e) => setForm({ ...form, rule: { ...form.rule, minCompleted: Number(e.target.value) || 1 } })} />
              </div>
              <div>
                <Label>Limit czasu</Label>
                <Input value={form.rule?.maxTime ?? ''} onChange={(e) => setForm({ ...form, rule: { ...form.rule, minCompleted: form.rule?.minCompleted ?? 1, maxTime: e.target.value } })} placeholder="HH:MM:SS" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Wydarzenia</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {events.map((event) => (
                <label key={event.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <Checkbox checked={selectedEventIds.has(event.id)} onCheckedChange={() => toggleEvent(event.id)} />
                  <span>{event.name} · {event.date}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Produkty / nagrody</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {products.map((product) => (
                <label key={product.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <Checkbox checked={selectedProductIds.has(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
                  <span>{product.name} · {product.price} zł</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
