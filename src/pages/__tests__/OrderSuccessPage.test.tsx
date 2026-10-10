import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { OrderDetails } from '@/types';
import OrderSuccessPage from '../OrderSuccessPage';

// PP.105: an organizer package is granted only after the payment is confirmed, so the success
// page must say so instead of implying the package is already active.

const { cart } = vi.hoisted(() => ({ cart: { lastOrder: null as OrderDetails | null } }));

vi.mock('@/contexts/CartContext', () => ({ useCart: () => cart }));
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const order = (overrides: Partial<OrderDetails> = {}): OrderDetails => ({
  orderId: 'o1',
  orderNumber: 'ORD-2026-ABCD1234',
  items: [{ productId: 'p1', productName: 'Pakiet organizatora START', quantity: 1, price: 499 }],
  deliveryMethod: { id: 'pickup', name: 'Odbiór osobisty', price: 0, estimatedDays: '1' },
  paymentMethod: { id: 'bank', name: 'Przelew bankowy', surcharge: 0 },
  productTotal: 499,
  deliveryPrice: 0,
  paymentSurcharge: 0,
  totalPrice: 499,
  estimatedDelivery: '1 stycznia 2027',
  createdAt: '2026-10-10T10:00:00Z',
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <OrderSuccessPage />
    </MemoryRouter>,
  );

describe('OrderSuccessPage organizer package note', () => {
  it('says the package activates after payment confirmation', () => {
    cart.lastOrder = order({ includesOrganizerPackage: true });
    renderPage();

    expect(
      screen.getByText(/Pakiet organizatora aktywuje się po potwierdzeniu płatności/),
    ).toBeInTheDocument();
  });

  it('shows no such note for an ordinary order', () => {
    cart.lastOrder = order({ includesOrganizerPackage: false });
    renderPage();

    expect(screen.queryByText(/aktywuje się po potwierdzeniu płatności/)).not.toBeInTheDocument();
  });
});
