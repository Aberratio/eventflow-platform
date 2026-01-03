import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Result, Certificate } from '@/types';
import { Calendar, Trophy, Medal, Download, ExternalLink, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { mockEvents, disciplineLabels } from '@/data/mockData';
import { toast } from 'sonner';

interface ParticipantHistoryTabProps {
  results: Result[];
  certificates: Certificate[];
}

const ParticipantHistoryTab = ({ results, certificates }: ParticipantHistoryTabProps) => {
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');

  // Enrich results with event data
  const enrichedResults = results.map(result => {
    const event = mockEvents.find(e => e.id === result.eventId);
    const certificate = certificates.find(c => c.eventId === result.eventId);
    return { ...result, event, certificate };
  });

  // Get unique years and disciplines for filters
  const years = [...new Set(enrichedResults.map(r => r.event?.date ? new Date(r.event.date).getFullYear() : null).filter(Boolean))] as number[];
  const disciplines = [...new Set(enrichedResults.map(r => r.event?.discipline).filter(Boolean))] as string[];

  // Filter results
  const filteredResults = enrichedResults.filter(result => {
    if (!result.event) return false;
    
    const resultYear = new Date(result.event.date).getFullYear();
    if (yearFilter !== 'all' && resultYear !== parseInt(yearFilter)) return false;
    if (disciplineFilter !== 'all' && result.event.discipline !== disciplineFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.event!.date).getTime() - new Date(a.event!.date).getTime());

  const handleDownloadCertificate = (certificateId: string) => {
    toast.success('Pobieranie dyplomu...');
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return null;
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Brak historii startów</h3>
          <p className="text-muted-foreground mb-4">Tu pojawią się Twoje wyniki po ukończeniu zawodów</p>
          <Button asChild>
            <Link to="/events">Znajdź zawody</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Rok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie lata</SelectItem>
            {years.sort((a, b) => b - a).map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Dyscyplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie dyscypliny</SelectItem>
            {disciplines.map(disc => (
              <SelectItem key={disc} value={disc}>{disciplineLabels[disc] || disc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredResults.map(result => (
          <Card key={result.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{result.eventName}</h3>
                    {getMedalIcon(result.categoryPosition)}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {result.event && format(new Date(result.event.date), 'd MMM yyyy', { locale: pl })}
                    </div>
                    <Badge variant="outline" className="text-xs">{result.distanceName}</Badge>
                  </div>
                  
                  {/* Results */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-mono font-bold text-lg">{result.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>OPEN: <strong>{result.position}</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{result.category}: <strong>{result.categoryPosition}</strong></span>
                    </div>
                    
                    <Badge 
                      variant={result.status === 'finished' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {result.status === 'finished' ? 'Ukończony' : result.status === 'dnf' ? 'DNF' : 'DSQ'}
                    </Badge>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 sm:flex-col shrink-0">
                  {result.certificate && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadCertificate(result.certificate!.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Dyplom
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link to={`/results?event=${result.eventId}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Wyniki
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Brak wyników dla wybranych filtrów
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParticipantHistoryTab;
