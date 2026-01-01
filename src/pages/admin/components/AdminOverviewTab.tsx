import { Card, CardContent } from '@/components/ui/card';
import { mockEvents, mockUsers, mockRegistrations } from '@/data/mockData';
import { Calendar, Users, Shield, Settings, TrendingUp, CheckCircle } from 'lucide-react';

export const AdminOverviewTab = () => {
  const stats = [
    {
      label: 'Wydarzeń',
      value: mockEvents.length,
      icon: Calendar,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Użytkowników',
      value: mockUsers.length,
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Administratorów',
      value: mockUsers.filter((u) => u.role === 'admin').length,
      icon: Shield,
      color: 'bg-destructive/10 text-destructive',
    },
    {
      label: 'Organizatorów',
      value: mockUsers.filter((u) => u.role === 'organizer').length,
      icon: Settings,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Rejestracji',
      value: mockRegistrations.length,
      icon: TrendingUp,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Aktywnych wydarzeń',
      value: mockEvents.filter((e) => e.status === 'published').length,
      icon: CheckCircle,
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Ostatnie rejestracje</h3>
            <div className="space-y-3">
              {mockRegistrations.slice(0, 5).map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{reg.userName}</div>
                    <div className="text-sm text-muted-foreground">{reg.eventName}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-muted rounded">{reg.distanceName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Nadchodzące wydarzenia</h3>
            <div className="space-y-3">
              {mockEvents
                .filter((e) => e.status === 'published')
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.date}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded">{event.city}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
