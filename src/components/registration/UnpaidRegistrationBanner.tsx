import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import {
  canRetryPayment,
  isAwaitingPayment,
  retryErrorMessage,
  retryRegistrationPayment,
} from '@/lib/unpaidRegistration';
import type { Event, Registration } from '@/types';

interface UnpaidRegistrationBannerProps {
  registrations: Registration[];
  events: Event[];
  /** Called after a retry that did not leave the page (bank transfer / error), to refetch the list. */
  onRetried?: () => void;
}

const formatDeadline = (iso: string): string =>
  format(new Date(iso), 'd MMMM yyyy, HH:mm', { locale: pl });

/** "Masz nieopłacony zapis…" with the way to finish the payment. */
export const UnpaidRegistrationBanner = ({
  registrations,
  events,
  onRetried,
}: UnpaidRegistrationBannerProps) => {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const now = new Date();

  const isBankTransfer = (event?: Event): boolean =>
    event?.paymentConfig?.type === 'organizer_bank';

  const items = registrations
    .map((registration) => ({
      registration,
      event: events.find((e) => e.id === registration.eventId),
    }))
    .filter(
      ({ registration, event }) =>
        isAwaitingPayment(registration, now) ||
        canRetryPayment(registration, now, { isBankTransfer: isBankTransfer(event) }),
    );

  if (items.length === 0) return null;

  const handleRetry = async (registration: Registration) => {
    setRetryingId(registration.id);
    try {
      const { redirected } = await retryRegistrationPayment(registration.id);
      if (!redirected) {
        toast.success('Okno płatności zostało ponownie otwarte', {
          description: 'Opłać zapis przelewem na dane z komunikatu.',
        });
        onRetried?.();
      }
    } catch (error) {
      toast.error('Nie udało się ponowić płatności', { description: retryErrorMessage(error) });
      onRetried?.();
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="mb-5 space-y-3 sm:mb-6" data-testid="unpaid-registration-banner">
      {items.map(({ registration, event }) => {
        const eventName = event?.name ?? registration.eventName;
        const isBank = isBankTransfer(event);
        const retryable = canRetryPayment(registration, now, { isBankTransfer: isBank });
        // Window lapsed (expired): the explanation changes; an open window keeps the deadline text.
        const lapsed = retryable && !isAwaitingPayment(registration, now);
        const transferTitle = registration.transferTitle ?? `ZC-${registration.id}`;
        const busy = retryingId === registration.id;

        return (
          <Alert key={registration.id} role="status" className="border-warning/40 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle>
              {lapsed
                ? `Zapis na ${eventName} wygasł z powodu braku płatności`
                : `Masz nieopłacony zapis na ${eventName}`}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              {lapsed ? (
                <p>Ponów płatność, aby odzyskać miejsce (o ile dystans nie jest już zapełniony).</p>
              ) : (
                <p>
                  Dokończ płatność
                  {registration.paymentExpiresAt
                    ? ` do ${formatDeadline(registration.paymentExpiresAt)}`
                    : ''}
                  , inaczej zapis wygaśnie.
                </p>
              )}

              {!lapsed && isBank && event?.paymentConfig && (
                <dl className="grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                  <dt className="text-muted-foreground">Numer konta</dt>
                  <dd className="font-medium">
                    {event.paymentConfig.bankAccountNumber || 'Brak danych'}
                  </dd>
                  {event.paymentConfig.bankAccountHolder && (
                    <>
                      <dt className="text-muted-foreground">Odbiorca</dt>
                      <dd className="font-medium">{event.paymentConfig.bankAccountHolder}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Tytuł przelewu</dt>
                  <dd className="font-medium">{transferTitle}</dd>
                  {registration.totalAmount != null && (
                    <>
                      <dt className="text-muted-foreground">Kwota</dt>
                      <dd className="font-medium">{formatMoney(registration.totalAmount)}</dd>
                    </>
                  )}
                </dl>
              )}

              {!lapsed && !isBank && (
                <p className="text-sm text-muted-foreground">
                  Płatność online — kliknij „Zapłać teraz”, aby przejść do bramki płatności.
                </p>
              )}

              {retryable && (
                <Button size="sm" onClick={() => handleRetry(registration)} disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {isBank ? 'Ponów zapis' : 'Zapłać teraz'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};
