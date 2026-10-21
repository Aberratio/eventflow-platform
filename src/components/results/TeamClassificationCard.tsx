import { useQuery } from '@tanstack/react-query';
import { getTeamClassification } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Trophy } from 'lucide-react';
import { TEAM_AGGREGATION_RULE_LABELS } from '@/types';
import { formatDuration } from '@/lib/format';

interface TeamClassificationCardProps {
  eventId: string;
  distanceId: string;
}

const medalClass = (position: number): string | undefined => {
  if (position === 1) return 'text-warning';
  if (position === 2) return 'text-muted-foreground';
  if (position === 3) return 'text-warning/70';
  return undefined;
};

/**
 * "the team classification is a separate table next to the individual
 * classification on the same Dystans" - a live-computed,
 * read-only table (GET /events/{eventId}/distances/{distanceId}/team-results),
 * never a form for manually entering/deleting teams (that legacy UI,
 * TeamResultsManager.tsx, was deleted - it let an organizer
 * manually type in a team's members/total time, exactly the model the product
 * owner rejects, and its add/delete handlers were never even wired to a
 * write endpoint - see server ResultRepository::teamResults()'s docblock).
 * Callers
 * are expected to render this only for a Dystans with startType === 'relay'
 * (ResultsSection.tsx and ResultsTab.tsx both gate on that already), since a
 * distance with no team_id-grouped registrations simply renders an empty
 * table.
 */
export const TeamClassificationCard = ({ eventId, distanceId }: TeamClassificationCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.teamClassification(eventId, distanceId),
    queryFn: () => getTeamClassification(eventId, distanceId),
  });

  const teams = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Klasyfikacja drużynowa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground">Wczytywanie...</p>
        ) : teams.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Klasyfikacja drużynowa pojawi się, gdy wszyscy członkowie przynajmniej jednej drużyny
            ukończą start.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Drużyna</TableHead>
                  <TableHead className="hidden sm:table-cell">Członkowie</TableHead>
                  <TableHead>Wynik drużyny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {team.position <= 3 && (
                          <Trophy className={`h-4 w-4 ${medalClass(team.position) ?? ''}`} />
                        )}
                        <span className="font-bold">{team.position}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {team.memberCount}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatDuration(team.aggregatedTimeInSeconds)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({TEAM_AGGREGATION_RULE_LABELS[team.aggregationRule]})
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
