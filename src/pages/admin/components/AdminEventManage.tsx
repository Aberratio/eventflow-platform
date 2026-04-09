import {
  mockEvents,
  mockMerchandise,
  defaultPaymentMethods,
  mockRegistrations,
  mockUsers,
} from '@/api';
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const event = mockEvents.find((e) => e.id === id);
  const eventRegistrations = mockRegistrations.filter((r) => r.eventId === id);

  const [merchandise, setMerchandise] = useState<EventMerchandise[]>(
    event?.merchandise || mockMerchandise,
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

  const organizers = mockUsers.filter((u) => u.role === 'organizer');

  const handleSaveAdvanced = () => {
    toast.success('Ustawienia zaawansowane zostały zapisane');
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do panelu
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">Zarządzanie wydarzeniem (widok administratora)</p>
        </div>

        <Tabs defaultValue="overview">
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
