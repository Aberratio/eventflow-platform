import { Card, CardContent } from '@/components/ui/card';
import { mockEvents } from '@/api/mock/events.mock';
import { mockRegistrations } from '@/api/mock/registrations.mock';
import { mockUsers } from '@/api/mock/users.mock';
import { Calendar, Users, Building2, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

export const ModeratorOverviewTab = () => {
  const pendingModerationCount = mockEvents.filter((e) => e.status === 'awaiting_approval').length;
  const publishedEvents = mockEvents.filter((e) => e.status === 'published').length;
  const participantCount = mockUsers.filter((u) => u.role === 'participant').length;
  const organizerCount = mockUsers.filter((u) => u.role === 'organizer').length;

  const stats = [
    {
      label: 'Do moderacji',
      value: pendingModerationCount,
      icon: Clock,
      color:
        pendingModerationCount > 0 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary',
    },
    {
      label: 'Opublikowanych wydarzeń',
      value: publishedEvents,
      icon: Calendar,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Uczestników',
      value: participantCount,
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Organizatorów',
      value: organizerCount,
      icon: Building2,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Rejestracji',
      value: mockRegistrations.length,
      icon: TrendingUp,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Moderatorów',
      value: mockUsers.filter((u) => u.role === 'moderator').length,
      icon: ShieldCheck,
      color: 'bg-accent/10 text-accent-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${stat.color}`}>
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

      {/* Info about limited access */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-warning/10 p-3">
              <ShieldCheck className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Twój zakres dostępu</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Zatwierdzanie i odrzucanie wydarzeń</li>
                <li>✓ Przeglądanie list użytkowników i organizatorów</li>
                <li>✓ Aktualizowanie statusów zamówień</li>
                <li>✓ Edycja własnego profilu</li>
                <li className="text-destructive">✗ Brak dostępu do danych finansowych</li>
                <li className="text-destructive">✗ Brak możliwości edycji/usuwania użytkowników</li>
                <li className="text-destructive">✗ Brak dostępu do zarządzania produktami</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Ostatnie rejestracje</h3>
            <div className="space-y-3">
              {mockRegistrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{reg.userName}</div>
                    <div className="text-sm text-muted-foreground">{reg.eventName}</div>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs">{reg.distanceName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Nadchodzące wydarzenia</h3>
            <div className="space-y-3">
              {mockEvents
                .filter((e) => e.status === 'published')
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.date}</div>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 text-xs">{event.city}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
