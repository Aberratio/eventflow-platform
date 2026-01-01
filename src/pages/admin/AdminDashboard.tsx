import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { UsersParticipantsTab } from './components/UsersParticipantsTab';
import { UsersOrganizersTab } from './components/UsersOrganizersTab';
import { AdminEventsTab } from './components/AdminEventsTab';
import { AdminPartnersTab } from './components/AdminPartnersTab';

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Panel Administratora</h1>
          <p className="text-muted-foreground">Pełna kontrola nad platformą</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Pulpit</TabsTrigger>
            <TabsTrigger value="participants">Uczestnicy</TabsTrigger>
            <TabsTrigger value="organizers">Organizatorzy</TabsTrigger>
            <TabsTrigger value="events">Wydarzenia</TabsTrigger>
            <TabsTrigger value="partners">Partnerzy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab />
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

          <TabsContent value="partners">
            <AdminPartnersTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
