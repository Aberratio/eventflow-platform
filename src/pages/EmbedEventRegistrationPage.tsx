import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';
import { registrationFormFieldErrors } from '@/api/errors';
import { answersToPayload } from '@/lib/formFields';
import {
  getEventById,
  getEventEmbedPublicConfig,
  createRegistration,
  quoteRegistration,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RegistrationForm, RegistrationData } from '@/components/registration/RegistrationForm';
import type { Registration, RegistrationFormFieldError } from '@/types';
import type { CreateRegistrationPayload } from '@/api/payloads';
import { navigateToPaymentGateway } from '@/lib/paymentGatewayNavigation';
import { TEST_REGISTRATION_MESSAGE, registrationClosedMessage } from '@/lib/registrationOutcome';
import { formatMoney } from '@/lib/format';

/**
 * The dedicated,
 * chrome-free route an organizer `<iframe>`s on their own website —
 * `/embed/event/:id/register`. No `<Layout>` (no header/nav/footer); `App.tsx`
 * additionally suppresses `BottomNav`/`DevToolbox`/`OnboardingDialog`/
 * `CookieConsent` for the whole `/embed/*` prefix.
 *
 * Keyed by the event's real `id`, not `:slug` — mirrors the server's embed
 * contract (`GET /events/{id}/embed/public`) one-to-one.
 */
const EmbedEventRegistrationPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The server refused with 409 `registration_closed` — shown instead of the form.
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<RegistrationFormFieldError[] | null>(
    null,
  );

  const { data: embedConfigResponse, isLoading: isEmbedConfigLoading } = useQuery({
    queryKey: ['event-embed-public-config', id],
    queryFn: () => getEventEmbedPublicConfig(id ?? ''),
    enabled: Boolean(id),
  });
  const embedConfig = embedConfigResponse?.data ?? null;

  const { data: eventResponse, isLoading: isEventLoading } = useQuery({
    queryKey: ['event-by-id', id],
    queryFn: () => getEventById(id ?? ''),
    // Only fetch the (potentially large) full event once we know embedding is
    // actually enabled — avoids leaking event data to a disabled/blocked embed.
    enabled: Boolean(id) && embedConfig?.enabled === true,
  });
  const event = eventResponse?.data ?? null;

  /**
   * Origin-allowlist check (defense-in-depth only — see below). `document.
   * referrer` is the only signal a static SPA has for "what page framed me";
   * it isn't fully reliable (some browsers/extensions/privacy modes omit it
   * entirely even for a legitimate same-origin-policy-compliant embed).
   *
   * Chosen behavior, deliberately conservative:
   *   - allowlist non-empty AND referrer missing/doesn't match → BLOCK.
   *   - allowlist empty → "no restriction configured", render regardless
   *     (there is nothing to check against, and an organizer who enabled
   *     embedding without listing origins has implicitly opted out of this
   *     check — the UI nudges them to add origins, but doesn't force it).
   *
   * This is explicitly NOT a security boundary — a page inside an iframe
   * cannot reliably prevent that iframe's existence, and `document.referrer`
   * can be spoofed by anything not going through a real browser navigation
   * (e.g. a server-side fetch replaying this URL). The actual guarantee, if
   * one is needed, is an HTTP `Content-Security-Policy: frame-ancestors`
   * response header — enforced at the hosting layer, out of reach for this
   * static SPA (no server-rendered HTML to attach headers to per-request).
   * This check only prevents the *honest* browser case: this app rendering
   * its own form inside an iframe on a site the organizer didn't list.
   */
  const referrerAllowed = useMemo(() => {
    const allowedOrigins = embedConfig?.allowedOrigins ?? [];
    if (allowedOrigins.length === 0) return true;

    let referrerOrigin: string | null = null;
    try {
      referrerOrigin = document.referrer ? new URL(document.referrer).origin : null;
    } catch {
      referrerOrigin = null;
    }
    if (!referrerOrigin) return false;

    return allowedOrigins.some((origin) => origin.toLowerCase() === referrerOrigin!.toLowerCase());
  }, [embedConfig]);

  const isLoading = isEmbedConfigLoading || (embedConfig?.enabled === true && isEventLoading);

  // Payload of `createRegistration` AND of `quoteRegistration`: the quote prices exactly what
  // the create call would send, so both are built here, once.
  const buildCreatePayload = (data: RegistrationData): CreateRegistrationPayload | null => {
    if (!user || !event) return null;
    return {
      eventId: event.id,
      eventName: event.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      distanceId: data.distanceId,
      distanceName: data.distanceName,
      category: data.category,
      teamName: data.teamName,
      teamId: data.teamId,
      teamInviteToken: data.teamInviteToken,
      createTeam: data.createTeam,
      specialCategory: data.teamSpecialCategory,
      pricingVariantId: data.pricingVariantId,
      discountCode: data.discountCode,
      merchandise: data.merchandise,
      insuranceVariantId: data.insuranceVariantId,
      // Answers and identity are validated by the server in the create call itself.
      formFieldAnswers: answersToPayload(data.formFieldAnswers),
      identity: data.identity,
    };
  };

  const handleComplete = async (data: RegistrationData) => {
    if (!user || !event || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Same money-free payload contract as the normal registration page
      // — only IDs/selections, server recomputes and freezes amounts.
      const payload = buildCreatePayload(data);
      if (!payload) return;
      const response = await createRegistration(payload);
      // A fresh `pending` trasa-A Zapis comes with a gateway session — pay there
      // (the helper breaks out of the iframe).
      if (
        !response.data.isTest &&
        response.data.status === 'pending' &&
        response.data.paymentSession?.redirectUrl
      ) {
        navigateToPaymentGateway(response.data.paymentSession.redirectUrl);
        return;
      }
      // No navigation to the normal `/events/:slug/register/success` page —
      // that page renders inside `<Layout>` (full site chrome), which would
      // look broken crammed into a small third-party iframe. Show a minimal
      // inline confirmation instead. The server sends the confirmation mail when
      // Central Mailer is configured; the UI makes no claim about it.
      setRegistration(response.data);
    } catch (error) {
      const closed = registrationClosedMessage(error);
      if (closed !== null) {
        setClosedMessage(closed);
        return;
      }
      const fieldErrors = registrationFormFieldErrors(error);
      if (fieldErrors.length > 0) setServerFieldErrors(fieldErrors);
      setSubmitError(error instanceof Error ? error.message : 'Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Ładowanie formularza...</p>
      </div>
    );
  }

  if (!embedConfig || !embedConfig.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ten formularz nie jest udostępniony do osadzenia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!referrerAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ta strona nie jest uprawniona do osadzenia tego formularza.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Nie znaleziono wydarzenia.</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-4 pt-6 text-center">
            <LogIn className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Zaloguj się na koncie Zmierzymy Czas, aby dokończyć zapis.
            </p>
            {/* /login is not frameable (frame-ancestors 'self'), and
                third-party-iframe storage is partitioned anyway, so log in
                top-level on our site. */}
            <Button asChild>
              <a href="/login" target="_top">
                Zaloguj się
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (closedMessage !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="text-lg font-bold">Zapisy są zamknięte</h1>
            <p className="text-muted-foreground">{closedMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registration?.isTest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6">
            <h1 className="text-center text-lg font-bold">Zapis testowy</h1>
            <p className="text-center text-muted-foreground">{TEST_REGISTRATION_MESSAGE}</p>
            <ul className="space-y-1 text-sm">
              {(registration.settlementItems ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>{item.name}</span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
            {registration.totalAmount !== undefined && (
              <p className="flex justify-between gap-4 font-semibold">
                <span>Razem</span>
                <span>{formatMoney(registration.totalAmount)}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registration) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
            <h1 className="text-lg font-bold">Zapisano się!</h1>
            <p className="text-muted-foreground">
              Zapisano na wydarzenie „{event.name}", dystans {registration.distanceName}. Szczegóły
              zapisu znajdziesz po zalogowaniu w panelu uczestnika.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isClosedByOrganizer = event.registrationStatus === 'closed';
  const registrationNotStarted = event.registrationStatus === 'none';
  const allDistancesFull =
    event.distances.length > 0 &&
    event.distances.every((d) => d.limit != null && d.registeredCount >= d.limit);
  const isRegistrationOpen =
    !isPast &&
    !deadlinePassed &&
    !isClosedByOrganizer &&
    !registrationNotStarted &&
    !allDistancesFull;

  if (!isRegistrationOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="space-y-3 pt-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Zapisy na to wydarzenie są obecnie zamknięte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {submitError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}
        <RegistrationForm
          event={event}
          onComplete={handleComplete}
          onCancel={() => window.history.back()}
          disabled={isSubmitting}
          serverFieldErrors={serverFieldErrors}
          quote={async (data) => {
            const payload = buildCreatePayload(data);
            if (!payload) throw new Error('Brak zalogowanego użytkownika.');
            return quoteRegistration(payload);
          }}
        />
      </div>
    </div>
  );
};

export default EmbedEventRegistrationPage;
