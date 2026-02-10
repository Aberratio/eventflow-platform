import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRegistrations, mockResults, mockPersonalRecords, mockMessages, mockCertificates, mockTickets, mockShopOrders } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Ticket, History, Medal, Mail, UserCog, TicketIcon, Package } from 'lucide-react';
import ParticipantOverviewTab from './components/ParticipantOverviewTab';
import ParticipantRegistrationsTab from './components/ParticipantRegistrationsTab';
import ParticipantHistoryTab from './components/ParticipantHistoryTab';
import ParticipantRecordsTab from './components/ParticipantRecordsTab';
import ParticipantMessagesTab from './components/ParticipantMessagesTab';
import ParticipantProfileTab from './components/ParticipantProfileTab';
import ParticipantTicketsTab from './components/ParticipantTicketsTab';
import ParticipantOrdersTab from './components/ParticipantOrdersTab';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
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
    { id: 'orders', label: 'Zamówienia', icon: Package },
    { id: 'messages', label: 'Wiadomości', icon: Mail, badge: unreadMessages.length },
    { id: 'profile', label: 'Profil', icon: UserCog },
  ];

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Witaj, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Twój panel uczestnika</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex-1 min-w-[60px] sm:min-w-[100px] gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

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

          <TabsContent value="orders" className="mt-0">
            <ParticipantOrdersTab orders={userOrders} />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <ParticipantMessagesTab messages={userMessages} />
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <ParticipantProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ParticipantDashboard;
