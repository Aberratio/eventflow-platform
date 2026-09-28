import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueries } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Event, PublicStartListEntry, RelayTeam } from '@/types';
import { getTeamsForDistance } from '@/api';
import { formatTeamCompleteness, groupStartListByTeam } from '@/lib/teamGrouping';
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock3,
  Download,
  Search,
  SlidersHorizontal,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventStartListTabProps {
  event: Event;
  registrations: PublicStartListEntry[];
  overrideShowAll?: boolean;
  sidebarEnabled?: boolean;
}

type RegistrationStatusFilter = 'pending' | 'confirmed' | 'cancelled';
type GenderFilter = 'all' | 'K' | 'M';

const statusLabels: Record<PublicStartListEntry['status'], string> = {
  pending: 'Oczekujący',
  confirmed: 'Potwierdzony',
  cancelled: 'Zrezygnowany',
  removed: 'Usunięty',
  expired: 'Wygasły',
};

const statusClasses: Record<PublicStartListEntry['status'], string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  confirmed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
  removed: 'border-muted-foreground/30 bg-muted/20 text-muted-foreground',
  expired: 'border-muted-foreground/30 bg-muted/20 text-muted-foreground',
};

const panelClass =
  'rounded-lg border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl';

const ALL_ACTIVE_STATUSES: RegistrationStatusFilter[] = ['pending', 'confirmed'];

export const EventStartListTab = ({
  event,
  registrations,
  overrideShowAll,
  sidebarEnabled = false,
}: EventStartListTabProps) => {
  const showAll = overrideShowAll ?? event.displayOptions?.showParticipants === 'all';
  const uppercaseNames = event.displayOptions?.uppercaseNames ?? false;
  const [query, setQuery] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [clubQuery, setClubQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('20');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarSlot, setSidebarSlot] = useState<HTMLElement | null>(null);
  const [activeStatuses, setActiveStatuses] =
    useState<RegistrationStatusFilter[]>(ALL_ACTIVE_STATUSES);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    setSidebarSlot(document.getElementById('event-start-list-sidebar-slot'));
  }, []);

  const visibleRegistrations = useMemo(
    () => registrations.filter((r) => r.status !== 'removed'),
    [registrations],
  );

  const sorted = useMemo(() => {
    return [...visibleRegistrations].sort((a, b) => {
      const sortKey = event.displayOptions?.defaultSort || 'name';
      switch (sortKey) {
        case 'bib':
          return (a.bibNumber || '').localeCompare(b.bibNumber || '', undefined, {
            numeric: true,
          });
        case 'date':
          return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
        case 'distance':
          return a.distanceName.localeCompare(b.distanceName);
        default:
          return a.userName.localeCompare(b.userName);
      }
    });
  }, [event.displayOptions?.defaultSort, visibleRegistrations]);

  const distanceOptions = useMemo(
    () => Array.from(new Set(sorted.map((r) => r.distanceName))).filter(Boolean),
    [sorted],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(sorted.map((r) => r.category))).filter(Boolean),
    [sorted],
  );
  const packageOptions = useMemo(
    () => Array.from(new Set(sorted.map((r) => (r.hasMerchandise ? 'Z dodatkami' : 'Standard')))),
    [sorted],
  );

  const filtered = useMemo(() => {
    return sorted.filter((reg) => {
      const normalizedQuery = query.trim().toLowerCase();
      const normalizedClub = clubQuery.trim().toLowerCase();
      const packageName = reg.hasMerchandise ? 'Z dodatkami' : 'Standard';
      const teamName = reg.teamName || '';

      const matchesQuery =
        !normalizedQuery ||
        reg.userName.toLowerCase().includes(normalizedQuery) ||
        reg.bibNumber?.toLowerCase().includes(normalizedQuery) ||
        teamName.toLowerCase().includes(normalizedQuery);

      const matchesDistance = distanceFilter === 'all' || reg.distanceName === distanceFilter;
      const matchesCategory = categoryFilter === 'all' || reg.category === categoryFilter;
      const matchesPackage = packageFilter === 'all' || packageName === packageFilter;
      const matchesClub = !normalizedClub || teamName.toLowerCase().includes(normalizedClub);
      const matchesStatus = activeStatuses.includes(reg.status as RegistrationStatusFilter);

      const matchesGender =
        genderFilter === 'all' ||
        reg.category?.toUpperCase().startsWith(genderFilter) ||
        reg.userName?.toUpperCase().startsWith(genderFilter);

      return (
        matchesQuery &&
        matchesDistance &&
        matchesCategory &&
        matchesPackage &&
        matchesClub &&
        matchesStatus &&
        matchesGender
      );
    });
  }, [
    sorted,
    query,
    clubQuery,
    distanceFilter,
    categoryFilter,
    packageFilter,
    activeStatuses,
    genderFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    distanceFilter,
    categoryFilter,
    packageFilter,
    clubQuery,
    activeStatuses,
    genderFilter,
  ]);

  const pendingCount = visibleRegistrations.filter((r) => r.status === 'pending').length;
  const confirmedCount = visibleRegistrations.filter((r) => r.status === 'confirmed').length;
  const cancelledCount = registrations.filter((r) => r.status === 'cancelled').length;
  const removedCount = registrations.filter((r) => r.status === 'removed').length;
  const maxParticipants = event.distances.reduce((sum, distance) => sum + (distance.limit ?? 0), 0);

  const pageSize = Number(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const showPagination = totalPages > 1;
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setQuery('');
    setDistanceFilter('all');
    setCategoryFilter('all');
    setPackageFilter('all');
    setGenderFilter('all');
    setClubQuery('');
    setActiveStatuses(ALL_ACTIVE_STATUSES);
  };

  const toggleStatus = (status: RegistrationStatusFilter) => {
    setActiveStatuses((current) => {
      if (current.includes(status)) {
        const next = current.filter((s) => s !== status);
        return next.length > 0 ? next : current;
      }
      return [...current, status];
    });
  };

  const allStatusesSelected =
    activeStatuses.length === ALL_ACTIVE_STATUSES.length &&
    ALL_ACTIVE_STATUSES.every((s) => activeStatuses.includes(s));

  const handleAllStatuses = () => {
    setActiveStatuses(ALL_ACTIVE_STATUSES);
  };

  const genderLabels: { value: GenderFilter; label: string }[] = [
    { value: 'all', label: 'Wszyscy' },
    { value: 'K', label: 'Kobiety' },
    { value: 'M', label: 'Mężczyźni' },
  ];

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, -1, totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, -1, safePage - 1, safePage, safePage + 1, -2, totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  const hasActiveFilters =
    query !== '' ||
    distanceFilter !== 'all' ||
    categoryFilter !== 'all' ||
    packageFilter !== 'all' ||
    genderFilter !== 'all' ||
    clubQuery !== '' ||
    !allStatusesSelected;

  // E7.4 (issue 23 Answer §4): "lista startowa pogrupowana po Drużynie" is a
  // VIEW concern layered on top of the existing per-member Zapisy — every
  // member already has its own bibNumber/qrCode (RegistrationRepository::
  // create(), unconditional, no team special-case). Real Drużyny (E7.1/E7.2)
  // are fetched per relay Dystans actually present among these
  // registrations, never derived from the free-text `teamName` the older,
  // unrelated `collectTeam` classification feature also writes.
  const relayDistanceIds = useMemo(
    () => Array.from(new Set(registrations.filter((r) => r.teamId).map((r) => r.distanceId))),
    [registrations],
  );
  const teamQueries = useQueries({
    queries: relayDistanceIds.map((distanceId) => ({
      queryKey: ['teams', 'distance', event.id, distanceId],
      queryFn: () => getTeamsForDistance(event.id, distanceId),
      select: (r: Awaited<ReturnType<typeof getTeamsForDistance>>) => r.data ?? [],
    })),
  });
  const teamsById = useMemo(() => {
    const map: Record<string, RelayTeam> = {};
    for (const query of teamQueries) {
      for (const team of (query.data as RelayTeam[] | undefined) ?? []) {
        map[team.id] = team;
      }
    }
    return map;
  }, [teamQueries]);

  const startListBlocks = useMemo(
    () => groupStartListByTeam(pageItems, teamsById),
    [pageItems, teamsById],
  );

  /**
   * One member row, optionally associated with a team group's header cell
   * via the `headers` attribute (WCAG technique H43) — the group header
   * itself is a real `<th scope="colgroup">` elsewhere in the table, not
   * just a visually-styled row, so assistive tech announces the Drużyna a
   * member row belongs to.
   */
  const renderRegistrationRow = (reg: PublicStartListEntry, groupHeaderId?: string) => {
    const packageName = reg.hasMerchandise ? 'Z dodatkami' : 'Standard';
    return (
      <TableRow key={reg.id} className="border-white/10 hover:bg-white/[0.035]">
        <TableCell className="font-mono text-sm text-foreground" headers={groupHeaderId}>
          {reg.bibNumber || '-'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-semibold text-rose-100">
              {reg.userName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              {reg.userId ? (
                <Link
                  to={`/athlete/${reg.userId}`}
                  className="font-medium transition-colors hover:text-primary hover:underline"
                >
                  {uppercaseNames ? reg.userName.toUpperCase() : reg.userName}
                </Link>
              ) : (
                <span className="font-medium">
                  {uppercaseNames ? reg.userName.toUpperCase() : reg.userName}
                </span>
              )}
              <p className="text-xs text-foreground/55">{reg.teamName || 'Klub niepodany'}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm text-foreground">{reg.distanceName}</p>
        </TableCell>
        <TableCell>
          <p className="text-sm text-foreground">{reg.category}</p>
        </TableCell>
        {showAll && (
          <TableCell>
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-xs ${statusClasses[reg.status]}`}
            >
              {statusLabels[reg.status]}
            </Badge>
          </TableCell>
        )}
        <TableCell>
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {packageName}
          </span>
        </TableCell>
      </TableRow>
    );
  };

  /** Inline stats strip — shown above the table when sidebar is not available */
  const statsStrip = !sidebarEnabled && (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MiniStat
        icon={<Users className="h-4 w-4" />}
        label="Zapisanych"
        value={visibleRegistrations.length}
        tone="emerald"
      />
      <MiniStat
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Potwierdzonych"
        value={confirmedCount}
        tone="emerald"
      />
      <MiniStat
        icon={<Clock3 className="h-4 w-4" />}
        label="Oczekujących"
        value={pendingCount}
        tone="warning"
      />
      <MiniStat
        icon={<XCircle className="h-4 w-4" />}
        label="Zrezygnowanych"
        value={cancelledCount + removedCount}
        tone="destructive"
      />
    </div>
  );

  return (
    <>
      <section className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Lista startowa</h2>
            <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-xs">
              {filtered.length} {filtered.length === 1 ? 'uczestnik' : 'uczestników'}
            </Badge>
          </div>
          <Button
            variant="outline"
            className="w-fit border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
          >
            <Download className="mr-2 h-4 w-4" />
            Eksportuj
          </Button>
        </div>

        {statsStrip && <div className="mt-4">{statsStrip}</div>}

        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj uczestnika..."
              className="h-11 border-white/10 bg-black/10 pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 justify-between border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
          >
            <span className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" />
              <span className="hidden sm:inline">Sortuj</span>
            </span>
          </Button>
        </div>

        {/* Inline advanced filters — only shown when sidebar panel is not available */}
        {!sidebarEnabled && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setFiltersExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-foreground/65 hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtry zaawansowane
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  !
                </span>
              )}
              {filtersExpanded ? (
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              )}
            </button>

            {filtersExpanded && (
              <div className="mt-3 grid gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
                <FilterSelect
                  label="Dystans"
                  value={distanceFilter}
                  onValueChange={setDistanceFilter}
                  placeholder="Wszystkie dystanse"
                  options={distanceOptions}
                />
                <FilterSelect
                  label="Kategoria"
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholder="Wszystkie kategorie"
                  options={categoryOptions}
                />
                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">Płeć</p>
                  <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
                    {genderLabels.map((item, index) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGenderFilter(item.value)}
                        className={`h-9 text-xs transition-colors ${
                          genderFilter === item.value
                            ? 'bg-primary/15 text-primary'
                            : `${index > 0 ? 'border-l border-white/10' : ''} text-foreground/60 hover:bg-white/[0.05]`
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">Szukaj po klubie</p>
                  <Input
                    value={clubQuery}
                    onChange={(e) => setClubQuery(e.target.value)}
                    placeholder="Wpisz nazwę klubu..."
                    className="h-10 border-white/10 bg-black/10"
                  />
                </div>
                {showAll && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Status zapisu</p>
                    <div className="space-y-2">
                      <StatusCheckbox
                        label="Wszyscy"
                        checked={allStatusesSelected}
                        onClick={handleAllStatuses}
                      />
                      <StatusCheckbox
                        label="Oczekujący"
                        checked={activeStatuses.includes('pending')}
                        onClick={() => toggleStatus('pending')}
                      />
                      <StatusCheckbox
                        label="Potwierdzony"
                        checked={activeStatuses.includes('confirmed')}
                        onClick={() => toggleStatus('confirmed')}
                      />
                      <StatusCheckbox
                        label="Zrezygnowany"
                        checked={activeStatuses.includes('cancelled')}
                        onClick={() => toggleStatus('cancelled')}
                      />
                    </div>
                  </div>
                )}
                {hasActiveFilters && (
                  <div className="sm:col-span-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10"
                      onClick={resetFilters}
                    >
                      Wyczyść filtry
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.04]">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="min-w-24 text-xs font-medium text-foreground/60">
                    Nr startowy <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-48 text-xs font-medium text-foreground/60">
                    Uczestnik <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-36 text-xs font-medium text-foreground/60">
                    Dystans <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-40 text-xs font-medium text-foreground/60">
                    Kategoria <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  {showAll && (
                    <TableHead className="min-w-28 text-xs font-medium text-foreground/60">
                      Status <ArrowDownUp className="ml-1 inline h-3 w-3" />
                    </TableHead>
                  )}
                  <TableHead className="min-w-28 text-xs font-medium text-foreground/60">
                    Pakiet <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length > 0 ? (
                  startListBlocks.flatMap((block) => {
                    if (block.type === 'individual') {
                      return [renderRegistrationRow(block.registration)];
                    }

                    const headerId = `team-group-${block.teamId}`;
                    return [
                      <TableRow
                        key={headerId}
                        className="border-white/10 bg-white/[0.05] hover:bg-white/[0.05]"
                      >
                        <TableHead
                          id={headerId}
                          scope="colgroup"
                          colSpan={showAll ? 6 : 5}
                          className="h-auto py-2.5 text-xs font-semibold text-foreground"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            Drużyna: {block.team.name}
                            <Badge
                              variant="outline"
                              className="border-white/10 bg-white/[0.06] text-[11px] font-normal text-foreground/70"
                            >
                              {formatTeamCompleteness(block.team)}
                            </Badge>
                            {/*
                              E7.5 (issue 23 Answer §7): the captain's
                              manually declared Kategoria specjalna, shown as
                              a cheap extension of the existing team-group
                              header (E7.4) — never recomputed from the
                              members listed below it, so it may legitimately
                              look stale after a roster change.
                            */}
                            {block.team.specialCategory && (
                              <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-[11px] font-normal text-primary"
                              >
                                {block.team.specialCategory}
                              </Badge>
                            )}
                          </span>
                        </TableHead>
                      </TableRow>,
                      ...block.members.map((reg) => renderRegistrationRow(reg, headerId)),
                    ];
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={showAll ? 6 : 5}>
                      <div className="flex min-h-[200px] items-center justify-center py-10">
                        <div className="max-w-xs text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-foreground/40">
                            <Users className="h-8 w-8" />
                          </div>
                          {filtered.length === 0 && sorted.length > 0 ? (
                            <>
                              <h3 className="mt-5 text-lg font-semibold">Brak wyników</h3>
                              <p className="mt-2 text-sm text-foreground/65">
                                Żaden uczestnik nie pasuje do wybranych filtrów.
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4 border-white/10"
                                onClick={resetFilters}
                              >
                                Wyczyść filtry
                              </Button>
                            </>
                          ) : (
                            <>
                              <h3 className="mt-5 text-lg font-semibold">
                                Więcej uczestników wkrótce!
                              </h3>
                              <p className="mt-2 text-sm text-foreground/65">
                                Lista startowa będzie widoczna gdy zapisze się więcej osób.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {showPagination && (
          <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span>Wierszy na stronę:</span>
              <Select
                value={rowsPerPage}
                onValueChange={(v) => {
                  setRowsPerPage(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-20 border-white/10 bg-white/[0.035]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/60"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {visiblePageNumbers.map((page, index) =>
                page < 0 ? (
                  <span key={`ellipsis-${index}`} className="px-2">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === safePage ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/60"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span>
              {filtered.length > 0
                ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} z ${filtered.length}`
                : '0 z 0'}
            </span>
          </div>
        )}
      </section>

      {sidebarEnabled &&
        sidebarSlot &&
        createPortal(
          <>
            <section className={`${panelClass} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFiltersExpanded((v) => !v)}
                  className="flex items-center gap-2 text-base font-semibold"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtry
                  {hasActiveFilters && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      !
                    </span>
                  )}
                  {filtersExpanded ? (
                    <ChevronUp className="ml-auto h-4 w-4 text-foreground/50" />
                  ) : (
                    <ChevronDown className="ml-auto h-4 w-4 text-foreground/50" />
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={resetFilters}
                  >
                    Wyczyść
                  </button>
                )}
              </div>

              {filtersExpanded && (
                <div className="space-y-5">
                  <FilterSelect
                    label="Dystans"
                    value={distanceFilter}
                    onValueChange={setDistanceFilter}
                    placeholder="Wszystkie dystanse"
                    options={distanceOptions}
                  />
                  <FilterSelect
                    label="Kategoria"
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="Wszystkie kategorie"
                    options={categoryOptions}
                  />
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Płeć</p>
                    <div className="grid grid-cols-3 overflow-hidden rounded-md border border-white/10">
                      {genderLabels.map((item, index) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setGenderFilter(item.value)}
                          className={`h-9 text-xs transition-colors ${
                            genderFilter === item.value
                              ? 'bg-primary/15 text-primary'
                              : `${index > 0 ? 'border-l border-white/10' : ''} text-foreground/60 hover:bg-white/[0.05]`
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {showAll && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-foreground">Status zapisu</p>
                      <div className="space-y-2">
                        <StatusCheckbox
                          label="Wszyscy"
                          checked={allStatusesSelected}
                          onClick={handleAllStatuses}
                        />
                        <StatusCheckbox
                          label="Oczekujący"
                          checked={activeStatuses.includes('pending')}
                          onClick={() => toggleStatus('pending')}
                        />
                        <StatusCheckbox
                          label="Potwierdzony"
                          checked={activeStatuses.includes('confirmed')}
                          onClick={() => toggleStatus('confirmed')}
                        />
                        <StatusCheckbox
                          label="Zrezygnowany"
                          checked={activeStatuses.includes('cancelled')}
                          onClick={() => toggleStatus('cancelled')}
                        />
                      </div>
                    </div>
                  )}
                  <FilterSelect
                    label="Pakiet"
                    value={packageFilter}
                    onValueChange={setPackageFilter}
                    placeholder="Wszystkie pakiety"
                    options={packageOptions}
                  />
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Szukaj po klubie</p>
                    <Input
                      value={clubQuery}
                      onChange={(e) => setClubQuery(e.target.value)}
                      placeholder="Wpisz nazwę klubu..."
                      className="h-10 border-white/10 bg-black/10"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className={`${panelClass} p-5`}>
              <h3 className="text-base font-semibold">Statystyki</h3>
              <div className="mt-4 space-y-3">
                <StatRow
                  icon={<Users className="h-4 w-4" />}
                  label="Zapisanych"
                  value={visibleRegistrations.length}
                  tone="emerald"
                />
                <StatRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Potwierdzonych"
                  value={confirmedCount}
                  tone="emerald"
                />
                <StatRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Oczekujących"
                  value={pendingCount}
                  tone="warning"
                />
                <StatRow
                  icon={<Circle className="h-4 w-4" />}
                  label="Lista rezerwowa"
                  value={0}
                  tone="violet"
                />
                <StatRow
                  icon={<XCircle className="h-4 w-4" />}
                  label="Zrezygnowanych"
                  value={cancelledCount + removedCount}
                  tone="destructive"
                />
              </div>
              {maxParticipants > 0 && (
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <p className="max-w-32 text-sm text-foreground/65">Limit uczestników</p>
                  <p className="text-2xl font-bold">{maxParticipants}</p>
                </div>
              )}
            </section>
          </>,
          sidebarSlot,
        )}
    </>
  );
};

const FilterSelect = ({
  label,
  value,
  onValueChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) => (
  <div>
    <p className="mb-2 text-xs font-medium text-foreground">{label}</p>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 border-white/10 bg-black/10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const StatusCheckbox = ({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick?: () => void;
}) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70">
    <Checkbox checked={checked} onCheckedChange={onClick} />
    {label}
  </label>
);

const StatRow = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'emerald' | 'warning' | 'violet' | 'destructive';
}) => {
  const toneClass = {
    emerald: 'bg-emerald-500/10 text-emerald-300',
    warning: 'bg-warning/10 text-warning',
    violet: 'bg-violet-500/10 text-violet-300',
    destructive: 'bg-destructive/10 text-destructive',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-3 text-foreground/65">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
          {icon}
        </span>
        {label}
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
};

const MiniStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'emerald' | 'warning' | 'violet' | 'destructive';
}) => {
  const toneClass = {
    emerald: 'text-emerald-400',
    warning: 'text-warning',
    violet: 'text-violet-400',
    destructive: 'text-destructive',
  }[tone];

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
      <span className={`shrink-0 ${toneClass}`}>{icon}</span>
      <div>
        <p className="text-[11px] text-foreground/55">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
};
