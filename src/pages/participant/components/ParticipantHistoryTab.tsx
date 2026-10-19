import { disciplineLabels } from '@/api';
import { getAllEventsPaged } from '@/api/fetchAllPages';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Result, Certificate } from '@/types';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { ListContainer, ListGroup, ListEmptyState, ResultListRow } from '@/components/lists';

interface ParticipantHistoryTabProps {
  results: Result[];
  certificates: Certificate[];
}

const ParticipantHistoryTab = ({ results, certificates }: ParticipantHistoryTabProps) => {
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'participant-history'],
    queryFn: () => getAllEventsPaged({ includeUnpublished: true, includePrivate: true }),
  });
  const events = eventsResponse?.data ?? [];

  // Enrich results with event data
  const enrichedResults = results.map((result) => {
    const event = events.find((e) => e.id === result.eventId);
    const certificate = certificates.find((c) => c.eventId === result.eventId);
    return { ...result, event, certificate };
  });

  // Get unique years and disciplines for filters
  const years = [
    ...new Set(
      enrichedResults
        .map((r) => (r.event?.date ? new Date(r.event.date).getFullYear() : null))
        .filter(Boolean),
    ),
  ] as number[];
  const disciplines = [
    ...new Set(enrichedResults.map((r) => r.event?.discipline).filter(Boolean)),
  ] as string[];

  // Filter results
  const filteredResults = enrichedResults
    .filter((result) => {
      if (!result.event) return false;

      const resultYear = new Date(result.event.date).getFullYear();
      if (yearFilter !== 'all' && resultYear !== parseInt(yearFilter)) return false;
      if (disciplineFilter !== 'all' && result.event.discipline !== disciplineFilter) return false;

      return true;
    })
    .sort((a, b) => new Date(b.event!.date).getTime() - new Date(a.event!.date).getTime());

  // Group by year
  const groupedResults = filteredResults.reduce(
    (groups, result) => {
      const year = new Date(result.event!.date).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(result);
      return groups;
    },
    {} as Record<string, typeof filteredResults>,
  );

  const handleDownloadCertificate = (certificateId: string) => {
    toast.success('Pobieranie dyplomu...');
  };

  if (results.length === 0) {
    return (
      <ListContainer
        isEmpty
        emptyState={
          <ListEmptyState
            icon={<Trophy className="h-12 w-12" />}
            title="Brak historii startów"
            description="Tu pojawią się Twoje wyniki po ukończeniu zawodów"
            action={
              <Button asChild>
                <Link to="/events">Znajdź zawody</Link>
              </Button>
            }
          />
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Rok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie lata</SelectItem>
            {years
              .sort((a, b) => b - a)
              .map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Dyscyplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie dyscypliny</SelectItem>
            {disciplines.map((disc) => (
              <SelectItem key={disc} value={disc}>
                {disciplineLabels[disc] || disc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <ListContainer
        isEmpty={filteredResults.length === 0}
        emptyState={
          <ListEmptyState title="Brak wyników" description="Brak wyników dla wybranych filtrów" />
        }
      >
        {Object.entries(groupedResults)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, yearResults]) => (
            <ListGroup key={year} title={year}>
              {yearResults.map((result) => (
                <ResultListRow
                  key={result.id}
                  result={result}
                  event={result.event}
                  showEvent
                  showDownload={!!result.certificate}
                  onDownloadCertificate={
                    result.certificate
                      ? () => handleDownloadCertificate(result.certificate!.id)
                      : undefined
                  }
                />
              ))}
            </ListGroup>
          ))}
      </ListContainer>
    </div>
  );
};

export default ParticipantHistoryTab;
