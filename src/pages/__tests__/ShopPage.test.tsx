import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import ShopPage from '../ShopPage';

// jsdom does not implement the Pointer Events methods Radix's Select uses;
// stub them the same way AddDiscountCodeDialog.test.tsx does.
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: () => false,
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => undefined,
});

// The catalog's client-side filtering (search/category/brand) is the
// only place that decides what a shopper actually sees on /shop — a bug here
// silently hides or leaks products. This exercises the real filter logic in
// ShopPage against a small fixed product set instead of mocking it away.

const { products, categories } = vi.hoisted(() => ({
  products: [
    {
      id: 'p1',
      name: 'Koszulka biegowa',
      slug: 'koszulka-biegowa',
      description: 'Lekka koszulka',
      price: 99,
      category: 'apparel',
      brand: 'RunFast',
      imageUrl: '/shirt.jpg',
      inStock: true,
    },
    {
      id: 'p2',
      name: 'Buty trailowe',
      slug: 'buty-trailowe',
      description: 'Buty na trudny teren',
      price: 399,
      category: 'footwear',
      brand: 'TrailPro',
      imageUrl: '/shoes.jpg',
      inStock: true,
    },
  ],
  categories: [
    { id: 'apparel', name: 'Odzież', sortOrder: 1 },
    { id: 'footwear', name: 'Obuwie', sortOrder: 2 },
  ],
}));

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getProducts: vi.fn().mockResolvedValue({ data: products }),
    getShopCategories: vi.fn().mockResolvedValue({ data: categories }),
  };
});

describe('ShopPage filtering', () => {
  it('shows all products by default', async () => {
    render(<ShopPage />);

    expect(await screen.findByText('Koszulka biegowa')).toBeInTheDocument();
    expect(screen.getByText('Buty trailowe')).toBeInTheDocument();
  });

  it('filters by search text across name, brand and description', async () => {
    const user = userEvent.setup();
    render(<ShopPage />);
    await screen.findByText('Koszulka biegowa');

    await user.type(screen.getByPlaceholderText('Szukaj produktów...'), 'trail');

    expect(screen.queryByText('Koszulka biegowa')).not.toBeInTheDocument();
    expect(screen.getByText('Buty trailowe')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    render(<ShopPage />);
    await screen.findByText('Koszulka biegowa');

    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: 'Obuwie' }));

    expect(screen.queryByText('Koszulka biegowa')).not.toBeInTheDocument();
    expect(screen.getByText('Buty trailowe')).toBeInTheDocument();
  });

  it('shows an empty state and lets the user clear filters when nothing matches', async () => {
    const user = userEvent.setup();
    render(<ShopPage />);
    await screen.findByText('Koszulka biegowa');

    await user.type(screen.getByPlaceholderText('Szukaj produktów...'), 'nonexistent-product-xyz');

    expect(await screen.findByText('Nie znaleziono produktów')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));

    expect(await screen.findByText('Koszulka biegowa')).toBeInTheDocument();
    expect(screen.getByText('Buty trailowe')).toBeInTheDocument();
  });
});
