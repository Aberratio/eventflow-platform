import {
  getEventById,
  getRegistrations,
  getUsers,
  defaultPaymentMethods,
  updateEvent,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { EventMerchandise, PaymentMethod, Distance, DiscountCode } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const AdminEventManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const [merchandise, setMerchandise] = useState<EventMerchandise[]>(
    event?.merchandise || [],
  );
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

  useEffect(() => {
    if (!event) return;
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
        if (distance.priceTierMode === 'date') {
          if (!tier.endDate || Number.isNaN(new Date(tier.endDate).getTime())) {
            toast.error('Podaj prawidlowa date koncowa dla kazdego progu cenowego');
            return false;
          }
          if (event.registrationDeadline && tier.endDate > event.registrationDeadline) {
            toast.error('Data koncowa progu nie moze byc pozniejsza niz termin rejestracji');
            return false;
          }
        }
        if (distance.priceTierMode === 'participants') {
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
      if (distance.priceTierMode === 'date') {
        const dates = tiers.map((tier) => tier.endDate).filter(Boolean);
        if (new Set(dates).size !== dates.length) {
          toast.error('Daty koncowe progow cenowych nie moga sie powtarzac');
          return false;
        }
      }
      if (distance.priceTierMode === 'participants') {
        const participantLimits = tiers.map((tier) => Number(tier.participantLimit));
        if (new Set(participantLimits).size !== participantLimits.length) {
          toast.error('Limity uczestnikow w progach cenowych nie moga sie powtarzac');
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveAdvanced = async () => {
    if (!validateAdvancedDistances()) return;

    try {
      await updateEvent(event.id, {
        organizerId: selectedOrganizer,
        distances,
        discountCodes,
        merchandise,
        paymentMethods,
        liveResultsUrl,
        enableMerchandiseInRegistration: enableMerchandise,
      });
      toast.success('Ustawienia zaawansowane zostały zapisane');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać zmian');
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
            <EventSettingsTab event={event} />
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
                <Button onClick={handleSaveAdvanced}>
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
                      <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
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
                        onChange={(e) => setLiveResultsUrl(e.target.value)}
                        placeholder="https://example.com/live-results/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Link do zewnętrznego serwisu z wynikami na żywo (iframe)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <PriceTiersEditor distances={distances} onChange={setDistances} />

              <DiscountCodesEditor
                discountCodes={discountCodes}
                distances={distances}
                onChange={setDiscountCodes}
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
                    <Switch checked={enableMerchandise} onCheckedChange={setEnableMerchandise} />
                  </div>
                </CardContent>
              </Card>

              <PaymentMethodsEditor paymentMethods={paymentMethods} onChange={setPaymentMethods} />

              <MerchandiseEditor merchandise={merchandise} onChange={setMerchandise} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
