import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { changeRegistrationDistance, quoteDistanceChange } from '@/api';
import { ApiRequestError } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { describeBalance } from '@/lib/distanceChange';
import { formatMoney } from '@/lib/format';
import type { Event, Registration } from '@/types';
import { RegistrationActionDialog, registrationSelectClass } from './RegistrationActionDialog';
import { apiErrorMessage, useRegistrationAction } from './useRegistrationAction';

interface ChangeDistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration;
  event: Event;
  /** The organizer has no limits (no window, extra to pay allowed); the owner is held back by the server's rules. */
  isManager?: boolean;
  /** Called with the Zapis after a successful change, so the caller can refresh its list. */
  onChanged?: (registration: Registration) => void;
}

/**
 * „Zmień dystans”. Pick the new Dystans (and its Wariant opłaty when it has several),
 * see the server's quote — new price, balance, refund or the extra the organizer has to settle — then confirm.
 * The owner who would owe an extra is told so and cannot confirm; nothing is paid online here.
 */
export const ChangeDistanceDialog = ({
  open,
  onOpenChange,
  registration,
  event,
  isManager = false,
  onChanged,
}: ChangeDistanceDialogProps) => {
  const { toast } = useToast();
  const [distanceId, setDistanceId] = useState('');
  const [variantId, setVariantId] = useState('');
  const { pending, run, guardOpenChange } = useRegistrationAction(onOpenChange);

  useEffect(() => {
    if (!open) {
      setDistanceId('');
      setVariantId('');
    }
  }, [open]);

  const options = (event.distances ?? []).filter((d) => d.id !== registration.distanceId);
  const target = options.find((d) => d.id === distanceId);
  const variants = (target?.pricingVariants ?? []).filter(
    (v) => isManager || (!v.officeOnly && v.visibleInPublicForm !== false),
  );

  const quoteQuery = useQuery({
    queryKey: ['distance-change-quote', registration.id, distanceId, variantId],
    queryFn: () =>
      quoteDistanceChange(registration.id, {
        distanceId,
        ...(variantId ? { pricingVariantId: variantId } : {}),
      }),
    enabled: open && distanceId !== '',
    retry: false,
    staleTime: 0,
  });
  const quote = quoteQuery.data?.data;
  const notice = quote ? describeBalance(quote, isManager) : null;
  const canConfirm = !!quote && quote.blockedReason === null && !pending;

  const handleConfirm = () => {
    if (!quote) return;
    return run(
      async () => {
        const res = await changeRegistrationDistance(registration.id, {
          distanceId,
          ...(variantId ? { pricingVariantId: variantId } : {}),
        });
        toast({
          title: 'Zmieniono dystans',
          description: `${quote.from.distanceName} → ${quote.to.distanceName}`,
        });
        onChanged?.(res.data);
        onOpenChange(false);
      },
      (error) =>
        toast({
          title: 'Nie udało się zmienić dystansu',
          description: apiErrorMessage(error, 'Spróbuj ponownie za chwilę.'),
          variant: 'destructive',
        }),
    );
  };

  return (
    <RegistrationActionDialog
      open={open}
      onOpenChange={guardOpenChange}
      title="Zmień dystans"
      description={
        <>
          {event.name} — obecnie {registration.distanceName}
          {registration.userName ? `, ${registration.userName}` : ''}
        </>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Wróć
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {pending ? 'Zmieniam…' : 'Zmień dystans'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="change-distance-select">Nowy dystans</Label>
          <select
            id="change-distance-select"
            className={registrationSelectClass}
            value={distanceId}
            onChange={(e) => {
              setDistanceId(e.target.value);
              setVariantId('');
            }}
          >
            <option value="">Wybierz dystans…</option>
            {options.map((d) => {
              const full = !!d.limit && d.registeredCount >= d.limit;
              return (
                <option key={d.id} value={d.id} disabled={full && !isManager}>
                  {d.name} — {formatMoney(d.price)}
                  {full ? ' (brak miejsc)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {variants.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="change-distance-variant">Wariant opłaty</Label>
            <select
              id="change-distance-variant"
              className={registrationSelectClass}
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              <option value="">Standardowa opłata dystansu</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatMoney(v.price)}
                </option>
              ))}
            </select>
          </div>
        )}

        {distanceId !== '' && quoteQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Liczymy nową cenę…</p>
        )}
        {distanceId !== '' && quoteQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            {quoteQuery.error instanceof ApiRequestError
              ? quoteQuery.error.message
              : 'Nie udało się policzyć nowej ceny.'}
          </p>
        )}

        {quote && notice && (
          <div className="space-y-2 rounded-md border p-3 text-sm" aria-live="polite">
            <p>
              Cena zapisu: <span className="line-through">{formatMoney(quote.currentTotal)}</span> →{' '}
              <span className="font-semibold">{formatMoney(quote.newTotal)}</span>
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {quote.settlementItems.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-2">
                  <span>{item.name}</span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
            <p
              className={
                notice.tone === 'blocked'
                  ? 'font-medium text-destructive'
                  : notice.tone === 'due'
                    ? 'font-medium text-warning'
                    : 'text-foreground'
              }
            >
              {notice.text}
            </p>
            {quote.discountDropped && (
              <p className="text-xs text-muted-foreground">
                Kod rabatowy nie obowiązuje na nowym dystansie, więc zostanie zdjęty.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Kod startowy zostaje ten sam
              {quote.bibCleared ? ', a numer startowy zostanie przydzielony od nowa.' : '.'}
            </p>
          </div>
        )}
      </div>
    </RegistrationActionDialog>
  );
};
