import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartPage from '../CartPage';

// E5.2: `handleCheckout` used to fabricate an order locally (Math.random order
// number, crypto.randomUUID id, a fake delay) and never call the backend.
// These assert the real `createOrder` API call happens with a reasonable
// payload, and that success/failure are handled distinctly (cart cleared +
// navigation only on success; an error toast and an untouched cart on
// failure).

const { cartItems, mockClearCart, mockSetLastOrder, mockToast, mockNavigate, mockCreateOrder } =
  vi.hoisted(() => ({
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
    useAuth: () => ({ user: { id: 'user-1' } }),
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
  // E5.3: courier requires a shipping address before checkout is enabled.
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
  }, 15000);

  // E5.3: courier/paczkomat need a shipping address before checkout is
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
});
