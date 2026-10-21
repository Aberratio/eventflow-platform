import { Link, useLocation, useParams } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Building2,
  Copy,
  AlertTriangle,
  ClipboardList,
  CreditCard,
  User,
  Users,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RegistrationData } from '@/components/registration/RegistrationForm';
import { PaymentConfig, Registration } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getTeamInvite } from '@/api';
import { buildTeamInviteLink } from '@/lib/teamInvite';
import { formatMoney } from '@/lib/format';
import { TEST_REGISTRATION_MESSAGE } from '@/lib/registrationOutcome';
import { cn } from '@/lib/utils';

interface RegistrationSuccessState {
  /**
   * The server's frozen response from `createRegistration()` — the
   * authoritative Rozliczenie. Everything actually charged/recorded
   * (`totalAmount`, `settlementItems`, `pricePaid`, `discountAmount`,
   * `insurancePaid`, `merchandiseOrders`) must be read from here, never from
   * `registrationData`.
   */
  registration: Registration;
  /**
   * The client's own pre-submit preview (see `RegistrationData`'s doc
   * comment) — used here only for fields the server response doesn't carry
   * (e.g. `birthDate`) or as a last-resort display fallback if the server
   * response is ever incomplete. Never used for money that was actually
   * charged.
   */
  registrationData: RegistrationData;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  eventCity: string;
  paymentConfig?: PaymentConfig;
}

interface ReceiptLine {
  key: string;
  label: string;
  amount: number;
}

/**
 * Build the receipt line items to render, from the server's frozen
 * Rozliczenie — never from the pre-submit preview. `settlementItems` (the
 * position-by-position breakdown the server computes) is authoritative
 * when present; the discrete `pricePaid`/`discountAmount`/`insurancePaid`/
 * `merchandiseOrders` fields on the same server response are the fallback
 * for older/partial responses. `registrationData` is touched only as a
 * last-resort fallback so the page still renders something sensible if the
 * server response is ever missing a field entirely.
 */
const buildReceiptLines = (
  registration: Registration,
  registrationData: RegistrationData,
): ReceiptLine[] => {
  if (registration.settlementItems && registration.settlementItems.length > 0) {
    return [...registration.settlementItems]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ key: item.id, label: item.name, amount: item.amount }));
  }

  const lines: ReceiptLine[] = [];
  const distanceName = registration.distanceName || registrationData.distanceName;
  const startFee = registration.pricePaid ?? registrationData.price;
  lines.push({
    key: 'start-fee',
    label: `Opłata startowa (${distanceName})`,
    amount: startFee,
  });

  const discountAmount = registration.discountAmount ?? registrationData.discountAmount;
  if (discountAmount && discountAmount > 0) {
    const discountCode = registration.discountCode ?? registrationData.discountCode;
    lines.push({
      key: 'discount',
      label: discountCode ? `Rabat (${discountCode})` : 'Rabat',
      amount: -discountAmount,
    });
  }

  const insuranceAmount = registration.insurancePaid ?? registrationData.insurancePrice;
  if (insuranceAmount && insuranceAmount > 0) {
    lines.push({ key: 'insurance', label: 'Ubezpieczenie NNW', amount: insuranceAmount });
  }

  const merchandiseOrders = registration.merchandiseOrders ?? registrationData.merchandiseOrders;
  merchandiseOrders?.forEach((order, index) => {
    const variant = [order.size, order.color].filter(Boolean).join(', ');
    const label = `${order.merchandiseName}${variant ? ` (${variant})` : ''}${
      order.quantity > 1 ? ` x${order.quantity}` : ''
    }`;
    lines.push({ key: `merch-${index}`, label, amount: order.price });
  });

  return lines;
};

const RegistrationSuccessPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const state = location.state as RegistrationSuccessState | null;

  // The invitation token is the captain's secret (the team id is public), so it is fetched
  // from the server (captain-only) instead of being derived from the Zapis. Only the Zapis that
  // just created a brand-new relay Drużyna is the captain and gets the link here.
  const inviteTeamId =
    state?.registrationData.createTeam && state.registration.teamId && !state.registration.isTest
      ? state.registration.teamId
      : null;
  const teamInviteQuery = useQuery({
    queryKey: ['team-invite-token', inviteTeamId],
    queryFn: () => getTeamInvite(inviteTeamId as string),
    enabled: Boolean(inviteTeamId),
    retry: false,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Skopiowano', { description: `${label} został skopiowany do schowka` });
    });
  };

  const generateTransferTitle = () => {
    // The server-computed, deterministic `ZC-{id}` title is authoritative
    // for matching bank transfers to this Zapis — prefer it whenever the
    // registration response carried one. The template-based title below is a
    // legacy fallback for the (now rare) case a registration response predates
    // this field.
    if (state?.registration.transferTitle) {
      return state.registration.transferTitle;
    }

    // The registered participant (the ward for an Opieka Zapis), not the logged-in guardian.
    const participantName = state?.registration.userName || user?.name || 'Uczestnik';

    if (!state?.paymentConfig?.transferTitle) {
      return `${state?.eventName || 'Wydarzenie'} - ${participantName}`;
    }

    return state.paymentConfig.transferTitle
      .replace('{eventName}', state.eventName)
      .replace('{participantName}', participantName)
      .replace(
        '{distanceName}',
        state.registration.distanceName || state.registrationData.distanceName,
      )
      .replace('{birthDate}', state.registrationData.birthDate || '');
  };

  // No state - user accessed page directly
  if (!state) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Brak danych rejestracji</h1>
            <p className="text-muted-foreground">
              Nie znaleźliśmy danych rejestracji do wyświetlenia.
            </p>
            <Button asChild>
              <Link to="/events">Przejdź do wydarzeń</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const { registration, registrationData, eventName, eventDate, eventCity, paymentConfig } = state;
  const isBankTransfer = paymentConfig?.type === 'organizer_bank';
  // Paid or not comes from the server's Zapis status, never from the payment route.
  const isTestRun = registration.isTest === true;
  const isPaid = registration.status === 'confirmed';
  const receiptLines = buildReceiptLines(registration, registrationData);
  const totalAmount = registration.totalAmount ?? registrationData.totalAmount;
  const distanceName = registration.distanceName || registrationData.distanceName;
  const category = registration.category || registrationData.category;

  // // this Zapis just created a brand-new relay Drużyna (`createTeam`
  // intent) — surface the shareable invitation link for the still-missing
  // teammates right here, the natural "what happens next" moment. The
  // link carries the captain's secret `invite` token (fetched above); joining
  // still goes through RegistrationRepository::resolveTeamForRegistration()
  // in full at submit time, which refuses a join without that token.
  const teamInviteToken = teamInviteQuery.data?.data.inviteToken;
  const teamInviteLink =
    inviteTeamId && teamInviteToken
      ? buildTeamInviteLink(window.location.origin, slug ?? '', inviteTeamId, teamInviteToken)
      : null;
  const teamInviteUnavailable = Boolean(inviteTeamId) && teamInviteQuery.isError;

  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">
              {isTestRun
                ? 'Zapis testowy'
                : isPaid
                  ? 'Rejestracja zakończona!'
                  : 'Rejestracja wstępna zakończona!'}
            </h1>
            {isTestRun && (
              <p className="mb-2 font-medium text-amber-800 dark:text-amber-200">
                {TEST_REGISTRATION_MESSAGE}
              </p>
            )}
            <p className="text-muted-foreground">
              {isTestRun ? 'Sprawdzone wydarzenie' : 'Zapisałeś się na wydarzenie'}{' '}
              <span className="font-semibold text-foreground">{eventName}</span>
            </p>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(eventDate), 'd MMMM yyyy', { locale: pl })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {eventCity}
              </span>
            </div>
            <p className="mt-2 text-sm">
              Dystans: <span className="font-medium">{distanceName}</span>
              {' • '}
              Kategoria: <span className="font-medium">{category}</span>
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardContent className="space-y-6 pt-6">
              {/* Registration details */}
              <div>
                <h2 className="mb-4 font-semibold">
                  {isBankTransfer ? 'Szczegóły zamówienia' : 'Szczegóły rejestracji'}
                </h2>
                <div className="space-y-3 text-sm">
                  {receiptLines.map((line) => (
                    <div
                      key={line.key}
                      className={cn('flex justify-between', line.amount < 0 && 'text-primary')}
                    >
                      <span>{line.label}</span>
                      <span className="font-medium">
                        {line.amount < 0 ? '-' : ''}
                        {formatMoney(Math.abs(line.amount))}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>{isPaid ? 'Razem zapłacono' : 'Do zapłaty'}</span>
                  <span>{formatMoney(totalAmount)}</span>
                </div>

                {!isTestRun && isPaid && !isBankTransfer && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <CreditCard className="h-4 w-4" />
                    <span>Płatność zrealizowana automatycznie</span>
                  </div>
                )}

                {!isTestRun && !isPaid && !isBankTransfer && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                    Płatność nie została jeszcze zrealizowana. Zapis zostanie potwierdzony po
                    zaksięgowaniu wpłaty — status sprawdzisz w panelu uczestnika.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Transfer Details (only for bank transfer) */}
          {!isTestRun && isBankTransfer && !isPaid && paymentConfig && (
            <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Building2 className="h-5 w-5" />
                  <h2 className="font-semibold">Dane do przelewu bankowego</h2>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Account number */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Numer konta</p>
                      <p className="font-mono font-medium">{paymentConfig.bankAccountNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(paymentConfig.bankAccountNumber || '', 'Numer konta')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Account holder */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Odbiorca</p>
                      <p className="font-medium">{paymentConfig.bankAccountHolder}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(paymentConfig.bankAccountHolder || '', 'Odbiorca')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Transfer title */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Tytuł przelewu</p>
                      <p className="font-medium">{generateTransferTitle()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateTransferTitle(), 'Tytuł przelewu')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Kwota</p>
                      <p className="text-lg font-bold">{formatMoney(totalAmount)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${totalAmount.toFixed(2)}`, 'Kwota')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Important info */}
                <div className="border-t border-amber-200 pt-4 dark:border-amber-800">
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Ważne informacje</h4>
                      <ul className="list-inside list-disc space-y-1 text-xs">
                        <li>Wpłać dokładną kwotę na podane konto</li>
                        <li>Użyj podanego tytułu przelewu</li>
                        <li>Twoja rejestracja zostanie potwierdzona po zaksięgowaniu wpłaty</li>
                        <li>Status płatności możesz sprawdzić w panelu uczestnika</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Invitation Link — only for the Zapis that just created a new relay Drużyna */}
          {(teamInviteLink || teamInviteUnavailable) && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Zaproś resztę drużyny</h2>
                </div>
                {teamInviteLink ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Wyślij ten link pozostałym osobom z Twojej drużyny — po kliknięciu od razu
                      dołączą do{' '}
                      <span className="font-medium text-foreground">{registration.teamName}</span> i
                      wypełnią własny zapis.
                    </p>
                    <div className="flex items-center gap-2">
                      <label htmlFor="team-invite-link" className="sr-only">
                        Link zaproszenia do drużyny
                      </label>
                      <Input
                        id="team-invite-link"
                        readOnly
                        value={teamInviteLink}
                        onFocus={(e) => e.currentTarget.select()}
                        className="font-mono text-xs sm:text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Skopiuj link zaproszenia"
                        onClick={() => copyToClipboard(teamInviteLink, 'Link zaproszenia')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Link zaproszenia znajdziesz w panelu uczestnika, w zakładce Rejestracje.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Where to find the registration details (the server sends the confirmation mail itself) */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ClipboardList className="h-5 w-5 flex-shrink-0" />
                <p>
                  Szczegóły zapisu i status płatności znajdziesz w panelu uczestnika, w zakładce
                  „Moje rejestracje".
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to={`/events/${slug}`}>Zobacz wydarzenie</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/participant?tab=registrations">Moje rejestracje</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrationSuccessPage;
