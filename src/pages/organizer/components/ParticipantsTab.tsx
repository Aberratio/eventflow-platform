import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SendMessageDialog } from '@/components/SendMessageDialog';
import SwapTeamMemberDialog from '@/components/team/SwapTeamMemberDialog';
import { ChangeDistanceDialog } from '@/components/registration/ChangeDistanceDialog';
import { canChangeDistance } from '@/lib/distanceChange';
import { BibNumberAssignment } from '@/components/organizer/BibNumberAssignment';
import { Event, Registration } from '@/types';
import {
  getAvailableNumbersString,
  isBibNumberTaken,
  getNextAvailableNumber,
} from '@/lib/bibNumberUtils';
import {
  Search,
  Download,
  Mail,
  UserCheck,
  UserX,
  Hash,
  Trash2,
  RotateCcw,
  Users,
  UserMinus,
  ArrowLeftRight,
  Shuffle,
  FileText,
  Printer,
  CreditCard,
  Check,
  Clock,
  AlertCircle,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentDetailsPanel } from './PaymentDetailsPanel';
import { FormFieldAggregatesCard } from './FormFieldAggregatesCard';
import { RegistrationStatsCard } from './RegistrationStatsCard';
import { useParticipantsActions } from '../hooks/useParticipantsActions';
import { formatDate } from '@/lib/format';

interface ParticipantsTabProps {
  event: Event;
  registrations: Registration[];
}

type ViewMode = 'active' | 'removed';

function getPaymentStatus(reg: Registration): 'full' | 'partial' | 'none' | null {
  if (!reg.paymentDetails) return null;
  const { startFeePaid, insurancePaid, insuranceAmount, merchandisePayments } = reg.paymentDetails;
  const allMerchPaid = merchandisePayments.every((mp) => mp.paid);
  const insuranceOk = !insuranceAmount || insurancePaid;
  if (startFeePaid && allMerchPaid && insuranceOk) return 'full';
  if (startFeePaid || merchandisePayments.some((mp) => mp.paid)) return 'partial';
  return 'none';
}

function PaymentBadge({ reg }: { reg: Registration }) {
  const status = getPaymentStatus(reg);
  if (!status) return null;
  if (status === 'full')
    return (
      <Badge className="bg-primary/10 text-primary">
        <Check className="mr-1 h-3 w-3" />
        Opłacone
      </Badge>
    );
  if (status === 'partial')
    return (
      <Badge variant="outline" className="border-warning/50 text-warning">
        <Clock className="mr-1 h-3 w-3" />
        Częściowo
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Nieopłacone
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Potwierdzony</Badge>;
    case 'pending':
      return <Badge variant="secondary">Oczekujący</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Anulowany</Badge>;
    case 'removed':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Usunięty
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export const ParticipantsTab = ({ event, registrations }: ParticipantsTabProps) => {
  const {
    localRegistrations,
    setLocalRegistrations,
    handleStatusChange,
    handleRemoveParticipant,
    handleRestoreParticipant,
    handleBulkDelete,
    handleDeleteUnpaid,
    handleAssignBib,
    handlePaymentUpdate,
    handleApproveRefund,
    handleCompleteRefund,
    handleMarkPaid,
    handleExportCSV,
    handleExportPDF,
    handleExportStartList,
    unpaidCount,
    activeCount,
    removedCount,
  } = useParticipantsActions(event, registrations);

  const [search, setSearch] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);
  const [bibDialogOpen, setBibDialogOpen] = useState(false);
  const [swapRegistration, setSwapRegistration] = useState<Registration | null>(null);
  const [changeDistanceRegistration, setChangeDistanceRegistration] = useState<Registration | null>(
    null,
  );
  const [bibNumber, setBibNumber] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
  const [deleteUnpaidDialogOpen, setDeleteUnpaidDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [paymentPanelRegistration, setPaymentPanelRegistration] = useState<Registration | null>(
    null,
  );

  const requiresManualPayment = event.paymentConfig?.type === 'organizer_bank';

  const filteredRegistrations = useMemo(() => {
    const result = localRegistrations.filter((reg) => {
      if (viewMode === 'active' && reg.status === 'removed') return false;
      if (viewMode === 'removed' && reg.status !== 'removed') return false;

      const matchesSearch =
        reg.userName.toLowerCase().includes(search.toLowerCase()) ||
        reg.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        reg.bibNumber?.toLowerCase().includes(search.toLowerCase()) ||
        reg.teamName?.toLowerCase().includes(search.toLowerCase());
      const matchesDistance = distanceFilter === 'all' || reg.distanceId === distanceFilter;
      const matchesStatus =
        viewMode === 'removed' || statusFilter === 'all' || reg.status === statusFilter;

      return matchesSearch && matchesDistance && matchesStatus;
    });

    const sortKey = event.displayOptions?.defaultSort || 'name';
    result.sort((a, b) => {
      switch (sortKey) {
        case 'bib':
          return (a.bibNumber || '').localeCompare(b.bibNumber || '', undefined, { numeric: true });
        case 'date':
          return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
        case 'distance':
          return a.distanceName.localeCompare(b.distanceName);
        default:
          return a.userName.localeCompare(b.userName);
      }
    });

    return result;
  }, [localRegistrations, viewMode, search, distanceFilter, statusFilter, event.displayOptions]);

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filteredRegistrations.length
        ? new Set()
        : new Set(filteredRegistrations.map((r) => r.id)),
    );
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const onBulkDelete = () => {
    handleBulkDelete(selectedIds);
    setSelectedIds(new Set());
    setDeleteSelectedDialogOpen(false);
  };

  const onDeleteUnpaid = () => {
    handleDeleteUnpaid();
    setDeleteUnpaidDialogOpen(false);
  };

  const onAssignBib = () => {
    if (!selectedParticipant || !bibNumber) return;
    handleAssignBib(selectedParticipant.id, bibNumber, selectedParticipant.userName);
    setBibDialogOpen(false);
    setBibNumber('');
    setSelectedParticipant(null);
  };

  const availableNumbersString = useMemo(
    () => getAvailableNumbersString(localRegistrations),
    [localRegistrations],
  );
  const isBibTaken = useMemo(() => {
    if (!bibNumber || !selectedParticipant) return false;
    return isBibNumberTaken(localRegistrations, bibNumber, selectedParticipant.id);
  }, [bibNumber, localRegistrations, selectedParticipant]);
  const suggestedNumber = useMemo(
    () => getNextAvailableNumber(localRegistrations, 1),
    [localRegistrations],
  );

  const participantStats = useMemo(() => {
    return localRegistrations.reduce(
      (acc, reg) => {
        if (reg.status === 'removed') return acc;

        if (!reg.bibNumber) acc.withoutNumber += 1;

        const details = reg.paymentDetails;
        const startFee = details?.startFeeAmount || reg.pricePaid || 0;
        const insurance = details?.insuranceAmount || 0;
        const merchandise =
          details?.merchandisePayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const paidMerchandise =
          details?.merchandisePayments?.reduce(
            (sum, payment) => sum + (payment.paid ? payment.amount : 0),
            0,
          ) || 0;

        acc.expected += startFee + insurance + merchandise;
        if (details?.startFeePaid) acc.collected += startFee;
        if (details?.insurancePaid) acc.collected += insurance;
        acc.collected += paidMerchandise;

        if (getPaymentStatus(reg) === 'full') acc.paid += 1;
        if (reg.checkedInAt) acc.checkedIn += 1;

        return acc;
      },
      { paid: 0, withoutNumber: 0, collected: 0, expected: 0, checkedIn: 0 },
    );
  }, [localRegistrations]);

  const pendingPaymentCount = Math.max(activeCount - participantStats.paid, 0);
  const remainingAmount = Math.max(participantStats.expected - participantStats.collected, 0);

  return (
    <div className="space-y-6">
      {paymentPanelRegistration && (
        <PaymentDetailsPanel
          registration={paymentPanelRegistration}
          event={event}
          onPaymentUpdate={handlePaymentUpdate}
          onClose={() => setPaymentPanelRegistration(null)}
          onApproveRefund={async () => {
            const updated = await handleApproveRefund(paymentPanelRegistration);
            if (updated) setPaymentPanelRegistration(updated);
          }}
          onCompleteRefund={async () => {
            const updated = await handleCompleteRefund(paymentPanelRegistration);
            if (updated) setPaymentPanelRegistration(updated);
          }}
          onMarkPaid={async () => {
            const updated = await handleMarkPaid(paymentPanelRegistration);
            if (updated) setPaymentPanelRegistration(updated);
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Opłaconych</div>
              <div className="text-3xl font-bold leading-tight">{participantStats.paid}</div>
            </div>
          </div>
        </Card>
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Oczekujących</div>
              <div className="text-3xl font-bold leading-tight">{pendingPaymentCount}</div>
            </div>
          </div>
        </Card>
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Zebrano</div>
              <div className="text-3xl font-bold leading-tight">
                {participantStats.collected.toLocaleString('pl-PL')} zł
              </div>
            </div>
          </div>
        </Card>
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pozostało</div>
              <div className="text-3xl font-bold leading-tight">
                {remainingAmount.toLocaleString('pl-PL')} zł
              </div>
            </div>
          </div>
        </Card>
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-muted-foreground">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold leading-tight">
                {participantStats.withoutNumber}
              </div>
              <div className="text-sm text-muted-foreground">bez numeru</div>
            </div>
          </div>
        </Card>
        {/* E3.6 (issue 12 §4): "ilu uczestników odebrało pakiet" — the minimal
            organizer-facing input this ticket scopes in, ahead of the full
            reporting ticket (21/E2.5/E8.2). Counts registrations Biuro
            Zawodów has reported checked in via return-sync, among the same
            already-fetched registrations every other card above reads. */}
        <Card className="px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Odprawionych</div>
              <div className="text-3xl font-bold leading-tight">{participantStats.checkedIn}</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-5">
        <TabsList className="h-auto rounded-lg border border-border/80 bg-muted/20 p-0">
          <TabsTrigger value="list" className="h-[46px] px-6">
            <Users className="mr-2 h-4 w-4" />
            Lista uczestników
          </TabsTrigger>
          <TabsTrigger value="numbers" className="h-[46px] px-6">
            <Hash className="mr-2 h-4 w-4" />
            Nadawanie numerów
          </TabsTrigger>
          <TabsTrigger value="aggregates" className="h-[46px] px-6">
            <BarChart3 className="mr-2 h-4 w-4" />
            Zestawienia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 px-6 py-5">
              <CardTitle>Lista uczestników</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {viewMode === 'active' ? 'Uczestnicy' : 'Usunięci uczestnicy'} (
                  {filteredRegistrations.length})
                </h2>
              </div>

              <div className="flex flex-wrap gap-0 border-b border-border/70 pb-4">
                <div className="inline-flex overflow-hidden rounded-lg border border-border/80 bg-background/30">
                  <Button
                    variant={viewMode === 'active' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-none border-0 px-5"
                    onClick={() => {
                      setViewMode('active');
                      setSelectedIds(new Set());
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Aktywni ({activeCount})
                  </Button>
                  <Button
                    variant={viewMode === 'removed' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-none border-0 px-5"
                    onClick={() => {
                      setViewMode('removed');
                      setSelectedIds(new Set());
                    }}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Usunięci ({removedCount})
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj po imieniu, email, numerze lub drużynie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Dystans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie dystanse</SelectItem>
                    {event.distances.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {viewMode === 'active' && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie statusy</SelectItem>
                      <SelectItem value="confirmed">Potwierdzony</SelectItem>
                      <SelectItem value="pending">Oczekujący</SelectItem>
                      <SelectItem value="cancelled">Anulowany</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {viewMode === 'active' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-10 items-center gap-2 rounded-md border border-[color:var(--glass-border)] bg-[var(--glass-bg)] px-3 text-sm font-semibold">
                    <Checkbox
                      checked={
                        filteredRegistrations.length > 0 &&
                        selectedIds.size === filteredRegistrations.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                    <span>
                      {selectedIds.size > 0
                        ? `Zaznaczono: ${selectedIds.size}`
                        : 'Zaznacz wszystkich'}
                    </span>
                  </div>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteSelectedDialogOpen(true)}
                    disabled={selectedIds.size === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń zaznaczonych
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteUnpaidDialogOpen(true)}
                    disabled={unpaidCount === 0}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Usuń nieopłaconych ({unpaidCount})
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Eksport
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportCSV(filteredRegistrations)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Pobierz CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPDF(filteredRegistrations)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Drukuj PDF
                      </DropdownMenuItem>
                      {/* E2.6: server-side export (all form fields + numer startowy +
                          status płatności) — one Distance at a time, so it requires
                          a concrete selection from the Dystans filter above, not "all". */}
                      <DropdownMenuItem
                        disabled={distanceFilter === 'all'}
                        title={
                          distanceFilter === 'all'
                            ? 'Wybierz konkretny dystans, aby wyeksportować listę startową.'
                            : undefined
                        }
                        onClick={() => handleExportStartList(distanceFilter, 'csv')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Lista startowa (CSV, Windows-1250)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={distanceFilter === 'all'}
                        title={
                          distanceFilter === 'all'
                            ? 'Wybierz konkretny dystans, aby wyeksportować listę startową.'
                            : undefined
                        }
                        onClick={() => handleExportStartList(distanceFilter, 'xlsx')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Lista startowa (XLSX)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={distanceFilter === 'all'}
                        title={
                          distanceFilter === 'all'
                            ? 'Wybierz konkretny dystans, aby wyeksportować listę startową.'
                            : undefined
                        }
                        onClick={() => handleExportStartList(distanceFilter, 'xml')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Lista startowa (XML)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => setMessageDialogOpen(true)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Wiadomość
                  </Button>
                </div>
              )}

              {filteredRegistrations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 py-10 text-center text-muted-foreground">
                  {viewMode === 'active'
                    ? 'Brak uczestników spełniających kryteria wyszukiwania.'
                    : 'Brak usuniętych uczestników.'}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <Table>
                    <TableHeader className="border-t-0 bg-muted/30 [&_tr]:border-border/70">
                      <TableRow className="hover:bg-transparent">
                        {viewMode === 'active' && <TableHead className="w-[50px]" />}
                        <TableHead>Numer</TableHead>
                        <TableHead>Uczestnik</TableHead>
                        <TableHead>Dystans</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Status</TableHead>
                        {requiresManualPayment && viewMode === 'active' && (
                          <TableHead>Płatność</TableHead>
                        )}
                        <TableHead>
                          {viewMode === 'removed' ? 'Data usunięcia' : 'Data zapisu'}
                        </TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map((reg) => (
                        <TableRow key={reg.id} className="even:bg-transparent hover:bg-muted/20">
                          {viewMode === 'active' && (
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(reg.id)}
                                onCheckedChange={() => toggleSelect(reg.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <span className="font-mono font-medium">{reg.bibNumber || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Link
                                to={`/athlete/${reg.userId}`}
                                className="font-medium transition-colors hover:text-primary hover:underline"
                              >
                                {event.displayOptions?.uppercaseNames
                                  ? reg.userName.toUpperCase()
                                  : reg.userName}
                              </Link>
                              <div className="text-sm text-muted-foreground">{reg.userEmail}</div>
                              {reg.teamName && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {reg.teamName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{reg.distanceName}</TableCell>
                          <TableCell>{reg.category}</TableCell>
                          <TableCell>
                            <StatusBadge status={reg.status} />
                          </TableCell>
                          {requiresManualPayment && viewMode === 'active' && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto px-2 py-1"
                                onClick={() => setPaymentPanelRegistration(reg)}
                              >
                                <PaymentBadge reg={reg} />
                                {!getPaymentStatus(reg) && (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <CreditCard className="mr-1 h-3 w-3" />
                                    Sprawdź
                                  </Badge>
                                )}
                              </Button>
                            </TableCell>
                          )}
                          <TableCell className="text-muted-foreground">
                            {viewMode === 'removed' && reg.removedAt
                              ? formatDate(reg.removedAt)
                              : formatDate(reg.registeredAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {viewMode === 'removed' ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Przywróć"
                                  onClick={() => handleRestoreParticipant(reg)}
                                >
                                  <RotateCcw className="h-4 w-4 text-primary" />
                                </Button>
                              ) : (
                                <>
                                  {requiresManualPayment && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Szczegóły płatności"
                                      onClick={() => setPaymentPanelRegistration(reg)}
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Przypisz numer startowy"
                                    onClick={() => {
                                      setSelectedParticipant(reg);
                                      setBibNumber(reg.bibNumber || '');
                                      setBibDialogOpen(true);
                                    }}
                                  >
                                    <Hash className="h-4 w-4" />
                                  </Button>
                                  {reg.teamId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Wymień zawodnika"
                                      aria-label={`Wymień zawodnika ${reg.userName}`}
                                      onClick={() => setSwapRegistration(reg)}
                                    >
                                      <ArrowLeftRight className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canChangeDistance(reg) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Zmień dystans"
                                      aria-label={`Zmień dystans ${reg.userName}`}
                                      onClick={() => setChangeDistanceRegistration(reg)}
                                    >
                                      <Shuffle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {reg.status !== 'confirmed' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Potwierdź"
                                      onClick={() => handleStatusChange(reg, 'confirmed')}
                                    >
                                      <UserCheck className="h-4 w-4 text-primary" />
                                    </Button>
                                  )}
                                  {reg.status !== 'cancelled' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Anuluj"
                                      onClick={() => handleStatusChange(reg, 'cancelled')}
                                    >
                                      <UserX className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Usuń"
                                    onClick={() => handleRemoveParticipant(reg)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {changeDistanceRegistration && (
          <ChangeDistanceDialog
            open
            isManager
            onOpenChange={(next) => {
              if (!next) setChangeDistanceRegistration(null);
            }}
            registration={changeDistanceRegistration}
            event={event}
            onChanged={(updated) =>
              setLocalRegistrations((prev) =>
                prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
              )
            }
          />
        )}

        {swapRegistration?.teamId && (
          <SwapTeamMemberDialog
            open
            onOpenChange={(next) => {
              if (!next) setSwapRegistration(null);
            }}
            teamId={swapRegistration.teamId}
            registrationId={swapRegistration.id}
            memberName={swapRegistration.userName}
            onSwapped={(updated) =>
              setLocalRegistrations((prev) =>
                prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
              )
            }
          />
        )}

        <TabsContent value="numbers" className="mt-0">
          <BibNumberAssignment
            event={event}
            registrations={localRegistrations}
            onRegistrationsChange={setLocalRegistrations}
          />
        </TabsContent>

        <TabsContent value="aggregates" className="mt-0 space-y-6">
          <RegistrationStatsCard eventId={event.id} />
          <FormFieldAggregatesCard eventId={event.id} />
        </TabsContent>
      </Tabs>

      {/* Bib Number Dialog */}
      <Dialog open={bibDialogOpen} onOpenChange={setBibDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz numer startowy</DialogTitle>
            <DialogDescription>
              Przypisz numer startowy dla <strong>{selectedParticipant?.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Dystans:</span>
              <span className="font-medium">{selectedParticipant?.distanceName}</span>
              <span className="text-muted-foreground">Kategoria:</span>
              <span className="font-medium">{selectedParticipant?.category}</span>
              {selectedParticipant?.bibNumber && (
                <>
                  <span className="text-muted-foreground">Obecny numer:</span>
                  <span className="font-mono font-medium">{selectedParticipant.bibNumber}</span>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bib-input">Numer startowy</Label>
              <Input
                id="bib-input"
                type="text"
                placeholder={`np. ${suggestedNumber}`}
                value={bibNumber}
                onChange={(e) => setBibNumber(e.target.value)}
                className={isBibTaken ? 'border-destructive' : ''}
              />
              {isBibTaken && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Ten numer jest już zajęty!
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Wolne numery: {availableNumbersString}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBibDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={onAssignBib} disabled={!bibNumber || isBibTaken}>
              {selectedParticipant?.bibNumber ? 'Zmień' : 'Przypisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteSelectedDialogOpen} onOpenChange={setDeleteSelectedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń zaznaczonych uczestników?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'zaznaczonego uczestnika' : 'zaznaczonych uczestników'}? Ta
              operacja może być cofnięta w zakładce "Usunięci".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={onBulkDelete}>Usuń uczestników</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUnpaidDialogOpen} onOpenChange={setDeleteUnpaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń nieopłaconych uczestników?</AlertDialogTitle>
            <AlertDialogDescription>
              Znaleziono {unpaidCount} {unpaidCount === 1 ? 'uczestnika' : 'uczestników'} ze
              statusem "Oczekujący" (nieopłacony). Ta operacja może być cofnięta w zakładce
              "Usunięci".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteUnpaid}>Usuń nieopłaconych</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SendMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        registrations={localRegistrations}
        selectedIds={selectedIds}
        distances={event.distances}
      />
    </div>
  );
};
