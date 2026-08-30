import { getEventById, getRegistrationsByEvent, updateEvent } from '@/api';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

const eventManageTabs = [
  'overview',
  'participants',
  'results',
  'discounts',
  'emails',
  'settings',
] as const;

type EventManageTab = (typeof eventManageTabs)[number];

const isEventManageTab = (value: string | null | undefined): value is EventManageTab =>
  eventManageTabs.includes(value as EventManageTab);

const statusLabels = {
  draft: 'Szkic',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Aktywne',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
} as const;

const EventManage = () => {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const legacyRequestedTab = searchParams.get('tab');
  const requestedTab = isEventManageTab(tab)
    ? tab
    : isEventManageTab(legacyRequestedTab)
      ? legacyRequestedTab
      : 'overview';
  const isModeratorContext = location.pathname.startsWith('/moderator/');
  const sectionBasePath = isModeratorContext
    ? `/moderator/events/${id}`
    : `/organizer/events/${id}`;
  const dashboardPath = isModeratorContext ? '/moderator' : '/organizer';

  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id || ''),
    enabled: Boolean(id),
  });

  const event = eventResponse?.data ?? null;
  const [localStatus, setLocalStatus] = useState(event?.publicationStatus);
  const visibleEvent = event && localStatus ? { ...event, publicationStatus: localStatus } : event;
  const hasVisibleEvent = Boolean(event);
  const isDraft = visibleEvent?.publicationStatus === 'draft';
  const activeTab: EventManageTab =
    isDraft && ['participants', 'results'].includes(requestedTab) ? 'overview' : requestedTab;

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
      setLocalStatus(event.publicationStatus);
    }
  }, [event]);

  useEffect(() => {
    if (!hasVisibleEvent || !id) return;

    const shouldRedirect =
      !tab ||
      !isEventManageTab(tab) ||
      Boolean(legacyRequestedTab) ||
      (isDraft && ['participants', 'results'].includes(tab));

    if (shouldRedirect) {
      navigate(`${sectionBasePath}/${activeTab}`, { replace: true });
    }
  }, [activeTab, hasVisibleEvent, id, isDraft, legacyRequestedTab, navigate, sectionBasePath, tab]);

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

  // Moderator access starts at `submitted` — a Szkic (draft) is visible only to its
  // owning organizer/team and to admins (spec 08, "Co widzi każda rola").
  const canManage =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user?.role === 'moderator' && visibleEvent?.publicationStatus !== 'draft') ||
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

  if (!visibleEvent || !canManage) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {!event ? 'Wydarzenie nie znalezione' : 'Brak dostępu'}
            </h1>
            <Button onClick={() => navigate(dashboardPath)}>Powrót do panelu</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-[1500px] py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(dashboardPath)}
          className="mb-6 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{visibleEvent.name}</h1>
              <Badge
                variant={visibleEvent.publicationStatus === 'published' ? 'default' : 'outline'}
                className="rounded-md px-2.5 py-1"
              >
                {statusLabels[visibleEvent.publicationStatus]}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-lg text-muted-foreground">
            {visibleEvent.isVirtual
              ? 'Wydarzenie wirtualne - cały świat'
              : `${visibleEvent.city} - ${visibleEvent.date}`}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isEventManageTab(value)) {
              navigate(`${sectionBasePath}/${value}`);
            }
          }}
          className="space-y-6"
        >
          <TabsList
            className={`grid h-auto w-full rounded-lg border border-border/80 bg-muted/20 p-0 ${isDraft ? 'grid-cols-4' : 'grid-cols-6'} lg:inline-grid lg:w-auto`}
          >
            <TabsTrigger value="overview" className="flex h-[52px] items-center gap-2 px-7 py-4">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Przegląd</span>
            </TabsTrigger>
            {!isDraft && (
              <TabsTrigger
                value="participants"
                className="flex h-[52px] items-center gap-2 px-7 py-4"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Uczestnicy</span>
              </TabsTrigger>
            )}
            {!isDraft && (
              <TabsTrigger value="results" className="flex h-[52px] items-center gap-2 px-7 py-4">
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
            <TabsTrigger value="discounts" className="flex h-[52px] items-center gap-2 px-7 py-4">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Kody rabatowe</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex h-[52px] items-center gap-2 px-7 py-4">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emaile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex h-[52px] items-center gap-2 px-7 py-4">
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
            <EventSettingsTab
              event={visibleEvent}
              currentUser={user ? { id: user.id, role: user.role } : null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EventManage;
