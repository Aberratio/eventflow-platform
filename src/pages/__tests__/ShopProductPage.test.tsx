import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShopProductPage from '../ShopProductPage';

// Regression test for TD.3: `handleAddToCart` used to build the CartItem
// without `productName`/`unitPrice`, which are required for the cart's
// toast message, activity log, and total-price calculation. This asserts
// the real product data reaches `addItem`, not just that the call happens.

const { testProduct, mockAddItem } = vi.hoisted(() => ({
  testProduct: {
    id: 'p1',
    name: 'Koszulka biegowa',
    slug: 'koszulka-biegowa',
    description: 'Opis',
    price: 129,
    category: 'apparel',
    brand: 'Marka',
    imageUrl: '/test.jpg',
    inStock: true,
  },
  mockAddItem: vi.fn(),
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getProductBySlug: vi.fn().mockResolvedValue({ data: testProduct }),
    getShopCategories: vi.fn().mockResolvedValue({ data: [] }),
  };
});

vi.mock('@/contexts/CartContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/CartContext')>('@/contexts/CartContext');
  return {
    ...actual,
    useCart: () => ({ addItem: mockAddItem }),
  };
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/shop/koszulka-biegowa']}>
        <Routes>
          <Route path="/shop/:slug" element={<ShopProductPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ShopProductPage add to cart', () => {
  it('sends the real product name and price to addItem', async () => {
    const user = userEvent.setup();
    renderPage();

    const addButton = await screen.findByRole('button', { name: 'Dodaj do koszyka' });
    await user.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p1',
        productName: 'Koszulka biegowa',
        unitPrice: 129,
        quantity: 1,
      }),
    );
  });
});
