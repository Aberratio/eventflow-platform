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
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Filter data for current user
  const userRegistrations = mockRegistrations.filter((r) => r.userId === user?.id);
  const upcomingRegistrations = userRegistrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending',
  );
  const userResults = mockResults.filter((r) => r.userId === user?.id);
  const userCertificates = mockCertificates.filter((c) =>
    userResults.some((r) => r.eventId === c.eventId),
  );
  const userMessages = mockMessages.filter((m) => m.toId === user?.id);
  const unreadMessages = userMessages.filter((m) => !m.read);
  const userTickets = mockTickets.filter((t) => t.participantId === user?.id);
  const userOrders = mockShopOrders.filter((o) => o.userId === user?.id);

  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'registrations', label: 'Moje starty', icon: Ticket },
    { id: 'tickets', label: 'Bilety', icon: TicketIcon },
    { id: 'history', label: 'Historia', icon: History },
    { id: 'records', label: 'Rekordy', icon: Medal },
    { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    { id: 'orders', label: 'Zamówienia', icon: Package },
    { id: 'messages', label: 'Wiadomości', icon: Mail, badge: unreadMessages.length },
  ];

  return (
    <Layout>
      {/* Hero header with gradient */}
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-warning/5">
        <div className="container py-5 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="hidden shrink-0 rounded-full bg-primary/10 p-3 sm:flex">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Witaj, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">Twój panel uczestnika</p>
            </div>
          </div>
        </div>
      </div>

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
