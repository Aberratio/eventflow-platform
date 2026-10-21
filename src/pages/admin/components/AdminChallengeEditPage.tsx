import {
  createChallenge,
  createExternalEvent,
  getChallengeById,
  getChallenges,
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
import { DateInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Save, Trophy } from 'lucide-react';
import { Challenge, ChallengeConditionNode } from '@/types';
import { toast } from 'sonner';
import { ChallengeConditionTreeSection, defaultNodeForType } from './ChallengeConditionTreeEditor';
import { formatMoney } from '@/lib/format';

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
  // The sub-challenge-threshold node picker may only offer Wyzwania
  // that already exist/are saved (spec: "a reference only goes downwards" — no
  // cycle, and the referenced Wyzwanie's tree must already be on disk).
  const { data: challengesData } = useQuery({
    queryKey: [...QUERY_KEYS.challenges, 'staff', 'condition-tree-picker'],
    queryFn: () => getChallenges({ includeArchived: true }),
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
    conditionTree: defaultNodeForType('event_threshold'),
  });

  useEffect(() => {
    if (challengeData?.data) setForm(challengeData.data);
  }, [challengeData?.data]);

  const events = eventsData?.data ?? [];
  const series = seriesData?.data ?? [];
  const products = productsData?.data ?? [];
  const otherChallenges = (challengesData?.data ?? []).filter((challenge) => challenge.id !== id);
  const conditionTree = form.conditionTree ?? defaultNodeForType('event_threshold');
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

  // "Wydarzenie zewnętrzne" quick-create, right where an
  // event gets linked into a Wyzwanie — for a Korona half-marathon that never
  // ran on this platform, or a pre-platform completion, there is no real
  // Event to pick from `events` until one is created here.
  const [externalEventDialogOpen, setExternalEventDialogOpen] = useState(false);
  const [externalEventForm, setExternalEventForm] = useState({
    name: '',
    date: '',
    location: '',
    city: '',
  });
  const createExternalEventMutation = useMutation({
    mutationFn: () => createExternalEvent(externalEventForm),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      const created = response.data;
      if (created) {
        setForm((prev) => ({
          ...prev,
          events: [
            ...(prev.events ?? []),
            { eventId: created.id, eventName: created.name, eventDate: created.date },
          ],
        }));
      }
      setExternalEventDialogOpen(false);
      setExternalEventForm({ name: '', date: '', location: '', city: '' });
      toast.success('Wydarzenie zewnętrzne zostało utworzone i dodane do wyzwania');
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
                <Input
                  value={form.slug ?? ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Opis</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>URL obrazka</Label>
                <Input
                  value={form.imageUrl ?? ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(status) =>
                    setForm({ ...form, status: status as Challenge['status'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select
                  value={form.seriesId || 'none'}
                  onValueChange={(value) =>
                    value === 'none'
                      ? setForm({ ...form, seriesId: '' })
                      : loadEventsFromSeries(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak</SelectItem>
                    {series.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data startu</Label>
                <DateInput
                  value={form.startDate ?? ''}
                  onValueChange={(startDate) => setForm({ ...form, startDate })}
                />
              </div>
              <div>
                <Label>Data końca</Label>
                <DateInput
                  value={form.endDate ?? ''}
                  onValueChange={(endDate) => setForm({ ...form, endDate })}
                />
              </div>
              <div>
                <Label>Minimum wydarzeń</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.rule?.minCompleted ?? 1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rule: { ...form.rule, minCompleted: Number(e.target.value) || 1 },
                    })
                  }
                />
              </div>
              <div>
                <Label>Limit czasu</Label>
                <Input
                  value={form.rule?.maxTime ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rule: {
                        ...form.rule,
                        minCompleted: form.rule?.minCompleted ?? 1,
                        maxTime: e.target.value,
                      },
                    })
                  }
                  placeholder="HH:MM:SS"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Wydarzenia</CardTitle>
              <Dialog open={externalEventDialogOpen} onOpenChange={setExternalEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" /> Wydarzenie zewnętrzne
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nowe wydarzenie zewnętrzne</DialogTitle>
                    <DialogDescription>
                      Wydarzenie bez Dystansów i zapisów na platformie — służy wyłącznie jako punkt
                      odniesienia dla ręcznie zgłaszanego dowodu ukończenia (np. bieg sprzed
                      istnienia platformy).
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createExternalEventMutation.mutate();
                    }}
                  >
                    <fieldset
                      className="space-y-3"
                      disabled={createExternalEventMutation.isPending}
                    >
                      <legend className="sr-only">Dane wydarzenia zewnętrznego</legend>
                      <div>
                        <Label htmlFor="external-event-name">Nazwa</Label>
                        <Input
                          id="external-event-name"
                          required
                          value={externalEventForm.name}
                          onChange={(e) =>
                            setExternalEventForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="external-event-date">Data</Label>
                        <DateInput
                          id="external-event-date"
                          value={externalEventForm.date}
                          onValueChange={(value) =>
                            setExternalEventForm((prev) => ({ ...prev, date: value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="external-event-location">Miejsce</Label>
                        <Input
                          id="external-event-location"
                          required
                          value={externalEventForm.location}
                          onChange={(e) =>
                            setExternalEventForm((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="external-event-city">Miasto</Label>
                        <Input
                          id="external-event-city"
                          required
                          value={externalEventForm.city}
                          onChange={(e) =>
                            setExternalEventForm((prev) => ({ ...prev, city: e.target.value }))
                          }
                        />
                      </div>
                      {createExternalEventMutation.isError && (
                        <p role="alert" className="text-sm text-destructive">
                          Nie udało się utworzyć wydarzenia zewnętrznego.
                        </p>
                      )}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createExternalEventMutation.isPending}
                      >
                        Utwórz i dodaj do wyzwania
                      </Button>
                    </fieldset>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="grid gap-2">
              {events.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-2 rounded border p-2 text-sm"
                >
                  <Checkbox
                    checked={selectedEventIds.has(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <span>
                    {event.name} · {event.date}
                    {event.isExternal && (
                      <Badge variant="outline" className="ml-2">
                        Zewnętrzne
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reguła ukończenia (drzewo warunków)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Wyzwanie ma dokładnie jeden korzeń drzewa warunków ukończenia — może to być
                pojedynczy próg (najczęstszy przypadek) albo grupa łącząca kilka warunków
                (AND/próg).
              </p>
              <ChallengeConditionTreeSection
                tree={conditionTree}
                onChange={(next: ChallengeConditionNode) =>
                  setForm({ ...form, conditionTree: next })
                }
                events={events}
                otherChallenges={otherChallenges}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produkty / nagrody</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {products.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-2 rounded border p-2 text-sm"
                >
                  <Checkbox
                    checked={selectedProductIds.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <span>
                    {product.name} · {formatMoney(product.price)}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
