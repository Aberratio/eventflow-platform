import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ProductCard } from './ProductCard';
import type { ShopProduct } from '@/types';

// D-03: prices go through formatMoney (pl-PL, two decimals), never raw `${price} zł`.
describe('ProductCard price', () => {
  it('formats price and original price with formatMoney', () => {
    render(
      <ProductCard
        product={
          {
            id: 'p1',
            name: 'Koszulka',
            slug: 'koszulka',
            price: 49.5,
            originalPrice: 699,
            imageUrl: '/x.jpg',
            inStock: true,
          } as ShopProduct
        }
      />,
    );
    expect(screen.getByText('49,50 zł')).toBeInTheDocument();
    expect(screen.getByText('699,00 zł')).toBeInTheDocument();
  });
});
