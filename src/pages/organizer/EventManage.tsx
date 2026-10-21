import { getEventById, getRegistrationsByEvent } from '@/api';
import { adoptSavedDiscountCodes } from '@/api/eventChildren';
import { useEventChildSaver } from '@/hooks/useEventChildSaver';
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
import { EventTeamTab } from './components/EventTeamTab';
import { FormFieldsTab } from './components/FormFieldsTab';
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
  ClipboardList,
  UsersRound,
} from 'lucide-react';
import type { ApiResponse } from '@/api/types';
import type { DiscountCode, Event } from '@/types';
import { EmailTemplatesManager } from '@/components/email/EmailTemplatesManager';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCoManagedEvents } from '@/hooks/useCoManagedEvents';
import { isCoManagerOf, isEventOwnerLevel } from '@/lib/eventTeam';

const eventManageTabs = [
  'overview',
  'participants',
  'results',
  'discounts',
  'form',
  'emails',
  'settings',
  'team',
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
  // A participant who only co-manages Events has no organizer dashboard.
  const dashboardPath = isModeratorContext
    ? '/moderator'
    : user?.role === 'organizer'
      ? '/organizer'
      : '/organizer/events';

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
  const isOwnerLevel = isEventOwnerLevel(user, visibleEvent);
  // The Zespół tab is the Owner's (and admin's): the server refuses the roster to anyone else.
  const showTeamTab = isOwnerLevel && !isModeratorContext;
  const activeTab: EventManageTab =
    (isDraft && ['participants', 'results'].includes(requestedTab)) ||
    (requestedTab === 'team' && !showTeamTab)
      ? 'overview'
      : requestedTab;

  const { data: registrationsResponse, isError: registrationsFailed } = useQuery({
    queryKey: ['event-registrations', id],
    queryFn: () => getRegistrationsByEvent(id!),
    enabled: Boolean(id),
  });
  const registrations = registrationsResponse?.data ?? [];

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(event?.discountCodes || []);

  const saver = useEventChildSaver<DiscountCode>(id, 'discountCodes', {
    onSaved: (saved: Event, idMap) => {
      // Adopt the server ids and counters without dropping edits made while the save was in flight.
      setDiscountCodes((local) => adoptSavedDiscountCodes(local, saved.discountCodes, idMap));
      queryClient.setQueryData<ApiResponse<Event>>(['event', saved.id], {
        success: true,
        data: saved,
      });
      void queryClient.invalidateQueries({ queryKey: ['event', saved.id] });
      toast.success('Kody rabatowe zapisane');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać kodów');
    },
  });

  const isSavingCodes = saver.isBusy;

  useEffect(() => {
    if (event) {
      // A refetch must not overwrite codes that are still being saved.
      if (!isSavingCodes()) setDiscountCodes(event.discountCodes || []);
      setLocalStatus(event.publicationStatus);
    }
  }, [event, isSavingCodes]);

  useEffect(() => {
    if (!hasVisibleEvent || !id) return;

    const shouldRedirect =
      !tab ||
      !isEventManageTab(tab) ||
      Boolean(legacyRequestedTab) ||
      (isDraft && ['participants', 'results'].includes(tab)) ||
      (tab === 'team' && !showTeamTab);

    if (shouldRedirect) {
      navigate(`${sectionBasePath}/${activeTab}`, { replace: true });
    }
  }, [
    activeTab,
    hasVisibleEvent,
    id,
    isDraft,
    legacyRequestedTab,
    navigate,
    sectionBasePath,
    showTeamTab,
    tab,
  ]);

  const handleDiscountCodesChange = (codes: DiscountCode[]) => {
    if (!visibleEvent) return;
    setDiscountCodes(codes);
    void saver.save(codes);
  };

  // A Co-manager is not the Owner; the organizer-panel list tells whether the
  // Account co-manages this Event. Moderators and admins get their access from their role.
  const needsTeamLookup =
    Boolean(user) &&
    Boolean(visibleEvent) &&
    !isOwnerLevel &&
    user?.role !== 'moderator' &&
    !isModeratorContext;
  const coManaged = useCoManagedEvents(needsTeamLookup);
  const isCoManager = needsTeamLookup && isCoManagerOf(coManaged.allEvents, id);

  // Moderator access starts at `submitted` — a Szkic (draft) is visible only to its
  // owning organizer/team and to admins.
  const canManage =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user?.role === 'moderator' && visibleEvent?.publicationStatus !== 'draft') ||
    (user?.role === 'organizer' && visibleEvent?.organizerId === user?.id) ||
    isCoManager;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Ładowanie wydarzenia...</p>
        </div>
      </Layout>
    );
  }

  // The access decision for a non-owner waits for the co-managed list (no flash of "Brak dostępu").
  if (needsTeamLookup && coManaged.isLoading) {
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
              {isCoManager && (
                <Badge variant="secondary" className="ml-2 rounded-md px-2.5 py-1">
                  Współzarządzający
                </Badge>
              )}
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
            className={`grid h-auto w-full rounded-lg border border-border/80 bg-muted/20 p-0 ${isDraft ? (showTeamTab ? 'grid-cols-5' : 'grid-cols-4') : showTeamTab ? 'grid-cols-7' : 'grid-cols-6'} lg:inline-grid lg:w-auto`}
          >
            <TabsTrigger
              aria-label="Przegląd"
              value="overview"
              className="flex h-[52px] items-center gap-2 px-7 py-4"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Przegląd</span>
            </TabsTrigger>
            {!isDraft && (
              <TabsTrigger
                aria-label="Uczestnicy"
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
            <TabsTrigger
              aria-label="Kody rabatowe"
              value="discounts"
              className="flex h-[52px] items-center gap-2 px-7 py-4"
            >
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Kody rabatowe</span>
            </TabsTrigger>
            <TabsTrigger
              aria-label="Formularz zapisów"
              value="form"
              className="flex h-[52px] items-center gap-2 px-7 py-4"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Formularz zapisów</span>
            </TabsTrigger>
            <TabsTrigger
              aria-label="Emaile"
              value="emails"
              className="flex h-[52px] items-center gap-2 px-7 py-4"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emaile</span>
            </TabsTrigger>
            <TabsTrigger
              aria-label="Ustawienia"
              value="settings"
              className="flex h-[52px] items-center gap-2 px-7 py-4"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ustawienia</span>
            </TabsTrigger>
            {showTeamTab && (
              <TabsTrigger value="team" className="flex h-[52px] items-center gap-2 px-7 py-4">
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Zespół</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <EventOverviewTab event={visibleEvent} registrations={registrations} />
          </TabsContent>

          {!isDraft && (
            <TabsContent value="participants">
              {registrationsResponse ? (
                <ParticipantsTab event={visibleEvent} registrations={registrations} />
              ) : registrationsFailed ? (
                <p className="text-destructive">Nie udało się wczytać listy uczestników.</p>
              ) : (
                <p className="text-muted-foreground">Ładowanie uczestników...</p>
              )}
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
              eventId={visibleEvent.id}
              discountCodes={discountCodes}
              distances={visibleEvent.distances}
              onChange={handleDiscountCodesChange}
            />
          </TabsContent>

          <TabsContent value="form">
            <FormFieldsTab eventId={visibleEvent.id} distances={visibleEvent.distances} />
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

          {showTeamTab && (
            <TabsContent value="team">
              <EventTeamTab eventId={visibleEvent.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default EventManage;
