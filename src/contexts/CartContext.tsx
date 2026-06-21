import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CartItem, ShopProduct, OrderDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { appLogger } from '@/lib/logger';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  removeItemByVariant: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getProduct: (productId: string) => ShopProduct | undefined;
  lastOrder: OrderDetails | null;
  setLastOrder: (order: OrderDetails) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const { toast } = useToast();

  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.productId === item.productId && i.size === item.size && i.color === item.color,
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity += item.quantity;
          return updated;
        }

        return [...prev, item];
      });

      toast({
        title: 'Dodano do koszyka',
        description: item.productName,
      });
      appLogger.shop('cart_add', `Dodano do koszyka: ${item.productName} (ilość: ${item.quantity})`, {
        targetType: 'product', targetId: item.productId, targetName: item.productName,
        metadata: { quantity: item.quantity, size: item.size, color: item.color },
      });
    },
    [toast],
  );

  const removeItem = useCallback((productId: string) => {
    const item = items.find((i) => i.productId === productId);
    appLogger.shop('cart_remove', `Usunięto z koszyka: ${item?.productName ?? productId}`, {
      targetType: 'product', targetId: productId, targetName: item?.productName,
    });
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [items]);

  const removeItemByVariant = useCallback((productId: string, size?: string, color?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size && i.color === color)),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    },
    [removeItem],
  );

  const updateItemQuantity = useCallback(
    (productId: string, quantity: number, size?: string, color?: string) => {
      if (quantity <= 0) {
        removeItemByVariant(productId, size, color);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.size === size && i.color === color
            ? { ...i, quantity }
            : i,
        ),
      );
    },
    [removeItemByVariant],
  );

  const clearCart = useCallback(() => {
    if (items.length > 0) {
      appLogger.shop('cart_clear', `Wyczyszczono koszyk (${items.length} pozycji)`);
    }
    setItems([]);
  }, [items.length]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  // Kept for backward compatibility with components that resolve product details from cart
  const getProduct = useCallback((_productId: string): ShopProduct | undefined => {
    return undefined;
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        removeItemByVariant,
        updateQuantity,
        updateItemQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getProduct,
        lastOrder,
        setLastOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Safe version that returns default values if used outside provider
export const useCartSafe = () => {
  const context = useContext(CartContext);
  return (
    context ?? {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      removeItemByVariant: () => {},
      updateQuantity: () => {},
      updateItemQuantity: () => {},
      clearCart: () => {},
      totalItems: 0,
      totalPrice: 0,
      getProduct: () => undefined,
      lastOrder: null,
      setLastOrder: () => {},
    }
  );
};
