import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Filter, Medal, Printer } from 'lucide-react';
import type { Event } from '@/types';

export interface SeriesStanding {
  userId: string;
  userName: string;
  totalPoints: number;
  eventsCount: number;
  eventPoints: Record<string, number>;
  gender?: 'M' | 'K';
  birthYear?: number;
  /** Rank from the server ranking (ties share a rank); falls back to row order. */
  rank?: number;
  isAnonymized?: boolean;
}

const genderOptions = [
  { id: 'all', label: 'Open' },
  { id: 'M', label: 'Mężczyźni' },
  { id: 'K', label: 'Kobiety' },
];

const getPositionDisplay = (position: number) => {
  if (position === 1) return <span className="font-bold text-warning">🥇 1</span>;
  if (position === 2) return <span className="font-bold text-muted-foreground">🥈 2</span>;
  if (position === 3) return <span className="font-bold text-warning/70">🥉 3</span>;
  return position;
};

interface SeriesStandingsTableProps {
  standings: SeriesStanding[];
  completedEvents: Event[];
  /**
   * Set when the rows come from GET /series/{id}/ranking: that ranking is summed over the
   * series' challenges, so it has no per-event breakdown, starts count or gender.
   */
  serverRanking?: { hasPoints: boolean };
  genderFilter: 'all' | 'M' | 'K';
  onGenderFilterChange: (v: 'all' | 'M' | 'K') => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onClearFilters: () => void;
}

export const SeriesStandingsTable: React.FC<SeriesStandingsTableProps> = ({
  standings,
  completedEvents,
  serverRanking,
  genderFilter,
  onGenderFilterChange,
  onExportCSV,
  onExportPDF,
  onClearFilters,
}) => (
  <Card className="mb-8">
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
      <CardTitle className="flex items-center gap-2">
        <Medal className="h-5 w-5 text-amber-500" />
        Klasyfikacja generalna
      </CardTitle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Eksport
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onExportCSV}>
            <FileText className="mr-2 h-4 w-4" /> Pobierz CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <Printer className="mr-2 h-4 w-4" /> Drukuj PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!serverRanking && (
          <ToggleGroup
            type="single"
            value={genderFilter}
            onValueChange={(value) => value && onGenderFilterChange(value as 'all' | 'M' | 'K')}
            className="rounded-lg bg-muted/50 p-1"
          >
            {genderOptions.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                className="px-3 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm sm:px-4"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>

      {standings.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Filter className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="mb-4">Brak zawodników spełniających kryteria</p>
          <Button variant="link" onClick={onClearFilters}>
            Wyczyść filtry
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Zawodnik</TableHead>
                  {!serverRanking &&
                    completedEvents.map((event) => (
                      <TableHead key={event.id} className="min-w-24 text-center">
                        <Link
                          to={`/events/${event.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {event.name.length > 15
                            ? `${event.name.substring(0, 15)}...`
                            : event.name}
                        </Link>
                      </TableHead>
                    ))}
                  <TableHead className="text-center font-bold">
                    {serverRanking ? (serverRanking.hasPoints ? 'Punkty' : 'Ukończono') : 'Suma'}
                  </TableHead>
                  {!serverRanking && <TableHead className="text-center">Starty</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((standing, index) => (
                  <TableRow key={standing.userId} className={index < 3 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                      {getPositionDisplay(standing.rank ?? index + 1)}
                    </TableCell>
                    <TableCell>
                      {standing.isAnonymized ? (
                        <span className="font-medium">{standing.userName}</span>
                      ) : (
                        <Link
                          to={`/athlete/${standing.userId}`}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {standing.userName}
                        </Link>
                      )}
                    </TableCell>
                    {!serverRanking &&
                      completedEvents.map((event) => (
                        <TableCell key={event.id} className="text-center">
                          {standing.eventPoints[event.id] ? (
                            <span className="font-medium">{standing.eventPoints[event.id]}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                    <TableCell className="text-center font-bold text-primary">
                      {serverRanking && !serverRanking.hasPoints
                        ? standing.totalPoints > 0
                          ? 'Tak'
                          : 'Nie'
                        : standing.totalPoints}
                    </TableCell>
                    {!serverRanking && (
                      <TableCell className="text-center text-muted-foreground">
                        {standing.eventsCount}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!serverRanking && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Punktacja:</strong> 1. miejsce - 100 pkt, 2. miejsce - 80 pkt, 3. miejsce -
                60 pkt, 4. miejsce - 50 pkt, 5. miejsce - 45 pkt, 6-10 miejsce - od 40 do 26 pkt
              </p>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);
