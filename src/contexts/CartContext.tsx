import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CartItem, ShopProduct, OrderDetails } from '@/types';
import { mockShopProducts } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

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

  const getProduct = useCallback((productId: string) => {
    return mockShopProducts.find(p => p.id === productId);
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && i.size === item.size && i.color === item.color
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      
      return [...prev, item];
    });

    const product = getProduct(item.productId);
    toast({
      title: 'Dodano do koszyka',
      description: product?.name || 'Produkt został dodany',
    });
  }, [getProduct, toast]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const removeItemByVariant = useCallback((productId: string, size?: string, color?: string) => {
    setItems(prev => prev.filter(i => 
      !(i.productId === productId && i.size === size && i.color === color)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i => 
      i.productId === productId ? { ...i, quantity } : i
    ));
  }, [removeItem]);

  const updateItemQuantity = useCallback((productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeItemByVariant(productId, size, color);
      return;
    }
    setItems(prev => prev.map(i => 
      (i.productId === productId && i.size === size && i.color === color) 
        ? { ...i, quantity } 
        : i
    ));
  }, [removeItemByVariant]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0), 
    [items]
  );

  const totalPrice = useMemo(() => 
    items.reduce((sum, item) => {
      const product = getProduct(item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0), 
    [items, getProduct]
  );

  return (
    <CartContext.Provider value={{
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
    }}>
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
