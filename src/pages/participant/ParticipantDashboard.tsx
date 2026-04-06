import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRegistrations, mockResults, mockPersonalRecords, mockMessages, mockCertificates, mockTickets, mockShopOrders } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Ticket, History, Medal, Mail, UserCog, TicketIcon, Package, Trophy } from 'lucide-react';
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
  const userRegistrations = mockRegistrations.filter(r => r.userId === user?.id);
  const upcomingRegistrations = userRegistrations.filter(r => r.status === 'confirmed' || r.status === 'pending');
  const userResults = mockResults.filter(r => r.userId === user?.id);
  const userCertificates = mockCertificates.filter(c => userResults.some(r => r.eventId === c.eventId));
  const userMessages = mockMessages.filter(m => m.toId === user?.id);
  const unreadMessages = userMessages.filter(m => !m.read);
  const userTickets = mockTickets.filter(t => t.participantId === user?.id);
  const userOrders = mockShopOrders.filter(o => o.userId === user?.id);

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
      <div className="bg-gradient-to-br from-primary/10 via-background to-warning/5 border-b">
        <div className="container py-5 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex p-3 rounded-full bg-primary/10 shrink-0">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Witaj, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Twój panel uczestnika</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5 sm:py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5 sm:space-y-6">
          {/* Mobile: horizontal scroll tabs */}
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
            <TabsList className="w-max sm:w-full h-auto flex-nowrap sm:flex-wrap gap-1 bg-muted/50 p-1">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="whitespace-nowrap sm:flex-1 sm:min-w-[100px] gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
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
