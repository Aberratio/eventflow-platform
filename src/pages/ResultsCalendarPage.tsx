import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/data/mockData';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { ChevronLeft, ChevronRight, Trophy, Calendar } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import { pl } from 'date-fns/locale';

const ResultsCalendarPage = () => {
  const [searchParams] = useSearchParams();
  const currentDate = new Date();
  const defaultYear = 2026; // Mock default year
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get('year');
    return yearParam ? parseInt(yearParam) : defaultYear;
  });

  const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Get all completed events
  const completedEvents = useMemo(() => {
    return mockEvents
      .filter(e => e.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    completedEvents.forEach(e => {
      years.add(getYear(new Date(e.date)));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [completedEvents]);

  // Filter events by selected year
  const yearEvents = useMemo(() => {
    return completedEvents.filter(e => getYear(new Date(e.date)) === selectedYear);
  }, [completedEvents, selectedYear]);

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const groups: Record<number, typeof yearEvents> = {};
    
    yearEvents.forEach(event => {
      const month = getMonth(new Date(event.date));
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(event);
    });
    
    return groups;
  }, [yearEvents]);

  // Scroll to current month on mount
  useEffect(() => {
    const currentMonth = currentDate.getMonth();
    const targetMonth = Object.keys(eventsByMonth)
      .map(Number)
      .find(m => m <= currentMonth) || Object.keys(eventsByMonth)[0];
    
    if (targetMonth !== undefined && monthRefs.current[targetMonth]) {
      setTimeout(() => {
        monthRefs.current[targetMonth]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedYear]);

  const canGoPrev = availableYears.includes(selectedYear + 1);
  const canGoNext = availableYears.includes(selectedYear - 1);

  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Kalendarz wyników</h1>
          </div>
          <p className="text-muted-foreground">
            Przeglądaj wyniki zakończonych zawodów
          </p>
        </div>

        {/* Year navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y + 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold min-w-[80px] text-center">{selectedYear}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y - 1)}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Events by month */}
        {yearEvents.length > 0 ? (
          <div className="space-y-8">
            {months.map((monthName, monthIndex) => {
              const monthEvents = eventsByMonth[monthIndex];
              if (!monthEvents || monthEvents.length === 0) return null;

              return (
                <div
                  key={monthIndex}
                  ref={(el) => { monthRefs.current[monthIndex] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    {monthName} {selectedYear}
                    <Badge variant="secondary" className="ml-2">{monthEvents.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {monthEvents.map(event => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <DisciplineIcon discipline={event.discipline} size="lg" />
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={`/results?eventId=${event.id}`}
                                className="font-medium hover:text-primary transition-colors line-clamp-1"
                              >
                                {event.name}
                              </Link>
                              <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                                <span>{format(new Date(event.date), 'd MMMM', { locale: pl })}</span>
                                <span>•</span>
                                <span>{event.city}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {event.distances.map(d => (
                                  <Badge key={d.id} variant="outline" className="text-xs">
                                    {d.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/results?eventId=${event.id}`}>
                                <Trophy className="h-4 w-4 mr-1.5" />
                                Wyniki
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Brak wyników</h2>
              <p className="text-muted-foreground mb-6">
                W roku {selectedYear} nie ma jeszcze opublikowanych wyników.
              </p>
              {availableYears.length > 0 && (
                <Button variant="outline" onClick={() => setSelectedYear(availableYears[0])}>
                  Przejdź do {availableYears[0]}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ResultsCalendarPage;