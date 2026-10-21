import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShopProductPage from '../ShopProductPage';

// Regression test: `handleAddToCart` used to build the CartItem
// without `productName`/`unitPrice`, which are required for the cart's
// toast message, activity log, and total-price calculation. This asserts
// the real product data reaches `addItem`, not just that the call happens.

const { testProduct, variantProduct, outOfStockProduct, mockAddItem } = vi.hoisted(() => ({
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
  variantProduct: {
    id: 'p2',
    name: 'Bluza z kapturem',
    slug: 'bluza-z-kapturem',
    description: 'Opis bluzy',
    price: 199,
    category: 'apparel',
    brand: 'Marka',
    imageUrl: '/hoodie.jpg',
    inStock: true,
    stockCount: 5,
    sizes: ['S', 'M', 'L'],
    colors: [
      { id: 'black', name: 'Czarny', hex: '#000000' },
      { id: 'red', name: 'Czerwony', hex: '#FF0000' },
    ],
  },
  outOfStockProduct: {
    id: 'p3',
    name: 'Czapka zimowa',
    slug: 'czapka-zimowa',
    description: 'Opis czapki',
    price: 49,
    category: 'apparel',
    brand: 'Marka',
    imageUrl: '/cap.jpg',
    inStock: false,
  },
  mockAddItem: vi.fn(),
}));

const productBySlug: Record<string, unknown> = {
  'koszulka-biegowa': testProduct,
  'bluza-z-kapturem': variantProduct,
  'czapka-zimowa': outOfStockProduct,
};

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getProductBySlug: vi.fn((slug: string) => Promise.resolve({ data: productBySlug[slug] })),
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

const renderPage = (slug = 'koszulka-biegowa') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/shop/${slug}`]}>
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

// The size/color pickers are the only UI for choosing a variant before
// checkout — a regression here would silently add the wrong variant (or none)
// to the cart. These exercise the real selection state, not just rendering.
describe('ShopProductPage variant selection', () => {
  it('defaults to the first size/color and sends the selection to addItem', async () => {
    const user = userEvent.setup();
    renderPage('bluza-z-kapturem');

    const addButton = await screen.findByRole('button', { name: 'Dodaj do koszyka' });
    await user.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p2',
        size: 'S',
        color: 'black',
      }),
    );
  });

  it('sends the newly picked size and color once the shopper changes them', async () => {
    const user = userEvent.setup();
    renderPage('bluza-z-kapturem');

    await user.click(await screen.findByRole('button', { name: 'L' }));
    await user.click(screen.getByTitle('Czerwony'));
    await user.click(screen.getByRole('button', { name: 'Dodaj do koszyka' }));

    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p2',
        size: 'L',
        color: 'red',
      }),
    );
  });

  it('caps quantity at the available stock count', async () => {
    const user = userEvent.setup();
    renderPage('bluza-z-kapturem');

    const increment = await screen.findByRole('button', { name: 'Zwiększ ilość' });
    for (let i = 0; i < 10; i++) {
      await user.click(increment);
    }

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(increment).toBeDisabled();
  });
});

describe('ShopProductPage stock gating', () => {
  it('disables the add-to-cart button and shows unavailable copy for an out-of-stock product', async () => {
    mockAddItem.mockClear();
    renderPage('czapka-zimowa');

    const button = await screen.findByRole('button', { name: 'Produkt niedostępny' });
    expect(button).toBeDisabled();
    expect(mockAddItem).not.toHaveBeenCalled();
  });
});
