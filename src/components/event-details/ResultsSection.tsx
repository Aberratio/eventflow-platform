import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockResultDocuments, mockTeamResults } from '@/api/mock/results.mock';
import { Trophy, Medal, Users } from 'lucide-react';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { ResultDocumentsList } from '@/components/results/ResultDocumentsList';
import { Event, Result } from '@/types';

interface ResultsSectionProps {
  event: Event;
  eventResults: Result[];
}

const getMedalIcon = (position: number) => {
  if (position === 1) return <Medal className="h-4 w-4 text-warning" />;
  if (position === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
  if (position === 3) return <Medal className="h-4 w-4 text-warning/70" />;
  return null;
};

export const ResultsSection = ({ event, eventResults }: ResultsSectionProps) => {
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const eventDocuments = mockResultDocuments.filter((d) => d.eventId === event.id);
  const eventTeamResults = mockTeamResults.filter((t) => t.eventId === event.id);

  const categories = useMemo(() => {
    const cats = new Set(eventResults.map((r) => r.category));
    return Array.from(cats).sort();
  }, [eventResults]);

  const filteredResults = useMemo(() => {
    return eventResults
      .filter((r) => {
        if (selectedDistance !== 'all' && r.distanceId !== selectedDistance) return false;
        if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
        if (selectedGender !== 'all' && r.gender !== selectedGender) return false;
        if (searchQuery && !r.userName.toLowerCase().includes(searchQuery.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => a.position - b.position);
  }, [eventResults, selectedDistance, selectedCategory, selectedGender, searchQuery]);

  return (
    <>
      <ResultsFilters
        distances={event.distances}
        selectedDistance={selectedDistance}
        onDistanceChange={setSelectedDistance}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Wyniki oficjalne
            <Badge variant="secondary" className="ml-2">
              {filteredResults.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Poz.</TableHead>
                    <TableHead>Uczestnik</TableHead>
                    <TableHead className="hidden sm:table-cell">Dystans</TableHead>
                    <TableHead>Czas</TableHead>
                    <TableHead className="hidden md:table-cell">Kat.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getMedalIcon(result.position)}
                          <span className="font-bold">{result.position}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/athlete/${result.userId}`}
                          className="font-medium transition-colors hover:text-primary hover:underline"
                        >
                          {result.userName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{result.distanceName}</TableCell>
                      <TableCell className="font-mono">{result.time}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {result.categoryPosition}. {result.category}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {eventResults.length === 0
                ? 'Wyniki będą dostępne wkrótce.'
                : 'Brak wyników spełniających kryteria.'}
            </p>
          )}
        </CardContent>
      </Card>

      {eventTeamResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Klasyfikacja drużynowa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Poz.</TableHead>
                    <TableHead>Drużyna</TableHead>
                    <TableHead className="hidden sm:table-cell">Członkowie</TableHead>
                    <TableHead>Łączny czas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventTeamResults
                    .sort((a, b) => a.position - b.position)
                    .map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getMedalIcon(team.position)}
                            <span className="font-bold">{team.position}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{team.teamName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {team.members.map((m) => (
                              <Badge key={m.userId} variant="outline" className="text-xs">
                                {m.userName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{team.totalTime}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {eventDocuments.length > 0 && <ResultDocumentsList documents={eventDocuments} />}
    </>
  );
};
