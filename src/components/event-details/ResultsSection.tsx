import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getResultDocuments } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Trophy,
  Medal,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Timer,
  Gauge,
  Upload,
} from 'lucide-react';
import { ResultDocumentsList } from '@/components/results/ResultDocumentsList';
import { PublicationStatusBadge } from '@/components/results/PublicationStatusBadge';
import { TeamClassificationCard } from '@/components/results/TeamClassificationCard';
import { ResultImportWizardDialog } from '@/components/organizer/ResultImportWizardDialog';
import { useAuthSafe } from '@/contexts/AuthContext';
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

type DisplayMode = 'time' | 'pace' | 'speed';

const formatPace = (timeInSeconds: number, distanceKm: number): string => {
  const paceSeconds = timeInSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
};

const formatSpeed = (timeInSeconds: number, distanceKm: number): string => {
  const kmh = (distanceKm / timeInSeconds) * 3600;
  return `${kmh.toFixed(1)} km/h`;
};

const formatValue = (
  result: { time: string; timeInSeconds: number },
  mode: DisplayMode,
  distanceKm?: number,
): string => {
  if (result.timeInSeconds <= 0) return result.time;
  if (mode === 'pace' && distanceKm) return formatPace(result.timeInSeconds, distanceKm);
  if (mode === 'speed' && distanceKm) return formatSpeed(result.timeInSeconds, distanceKm);
  return result.time;
};

interface CategoryTableProps {
  categoryName: string;
  results: Result[];
  positionKey: 'position' | 'categoryPosition';
  showCategory?: boolean;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  distanceKm?: number;
  displayMode: DisplayMode;
  currentUserId?: string;
}

const COLUMN_LABEL: Record<DisplayMode, string> = {
  time: 'Czas',
  pace: 'Tempo',
  speed: 'Prędkość',
};

const CategoryTable = ({
  categoryName,
  results,
  positionKey,
  showCategory = false,
  defaultOpen = false,
  forceOpen = false,
  distanceKm,
  displayMode,
  currentUserId,
}: CategoryTableProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const winner = results[0];

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const canConvert = !!distanceKm;
  const activeMode = canConvert ? displayMode : 'time';

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">{categoryName}</span>
          <Badge variant="secondary" className="text-xs">
            {results.length}
          </Badge>
        </div>
        {!open && winner && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Medal className="h-3.5 w-3.5 text-warning" />
            <span className="font-medium text-foreground">{winner.userName}</span>
            <span className="font-mono">{winner.time}</span>
          </div>
        )}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Poz.</TableHead>
                <TableHead>Uczestnik</TableHead>
                <TableHead>{COLUMN_LABEL[activeMode]}</TableHead>
                {showCategory && <TableHead className="hidden sm:table-cell">Kategoria</TableHead>}
                <TableHead className="hidden w-16 text-xs text-muted-foreground sm:table-cell">
                  Nr
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const pos = result[positionKey];
                const timeValue = formatValue(result, activeMode, distanceKm);
                const isCurrentUser = !!currentUserId && result.userId === currentUserId;
                const finished = result.status === 'finished';
                return (
                  <TableRow
                    key={result.id}
                    data-current-user={isCurrentUser || undefined}
                    className={isCurrentUser ? 'bg-primary/10 font-semibold' : undefined}
                  >
                    <TableCell>
                      {finished ? (
                        <div className="flex items-center gap-1">
                          {getMedalIcon(pos)}
                          <span className={pos <= 3 ? 'font-bold' : ''}>{pos}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/athlete/${result.userId}`}
                          className="font-medium transition-colors hover:text-primary hover:underline"
                        >
                          {result.userName}
                        </Link>
                        {isCurrentUser && (
                          <Badge variant="default" className="shrink-0 px-1.5 py-0 text-xs">
                            Ty
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{timeValue}</TableCell>
                    {showCategory && (
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {result.category}
                      </TableCell>
                    )}
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {result.bibNumber}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

interface DistancePanelProps {
  results: Result[];
  searchQuery: string;
  distanceKm?: number;
  currentUserId?: string;
}

const DistancePanel = ({ results, searchQuery, distanceKm, currentUserId }: DistancePanelProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('time');
  const publicationStatus: 'preliminary' | 'official' =
    results[0]?.publicationStatus ?? 'preliminary';
  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.userName.toLowerCase().includes(q) || r.bibNumber.toLowerCase().includes(q);
    });
  }, [results, searchQuery]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of filtered) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.status !== 'finished' && b.status === 'finished') return 1;
        if (a.status === 'finished' && b.status !== 'finished') return -1;
        return a.categoryPosition - b.categoryPosition;
      });
    }
    return map;
  }, [filtered]);

  const overallResults = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.status !== 'finished' && b.status === 'finished') return 1;
        if (a.status === 'finished' && b.status !== 'finished') return -1;
        return a.position - b.position;
      }),
    [filtered],
  );

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">Brak wyników spełniających kryteria.</p>
    );
  }

  const categories = Array.from(byCategory.entries());

  return (
    <div className="space-y-2">
      <div className="flex justify-end pb-1">
        <PublicationStatusBadge status={publicationStatus} />
      </div>
      {distanceKm && (
        <div className="flex justify-end pb-1">
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={(v) => {
              if (v) setDisplayMode(v as DisplayMode);
            }}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="time" className="gap-1.5 px-3">
              <Timer className="h-3.5 w-3.5" />
              Czas
            </ToggleGroupItem>
            <ToggleGroupItem value="speed" className="gap-1.5 px-3">
              <Gauge className="h-3.5 w-3.5" />
              km/h
            </ToggleGroupItem>
            <ToggleGroupItem value="pace" className="gap-1.5 px-3">
              <Gauge className="h-3.5 w-3.5" />
              min/km
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <CategoryTable
        categoryName="Klasyfikacja generalna"
        results={overallResults}
        positionKey="position"
        showCategory
        defaultOpen={true}
        forceOpen={!!searchQuery}
        distanceKm={distanceKm}
        displayMode={displayMode}
        currentUserId={currentUserId}
      />
      {categories.map(([cat, catResults]) => (
        <CategoryTable
          key={cat}
          categoryName={cat}
          results={catResults}
          positionKey="categoryPosition"
          defaultOpen={false}
          forceOpen={!!searchQuery}
          distanceKm={distanceKm}
          displayMode={displayMode}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

interface FlatResultsTableProps {
  results: Result[];
  showDistance: boolean;
  distanceKm?: number;
  displayMode: DisplayMode;
  currentUserId?: string;
}

const FlatResultsTable = ({
  results,
  showDistance,
  distanceKm,
  displayMode,
  currentUserId,
}: FlatResultsTableProps) => {
  const activeMode = distanceKm ? displayMode : 'time';
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Poz.</TableHead>
            <TableHead>Uczestnik</TableHead>
            {showDistance && <TableHead className="hidden sm:table-cell">Dystans</TableHead>}
            <TableHead>{COLUMN_LABEL[activeMode]}</TableHead>
            <TableHead className="hidden md:table-cell">Kat.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const timeValue = formatValue(result, activeMode, distanceKm);
            const isCurrentUser = !!currentUserId && result.userId === currentUserId;
            const finished = result.status === 'finished';
            return (
              <TableRow
                key={result.id}
                data-current-user={isCurrentUser || undefined}
                className={isCurrentUser ? 'bg-primary/10 font-semibold' : undefined}
              >
                <TableCell>
                  {finished ? (
                    <div className="flex items-center gap-1">
                      {getMedalIcon(result.position)}
                      <span className="font-bold">{result.position}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/athlete/${result.userId}`}
                      className="font-medium transition-colors hover:text-primary hover:underline"
                    >
                      {result.userName}
                    </Link>
                    {isCurrentUser && (
                      <Badge variant="default" className="shrink-0 px-1.5 py-0 text-xs">
                        Ty
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {showDistance && (
                  <TableCell className="hidden sm:table-cell">{result.distanceName}</TableCell>
                )}
                <TableCell className="font-mono">{timeValue}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {finished ? `${result.categoryPosition}. ` : ''}
                  {result.category}
                  {finished && result.gender && (result.genderPosition ?? 0) > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {result.gender === 'K' ? 'Kobiety' : 'Mężczyźni'}: {result.genderPosition}.
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export const ResultsSection = ({ event, eventResults }: ResultsSectionProps) => {
  const auth = useAuthSafe();
  const queryClient = useQueryClient();
  const currentUserId = auth?.user?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [displayModeSingle, setDisplayModeSingle] = useState<DisplayMode>('time');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const canUploadResults =
    (event.publicationStatus === 'published' || event.publicationStatus === 'finished') &&
    (auth?.user?.role === 'admin' ||
      auth?.user?.role === 'superadmin' ||
      auth?.user?.role === 'moderator' ||
      (auth?.user?.role === 'organizer' && auth.user.id === event.organizerId));

  const hasMyResult = useMemo(
    () => !!currentUserId && eventResults.some((r) => r.userId === currentUserId),
    [currentUserId, eventResults],
  );

  const scrollToMyResult = useCallback(() => {
    const el = resultsCardRef.current?.querySelector('[data-current-user]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const { data: documentsResponse } = useQuery({
    queryKey: QUERY_KEYS.resultDocuments(event.id),
    queryFn: () => getResultDocuments(event.id),
  });
  const eventDocuments = documentsResponse?.data ?? [];

  const hasMultipleDistances = event.distances.length > 1;

  const distancesWithResults = useMemo(() => {
    const ids = new Set(eventResults.map((r) => r.distanceId));
    return event.distances.filter((d) => ids.has(d.id));
  }, [event.distances, eventResults]);

  const filteredResults = useMemo(() => {
    return eventResults
      .filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.userName.toLowerCase().includes(q) || r.bibNumber.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.status !== 'finished' && b.status === 'finished') return 1;
        if (a.status === 'finished' && b.status !== 'finished') return -1;
        return a.position - b.position;
      });
  }, [eventResults, searchQuery]);

  const resultsByDistance = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of eventResults) {
      const list = map.get(r.distanceId) ?? [];
      list.push(r);
      map.set(r.distanceId, list);
    }
    return map;
  }, [eventResults]);

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku lub numerze startowym..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasMyResult && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToMyResult}
            className="shrink-0 gap-1.5"
          >
            <Medal className="h-3.5 w-3.5 text-primary" />
            Mój wynik
          </Button>
        )}
        {canUploadResults && (
          <Button size="sm" onClick={() => setImportDialogOpen(true)} className="shrink-0 gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Wgraj wyniki
          </Button>
        )}
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery('')}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      {hasMultipleDistances ? (
        <Card ref={resultsCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Wyniki
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventResults.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Wyniki będą dostępne wkrótce.
              </p>
            ) : (
              <Tabs defaultValue={distancesWithResults[0]?.id}>
                <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
                  {distancesWithResults.map((d) => {
                    const count = resultsByDistance.get(d.id)?.length ?? 0;
                    return (
                      <TabsTrigger key={d.id} value={d.id} className="gap-1.5">
                        {d.name}
                        <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {distancesWithResults.map((d) => {
                  const distResults = resultsByDistance.get(d.id) ?? [];
                  const distanceKm =
                    d.length != null ? (d.unit === 'm' ? d.length / 1000 : d.length) : undefined;
                  return (
                    <TabsContent key={d.id} value={d.id} className="space-y-4">
                      <DistancePanel
                        results={distResults}
                        searchQuery={searchQuery}
                        distanceKm={distanceKm}
                        currentUserId={currentUserId}
                      />
                      {d.startType === 'relay' && (
                        <TeamClassificationCard eventId={event.id} distanceId={d.id} />
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card ref={resultsCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Wyniki
              <Badge variant="secondary" className="ml-2">
                {filteredResults.length}
              </Badge>
              {filteredResults.length > 0 && (
                <PublicationStatusBadge
                  status={filteredResults[0]?.publicationStatus ?? 'preliminary'}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length > 0 ? (
              (() => {
                const singleDistanceKm =
                  event.distances[0]?.length != null
                    ? event.distances[0].unit === 'm'
                      ? event.distances[0].length! / 1000
                      : event.distances[0].length!
                    : undefined;
                return (
                  <>
                    {singleDistanceKm && (
                      <div className="flex justify-end pb-3">
                        <ToggleGroup
                          type="single"
                          value={displayModeSingle}
                          onValueChange={(v) => {
                            if (v) setDisplayModeSingle(v as DisplayMode);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <ToggleGroupItem value="time" className="gap-1.5 px-3">
                            <Timer className="h-3.5 w-3.5" />
                            Czas
                          </ToggleGroupItem>
                          <ToggleGroupItem value="speed" className="gap-1.5 px-3">
                            <Gauge className="h-3.5 w-3.5" />
                            km/h
                          </ToggleGroupItem>
                          <ToggleGroupItem value="pace" className="gap-1.5 px-3">
                            <Gauge className="h-3.5 w-3.5" />
                            min/km
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    )}
                    <FlatResultsTable
                      results={filteredResults}
                      showDistance={false}
                      distanceKm={singleDistanceKm}
                      displayMode={displayModeSingle}
                      currentUserId={currentUserId}
                    />
                  </>
                );
              })()
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {eventResults.length === 0
                  ? 'Wyniki będą dostępne wkrótce.'
                  : 'Brak wyników spełniających kryteria.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team/relay classification, single-distance case - the
          multi-distance case renders one of these per relay TabsContent
          above instead (each Dystans has its own classification). */}
      {!hasMultipleDistances && event.distances[0]?.startType === 'relay' && (
        <TeamClassificationCard eventId={event.id} distanceId={event.distances[0].id} />
      )}

      {eventDocuments.length > 0 && <ResultDocumentsList documents={eventDocuments} />}
      <ResultImportWizardDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        eventId={event.id}
        selectedDistanceId={event.distances[0]?.id ?? ''}
        distances={event.distances}
        onCommitted={() => {
          queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
          queryClient.invalidateQueries({ queryKey: ['event-registrations', event.id] });
        }}
      />
    </>
  );
};
