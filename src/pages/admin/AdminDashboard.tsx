import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { UsersParticipantsTab } from './components/UsersParticipantsTab';
import { UsersOrganizersTab } from './components/UsersOrganizersTab';
import { AdminEventsTab } from './components/AdminEventsTab';
import { AdminModerationTab } from './components/AdminModerationTab';
import { AdminPartnersTab } from './components/AdminPartnersTab';
import { AdminShopTab } from './components/AdminShopTab';
import AdminProfileTab from './components/AdminProfileTab';
import { LayoutDashboard, Users, Building2, Calendar, Handshake, UserCog, ShoppingBag, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'moderation', label: 'Moderacja', icon: ShieldCheck },
    { id: 'participants', label: 'Uczestnicy', icon: Users },
    { id: 'organizers', label: 'Organizatorzy', icon: Building2 },
    { id: 'events', label: 'Wydarzenia', icon: Calendar },
    { id: 'shop', label: 'Sklep', icon: ShoppingBag },
    { id: 'partners', label: 'Partnerzy', icon: Handshake },
    { id: 'profile', label: 'Profil', icon: UserCog },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Panel Administratora</h1>
          <p className="text-muted-foreground">Pełna kontrola nad platformą</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 lg:w-auto lg:inline-flex">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex-1 lg:flex-none gap-2 text-sm py-2.5 data-[state=active]:bg-background"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab />
          </TabsContent>

          <TabsContent value="moderation">
            <AdminModerationTab />
          </TabsContent>

          <TabsContent value="participants">
            <UsersParticipantsTab />
          </TabsContent>

          <TabsContent value="organizers">
            <UsersOrganizersTab />
          </TabsContent>

          <TabsContent value="events">
            <AdminEventsTab />
          </TabsContent>

          <TabsContent value="shop">
            <AdminShopTab />
          </TabsContent>

          <TabsContent value="partners">
            <AdminPartnersTab />
          </TabsContent>

          <TabsContent value="profile">
            <AdminProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
