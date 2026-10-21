import {
  getEventById,
  getRegistrations,
  getUsers,
  defaultPaymentMethods,
  updateEvent,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { buildChildIdMap, remapChildIds } from '@/api/eventChildren';
import type { ApiResponse } from '@/api/types';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { EventOverviewTab } from '@/pages/organizer/components/EventOverviewTab';
import { ParticipantsTab } from '@/pages/organizer/components/ParticipantsTab';
import { ResultsTab } from '@/pages/organizer/components/ResultsTab';
import { EventSettingsTab } from '@/pages/organizer/components/EventSettingsTab';
import { MerchandiseEditor } from './MerchandiseEditor';
import { PaymentMethodsEditor } from './PaymentMethodsEditor';
import { PriceTiersEditor } from './PriceTiersEditor';
import { DiscountCodesEditor } from './DiscountCodesEditor';
import { ArrowLeft, Save, Radio, Users, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { EventMerchandise, PaymentMethod, Distance, DiscountCode, Event } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

export const AdminEventManage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data: eventResponse, isLoading } = useQuery({
    queryKey: id ? QUERY_KEYS.event(id) : ['events', 'missing'],
    queryFn: () => getEventById(id ?? ''),
    enabled: Boolean(id),
  });
  const { data: registrationsResponse } = useQuery({
    queryKey: id ? [...QUERY_KEYS.registrationsByEvent(id), 'admin'] : ['registrations', 'missing'],
    queryFn: () => getRegistrations({ eventId: id, pageSize: 100 }),
    enabled: Boolean(id),
  });
  const { data: organizersResponse } = useQuery({
    queryKey: ['users', 'admin-event-organizers'],
    queryFn: () => getUsers({ role: 'organizer', pageSize: 100 }),
  });
  const event = eventResponse?.data ?? null;
  const requestedTab = searchParams.get('tab');
  const defaultTab = ['overview', 'participants', 'results', 'settings', 'advanced'].includes(
    requestedTab ?? '',
  )
    ? requestedTab!
    : 'overview';
  const eventRegistrations = registrationsResponse?.data ?? [];

  const [merchandise, setMerchandise] = useState<EventMerchandise[]>(event?.merchandise || []);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    event?.paymentMethods || defaultPaymentMethods,
  );
  const [liveResultsUrl, setLiveResultsUrl] = useState(event?.liveResultsUrl || '');
  const [selectedOrganizer, setSelectedOrganizer] = useState(event?.organizerId || '');
  const [distances, setDistances] = useState<Distance[]>(event?.distances || []);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(event?.discountCodes || []);
  const [enableMerchandise, setEnableMerchandise] = useState(
    event?.enableMerchandiseInRegistration || false,
  );

  const [isSaving, setIsSaving] = useState(false);
  // Unsaved edits must survive a background refetch of the event, so the form is only
  // re-hydrated while it is clean (or when another event is opened).
  const dirtyRef = useRef(false);
  const editVersionRef = useRef(0);
  const hydratedEventIdRef = useRef<string | undefined>(undefined);

  const markDirty = () => {
    dirtyRef.current = true;
    editVersionRef.current += 1;
  };
  const edited =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      markDirty();
      setter(value);
    };

  useEffect(() => {
    if (!event) return;
    if (dirtyRef.current && hydratedEventIdRef.current === event.id) return;
    hydratedEventIdRef.current = event.id;
    dirtyRef.current = false;
    setMerchandise(event.merchandise || []);
    setPaymentMethods(event.paymentMethods || defaultPaymentMethods);
    setLiveResultsUrl(event.liveResultsUrl || '');
    setSelectedOrganizer(event.organizerId || '');
    setDistances(event.distances || []);
    setDiscountCodes(event.discountCodes || []);
    setEnableMerchandise(event.enableMerchandiseInRegistration || false);
  }, [event]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Ladowanie wydarzenia...</p>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-8">
          <p>Wydarzenie nie zostało znalezione.</p>
          <Button asChild className="mt-4">
            <Link to="/admin">Wróć do panelu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const organizers = organizersResponse?.data ?? [];

  const validateAdvancedDistances = () => {
    for (const distance of distances) {
      const tiers = distance.priceTiers || [];
      for (const tier of tiers) {
        if (!tier.name.trim()) {
          toast.error('Kazdy prog cenowy musi miec nazwe');
          return false;
        }
        if (tier.endDate) {
          if (Number.isNaN(new Date(tier.endDate).getTime())) {
            toast.error('Podaj prawidlowa date koncowa dla progu cenowego');
            return false;
          }
          if (event.registrationDeadline && tier.endDate > event.registrationDeadline) {
            toast.error('Data koncowa progu nie moze byc pozniejsza niz termin rejestracji');
            return false;
          }
        }
        if (tier.participantLimit != null) {
          const participantLimit = Number(tier.participantLimit);
          if (!participantLimit || participantLimit <= 0 || !Number.isInteger(participantLimit)) {
            toast.error('Limit uczestnikow w progu musi byc dodatnia liczba calkowita');
            return false;
          }
          if (distance.limit && participantLimit > distance.limit) {
            toast.error('Limit uczestnikow w progu nie moze byc wyzszy niz limit dystansu');
            return false;
          }
        }
      }
      const dates = tiers.map((tier) => tier.endDate).filter(Boolean);
      if (new Set(dates).size !== dates.length) {
        toast.error('Daty koncowe progow cenowych nie moga sie powtarzac');
        return false;
      }
      const participantLimits = tiers
        .map((tier) => tier.participantLimit)
        .filter((value): value is number => value != null);
      if (new Set(participantLimits).size !== participantLimits.length) {
        toast.error('Limity uczestnikow w progach cenowych nie moga sie powtarzac');
        return false;
      }
    }
    return true;
  };

  const handleSaveAdvanced = async () => {
    if (isSaving || !validateAdvancedDistances()) return;

    const submitted = { distances, discountCodes, merchandise, paymentMethods };
    const versionAtSend = editVersionRef.current;
    setIsSaving(true);
    try {
      const response = await updateEvent(event.id, {
        organizerId: selectedOrganizer,
        ...submitted,
        liveResultsUrl,
        enableMerchandiseInRegistration: enableMerchandise,
      });
      if (response.success === false) {
        throw new Error(response.message || 'Nie udało się zapisać zmian');
      }
      const saved: Event = response.data;
      const idMap = buildChildIdMap(submitted, saved);
      // Adopt the server rows (real ids, server-owned counters). A collection the user changed
      // while the save was in flight keeps those edits, only its temporary ids are remapped.
      setDistances((local) =>
        local === submitted.distances ? (saved.distances ?? local) : remapChildIds(local, idMap),
      );
      setDiscountCodes((local) =>
        local === submitted.discountCodes
          ? (saved.discountCodes ?? local)
          : remapChildIds(local, idMap),
      );
      setMerchandise((local) =>
        local === submitted.merchandise
          ? (saved.merchandise ?? local)
          : remapChildIds(local, idMap),
      );
      setPaymentMethods((local) =>
        local === submitted.paymentMethods
          ? (saved.paymentMethods ?? local)
          : remapChildIds(local, idMap),
      );
      if (editVersionRef.current === versionAtSend) dirtyRef.current = false;
      queryClient.setQueryData<ApiResponse<Event>>(QUERY_KEYS.event(event.id), response);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      void queryClient.invalidateQueries({ queryKey: ['event', event.id] });
      toast.success('Ustawienia zaawansowane zostały zapisane');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać zmian');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do panelu
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">Zarządzanie wydarzeniem (widok administratora)</p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="participants">Uczestnicy</TabsTrigger>
            <TabsTrigger value="results">Wyniki</TabsTrigger>
            <TabsTrigger value="settings">Ustawienia</TabsTrigger>
            <TabsTrigger value="advanced">Opcje zaawansowane</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EventOverviewTab event={event} registrations={eventRegistrations} />
          </TabsContent>

          <TabsContent value="participants">
            <ParticipantsTab event={event} registrations={eventRegistrations} />
          </TabsContent>

          <TabsContent value="results">
            <ResultsTab event={event} registrations={eventRegistrations} />
          </TabsContent>

          <TabsContent value="settings">
            <EventSettingsTab
              event={event}
              currentUser={user ? { id: user.id, role: user.role } : null}
            />
          </TabsContent>

          <TabsContent value="advanced">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Opcje zaawansowane</h2>
                  <p className="text-sm text-muted-foreground">
                    Dodatkowe ustawienia dostępne tylko dla administratora
                  </p>
                </div>
                <Button onClick={handleSaveAdvanced} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz zmiany
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Przypisany organizator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="organizer">Organizator</Label>
                      <Select
                        value={selectedOrganizer}
                        onValueChange={edited(setSelectedOrganizer)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz organizatora" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizers.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Radio className="h-5 w-5" />
                      Wyniki na żywo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="liveResultsUrl">URL do wyników na żywo</Label>
                      <Input
                        id="liveResultsUrl"
                        value={liveResultsUrl}
                        onChange={(e) => edited(setLiveResultsUrl)(e.target.value)}
                        placeholder="https://example.com/live-results/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Link do zewnętrznego serwisu z wynikami na żywo (iframe)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <PriceTiersEditor distances={distances} onChange={edited(setDistances)} />

              <DiscountCodesEditor
                eventId={event.id}
                discountCodes={discountCodes}
                distances={distances}
                onChange={edited(setDiscountCodes)}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingBag className="h-5 w-5" />
                    Gadżety przy rejestracji
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pokaż gadżety podczas rejestracji</Label>
                      <p className="text-sm text-muted-foreground">
                        Uczestnicy będą mogli zamówić gadżety razem z pakietem startowym
                      </p>
                    </div>
                    <Switch
                      checked={enableMerchandise}
                      onCheckedChange={edited(setEnableMerchandise)}
                    />
                  </div>
                </CardContent>
              </Card>

              <PaymentMethodsEditor
                paymentMethods={paymentMethods}
                onChange={edited(setPaymentMethods)}
              />

              <MerchandiseEditor merchandise={merchandise} onChange={edited(setMerchandise)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
