import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ModeratorOverviewTab } from './components/ModeratorOverviewTab';
import { ModeratorModerationTab } from './components/ModeratorModerationTab';
import { UsersReadOnlyTab } from './components/UsersReadOnlyTab';
import { ModeratorOrdersTab } from './components/ModeratorOrdersTab';
import { ModeratorProfileTab } from './components/ModeratorProfileTab';
import { ModeratorDiscountCodesTab } from './components/ModeratorDiscountCodesTab';
import { ModeratorChallengesTab } from './components/ModeratorChallengesTab';
import { LayoutDashboard, Users, Building2, ShoppingCart, ShieldCheck, UserCog, Lock, Tag, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ModeratorDashboard = () => {
  const { user } = useAuth();
  
  const tabs = [
    { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    { id: 'moderation', label: 'Moderacja', icon: ShieldCheck },
    { id: 'participants', label: 'Uczestnicy', icon: Users },
    { id: 'organizers', label: 'Organizatorzy', icon: Building2 },
    { id: 'discounts', label: 'Kody rabatowe', icon: Tag },
    { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    { id: 'orders', label: 'Zamówienia', icon: ShoppingCart },
    { id: 'profile', label: 'Profil', icon: UserCog },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Panel Moderatora</h1>
            <p className="text-muted-foreground">Witaj, {user?.name}!</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto">
            <Lock className="h-3 w-3" />
            Dostęp ograniczony
          </Badge>
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
            <ModeratorOverviewTab />
          </TabsContent>

          <TabsContent value="moderation">
            <ModeratorModerationTab />
          </TabsContent>

          <TabsContent value="participants">
            <UsersReadOnlyTab userType="participant" />
          </TabsContent>

          <TabsContent value="organizers">
            <UsersReadOnlyTab userType="organizer" />
          </TabsContent>

          <TabsContent value="discounts">
            <ModeratorDiscountCodesTab />
          </TabsContent>

          <TabsContent value="challenges">
            <ModeratorChallengesTab />
          </TabsContent>

          <TabsContent value="orders">
            <ModeratorOrdersTab />
          </TabsContent>

          <TabsContent value="profile">
            <ModeratorProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ModeratorDashboard;
