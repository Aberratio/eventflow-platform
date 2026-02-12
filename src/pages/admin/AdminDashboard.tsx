import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { UsersParticipantsTab } from './components/UsersParticipantsTab';
import { UsersOrganizersTab } from './components/UsersOrganizersTab';
import { AdminEventsTab } from './components/AdminEventsTab';
import { AdminModerationTab } from './components/AdminModerationTab';
import { AdminPartnersTab } from './components/AdminPartnersTab';
import { AdminShopTab } from './components/AdminShopTab';
import { AdminPagesTab } from './components/AdminPagesTab';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import { AdminChallengesTab } from './components/AdminChallengesTab';
import { LayoutDashboard, Users, Building2, Calendar, Handshake, ShoppingBag, ShieldCheck, FileText, Settings, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    items: [
      { id: 'overview', label: 'Pulpit', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Moderacja',
    items: [
      { id: 'moderation', label: 'Moderacja', icon: ShieldCheck },
      { id: 'participants', label: 'Uczestnicy', icon: Users },
      { id: 'organizers', label: 'Organizatorzy', icon: Building2 },
    ],
  },
  {
    label: 'Sklep',
    items: [
      { id: 'shop', label: 'Produkty', icon: ShoppingBag },
      { id: 'challenges', label: 'Wyzwania', icon: Trophy },
    ],
  },
  {
    label: 'Treści',
    items: [
      { id: 'events', label: 'Wydarzenia', icon: Calendar },
      { id: 'partners', label: 'Partnerzy', icon: Handshake },
      { id: 'pages', label: 'Strony', icon: FileText },
    ],
  },
  {
    label: 'Konfiguracja',
    items: [
      { id: 'settings', label: 'Ustawienia', icon: Settings },
    ],
  },
];

const allItems = navGroups.flatMap(g => g.items);

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const isMobile = useIsMobile();

  const activeItem = allItems.find(i => i.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverviewTab />;
      case 'moderation': return <AdminModerationTab />;
      case 'participants': return <UsersParticipantsTab />;
      case 'organizers': return <UsersOrganizersTab />;
      case 'events': return <AdminEventsTab />;
      case 'shop': return <AdminShopTab />;
      case 'challenges': return <AdminChallengesTab />;
      case 'partners': return <AdminPartnersTab />;
      case 'pages': return <AdminPagesTab />;
      case 'settings': return <AdminSettingsTab />;
      default: return <AdminOverviewTab />;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Panel Administratora</h1>
          <p className="text-muted-foreground">Pełna kontrola nad platformą</p>
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
                {navGroups.map(group => (
                  <div key={group.label}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.items.map(item => (
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
            {/* Sidebar */}
            <nav className="w-56 shrink-0 space-y-4">
              {navGroups.map(group => (
                <div key={group.label}>
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          'flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          activeSection === item.id
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

            {/* Content */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
