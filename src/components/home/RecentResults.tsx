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
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Ostatnie wyniki</h2>
            <p className="text-muted-foreground mt-1">Zobacz jak poszło innym zawodnikom</p>
          </div>
          <Button asChild variant="ghost" className="gap-2 hidden sm:flex">
            <Link to="/results">
              Wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {completedEvents.map(event => {
            const eventResults = results
              .filter(r => r.eventId === event.id && r.status === 'finished')
              .sort((a, b) => a.position - b.position)
              .slice(0, 3);

            const userResult = userId ? results.find(r => r.eventId === event.id && r.userId === userId) : null;

            return (
              <Card key={event.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{disciplineIcons[event.discipline]}</span>
                    <Badge variant="secondary">
                      {format(new Date(event.date), 'd MMM', { locale: pl })}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventResults.map(result => (
                      <div 
                        key={result.id} 
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          result.userId === userId ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-muted ${getMedalColor(result.position)}`}>
                          {result.position <= 3 ? (
                            <Medal className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-bold">{result.position}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{result.userName}</p>
                          <p className="text-xs text-muted-foreground">{result.distanceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-sm">{result.time}</p>
                        </div>
                      </div>
                    ))}

                    {userResult && userResult.position > 3 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <span className="text-sm font-bold">{userResult.position}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">Twój wynik</p>
                            <p className="text-xs text-muted-foreground">{userResult.distanceName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-semibold text-sm">{userResult.time}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/results?eventId=${event.id}`}
                    className="block mt-4 text-sm text-primary hover:underline text-center"
                  >
                    Zobacz pełne wyniki →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/results">
              Zobacz wszystkie wyniki
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
