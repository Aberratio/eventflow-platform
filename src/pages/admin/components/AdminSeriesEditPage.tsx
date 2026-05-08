import {
  createSeries,
  getEvents,
  getProducts,
  getSeriesById,
  updateSeries,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { EventSeries } from '@/types';
import { toast } from 'sonner';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const AdminSeriesEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const basePath = location.pathname.startsWith('/moderator') ? '/moderator' : '/admin';

  const { data: seriesData } = useQuery({
    queryKey: id ? QUERY_KEYS.seriesById(id) : ['series', 'new'],
    queryFn: () => getSeriesById(id!),
    enabled: !!id,
  });
  const { data: eventsData } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'staff'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true }),
  });
  const { data: productsData } = useQuery({
    queryKey: [...QUERY_KEYS.products, 'staff'],
    queryFn: () => getProducts({ includeArchived: true }),
  });

  const [form, setForm] = useState<Partial<EventSeries>>({
    name: '',
    slug: '',
    type: 'cup',
    description: '',
    organizerId: 'u-organizer',
    organizerName: 'ZmierzymyCzas',
    eventIds: [],
    products: [],
    status: 'upcoming',
  });

  useEffect(() => {
    if (seriesData?.data) setForm(seriesData.data);
  }, [seriesData?.data]);

  const events = eventsData?.data ?? [];
  const products = productsData?.data ?? [];
  const selectedProducts = new Set((form.products ?? []).map((product) => product.productId));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = form as Omit<EventSeries, 'id'>;
      return isNew ? createSeries(payload) : updateSeries(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.series });
      toast.success(isNew ? 'Seria została utworzona' : 'Seria została zapisana');
      navigate(basePath);
    },
  });

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slugify(name) }));

  const toggleEvent = (eventId: string) =>
    setForm((prev) => {
      const current = prev.eventIds ?? [];
      return {
        ...prev,
        eventIds: current.includes(eventId)
          ? current.filter((id) => id !== eventId)
          : [...current, eventId],
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

  const selectedEventIds = useMemo(() => new Set(form.eventIds ?? []), [form.eventIds]);

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
            <CardHeader><CardTitle>Podstawowe</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nazwa</Label>
                <Input value={form.name ?? ''} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <Label>Typ</Label>
                <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as EventSeries['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cup">Cykl / Grand Prix</SelectItem>
                    <SelectItem value="championship">Mistrzostwa</SelectItem>
                    <SelectItem value="local">Ustawki lokalne</SelectItem>
                    <SelectItem value="virtual">Wirtualna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as EventSeries['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Nadchodząca</SelectItem>
                    <SelectItem value="active">Aktywna</SelectItem>
                    <SelectItem value="completed">Zakończona</SelectItem>
                    <SelectItem value="archived">Archiwalna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Opis</Label>
                <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Start</Label>
                <Input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Koniec</Label>
                <Input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
            <CardHeader><CardTitle>Produkty</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {products.map((product) => (
                <label key={product.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <Checkbox checked={selectedProducts.has(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
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
