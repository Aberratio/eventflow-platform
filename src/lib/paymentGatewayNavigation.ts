/**
 * E8.11 ("Zewnętrzny formularz w iframe", contract §5.3): when the
 * registration/payment flow is about to navigate to an external payment
 * gateway's checkout URL (PayNow/Tpay — the `admin_gateway` PaymentConfig
 * type), that navigation must break OUT of an iframe rather than happen
 * inside it, because gateway checkout pages generally set `X-Frame-Options`/
 * `frame-ancestors` and refuse to be framed — navigating inside the iframe
 * would silently fail (a blank/error frame) rather than showing the
 * checkout page.
 *
 * NOTE: as of this ticket, this client has no actual PayNow/Tpay checkout
 * redirect implemented yet — `EventRegistrationPage.handleComplete` only
 * branches on `paymentConfig.type !== 'organizer_bank'` to mark fees as
 * "paid" immediately; there is no code anywhere that receives a gateway
 * `redirectUrl` and navigates to it (grepped the whole client — zero hits).
 * That's a separate, not-yet-built feature. This helper exists so that when
 * that flow lands, it has a ready-made, already-tested breakout primitive to
 * call instead of a bare `window.location.href = url` — see the E8.11
 * ticket report for this judgment call.
 */
export function navigateToPaymentGateway(url: string): void {
  const isFramed = window.self !== window.top;
  if (isFramed && window.top) {
    window.top.location.href = url;
    return;
  }
  window.location.href = url;
}
