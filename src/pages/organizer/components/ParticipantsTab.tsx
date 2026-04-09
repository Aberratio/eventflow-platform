import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  FileText,
  Printer,
  CreditCard,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentDetailsPanel } from './PaymentDetailsPanel';
import { BankPaymentSummary } from './BankPaymentSummary';
import { useParticipantsActions } from '../hooks/useParticipantsActions';

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
    handleExportCSV,
    handleExportPDF,
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
      if (event.displayOptions?.hideUnpaid && reg.status === 'pending') return false;

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

  return (
    <div className="space-y-6">
      {viewMode === 'active' && (
        <BibNumberAssignment
          event={event}
          registrations={localRegistrations}
          onRegistrationsChange={setLocalRegistrations}
        />
      )}

      {requiresManualPayment && viewMode === 'active' && (
        <BankPaymentSummary event={event} registrations={localRegistrations} />
      )}

      {paymentPanelRegistration && (
        <PaymentDetailsPanel
          registration={paymentPanelRegistration}
          event={event}
          onPaymentUpdate={handlePaymentUpdate}
          onClose={() => setPaymentPanelRegistration(null)}
        />
      )}

      {/* Filters & Bulk Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <span className="text-sm font-medium">Widok:</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'active' ? 'default' : 'outline'}
                  size="sm"
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
              <div className="flex flex-wrap items-center gap-3 border-t pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      filteredRegistrations.length > 0 &&
                      selectedIds.size === filteredRegistrations.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
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
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setMessageDialogOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Wiadomość
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'active' ? 'Uczestnicy' : 'Usunięci uczestnicy'} (
            {filteredRegistrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {viewMode === 'active'
                ? 'Brak uczestników spełniających kryteria wyszukiwania.'
                : 'Brak usuniętych uczestników.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={reg.id}>
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
                      <TableCell>{reg.distanceName}</TableCell>
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
                          ? new Date(reg.removedAt).toLocaleDateString('pl-PL')
                          : new Date(reg.registeredAt).toLocaleDateString('pl-PL')}
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
