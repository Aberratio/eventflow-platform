import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
}

const genderOptions = [
  { id: 'all', label: 'Open' },
  { id: 'M', label: 'Mężczyźni' },
  { id: 'K', label: 'Kobiety' },
];

const getPositionDisplay = (position: number) => {
  if (position === 1) return <span className="text-warning font-bold">🥇 1</span>;
  if (position === 2) return <span className="text-muted-foreground font-bold">🥈 2</span>;
  if (position === 3) return <span className="text-warning/70 font-bold">🥉 3</span>;
  return position;
};

interface SeriesStandingsTableProps {
  standings: SeriesStanding[];
  completedEvents: Event[];
  genderFilter: 'all' | 'M' | 'K';
  onGenderFilterChange: (v: 'all' | 'M' | 'K') => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onClearFilters: () => void;
}

export const SeriesStandingsTable: React.FC<SeriesStandingsTableProps> = ({
  standings,
  completedEvents,
  genderFilter,
  onGenderFilterChange,
  onExportCSV,
  onExportPDF,
  onClearFilters,
}) => (
  <Card className="mb-8">
    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
      <CardTitle className="flex items-center gap-2">
        <Medal className="h-5 w-5 text-amber-500" />
        Klasyfikacja generalna
      </CardTitle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Eksport
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onExportCSV}>
            <FileText className="h-4 w-4 mr-2" /> Pobierz CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <Printer className="h-4 w-4 mr-2" /> Drukuj PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ToggleGroup
          type="single"
          value={genderFilter}
          onValueChange={(value) => value && onGenderFilterChange(value as 'all' | 'M' | 'K')}
          className="bg-muted/50 rounded-lg p-1"
        >
          {genderOptions.map(option => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              className="px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm text-sm"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                  {completedEvents.map(event => (
                    <TableHead key={event.id} className="text-center min-w-24">
                      <Link to={`/events/${event.id}`} className="hover:text-primary transition-colors">
                        {event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name}
                      </Link>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Suma</TableHead>
                  <TableHead className="text-center">Starty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((standing, index) => (
                  <TableRow key={standing.userId} className={index < 3 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">{getPositionDisplay(index + 1)}</TableCell>
                    <TableCell>
                      <Link to={`/athlete/${standing.userId}`} className="font-medium hover:text-primary transition-colors">
                        {standing.userName}
                      </Link>
                    </TableCell>
                    {completedEvents.map(event => (
                      <TableCell key={event.id} className="text-center">
                        {standing.eventPoints[event.id] ? (
                          <span className="font-medium">{standing.eventPoints[event.id]}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold text-primary">{standing.totalPoints}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{standing.eventsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Punktacja:</strong> 1. miejsce - 100 pkt, 2. miejsce - 80 pkt, 3. miejsce - 60 pkt,
              4. miejsce - 50 pkt, 5. miejsce - 45 pkt, 6-10 miejsce - od 40 do 26 pkt
            </p>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);
