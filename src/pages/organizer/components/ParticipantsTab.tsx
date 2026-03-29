import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { SendMessageDialog } from '@/components/SendMessageDialog';
import { BibNumberAssignment } from '@/components/organizer/BibNumberAssignment';
import { Event, Registration, PaymentDetails } from '@/types';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { getAvailableNumbersString, isBibNumberTaken, getNextAvailableNumber } from '@/lib/bibNumberUtils';
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

interface ParticipantsTabProps {
  event: Event;
  registrations: Registration[];
}

type ViewMode = 'active' | 'removed';

export const ParticipantsTab = ({ event, registrations }: ParticipantsTabProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);
  const [bibDialogOpen, setBibDialogOpen] = useState(false);
  const [bibNumber, setBibNumber] = useState('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
  const [deleteUnpaidDialogOpen, setDeleteUnpaidDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  
  // Payment details panel
  const [paymentPanelRegistration, setPaymentPanelRegistration] = useState<Registration | null>(null);

  // Local state for registrations (to simulate changes)
  const [localRegistrations, setLocalRegistrations] = useState<Registration[]>(registrations);

  // Check if event requires manual payment confirmation
  const requiresManualPayment = event.paymentConfig?.type === 'organizer_bank';

  // Filter registrations based on view mode and filters
  const filteredRegistrations = useMemo(() => {
    let result = localRegistrations.filter(reg => {
      // View mode filter
      if (viewMode === 'active' && reg.status === 'removed') return false;
      if (viewMode === 'removed' && reg.status !== 'removed') return false;

      // Display options: hide unpaid
      if (event.displayOptions?.hideUnpaid && reg.status === 'pending') return false;

      // Search filter
      const matchesSearch = 
        reg.userName.toLowerCase().includes(search.toLowerCase()) ||
        reg.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        reg.bibNumber?.toLowerCase().includes(search.toLowerCase()) ||
        reg.teamName?.toLowerCase().includes(search.toLowerCase());
      
      // Distance filter
      const matchesDistance = distanceFilter === 'all' || reg.distanceId === distanceFilter;
      
      // Status filter (only for active view)
      const matchesStatus = viewMode === 'removed' || statusFilter === 'all' || reg.status === statusFilter;

      return matchesSearch && matchesDistance && matchesStatus;
    });

    // Apply display options: sorting
    const sortKey = event.displayOptions?.defaultSort || 'name';
    result.sort((a, b) => {
      switch (sortKey) {
        case 'bib':
          return (a.bibNumber || '').localeCompare(b.bibNumber || '', undefined, { numeric: true });
        case 'date':
          return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
        case 'distance':
          return a.distanceName.localeCompare(b.distanceName);
        case 'name':
        default:
          return a.userName.localeCompare(b.userName);
      }
    });

    return result;
  }, [localRegistrations, viewMode, search, distanceFilter, statusFilter, event.displayOptions]);

  // Count unpaid registrations
  const unpaidCount = useMemo(() => {
    return localRegistrations.filter(r => r.status === 'pending').length;
  }, [localRegistrations]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRegistrations.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Action handlers
  const handleStatusChange = (registration: Registration, newStatus: 'confirmed' | 'cancelled') => {
    setLocalRegistrations(prev => 
      prev.map(r => r.id === registration.id ? { ...r, status: newStatus } : r)
    );
    toast({
      title: 'Status zaktualizowany',
      description: `Zmieniono status ${registration.userName} na ${newStatus === 'confirmed' ? 'potwierdzony' : 'anulowany'}.`,
    });
  };

  const handleRemoveParticipant = (registration: Registration) => {
    setLocalRegistrations(prev =>
      prev.map(r => r.id === registration.id 
        ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() } 
        : r
      )
    );
    toast({
      title: 'Uczestnik usunięty',
      description: `${registration.userName} został usunięty z listy uczestników.`,
    });
  };

  const handleRestoreParticipant = (registration: Registration) => {
    setLocalRegistrations(prev =>
      prev.map(r => r.id === registration.id 
        ? { ...r, status: 'pending' as const, removedAt: undefined } 
        : r
      )
    );
    toast({
      title: 'Uczestnik przywrócony',
      description: `${registration.userName} został przywrócony na listę uczestników.`,
    });
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setLocalRegistrations(prev =>
      prev.map(r => selectedIds.has(r.id) 
        ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() } 
        : r
      )
    );
    setSelectedIds(new Set());
    setDeleteSelectedDialogOpen(false);
    toast({
      title: 'Uczestnicy usunięci',
      description: `Usunięto ${count} ${count === 1 ? 'uczestnika' : 'uczestników'} z listy.`,
    });
  };

  const handleDeleteUnpaid = () => {
    const unpaidIds = localRegistrations
      .filter(r => r.status === 'pending')
      .map(r => r.id);
    
    setLocalRegistrations(prev =>
      prev.map(r => unpaidIds.includes(r.id) 
        ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() } 
        : r
      )
    );
    setDeleteUnpaidDialogOpen(false);
    toast({
      title: 'Nieopłaceni usunięci',
      description: `Usunięto ${unpaidIds.length} nieopłaconych uczestników.`,
    });
  };

  const handleAssignBib = () => {
    if (!selectedParticipant || !bibNumber) return;
    setLocalRegistrations(prev =>
      prev.map(r => r.id === selectedParticipant.id ? { ...r, bibNumber } : r)
    );
    toast({
      title: 'Numer startowy przypisany',
      description: `Przypisano numer ${bibNumber} dla ${selectedParticipant.userName}.`,
    });
    setBibDialogOpen(false);
    setBibNumber('');
    setSelectedParticipant(null);
  };

  const handleExportCSV = () => {
    const data = filteredRegistrations.map(reg => ({
      'Numer startowy': reg.bibNumber || '-',
      'Imię i nazwisko': reg.userName,
      'Email': reg.userEmail,
      'Dystans': reg.distanceName,
      'Kategoria': reg.category,
      'Status': reg.status === 'confirmed' ? 'Potwierdzony' : reg.status === 'pending' ? 'Oczekujący' : reg.status === 'cancelled' ? 'Anulowany' : 'Usunięty',
      'Drużyna': reg.teamName || '-',
      'Data zapisu': new Date(reg.registeredAt).toLocaleDateString('pl-PL'),
    }));
    exportToCSV(data, `lista-startowa-${event.slug}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = () => {
    const columns = ['Numer', 'Imię i nazwisko', 'Dystans', 'Kategoria', 'Status'];
    const rows = filteredRegistrations.map(reg => [
      reg.bibNumber || '-',
      reg.userName,
      reg.distanceName,
      reg.category,
      reg.status === 'confirmed' ? 'Potwierdzony' : reg.status === 'pending' ? 'Oczekujący' : 'Anulowany',
    ]);
    generatePrintableHTML(`Lista startowa - ${event.name}`, columns, rows);
  };

  const handlePaymentUpdate = (registrationId: string, updatedDetails: PaymentDetails) => {
    setLocalRegistrations(prev =>
      prev.map(r => r.id === registrationId ? { ...r, paymentDetails: updatedDetails } : r)
    );
  };

  const getPaymentStatus = (reg: Registration) => {
    if (!reg.paymentDetails) return null;
    const { startFeePaid, insurancePaid, insuranceAmount, merchandisePayments } = reg.paymentDetails;
    
    const allMerchPaid = merchandisePayments.every(mp => mp.paid);
    const insuranceOk = !insuranceAmount || insurancePaid;
    
    if (startFeePaid && allMerchPaid && insuranceOk) {
      return 'full';
    } else if (startFeePaid || merchandisePayments.some(mp => mp.paid)) {
      return 'partial';
    }
    return 'none';
  };

  const getPaymentBadge = (reg: Registration) => {
    const status = getPaymentStatus(reg);
    if (!status) return null;
    
    switch (status) {
      case 'full':
        return (
          <Badge className="bg-primary/10 text-primary">
            <Check className="h-3 w-3 mr-1" />
            Opłacone
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="text-warning border-warning/50">
            <Clock className="h-3 w-3 mr-1" />
            Częściowo
          </Badge>
        );
      case 'none':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Nieopłacone
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Potwierdzony</Badge>;
      case 'pending':
        return <Badge variant="secondary">Oczekujący</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Anulowany</Badge>;
      case 'removed':
        return <Badge variant="outline" className="text-muted-foreground">Usunięty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeCount = localRegistrations.filter(r => r.status !== 'removed').length;
  const removedCount = localRegistrations.filter(r => r.status === 'removed').length;

  // Calculate available numbers string for dialog
  const availableNumbersString = useMemo(() => {
    return getAvailableNumbersString(localRegistrations);
  }, [localRegistrations]);

  // Check if current bib number is taken
  const isBibTaken = useMemo(() => {
    if (!bibNumber || !selectedParticipant) return false;
    return isBibNumberTaken(localRegistrations, bibNumber, selectedParticipant.id);
  }, [bibNumber, localRegistrations, selectedParticipant]);

  // Get suggested next available number
  const suggestedNumber = useMemo(() => {
    return getNextAvailableNumber(localRegistrations, 1);
  }, [localRegistrations]);

  return (
    <div className="space-y-6">
      {/* Bib number assignment panel */}
      {viewMode === 'active' && (
        <BibNumberAssignment
          event={event}
          registrations={localRegistrations}
          onRegistrationsChange={setLocalRegistrations}
        />
      )}

      {/* Bank payment summary for manual payment events */}
      {requiresManualPayment && viewMode === 'active' && (
        <BankPaymentSummary event={event} registrations={localRegistrations} />
      )}

      {/* Payment details panel */}
      {paymentPanelRegistration && (
        <PaymentDetailsPanel
          registration={paymentPanelRegistration}
          event={event}
          onPaymentUpdate={handlePaymentUpdate}
          onClose={() => setPaymentPanelRegistration(null)}
        />
      )}

      {/* View mode toggle and bulk actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-4 pb-4 border-b">
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
                  <Users className="h-4 w-4 mr-2" />
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
                  <UserMinus className="h-4 w-4 mr-2" />
                  Usunięci ({removedCount})
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj po imieniu, email, numerze lub drużynie..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Dystans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie dystanse</SelectItem>
                  {event.distances.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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

            {/* Bulk actions - only for active view */}
            {viewMode === 'active' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={filteredRegistrations.length > 0 && selectedIds.size === filteredRegistrations.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size > 0 ? `Zaznaczono: ${selectedIds.size}` : 'Zaznacz wszystkich'}
                  </span>
                </div>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteSelectedDialogOpen(true)}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń zaznaczonych
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteUnpaidDialogOpen(true)}
                  disabled={unpaidCount === 0}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Usuń nieopłaconych ({unpaidCount})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Eksport
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileText className="h-4 w-4 mr-2" />
                      Pobierz CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <Printer className="h-4 w-4 mr-2" />
                      Drukuj PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setMessageDialogOpen(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Wiadomość
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'active' ? 'Uczestnicy' : 'Usunięci uczestnicy'} ({filteredRegistrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                    <TableHead>{viewMode === 'removed' ? 'Data usunięcia' : 'Data zapisu'}</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map(reg => (
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
                        <span className="font-mono font-medium">
                          {reg.bibNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link 
                            to={`/athlete/${reg.userId}`}
                            className="font-medium hover:text-primary hover:underline transition-colors"
                          >
                            {event.displayOptions?.uppercaseNames ? reg.userName.toUpperCase() : reg.userName}
                          </Link>
                          <div className="text-sm text-muted-foreground">{reg.userEmail}</div>
                          {reg.teamName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {reg.teamName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{reg.distanceName}</TableCell>
                      <TableCell>{reg.category}</TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {viewMode === 'removed' && reg.removedAt
                          ? new Date(reg.removedAt).toLocaleDateString('pl-PL')
                          : new Date(reg.registeredAt).toLocaleDateString('pl-PL')}
                      </TableCell>
                      {requiresManualPayment && viewMode === 'active' && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2"
                            onClick={() => setPaymentPanelRegistration(reg)}
                          >
                            {getPaymentBadge(reg) || (
                              <Badge variant="outline" className="text-muted-foreground">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Sprawdź
                              </Badge>
                            )}
                          </Button>
                        </TableCell>
                      )}
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

      {/* Bib number dialog - enhanced with validation and suggestions */}
      <Dialog open={bibDialogOpen} onOpenChange={setBibDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz numer startowy</DialogTitle>
            <DialogDescription>
              Przypisz numer startowy dla <strong>{selectedParticipant?.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Participant info */}
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

            {/* Input */}
            <div className="space-y-2">
              <Label htmlFor="bib-input">Numer startowy</Label>
              <Input
                id="bib-input"
                type="text"
                placeholder={`np. ${suggestedNumber}`}
                value={bibNumber}
                onChange={e => setBibNumber(e.target.value)}
                className={isBibTaken ? 'border-destructive' : ''}
              />
              
              {/* Validation warning */}
              {isBibTaken && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Ten numer jest już zajęty!
                </div>
              )}

              {/* Available numbers hint */}
              <p className="text-xs text-muted-foreground">
                Wolne numery: {availableNumbersString}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBibDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAssignBib} disabled={!bibNumber || isBibTaken}>
              {selectedParticipant?.bibNumber ? 'Zmień' : 'Przypisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete selected dialog */}
      <AlertDialog open={deleteSelectedDialogOpen} onOpenChange={setDeleteSelectedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń zaznaczonych uczestników?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć {selectedIds.size} {selectedIds.size === 1 ? 'zaznaczonego uczestnika' : 'zaznaczonych uczestników'}? 
              Ta operacja może być cofnięta w zakładce "Usunięci".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Usuń uczestników
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete unpaid dialog */}
      <AlertDialog open={deleteUnpaidDialogOpen} onOpenChange={setDeleteUnpaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń nieopłaconych uczestników?</AlertDialogTitle>
            <AlertDialogDescription>
              Znaleziono {unpaidCount} {unpaidCount === 1 ? 'uczestnika' : 'uczestników'} ze statusem "Oczekujący" (nieopłacony).
              Czy na pewno chcesz ich wszystkich usunąć? Ta operacja może być cofnięta w zakładce "Usunięci".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnpaid}>
              Usuń nieopłaconych
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send message dialog */}
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
