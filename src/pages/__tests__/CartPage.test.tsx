import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartPage from '../CartPage';
import type { CartItem } from '@/types';

// `handleCheckout` used to fabricate an order locally (Math.random order
// number, crypto.randomUUID id, a fake delay) and never call the backend.
// These assert the real `createOrder` API call happens with a reasonable
// payload, and that success/failure are handled distinctly (cart cleared +
// navigation only on success; an error toast and an untouched cart on
// failure).

const {
  cartItems,
  mockClearCart,
  mockSetLastOrder,
  mockToast,
  mockNavigate,
  mockCreateOrder,
  mockRefreshUser,
} = vi.hoisted(() => ({
  cartItems: [
    {
      productId: 'p1',
      productName: 'Koszulka biegowa',
      unitPrice: 100,
      quantity: 2,
    },
  ],
  mockClearCart: vi.fn(),
  mockSetLastOrder: vi.fn(),
  mockToast: vi.fn(),
  mockNavigate: vi.fn(),
  mockCreateOrder: vi.fn(),
  mockRefreshUser: vi.fn(),
}));

const fakeOrder = {
  id: 'order-1',
  orderNumber: 'ORD-2026-ABC123',
  userId: 'user-1',
  items: [
    {
      productId: 'p1',
      productName: 'Koszulka biegowa',
      quantity: 2,
      price: 100,
    },
  ],
  deliveryMethod: { id: 'courier', name: 'Kurier', price: 15, estimatedDays: '2-3 dni' },
  paymentMethod: { id: 'card', name: 'Karta' },
  productTotal: 200,
  deliveryPrice: 15,
  paymentSurcharge: 0,
  totalPrice: 215,
  status: 'pending' as const,
  createdAt: '2026-09-17T10:00:00.000Z',
};

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getDeliveryMethods: vi.fn().mockResolvedValue({
      data: [
        { id: 'courier', name: 'Kurier', price: 15, estimatedDays: '2-3 dni' },
        { id: 'paczkomat', name: 'Paczkomat', price: 12, estimatedDays: '1-2 dni' },
        { id: 'pickup', name: 'Odbior osobisty', price: 0, estimatedDays: 'w dniu zawodow' },
      ],
      success: true,
    }),
    getShopPaymentMethods: vi.fn().mockResolvedValue({
      data: [{ id: 'card', name: 'Karta' }],
      success: true,
    }),
    createOrder: mockCreateOrder,
  };
});

vi.mock('@/contexts/CartContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/CartContext')>('@/contexts/CartContext');
  return {
    ...actual,
    useCart: () => ({
      items: cartItems,
      updateItemQuantity: vi.fn(),
      removeItemByVariant: vi.fn(),
      clearCart: mockClearCart,
      totalPrice: 200,
      totalItems: 2,
      setLastOrder: mockSetLastOrder,
    }),
  };
});

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: { id: 'user-1' }, refreshUser: mockRefreshUser }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cart']}>
        <CartPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const selectDeliveryAndPayment = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByText('Kurier'));
  // Courier requires a shipping address before checkout is enabled.
  await user.type(screen.getByLabelText('Imię i nazwisko'), 'Jan Kowalski');
  await user.type(screen.getByLabelText('Ulica i numer'), 'Testowa 1');
  await user.type(screen.getByLabelText('Kod pocztowy'), '00-001');
  await user.type(screen.getByLabelText('Miejscowość'), 'Warszawa');
  await user.click(screen.getByText('Karta'));
};

describe('CartPage checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createOrder with a reasonable payload and completes checkout on success', async () => {
    mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
    const user = userEvent.setup();
    renderPage();

    await selectDeliveryAndPayment(user);
    await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));

    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        items: [expect.objectContaining({ productId: 'p1', quantity: 2, price: 100 })],
        deliveryMethod: expect.objectContaining({ id: 'courier' }),
        paymentMethod: expect.objectContaining({ id: 'card' }),
        shippingAddress: {
          fullName: 'Jan Kowalski',
          street: 'Testowa 1',
          city: 'Warszawa',
          postalCode: '00-001',
        },
      }),
    );

    await waitFor(() =>
      expect(mockSetLastOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          orderNumber: 'ORD-2026-ABC123',
          totalPrice: 215,
        }),
      ),
    );
    expect(mockClearCart).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/order-success');
    // A successful checkout may have granted the Organizer role
    // server-side (organizer-package purchase) — refetch /users/me so the
    // Organizer-only nav item can appear without a manual reload.
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  }, 15000);

  it('shows an error toast and keeps the cart on failure', async () => {
    mockCreateOrder.mockRejectedValue(new Error('Brak towaru na stanie'));
    const user = userEvent.setup();
    renderPage();

    await selectDeliveryAndPayment(user);
    await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: 'Brak towaru na stanie',
        }),
      ),
    );

    expect(mockClearCart).not.toHaveBeenCalled();
    expect(mockSetLastOrder).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/order-success');
    expect(mockRefreshUser).not.toHaveBeenCalled();
  }, 15000);

  // Courier/paczkomat need a shipping address before checkout is
  // possible at all — these assert the button stays disabled (canCheckout
  // false) rather than letting an incomplete request reach the server.
  it('keeps checkout disabled for courier until the shipping address is complete', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Kurier'));
    await user.click(screen.getByText('Karta'));

    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();

    await user.type(screen.getByLabelText('Imię i nazwisko'), 'Jan Kowalski');
    await user.type(screen.getByLabelText('Ulica i numer'), 'Testowa 1');
    await user.type(screen.getByLabelText('Miejscowość'), 'Warszawa');
    // postal code left out entirely — still incomplete.
    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();
    expect(mockCreateOrder).not.toHaveBeenCalled();
  }, 15000);

  it('rejects a malformed postal code and keeps checkout disabled', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Kurier'));
    await user.type(screen.getByLabelText('Imię i nazwisko'), 'Jan Kowalski');
    await user.type(screen.getByLabelText('Ulica i numer'), 'Testowa 1');
    await user.type(screen.getByLabelText('Miejscowość'), 'Warszawa');
    await user.type(screen.getByLabelText('Kod pocztowy'), '00001');
    await user.click(screen.getByText('Karta'));

    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();
    expect(mockCreateOrder).not.toHaveBeenCalled();
  }, 15000);

  // WCAG fix: the disabled button alone isn't an accessible error
  // identification (SC 3.3.1) — each invalid field needs its own visible
  // message wired via aria-invalid/aria-describedby.
  it('shows a visible, accessible error for an empty required field once it has been touched', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Kurier'));
    const fullNameInput = screen.getByLabelText('Imię i nazwisko');

    // Not yet touched — no error should be shown.
    expect(screen.queryByText('Podaj imię i nazwisko.')).not.toBeInTheDocument();

    await user.click(fullNameInput);
    await user.tab(); // blur without typing anything

    const error = await screen.findByText('Podaj imię i nazwisko.');
    expect(error).toBeInTheDocument();
    expect(fullNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(fullNameInput).toHaveAttribute('aria-describedby', error.id);
  }, 15000);

  it('shows a format hint and error suggestion for a malformed postal code once touched', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Kurier'));
    const postalCodeInput = screen.getByLabelText('Kod pocztowy');

    // Untouched, empty field: format hint visible, no error yet.
    expect(screen.getByText('Format: NN-NNN, np. 00-001.')).toBeInTheDocument();

    await user.type(postalCodeInput, '00001');
    await user.tab();

    const error = await screen.findByText('Nieprawidłowy format. Użyj formatu NN-NNN, np. 00-001.');
    expect(error).toBeInTheDocument();
    expect(postalCodeInput).toHaveAttribute('aria-invalid', 'true');
    expect(postalCodeInput).toHaveAttribute('aria-describedby', error.id);

    await user.clear(postalCodeInput);
    await user.type(postalCodeInput, '00-001');
    expect(
      screen.queryByText('Nieprawidłowy format. Użyj formatu NN-NNN, np. 00-001.'),
    ).not.toBeInTheDocument();
    expect(postalCodeInput).not.toHaveAttribute('aria-invalid');
  }, 15000);

  it('shows a visible error for a missing paczkomat number once touched', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Paczkomat'));
    const paczkomatInput = screen.getByLabelText('Numer paczkomatu');

    await user.click(paczkomatInput);
    await user.tab();

    const error = await screen.findByText('Podaj numer paczkomatu.');
    expect(error).toBeInTheDocument();
    expect(paczkomatInput).toHaveAttribute('aria-invalid', 'true');
    expect(paczkomatInput).toHaveAttribute('aria-describedby', error.id);
  }, 15000);

  it('requires a paczkomat number when paczkomat delivery is selected, and sends it once filled', async () => {
    mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Paczkomat'));
    await user.type(screen.getByLabelText('Imię i nazwisko'), 'Jan Kowalski');
    await user.type(screen.getByLabelText('Ulica i numer'), 'Testowa 1');
    await user.type(screen.getByLabelText('Kod pocztowy'), '00-001');
    await user.type(screen.getByLabelText('Miejscowość'), 'Warszawa');
    await user.click(screen.getByText('Karta'));

    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();
    expect(mockCreateOrder).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Numer paczkomatu'), 'WAW01A');
    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));
    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: expect.objectContaining({ paczkomatId: 'WAW01A' }),
      }),
    );
  }, 15000);

  it('never shows or requires a shipping address for pickup delivery', async () => {
    mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Odbior osobisty'));
    expect(screen.queryByLabelText('Imię i nazwisko')).not.toBeInTheDocument();

    await user.click(screen.getByText('Karta'));
    expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));
    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ shippingAddress: undefined }),
    );
  });

  // "Dane do faktury przy zamówieniu" — the "Chcę fakturę" toggle
  // shows/hides a fieldset (companyName/nip/street/city/postalCode),
  // mirroring the shipping-address accessible-error pattern.
  describe('invoice data', () => {
    it('does not show the invoice fieldset by default, and never requires or sends invoice data', async () => {
      mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
      const user = userEvent.setup();
      renderPage();

      expect(screen.queryByLabelText('Nazwa firmy')).not.toBeInTheDocument();

      await selectDeliveryAndPayment(user);
      await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));

      await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceData: undefined }),
      );
    }, 15000);

    it('shows the invoice fieldset once the toggle is checked, and hides it again when unchecked', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      expect(screen.getByLabelText('Nazwa firmy')).toBeInTheDocument();
      expect(screen.getByLabelText('NIP')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      expect(screen.queryByLabelText('Nazwa firmy')).not.toBeInTheDocument();
    }, 15000);

    it('keeps checkout disabled until invoice fields are complete once the toggle is on', async () => {
      const user = userEvent.setup();
      renderPage();

      await selectDeliveryAndPayment(user);
      expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeEnabled();

      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();

      await user.type(screen.getByLabelText('Nazwa firmy'), 'Testowa Sp. z o.o.');
      await user.type(screen.getByLabelText('NIP'), '525-234-40-78');
      await user.type(
        screen.getByLabelText('Ulica i numer', { selector: '#invoice-street' }),
        'Faktury 1',
      );
      await user.type(
        screen.getByLabelText('Kod pocztowy', { selector: '#invoice-postal-code' }),
        '00-002',
      );
      await user.type(
        screen.getByLabelText('Miejscowość', { selector: '#invoice-city' }),
        'Warszawa',
      );

      expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeEnabled();
    }, 15000);

    it('shows a visible, accessible error for an empty required invoice field once touched', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      const companyNameInput = screen.getByLabelText('Nazwa firmy');

      expect(screen.queryByText('Podaj nazwę firmy.')).not.toBeInTheDocument();

      await user.click(companyNameInput);
      await user.tab();

      const error = await screen.findByText('Podaj nazwę firmy.');
      expect(error).toBeInTheDocument();
      expect(companyNameInput).toHaveAttribute('aria-invalid', 'true');
      expect(companyNameInput).toHaveAttribute('aria-describedby', error.id);
    }, 15000);

    it('shows a distinct format hint and error for a malformed NIP once touched', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      const nipInput = screen.getByLabelText('NIP');

      expect(
        screen.getByText('10 cyfr, z myślnikami lub bez, np. 000-000-00-00.'),
      ).toBeInTheDocument();

      await user.type(nipInput, '12345');
      await user.tab();

      const error = await screen.findByText('NIP musi mieć 10 cyfr.');
      expect(error).toBeInTheDocument();
      expect(nipInput).toHaveAttribute('aria-invalid', 'true');
      expect(nipInput).toHaveAttribute('aria-describedby', error.id);
    }, 15000);

    it('sends invoiceData with the right payload once the toggle is on and fields are complete', async () => {
      mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
      const user = userEvent.setup();
      renderPage();

      await selectDeliveryAndPayment(user);
      await user.click(screen.getByLabelText('Chcę fakturę (dane firmy)'));
      await user.type(screen.getByLabelText('Nazwa firmy'), 'Testowa Sp. z o.o.');
      await user.type(screen.getByLabelText('NIP'), '525-234-40-78');
      await user.type(
        screen.getByLabelText('Ulica i numer', { selector: '#invoice-street' }),
        'Faktury 1',
      );
      await user.type(
        screen.getByLabelText('Kod pocztowy', { selector: '#invoice-postal-code' }),
        '00-002',
      );
      await user.type(
        screen.getByLabelText('Miejscowość', { selector: '#invoice-city' }),
        'Warszawa',
      );

      await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));
      await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceData: {
            companyName: 'Testowa Sp. z o.o.',
            nip: '525-234-40-78',
            street: 'Faktury 1',
            city: 'Warszawa',
            postalCode: '00-002',
          },
        }),
      );
    }, 15000);
  });

  // HasOnlyServices gates the whole delivery-method /
  // shipping-address block off for a cart made entirely of digital/service
  // items (e.g. "pakiet organizatora"). These cover the client-side gating
  // itself (.every(), not .some() — a mixed cart still needs delivery/address)
  // and the empty-cart edge case (`items.length > 0` guard: `[].every(...)`
  // is vacuously true, which would otherwise misclassify an empty cart as
  // "all services"). The last test is a regression test for the crash fix in
  // handleCheckout, where a digital-only order's `deliveryMethod` comes back
  // from the server as `{}` rather than a populated DeliveryMethod.
  describe('digital-only cart gating', () => {
    const originalCartItems: CartItem[] = cartItems.map((item) => ({ ...item }));

    const setCartItems = (newItems: CartItem[]) => {
      cartItems.length = 0;
      cartItems.push(...newItems);
    };

    afterEach(() => {
      setCartItems(originalCartItems);
    });

    it('hides delivery method and address selection for an all-services cart, and checkout proceeds without either', async () => {
      setCartItems([
        {
          productId: 'svc-1',
          productName: 'Pakiet organizatora',
          unitPrice: 199,
          quantity: 1,
          isService: true,
        },
      ]);
      mockCreateOrder.mockResolvedValue({ data: fakeOrder, success: true });
      const user = userEvent.setup();
      renderPage();

      expect(screen.getByText('Usługa cyfrowa')).toBeInTheDocument();
      expect(screen.queryByText('Wybierz metodę dostawy')).not.toBeInTheDocument();
      expect(screen.queryByText('Kurier')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Imię i nazwisko')).not.toBeInTheDocument();

      await user.click(await screen.findByText('Karta'));
      expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeEnabled();

      await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));
      await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: undefined,
          deliveryMethod: expect.objectContaining({ id: 'digital', price: 0 }),
        }),
      );
    }, 15000);

    it('does not treat a mixed cart as digital-only — delivery method and address selection still apply', async () => {
      setCartItems([
        {
          productId: 'svc-1',
          productName: 'Pakiet organizatora',
          unitPrice: 199,
          quantity: 1,
          isService: true,
        },
        {
          productId: 'p1',
          productName: 'Koszulka biegowa',
          unitPrice: 100,
          quantity: 1,
          isService: false,
        },
      ]);
      const user = userEvent.setup();
      renderPage();

      expect(screen.queryByText('Usługa cyfrowa')).not.toBeInTheDocument();
      expect(await screen.findByText('Wybierz metodę dostawy')).toBeInTheDocument();

      await user.click(screen.getByText('Karta'));
      // Delivery method was never selected, and courier/paczkomat need an
      // address too — checkout must stay disabled, same as for a purely
      // physical cart.
      expect(screen.getByRole('button', { name: /Przejdź do płatności/ })).toBeDisabled();
      expect(mockCreateOrder).not.toHaveBeenCalled();
    }, 15000);

    it('does not treat an empty cart as all-services', () => {
      setCartItems([]);
      renderPage();

      expect(screen.getByText('Twój koszyk jest pusty')).toBeInTheDocument();
      expect(screen.queryByText('Usługa cyfrowa')).not.toBeInTheDocument();
    });

    it('does not crash rendering order details when the digital-only order comes back with deliveryMethod: {}', async () => {
      setCartItems([
        {
          productId: 'svc-1',
          productName: 'Pakiet organizatora',
          unitPrice: 199,
          quantity: 1,
          isService: true,
        },
      ]);
      mockCreateOrder.mockResolvedValue({
        data: { ...fakeOrder, deliveryMethod: {} },
        success: true,
      });
      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByText('Karta'));
      await user.click(screen.getByRole('button', { name: /Przejdź do płatności/ }));

      await waitFor(() => expect(mockSetLastOrder).toHaveBeenCalledTimes(1));
      expect(mockNavigate).toHaveBeenCalledWith('/order-success');

      const orderDetailsArg = mockSetLastOrder.mock.calls[0][0];
      expect(orderDetailsArg.deliveryMethod).toEqual({});
      expect(typeof orderDetailsArg.estimatedDelivery).toBe('string');
      expect(orderDetailsArg.estimatedDelivery).not.toMatch(/undefined|NaN/);
    }, 15000);
  });
});
