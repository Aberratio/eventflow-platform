import { getEventById, getRegistrationsByEvent, updateEvent } from '@/api';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventOverviewTab } from './components/EventOverviewTab';
import { ParticipantsTab } from './components/ParticipantsTab';
import { ResultsTab } from './components/ResultsTab';
import { VirtualResultsVerificationTab } from './components/VirtualResultsVerificationTab';
import { EventSettingsTab } from './components/EventSettingsTab';
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  Globe,
  Tag,
  Mail,
} from 'lucide-react';
import { DiscountCode } from '@/types';
import { EmailTemplatesManager } from '@/components/email/EmailTemplatesManager';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const statusLabels = {
  draft: 'Szkic',
  awaiting_approval: 'Do sprawdzenia',
  approved: 'Zatwierdzone',
  active: 'Aktywne',
  past: 'Przeszłe',
  archived: 'Zarchiwizowane',
  deleted: 'Usunięte',
} as const;

const EventManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const requestedTab = searchParams.get('tab');
  const requestedDefaultTab = [
    'overview',
    'participants',
    'results',
    'discounts',
    'emails',
    'settings',
  ].includes(requestedTab ?? '')
    ? requestedTab!
    : 'overview';

  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id || ''),
    enabled: Boolean(id),
  });

  const event = eventResponse?.data ?? null;
  const [localStatus, setLocalStatus] = useState(event?.status);
  const visibleEvent = event && localStatus ? { ...event, status: localStatus } : event;
  const isDraft = visibleEvent?.status === 'draft';
  const defaultTab =
    isDraft && ['participants', 'results'].includes(requestedDefaultTab)
      ? 'overview'
      : requestedDefaultTab;

  const { data: registrationsResponse } = useQuery({
    queryKey: ['event-registrations', id],
    queryFn: () => getRegistrationsByEvent(id!),
    enabled: Boolean(id),
  });
  const registrations = registrationsResponse?.data ?? [];

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(event?.discountCodes || []);

  useEffect(() => {
    if (event) {
      setDiscountCodes(event.discountCodes || []);
      setLocalStatus(event.status);
    }
  }, [event]);

  const handleDiscountCodesChange = (codes: DiscountCode[]) => {
    if (!visibleEvent) return;
    setDiscountCodes(codes);
    updateEvent(visibleEvent.id, { discountCodes: codes })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['event', visibleEvent.id] });
        toast.success('Kody rabatowe zapisane');
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać kodów');
      });
  };

  const canManage =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'moderator' ||
    (user?.role === 'organizer' && visibleEvent?.organizerId === user?.id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Ładowanie wydarzenia...</p>
        </div>
      </Layout>
    );
  }

  if (!visibleEvent || !canManage || visibleEvent.status === 'deleted') {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {!event ? 'Wydarzenie nie znalezione' : 'Brak dostępu'}
            </h1>
            <Button onClick={() => navigate(-1)}>Powrót do panelu</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{visibleEvent.name}</h1>
              <Badge variant={visibleEvent.status === 'active' ? 'default' : 'outline'}>
                {statusLabels[visibleEvent.status]}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {visibleEvent.isVirtual
              ? 'Wydarzenie wirtualne - cały świat'
              : `${visibleEvent.city} - ${visibleEvent.date}`}
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList
            className={`grid w-full ${isDraft ? 'grid-cols-4' : 'grid-cols-6'} lg:inline-grid lg:w-auto`}
          >
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Przegląd</span>
            </TabsTrigger>
            {!isDraft && (
              <TabsTrigger value="participants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Uczestnicy</span>
              </TabsTrigger>
            )}
            {!isDraft && (
              <TabsTrigger value="results" className="flex items-center gap-2">
                {visibleEvent.isVirtual ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Trophy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {visibleEvent.isVirtual ? 'Weryfikacja' : 'Wyniki'}
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Kody rabatowe</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emaile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ustawienia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EventOverviewTab event={visibleEvent} registrations={registrations} />
          </TabsContent>

          {!isDraft && (
            <TabsContent value="participants">
              <ParticipantsTab event={visibleEvent} registrations={registrations} />
            </TabsContent>
          )}

          {!isDraft && (
            <TabsContent value="results">
              {visibleEvent.isVirtual ? (
                <VirtualResultsVerificationTab event={visibleEvent} />
              ) : (
                <ResultsTab event={visibleEvent} registrations={registrations} />
              )}
            </TabsContent>
          )}

          <TabsContent value="discounts">
            <DiscountCodesEditor
              discountCodes={discountCodes}
              distances={visibleEvent.distances}
              onChange={handleDiscountCodesChange}
            />
          </TabsContent>

          <TabsContent value="emails">
            <EmailTemplatesManager eventId={visibleEvent.id} scope="event" />
          </TabsContent>

          <TabsContent value="settings">
            <EventSettingsTab event={visibleEvent} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EventManage;
