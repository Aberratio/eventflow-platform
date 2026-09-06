import { useState, useMemo } from 'react';
import { Event, Registration, PaymentDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { approveRefund, completeRefund, markRegistrationPaid, exportStartList } from '@/api';

export const useParticipantsActions = (event: Event, initialRegistrations: Registration[]) => {
  const { toast } = useToast();
  const [localRegistrations, setLocalRegistrations] =
    useState<Registration[]>(initialRegistrations);

  const handleStatusChange = (registration: Registration, newStatus: 'confirmed' | 'cancelled') => {
    setLocalRegistrations((prev) =>
      prev.map((r) => (r.id === registration.id ? { ...r, status: newStatus } : r)),
    );
    toast({
      title: 'Status zaktualizowany',
      description: `Zmieniono status ${registration.userName} na ${newStatus === 'confirmed' ? 'potwierdzony' : 'anulowany'}.`,
    });
  };

  const handleRemoveParticipant = (registration: Registration) => {
    setLocalRegistrations((prev) =>
      prev.map((r) =>
        r.id === registration.id
          ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() }
          : r,
      ),
    );
    toast({
      title: 'Uczestnik usunięty',
      description: `${registration.userName} został usunięty z listy uczestników.`,
    });
  };

  const handleRestoreParticipant = (registration: Registration) => {
    setLocalRegistrations((prev) =>
      prev.map((r) =>
        r.id === registration.id ? { ...r, status: 'pending' as const, removedAt: undefined } : r,
      ),
    );
    toast({
      title: 'Uczestnik przywrócony',
      description: `${registration.userName} został przywrócony na listę uczestników.`,
    });
  };

  const handleBulkDelete = (selectedIds: Set<string>) => {
    const count = selectedIds.size;
    setLocalRegistrations((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id)
          ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() }
          : r,
      ),
    );
    toast({
      title: 'Uczestnicy usunięci',
      description: `Usunięto ${count} ${count === 1 ? 'uczestnika' : 'uczestników'} z listy.`,
    });
  };

  const handleDeleteUnpaid = () => {
    const unpaidIds = localRegistrations.filter((r) => r.status === 'pending').map((r) => r.id);
    setLocalRegistrations((prev) =>
      prev.map((r) =>
        unpaidIds.includes(r.id)
          ? { ...r, status: 'removed' as const, removedAt: new Date().toISOString() }
          : r,
      ),
    );
    toast({
      title: 'Nieopłaceni usunięci',
      description: `Usunięto ${unpaidIds.length} nieopłaconych uczestników.`,
    });
  };

  const handleAssignBib = (participantId: string, bibNumber: string, participantName: string) => {
    setLocalRegistrations((prev) =>
      prev.map((r) => (r.id === participantId ? { ...r, bibNumber } : r)),
    );
    toast({
      title: 'Numer startowy przypisany',
      description: `Przypisano numer ${bibNumber} dla ${participantName}.`,
    });
  };

  const handlePaymentUpdate = (registrationId: string, updatedDetails: PaymentDetails) => {
    setLocalRegistrations((prev) =>
      prev.map((r) => (r.id === registrationId ? { ...r, paymentDetails: updatedDetails } : r)),
    );
  };

  /**
   * E1.5: organizator zatwierdza żądanie zwrotu ("do zwrotu"). Amount is always
   * server-computed (the saldo ceiling) — the organizer never types a number here.
   */
  const handleApproveRefund = async (
    registration: Registration,
  ): Promise<Registration | undefined> => {
    try {
      const response = await approveRefund(registration.id);
      if (response.data) {
        setLocalRegistrations((prev) =>
          prev.map((r) => (r.id === registration.id ? response.data! : r)),
        );
      }
      toast({
        title: 'Zwrot zatwierdzony',
        description: `Zwrot dla ${registration.userName} oczekuje na wykonanie.`,
      });
      return response.data ?? undefined;
    } catch {
      toast({
        title: 'Nie udało się zatwierdzić zwrotu',
        description: 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
      return undefined;
    }
  };

  /**
   * Trasa B (przelew tradycyjny): organizator ręcznie odznacza „zwrócono" po
   * oddaniu pieniędzy ze swojego konta — jedyna droga zwrotu, jaką platforma może
   * wykonać technicznie za organizatora (trasa A/bramka: E1.6/E1.7).
   */
  const handleCompleteRefund = async (
    registration: Registration,
  ): Promise<Registration | undefined> => {
    try {
      const response = await completeRefund(registration.id);
      if (response.data) {
        setLocalRegistrations((prev) =>
          prev.map((r) => (r.id === registration.id ? response.data! : r)),
        );
      }
      toast({
        title: 'Zwrot oznaczony jako zrealizowany',
        description: `Zapis ${registration.userName} został zaktualizowany.`,
      });
      return response.data ?? undefined;
    } catch {
      toast({
        title: 'Nie udało się oznaczyć zwrotu',
        description: 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
      return undefined;
    }
  };

  /**
   * E1.8: trasa B (przelew tradycyjny) — organizator ręcznie potwierdza wpłatę
   * po zweryfikowaniu jej na koncie bankowym. Wykonuje realną tranzycję
   * pending -> confirmed po stronie serwera (RegistrationRepository::
   * markManualPaymentPaid(), ta sama ścieżka co webhook trasy A) — w
   * odróżnieniu od handlePaymentUpdate() powyżej, który jest tylko lokalnym
   * podglądem odznaczania pojedynczych pozycji Rozliczenia.
   */
  const handleMarkPaid = async (registration: Registration): Promise<Registration | undefined> => {
    try {
      const response = await markRegistrationPaid(registration.id);
      if (response.data) {
        setLocalRegistrations((prev) =>
          prev.map((r) => (r.id === registration.id ? response.data! : r)),
        );
      }
      toast({
        title: 'Wpłata potwierdzona',
        description: `Zapis ${registration.userName} oznaczono jako opłacony.`,
      });
      return response.data ?? undefined;
    } catch {
      toast({
        title: 'Nie udało się potwierdzić wpłaty',
        description: 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
      return undefined;
    }
  };

  const handleExportCSV = (filteredRegistrations: Registration[]) => {
    const data = filteredRegistrations.map((reg) => ({
      'Numer startowy': reg.bibNumber || '-',
      'Imię i nazwisko': reg.userName,
      Email: reg.userEmail,
      Dystans: reg.distanceName,
      Kategoria: reg.category,
      Status:
        reg.status === 'confirmed'
          ? 'Potwierdzony'
          : reg.status === 'pending'
            ? 'Oczekujący'
            : reg.status === 'cancelled'
              ? 'Anulowany'
              : 'Usunięty',
      Drużyna: reg.teamName || '-',
      'Data zapisu': new Date(reg.registeredAt).toLocaleDateString('pl-PL'),
    }));
    exportToCSV(data, `lista-startowa-${event.slug}`);
    toast({ title: 'Eksport CSV', description: 'Plik został pobrany.' });
  };

  const handleExportPDF = (filteredRegistrations: Registration[]) => {
    const columns = ['Numer', 'Imię i nazwisko', 'Dystans', 'Kategoria', 'Status'];
    const rows = filteredRegistrations.map((reg) => [
      reg.bibNumber || '-',
      reg.userName,
      reg.distanceName,
      reg.category,
      reg.status === 'confirmed'
        ? 'Potwierdzony'
        : reg.status === 'pending'
          ? 'Oczekujący'
          : 'Anulowany',
    ]);
    generatePrintableHTML(`Lista startowa - ${event.name}`, columns, rows);
  };

  // E2.6: server-driven start-list export (all form fields + numer startowy +
  // status płatności, Windows-1250 CSV or XLSX) for one Distance — distinct
  // from handleExportCSV above, which is a client-side-only, fixed-column
  // export of whatever rows are already loaded in the browser. This one
  // hits GET /events/{id}/distances/{id}/start-list-export and leaves an
  // activity-log entry server-side, per spec ("każdy eksport zostawia wpis
  // w rejestrze aktywności").
  const handleExportStartList = async (distanceId: string, format: 'csv' | 'xlsx') => {
    try {
      await exportStartList(event.id, distanceId, format);
      toast({
        title: `Eksport ${format.toUpperCase()}`,
        description: 'Lista startowa została pobrana.',
      });
    } catch {
      toast({
        title: 'Nie udało się pobrać listy startowej',
        description: 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    }
  };

  const unpaidCount = useMemo(() => {
    return localRegistrations.filter((r) => r.status === 'pending').length;
  }, [localRegistrations]);

  const activeCount = localRegistrations.filter((r) => r.status !== 'removed').length;
  const removedCount = localRegistrations.filter((r) => r.status === 'removed').length;

  return {
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
  };
};
