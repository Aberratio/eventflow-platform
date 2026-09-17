import { renderHook, act, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/types';

// Cart items now persist to localStorage (E5.2), so every test must start
// from a clean store or state leaks between tests.
beforeEach(() => {
  localStorage.clear();
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(CartProvider, null, children);

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'p1',
  productName: 'Koszulka',
  unitPrice: 99,
  quantity: 1,
  ...overrides,
});

describe('CartContext', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
  });

  it('addItem adds a new item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem());
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(1);
  });

  it('addItem merges quantity for same variant', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem({ quantity: 2 }));
    });
    act(() => {
      result.current.addItem(makeItem({ quantity: 3 }));
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removeItem removes by productId', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem());
    });
    act(() => {
      result.current.removeItem('p1');
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('updateQuantity updates and removes if 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem());
    });
    act(() => {
      result.current.updateQuantity('p1', 5);
    });
    expect(result.current.items[0].quantity).toBe(5);
    act(() => {
      result.current.updateQuantity('p1', 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('clearCart empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem());
    });
    act(() => {
      result.current.addItem(makeItem({ productId: 'p2' }));
    });
    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('removeItemByVariant targets specific variant', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem({ size: 'M', color: 'red' }));
    });
    act(() => {
      result.current.addItem(makeItem({ size: 'L', color: 'blue' }));
    });
    act(() => {
      result.current.removeItemByVariant('p1', 'M', 'red');
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].size).toBe('L');
  });
});

// E5.2: the cart must survive a page reload, so items are persisted to
// localStorage and rehydrated on mount — guarded so a disabled/corrupt store
// never crashes the provider.
describe('CartContext localStorage persistence', () => {
  it('persists items to localStorage and restores them on remount', () => {
    const { result, unmount } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(makeItem());
    });
    expect(result.current.items).toHaveLength(1);
    unmount();

    const { result: result2 } = renderHook(() => useCart(), { wrapper });
    expect(result2.current.items).toHaveLength(1);
    expect(result2.current.items[0].productId).toBe('p1');
  });

  it('starts with an empty cart when localStorage content is corrupt', () => {
    localStorage.setItem('shop-cart-items', '{not valid json');

    expect(() =>
      render(React.createElement(CartProvider, null, React.createElement(Probe))),
    ).not.toThrow();
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  it('starts with an empty cart when localStorage.getItem throws', () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error('storage disabled');
    };

    try {
      expect(() =>
        render(React.createElement(CartProvider, null, React.createElement(Probe))),
      ).not.toThrow();
      expect(screen.getByTestId('items-count').textContent).toBe('0');
    } finally {
      window.localStorage.getItem = original;
    }
  });
});

const Probe = () => {
  const { items } = useCart();
  return React.createElement('div', { 'data-testid': 'items-count' }, items.length);
};
