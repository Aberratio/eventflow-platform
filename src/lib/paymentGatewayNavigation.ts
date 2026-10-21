/**
 * When the
 * registration/payment flow is about to navigate to an external payment
 * gateway's checkout URL (PayNow/Tpay — the `admin_gateway` PaymentConfig
 * type), that navigation must break OUT of an iframe rather than happen
 * inside it, because gateway checkout pages generally set `X-Frame-Options`/
 * `frame-ancestors` and refuse to be framed — navigating inside the iframe
 * would silently fail (a blank/error frame) rather than showing the
 * checkout page.
 *
 * NOTE: called by EventRegistrationPage and EmbedEventRegistrationPage
 * when POST /registrations returns a `paymentSession`.
 */
export function navigateToPaymentGateway(url: string): void {
  const isFramed = window.self !== window.top;
  if (isFramed && window.top) {
    window.top.location.href = url;
    return;
  }
  window.location.href = url;
}
