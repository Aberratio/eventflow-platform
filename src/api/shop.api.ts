import { simulateDelay } from './client';
import type { ApiResponse, PaginatedResponse, ShopProductFilters, OrderFilters } from './types';
import { mockShopProducts, mockDeliveryMethods, mockShopPaymentMethods, mockShopOrders } from './mock/shop.mock';
import type { ShopProduct, DeliveryMethod, ShopPaymentMethod, ShopOrder } from '@/types';

export async function getProducts(filters?: ShopProductFilters): Promise<PaginatedResponse<ShopProduct>> {
  await simulateDelay();
  let filtered = [...mockShopProducts];

  if (filters?.category) filtered = filtered.filter((p) => p.category === filters.category);
  if (filters?.inStock !== undefined) filtered = filtered.filter((p) => p.inStock === filters.inStock);
  if (filters?.minPrice !== undefined) filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  if (filters?.maxPrice !== undefined) filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1 };
}

export async function getProductBySlug(slug: string): Promise<ApiResponse<ShopProduct | null>> {
  await simulateDelay();
  const product = mockShopProducts.find((p) => p.slug === slug) ?? null;
  return { data: product, success: !!product };
}

export async function getProductById(id: string): Promise<ApiResponse<ShopProduct | null>> {
  await simulateDelay();
  const product = mockShopProducts.find((p) => p.id === id) ?? null;
  return { data: product, success: !!product };
}

export async function getDeliveryMethods(): Promise<ApiResponse<DeliveryMethod[]>> {
  await simulateDelay();
  return { data: [...mockDeliveryMethods], success: true };
}

export async function getShopPaymentMethods(): Promise<ApiResponse<ShopPaymentMethod[]>> {
  await simulateDelay();
  return { data: [...mockShopPaymentMethods], success: true };
}

export async function getOrders(userId?: string): Promise<ApiResponse<ShopOrder[]>> {
  await simulateDelay();
  const orders = userId ? mockShopOrders.filter((o) => o.userId === userId) : [...mockShopOrders];
  return { data: orders, success: true };
}

export async function getOrderById(id: string): Promise<ApiResponse<ShopOrder | null>> {
  await simulateDelay();
  const order = mockShopOrders.find((o) => o.id === id) ?? null;
  return { data: order, success: !!order };
}

export async function createOrder(data: Partial<ShopOrder>): Promise<ApiResponse<ShopOrder>> {
  await simulateDelay();
  const order: ShopOrder = {
    id: `order-${Date.now()}`,
    orderNumber: `ORD-${Date.now()}`,
    userId: '',
    items: [],
    deliveryMethod: mockDeliveryMethods[0],
    paymentMethod: mockShopPaymentMethods[0],
    productTotal: 0,
    deliveryPrice: 0,
    paymentSurcharge: 0,
    totalPrice: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...data,
  } as ShopOrder;
  return { data: order, success: true };
}

export async function updateOrderStatus(
  id: string,
  status: ShopOrder['status'],
  trackingNumber?: string,
): Promise<ApiResponse<ShopOrder>> {
  await simulateDelay();
  const order = mockShopOrders.find((o) => o.id === id);
  if (!order) return { data: null as unknown as ShopOrder, success: false, message: 'Order not found' };
  return { data: { ...order, status, trackingNumber: trackingNumber ?? order.trackingNumber }, success: true };
}
