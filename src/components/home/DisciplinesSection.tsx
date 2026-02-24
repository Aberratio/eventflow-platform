import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/types';
import { disciplineLabels } from '@/data/mockData';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';

interface DisciplinesSectionProps {
  events: Event[];
}

const disciplines = ['running', 'cycling', 'triathlon', 'multisport'] as const;

export const DisciplinesSection = ({ events }: DisciplinesSectionProps) => {
  const now = new Date();
  
  const getDisciplineStats = (discipline: string) => {
    const upcomingCount = events.filter(
      e => !e.isPrivate && e.discipline === discipline && new Date(e.date) > now && e.status === 'published'
    ).length;
    return upcomingCount;
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Dyscypliny</h2>
          <p className="text-muted-foreground mt-1">Znajdź wydarzenia w swojej ulubionej dyscyplinie</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {disciplines.map(discipline => {
            const count = getDisciplineStats(discipline);
            return (
              <Link key={discipline} to={`/wydarzenia?discipline=${discipline}`}>
                <Card className="hover:shadow-lg hover:border-muted-foreground/30 transition-all h-full">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <DisciplineIcon discipline={discipline} size="lg" className="h-12 w-12" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{disciplineLabels[discipline]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {count} {count === 1 ? 'wydarzenie' : count < 5 ? 'wydarzenia' : 'wydarzeń'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
