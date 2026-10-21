import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Event, Registration, PaymentDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, generatePrintableHTML } from '@/lib/exportUtils';
import { formatDate } from '@/lib/format';
import { QUERY_KEYS } from '@/constants';
import {
  approveRefund,
  completeRefund,
  markRegistrationPaid,
  cancelRegistration,
  updatePaymentDetails,
  updateRegistration,
  exportStartList,
} from '@/api';

const FALLBACK_ERROR = 'Spróbuj ponownie za chwilę.';

export const useParticipantsActions = (event: Event, initialRegistrations: Registration[]) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localRegistrations, setLocalRegistrations] =
    useState<Registration[]>(initialRegistrations);

  // The list is owned by the server: follow the query data whenever it is refetched.
  // (An empty -> empty change is ignored so an unstable `[]` default cannot loop.)
  useEffect(() => {
    setLocalRegistrations((prev) =>
      prev.length === 0 && initialRegistrations.length === 0 ? prev : initialRegistrations,
    );
  }, [initialRegistrations]);

  const refreshRegistrations = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-registrations', event.id] }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.registrationsByEvent(event.id) }),
    ]);

  const failureToast = (title: string, error: unknown) =>
    toast({
      title,
      description: error instanceof Error && error.message ? error.message : FALLBACK_ERROR,
      variant: 'destructive',
    });

  /**
   * "Potwierdź" = server transition pending -> confirmed, which exists only as
   * POST /registrations/{id}/mark-paid (manual bank-transfer route); "Anuluj" =
   * POST /registrations/{id}/cancel. Neither is patched locally: on success the
   * list is refetched, on failure the server message is shown.
   */
  const handleStatusChange = async (
    registration: Registration,
    newStatus: 'confirmed' | 'cancelled',
  ): Promise<boolean> => {
    try {
      if (newStatus === 'confirmed') {
        await markRegistrationPaid(registration.id);
      } else {
        await cancelRegistration(registration.id);
      }
    } catch (error) {
      failureToast(
        newStatus === 'confirmed'
          ? 'Nie udało się potwierdzić zapisu'
          : 'Nie udało się anulować zapisu',
        error,
      );
      return false;
    }
    await refreshRegistrations();
    toast({
      title: 'Status zaktualizowany',
      description: `Zmieniono status ${registration.userName} na ${newStatus === 'confirmed' ? 'potwierdzony' : 'anulowany'}.`,
    });
    return true;
  };

  /** Cancels many Zapisy (one POST /registrations/{id}/cancel each) and reports partial failures. */
  const cancelMany = async (ids: string[], title: string): Promise<void> => {
    const outcomes = await Promise.allSettled(ids.map((id) => cancelRegistration(id)));
    const failed = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected');
    const done = outcomes.length - failed.length;
    if (done > 0) await refreshRegistrations();
    if (failed.length === 0) {
      toast({ title, description: `Anulowano zapisy: ${done}.` });
      return;
    }
    const reason = failed[0].reason;
    toast({
      title: 'Nie wszystkie zapisy zostały anulowane',
      description: `Anulowano: ${done}, błędy: ${failed.length}. ${
        reason instanceof Error && reason.message ? reason.message : FALLBACK_ERROR
      }`,
      variant: 'destructive',
    });
  };

  const handleBulkCancel = (selectedIds: Set<string>) =>
    cancelMany([...selectedIds], 'Zapisy anulowane');

  const handleCancelUnpaid = () =>
    cancelMany(
      localRegistrations.filter((r) => r.status === 'pending').map((r) => r.id),
      'Nieopłacone zapisy anulowane',
    );

  /**
   * R-13: manual start number override. The server checks that the number is unique within the
   * event (409) and inside the distance range (422); on failure nothing changes locally.
   * Resolves true when the number was saved.
   */
  const handleAssignBib = async (
    participantId: string,
    bibNumber: string,
    participantName: string,
  ): Promise<boolean> => {
    try {
      const response = await updateRegistration(participantId, { bibNumber });
      const saved = response.data?.bibNumber ?? bibNumber;
      await refreshRegistrations();
      toast({
        title: 'Numer startowy przypisany',
        description: `Przypisano numer ${saved} dla ${participantName}.`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Nie udało się przypisać numeru',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /** PATCH /registrations/{id}/payment-details; resolves true only when the server accepted it. */
  const handlePaymentUpdate = async (
    registrationId: string,
    updatedDetails: PaymentDetails,
  ): Promise<boolean> => {
    try {
      await updatePaymentDetails(registrationId, updatedDetails);
    } catch (error) {
      failureToast('Nie udało się zapisać płatności', error);
      return false;
    }
    await refreshRegistrations();
    return true;
  };

  /**
   * The organizer approves the refund request ("do zwrotu"). Amount is always
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
   * Route B (traditional bank transfer): the organizer manually marks it "zwrócono" after
   * returning the money from their own account — the only refund path the platform can
   * carry out technically on the organizer's behalf (route A / gateway is not built).
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
   * Route B (traditional bank transfer) — the organizer manually confirms a payment
   * after verifying it on the bank account. Performs the real transition
   * pending -> confirmed on the server (RegistrationRepository::
   * markManualPaymentPaid(), the same path as the route-A webhook) — unlike
   * handlePaymentUpdate() above, which is only a local preview of ticking
   * single Rozliczenie items.
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
      'Data zapisu': formatDate(reg.registeredAt),
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

  // Server-driven start-list export (all form fields + numer startowy +
  // payment status, Windows-1250 CSV, XLSX or XML) for one Distance — distinct
  // from handleExportCSV above, which is a client-side-only, fixed-column
  // export of whatever rows are already loaded in the browser. This one
  // hits GET /events/{id}/distances/{id}/start-list-export and leaves an
  // activity-log entry server-side, (every export leaves an entry
  // in the activity log).
  const handleExportStartList = async (distanceId: string, format: 'csv' | 'xlsx' | 'xml') => {
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
    handleBulkCancel,
    handleCancelUnpaid,
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
