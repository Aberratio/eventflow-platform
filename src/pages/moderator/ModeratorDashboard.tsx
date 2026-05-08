import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { ModeratorOverviewTab } from './components/ModeratorOverviewTab';
import { ModeratorModerationTab } from './components/ModeratorModerationTab';
import { UsersReadOnlyTab } from './components/UsersReadOnlyTab';
import { ModeratorOrdersTab } from './components/ModeratorOrdersTab';
import { ModeratorDiscountCodesTab } from './components/ModeratorDiscountCodesTab';
import { ModeratorChallengesTab } from './components/ModeratorChallengesTab';
import { AdminFeaturedEventsTab } from '@/pages/admin/components/AdminFeaturedEventsTab';
import { AdminSeriesTab } from '@/pages/admin/components/AdminSeriesTab';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingCart,
  ShieldCheck,
  Lock,
  Tag,
  Trophy,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Panel',
    items: [{ id: 'overview', label: 'Pulpit', icon: LayoutDashboard }],
  },
  {
    label: 'Moderacja',
    items: [
      { id: 'moderation', label: 'Moderacja', icon: ShieldCheck },
      { id: 'featured', label: 'Polecane', icon: Star },
      { id: 'series', label: 'Serie', icon: Trophy },
      { id: 'participants', label: 'Uczestnicy', icon: Users },
      { id: 'organizers', label: 'Organizatorzy', icon: Building2 },
    ],
  },
  {
    label: 'Sklep',
    items: [
      { id: 'discounts', label: 'Kody rabatowe', icon: Tag },
      { id: 'orders', label: 'Zamówienia', icon: ShoppingCart },
      { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

const ModeratorDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const isMobile = useIsMobile();

  const activeItem = allItems.find((i) => i.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <ModeratorOverviewTab />;
      case 'moderation':
        return <ModeratorModerationTab />;
      case 'featured':
        return <AdminFeaturedEventsTab />;
      case 'series':
        return <AdminSeriesTab basePath="/moderator" />;
      case 'participants':
        return <UsersReadOnlyTab userType="participant" />;
      case 'organizers':
        return <UsersReadOnlyTab userType="organizer" />;
      case 'discounts':
        return <ModeratorDiscountCodesTab />;
      case 'orders':
        return <ModeratorOrdersTab />;
      case 'challenges':
        return <ModeratorChallengesTab />;
      default:
        return <ModeratorOverviewTab />;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Panel Moderatora</h1>
            <p className="text-muted-foreground">Witaj, {user?.name}!</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto">
            <Lock className="h-3 w-3" />
            Dostęp ograniczony
          </Badge>
        </div>

        {isMobile ? (
          <>
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="mb-6">
                <SelectValue>
                  {activeItem && (
                    <span className="flex items-center gap-2">
                      <activeItem.icon className="h-4 w-4" />
                      {activeItem.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </div>
                    {group.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {renderContent()}
          </>
        ) : (
          <div className="flex gap-6">
            <nav className="w-56 shrink-0 space-y-4 rounded-lg border border-border bg-[hsl(var(--surface-overlay))] p-3">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          activeSection === item.id
                            ? 'border-l-[3px] border-l-primary bg-accent/50 pl-[9px] text-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="min-w-0 flex-1">{renderContent()}</div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModeratorDashboard;
