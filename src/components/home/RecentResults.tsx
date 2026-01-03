import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Medal } from 'lucide-react';
import { Event, Result } from '@/types';
import { disciplineIcons } from '@/data/mockData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface RecentResultsProps {
  events: Event[];
  results: Result[];
  userId?: string;
}

export const RecentResults = ({ events, results, userId }: RecentResultsProps) => {
  const completedEvents = events
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (completedEvents.length === 0) return null;

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
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
            <Link to="/results">
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{disciplineIcons[event.discipline]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(event.date), 'd MMM', { locale: pl })}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold line-clamp-1">{event.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {eventResults.map(result => (
                      <div 
                        key={result.id} 
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-sm ${
                          result.userId === userId ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-background ${getMedalColor(result.position)}`}>
                          {result.position <= 3 ? (
                            <Medal className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-xs font-bold">{result.position}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{result.userName}</p>
                        </div>
                        <div className="font-mono font-semibold text-xs">{result.time}</div>
                      </div>
                    ))}

                    {userResult && userResult.position > 3 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background">
                            <span className="text-xs font-bold">{userResult.position}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs">Twój wynik</p>
                          </div>
                          <div className="font-mono font-semibold text-xs">{userResult.time}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/results?eventId=${event.id}`}
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
            <Link to="/results">
              Wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
