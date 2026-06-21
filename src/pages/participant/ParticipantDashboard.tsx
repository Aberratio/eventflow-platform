import {
  getRegistrationsByUser,
  getResultsByUser,
  getPersonalRecords,
  getMessages,
  getTickets,
  getCertificates,
  getOrders,
} from '@/api';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { PageHero, PageHeroTitle } from '@/components/ui/page-hero';
import {
  LayoutDashboard,
  Ticket,
  History,
  Medal,
  Mail,
  UserCog,
  TicketIcon,
  Package,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import ParticipantOverviewTab from './components/ParticipantOverviewTab';
import ParticipantRegistrationsTab from './components/ParticipantRegistrationsTab';
import ParticipantHistoryTab from './components/ParticipantHistoryTab';
import ParticipantRecordsTab from './components/ParticipantRecordsTab';
import ParticipantMessagesTab from './components/ParticipantMessagesTab';
import ParticipantProfileTab from './components/ParticipantProfileTab';
import ParticipantTicketsTab from './components/ParticipantTicketsTab';
import ParticipantOrdersTab from './components/ParticipantOrdersTab';
import ParticipantChallengesTab from './components/ParticipantChallengesTab';
import ParticipantAuthorizationsTab from './components/ParticipantAuthorizationsTab';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const { data: registrationsResp } = useQuery({
    queryKey: ['registrations-by-user', user?.id],
    queryFn: () => getRegistrationsByUser(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: resultsResp } = useQuery({
    queryKey: ['results-by-user', user?.id],
    queryFn: () => getResultsByUser(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: recordsResp } = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: () => getPersonalRecords(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: messagesResp } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: () => getMessages(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: ticketsResp } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: () => getTickets(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: certificatesResp } = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: () => getCertificates(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: ordersResp } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => getOrders(user?.id),
    enabled: Boolean(user?.id),
  });

  const userRegistrations = registrationsResp?.data ?? [];
  const upcomingRegistrations = userRegistrations.filter((r) => r.status !== 'removed');
  const userResults = resultsResp?.data ?? [];
  const userCertificates = certificatesResp?.data ?? [];
  const userMessages = messagesResp?.data ?? [];
  const unreadMessages = userMessages.filter((m) => !m.read);
  const userRecords = recordsResp?.data ?? [];
  const userOrders = ordersResp?.data ?? [];
  const userTickets = ticketsResp?.data ?? [];

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: LayoutDashboard },
    { id: 'registrations', label: 'Rejestracje', icon: Ticket, badge: userRegistrations.length },
    { id: 'history', label: 'Historia', icon: History, badge: userResults.length },
    { id: 'records', label: 'Rekordy', icon: Medal },
    { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    { id: 'tickets', label: 'Bilety', icon: TicketIcon, badge: userTickets.length },
    { id: 'orders', label: 'Zamówienia', icon: Package, badge: userOrders.length },
    { id: 'profile', label: 'Profil', icon: UserCog },
    { id: 'authorizations', label: 'Upoważnienia', icon: ShieldCheck },
    { id: 'messages', label: 'Wiadomości', icon: Mail, badge: unreadMessages.length },
  ];

  return (
    <Layout>
      <PageHero>
        <PageHeroTitle
          icon={<LayoutDashboard className="h-6 w-6" />}
          title={`Witaj, ${user?.name?.split(' ')[0]}! 👋`}
          subtitle="Twój panel uczestnika"
        />
      </PageHero>

      <div className="container py-5 sm:py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5 sm:space-y-6">
          {/* Mobile: horizontal scroll tabs */}
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="h-auto w-max flex-nowrap gap-1 bg-muted/50 p-1 sm:w-full sm:flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-1.5 whitespace-nowrap px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:min-w-[100px] sm:flex-1 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <ParticipantOverviewTab
              upcomingRegistrations={upcomingRegistrations}
              results={userResults}
              personalRecords={userRecords}
              unreadMessages={unreadMessages}
            />
          </TabsContent>

          <TabsContent value="registrations" className="mt-0">
            <ParticipantRegistrationsTab registrations={upcomingRegistrations} />
          </TabsContent>

          <TabsContent value="tickets" className="mt-0">
            <ParticipantTicketsTab tickets={userTickets} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ParticipantHistoryTab results={userResults} certificates={userCertificates} />
          </TabsContent>

          <TabsContent value="records" className="mt-0">
            <ParticipantRecordsTab personalRecords={userRecords} results={userResults} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <ParticipantChallengesTab />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <ParticipantOrdersTab orders={userOrders} />
          </TabsContent>

          <TabsContent value="authorizations" className="mt-0">
            <ParticipantAuthorizationsTab />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <ParticipantMessagesTab messages={userMessages} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ParticipantDashboard;
