import type { MerchandiseColor } from './event';

export type ShopCategory = 'apparel' | 'footwear' | 'accessories' | 'nutrition' | 'electronics' | 'services';

export interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description?: string;
}

export interface ShopPaymentMethod {
  id: string;
  name: string;
  icon?: string;
  surcharge?: number;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ShopCategory;
  brand: string;
  sizes?: string[];
  colors?: MerchandiseColor[];
  imageUrl: string;
  images?: string[];
  inStock: boolean;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  isService?: boolean;
  serviceDetails?: string;
  validityDays?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface OrderDetails {
  orderId: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: ShopPaymentMethod;
  productTotal: number;
  deliveryPrice: number;
  paymentSurcharge: number;
  totalPrice: number;
  estimatedDelivery: string;
  createdAt: string;
}

export interface ShopOrderAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  phone?: string;
  paczkomatId?: string;
}

export interface ShopOrderInvoice {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

export type OrderHistoryAction = 'status_change' | 'items_edited' | 'price_adjustment' | 'tracking_updated' | 'notes_updated' | 'cancel_reason' | 'created';

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: OrderHistoryAction;
  description: string;
  previousValue?: string;
  newValue?: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: ShopPaymentMethod;
  productTotal: number;
  deliveryPrice: number;
  paymentSurcharge: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
  trackingNumber?: string;
  shippingAddress?: ShopOrderAddress;
  invoiceData?: ShopOrderInvoice;
  customerNotes?: string;
  adminNotes?: string;
  cancelReason?: string;
  priceAdjustment?: number;
  history?: OrderHistoryEntry[];
}
