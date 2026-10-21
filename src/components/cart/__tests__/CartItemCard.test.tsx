import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CartItemCard } from '@/components/cart/CartItemCard';
import type { CartItem } from '@/types';

const baseItem: CartItem = {
  productId: 'p1',
  productName: 'Koszulka biegowa',
  unitPrice: 50,
  quantity: 2,
  size: 'M',
  color: 'Czarny',
};

describe('CartItemCard', () => {
  it('renders product name, variant badges, unit price and computed total', () => {
    render(<CartItemCard item={baseItem} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('Koszulka biegowa')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Czarny')).toBeInTheDocument();
    // Unified money formatting now uses pl-PL locale formatting
    // (comma decimal separator) via the shared formatMoney utility.
    expect(screen.getByText('50,00 zł / szt.')).toBeInTheDocument();
    expect(screen.getByText('100,00 zł')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity with quantity - 1 when decreasing', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    render(<CartItemCard item={baseItem} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Zmniejsz ilość' }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(1);
  });

  it('calls onUpdateQuantity with quantity + 1 when increasing', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    render(<CartItemCard item={baseItem} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Zwiększ ilość' }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(3);
  });

  it('disables the decrease button when quantity is 1', () => {
    render(
      <CartItemCard
        item={{ ...baseItem, quantity: 1 }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Zmniejsz ilość' })).toBeDisabled();
  });

  it('calls onRemove when the remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<CartItemCard item={baseItem} onUpdateQuantity={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: /Usuń/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render variant badges when size and color are absent', () => {
    render(
      <CartItemCard
        item={{ ...baseItem, size: undefined, color: undefined }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText('M')).not.toBeInTheDocument();
    expect(screen.queryByText('Czarny')).not.toBeInTheDocument();
  });
});
