import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Medal } from 'lucide-react';
import { Event, Result } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface RecentResultsProps {
  events: Event[];
  results: Result[];
  userId?: string;
}

export const RecentResults = ({ events, results, userId }: RecentResultsProps) => {
  const completedEvents = events
    .filter(e => !e.isPrivate && e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (completedEvents.length === 0) return null;

  const getMedalColor = (position: number) => {
    if (position === 1) return 'text-yellow-500';
    if (position === 2) return 'text-gray-400';
    if (position === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getPositionDisplay = (position: number) => {
    if (position <= 3) {
      return <Medal className={`h-4 w-4 ${getMedalColor(position)}`} />;
    }
    return <span className="text-sm font-medium">{position}.</span>;
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Ostatnie wyniki</h2>
            </div>
            <p className="text-sm text-muted-foreground">Zobacz jak poszło zawodnikom</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <Link to="/wyniki">
              Wszystkie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {completedEvents.map(event => {
            const eventResults = results
              .filter(r => r.eventId === event.id && r.status === 'finished')
              .sort((a, b) => a.position - b.position)
              .slice(0, 3);

            const userResult = userId ? results.find(r => r.eventId === event.id && r.userId === userId) : null;

            return (
              <Card key={event.id} className="h-full">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <DisciplineIcon discipline={event.discipline} size="sm" />
                    <span>{format(new Date(event.date), 'd MMM', { locale: pl })}</span>
                  </div>
                  <CardTitle className="text-sm font-semibold line-clamp-1">{event.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1.5">
                    {eventResults.map(result => (
                      <div 
                        key={result.id} 
                        className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
                          result.userId === userId ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span className="w-6 flex justify-center shrink-0">{getPositionDisplay(result.position)}</span>
                        <span className="flex-1 truncate">{result.userName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{result.time}</span>
                      </div>
                    ))}

                    {userResult && userResult.position > 3 && (
                      <div className="pt-1.5 mt-1.5 border-t">
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-primary/10 text-sm">
                          <span className="w-6 flex justify-center shrink-0">{userResult.position}.</span>
                          <span className="flex-1 truncate">Twój wynik</span>
                          <span className="font-mono text-xs text-muted-foreground">{userResult.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/wyniki?eventId=${event.id}`}
                    className="block mt-3 text-xs text-primary hover:underline text-center"
                  >
                    Pełne wyniki →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/wyniki">
              Wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
