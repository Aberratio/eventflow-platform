import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { Event, Registration } from '@/types';
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventStartListTabProps {
  event: Event;
  registrations: Registration[];
  overrideShowAll?: boolean;
  sidebarEnabled?: boolean;
}

type RegistrationStatusFilter = 'pending' | 'confirmed' | 'cancelled';
type GenderFilter = 'all' | 'K' | 'M';

const statusLabels: Record<Registration['status'], string> = {
  pending: 'Oczekujący',
  confirmed: 'Potwierdzony',
  cancelled: 'Zrezygnowany',
  removed: 'Usunięty',
};

const statusClasses: Record<Registration['status'], string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  confirmed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
  removed: 'border-muted-foreground/30 bg-muted/20 text-muted-foreground',
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
  const [activeStatuses, setActiveStatuses] = useState<RegistrationStatusFilter[]>(
    ALL_ACTIVE_STATUSES,
  );

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
    () =>
      Array.from(
        new Set(sorted.map((r) => (r.merchandiseOrders?.length ? 'Z dodatkami' : 'Standard'))),
      ),
    [sorted],
  );

  const filtered = useMemo(() => {
    return sorted.filter((reg) => {
      const normalizedQuery = query.trim().toLowerCase();
      const normalizedClub = clubQuery.trim().toLowerCase();
      const packageName = reg.merchandiseOrders?.length ? 'Z dodatkami' : 'Standard';
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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, distanceFilter, categoryFilter, packageFilter, clubQuery, activeStatuses, genderFilter]);

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
        // Prevent deselecting all — keep at least one active
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

  return (
    <>
      <section className={`${panelClass} min-h-[820px] p-5`}>
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

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj uczestnika..."
              className="h-11 border-white/10 bg-black/10 pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 justify-between border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
          >
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtry
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            className="h-11 justify-between border-white/10 bg-white/[0.035] text-muted-foreground hover:bg-white/[0.07]"
          >
            <span>
              Sortuj: <span className="text-foreground">Numer startowy</span>
            </span>
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.04]">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="min-w-24 text-xs font-medium text-muted-foreground">
                    Nr startowy <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-48 text-xs font-medium text-muted-foreground">
                    Uczestnik <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-36 text-xs font-medium text-muted-foreground">
                    Dystans <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  <TableHead className="min-w-40 text-xs font-medium text-muted-foreground">
                    Kategoria <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                  {showAll && (
                    <TableHead className="min-w-28 text-xs font-medium text-muted-foreground">
                      Status <ArrowDownUp className="ml-1 inline h-3 w-3" />
                    </TableHead>
                  )}
                  <TableHead className="min-w-28 text-xs font-medium text-muted-foreground">
                    Pakiet <ArrowDownUp className="ml-1 inline h-3 w-3" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length > 0 ? (
                  pageItems.map((reg) => {
                    const packageName = reg.merchandiseOrders?.length ? 'Z dodatkami' : 'Standard';
                    return (
                      <TableRow key={reg.id} className="border-white/10 hover:bg-white/[0.035]">
                        <TableCell className="font-mono text-sm text-foreground">
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
                              <Link
                                to={`/athlete/${reg.userId}`}
                                className="font-medium transition-colors hover:text-primary hover:underline"
                              >
                                {uppercaseNames ? reg.userName.toUpperCase() : reg.userName}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {reg.teamName || 'Klub niepodany'}
                              </p>
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
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={showAll ? 6 : 5}>
                      <div className="flex min-h-[420px] items-center justify-center">
                        <div className="max-w-xs text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-muted-foreground">
                            <Users className="h-8 w-8" />
                          </div>
                          {filtered.length === 0 && sorted.length > 0 ? (
                            <>
                              <h3 className="mt-5 text-lg font-semibold">Brak wyników</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
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
                              <h3 className="mt-5 text-lg font-semibold">Więcej uczestników wkrótce!</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
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
                className="h-9 w-9 text-muted-foreground"
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
                className="h-9 w-9 text-muted-foreground"
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
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filtry</h3>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={resetFilters}
                >
                  Wyczyść wszystko
                </button>
              </div>
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
                            : `${index > 0 ? 'border-l border-white/10' : ''} text-muted-foreground hover:bg-white/[0.05]`
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
                    onChange={(event) => setClubQuery(event.target.value)}
                    placeholder="Wpisz nazwę klubu..."
                    className="h-10 border-white/10 bg-black/10"
                  />
                </div>
                <Button className="h-11 w-full rounded-lg" onClick={resetFilters} variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Wyczyść filtry
                </Button>
              </div>
            </section>

            <section className={`${panelClass} p-5`}>
              <h3 className="text-lg font-semibold">Statystyki listy startowej</h3>
              <div className="mt-5 space-y-3">
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
                  label="Na liście rezerwowej"
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
              <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                <p className="max-w-32 text-sm text-muted-foreground">
                  Maksymalna liczba uczestników
                </p>
                <p className="text-2xl font-bold">{maxParticipants || '—'}</p>
              </div>
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
  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
          {icon}
        </span>
        {label}
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
};
