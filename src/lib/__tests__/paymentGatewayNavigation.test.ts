import { describe, it, expect, afterEach } from 'vitest';
import { navigateToPaymentGateway } from '../paymentGatewayNavigation';

describe('navigateToPaymentGateway', () => {
  const originalTop = window.top;
  const originalSelf = window.self;
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'top', { value: originalTop, configurable: true });
    Object.defineProperty(window, 'self', { value: originalSelf, configurable: true });
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
  });

  it('navigates the top-level window when running inside an iframe', () => {
    const fakeTop = { location: { href: '' } } as unknown as Window;
    Object.defineProperty(window, 'top', { value: fakeTop, configurable: true });
    Object.defineProperty(window, 'self', { value: {} as Window, configurable: true }); // self !== top

    navigateToPaymentGateway('https://secure.paynow.pl/checkout/abc');

    expect(fakeTop.location.href).toBe('https://secure.paynow.pl/checkout/abc');
  });

  it('navigates the current window normally when not framed', () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'top', { value: window, configurable: true });
    Object.defineProperty(window, 'self', { value: window, configurable: true }); // self === top

    navigateToPaymentGateway('https://secure.tpay.com/checkout/xyz');

    expect(window.location.href).toBe('https://secure.tpay.com/checkout/xyz');
  });
});
