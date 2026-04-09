import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRegistrations } from '@/api/mock/registrations.mock';
import {
  mockCertificates,
  mockMessages,
  mockPersonalRecords,
  mockResults,
} from '@/api/mock/results.mock';
import { mockShopOrders, mockTickets } from '@/api/mock/shop.mock';
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

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const userRegistrations = mockRegistrations.filter((r) => r.userId === user?.id);
  const upcomingRegistrations = userRegistrations.filter((r) => r.status !== 'removed');
  const userResults = mockResults.filter((r) => r.userId === user?.id);
  const userCertificates = mockCertificates.filter((c) => (c as any).userId === user?.id);
  const unreadMessages = mockMessages.filter((m) => !m.read);
  const userMessages = mockMessages.filter((m) => (m as any).recipientId === user?.id || true);
  const userRecords = mockPersonalRecords.filter((r) => (r as any).userId === user?.id);
  const userOrders = mockShopOrders.filter((o) => o.userId === user?.id);
  const userTickets = mockTickets.filter((t) => (t as any).userId === user?.id);

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: LayoutDashboard },
    { id: 'registrations', label: 'Rejestracje', icon: Ticket, badge: userRegistrations.length },
    { id: 'history', label: 'Historia', icon: History, badge: userResults.length },
    { id: 'records', label: 'Rekordy', icon: Medal },
    { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    { id: 'tickets', label: 'Bilety', icon: TicketIcon, badge: userTickets.length },
    { id: 'orders', label: 'Zamówienia', icon: Package, badge: userOrders.length },
    { id: 'profile', label: 'Profil', icon: UserCog },
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
              personalRecords={mockPersonalRecords}
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
            <ParticipantRecordsTab personalRecords={mockPersonalRecords} results={userResults} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <ParticipantChallengesTab />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <ParticipantOrdersTab orders={userOrders} />
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
