import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Trophy, Flag } from 'lucide-react';
import { Event, Registration, Result } from '@/types';

interface StatsSectionProps {
  events: Event[];
  registrations: Registration[];
  results: Result[];
}

export const StatsSection = ({ events, registrations, results }: StatsSectionProps) => {
  const stats = [
    {
      icon: Calendar,
      value: events.length,
      label: 'Wydarzeń w bazie',
    },
    {
      icon: Users,
      value: registrations.length,
      label: 'Zapisanych uczestników',
    },
    {
      icon: Trophy,
      value: events.filter(e => e.status === 'completed').length,
      label: 'Zakończonych zawodów',
    },
    {
      icon: Flag,
      value: results.filter(r => r.status === 'finished').length,
      label: 'Ukończonych startów',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">ZmierzymyCzas w liczbach</h2>
          <p className="text-muted-foreground mt-1">Dołącz do naszej społeczności sportowców</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 bg-background/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
