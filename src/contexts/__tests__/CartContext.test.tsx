import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/types';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(CartProvider, null, children);

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'p1',
  quantity: 1,
  ...overrides,
});

describe('CartContext', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('addItem adds a new item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem()); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(50);
  });

  it('addItem merges quantity for same variant', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem({ quantity: 2 })); });
    act(() => { result.current.addItem(makeItem({ quantity: 3 })); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removeItem removes by productId', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem()); });
    act(() => { result.current.removeItem('p1'); });
    expect(result.current.items).toHaveLength(0);
  });

  it('updateQuantity updates and removes if 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem()); });
    act(() => { result.current.updateQuantity('p1', 5); });
    expect(result.current.items[0].quantity).toBe(5);
    act(() => { result.current.updateQuantity('p1', 0); });
    expect(result.current.items).toHaveLength(0);
  });

  it('clearCart empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem()); });
    act(() => { result.current.addItem(makeItem({ productId: 'p2' })); });
    act(() => { result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
  });

  it('removeItemByVariant targets specific variant', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addItem(makeItem({ size: 'M', color: 'red' })); });
    act(() => { result.current.addItem(makeItem({ size: 'L', color: 'blue' })); });
    act(() => { result.current.removeItemByVariant('p1', 'M', 'red'); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].size).toBe('L');
  });
});
