/**
 * Mock API Adapter — implements the full ApiAdapter contract using in-memory data.
 *
 * This is the default adapter used during development.
 * Replace with a real adapter (e.g., Supabase) for production.
 */

import type { ApiAdapter } from '../contract';
import { httpAdapter } from './http.adapter';
import type {
  ApiResponse,
  PaginatedResponse,
  EventFilters,
  UserFilters,
  ResultFilters,
  RegistrationFilters,
  ShopProductFilters,
  ActivityLogFilters,
  VirtualResultFilters,
  SeriesFilters,
} from '../types';
import type { SalesStats } from '@/types/admin';
import type {
  Event,
  User,
  UserRole,
  Result,
  PersonalRecord,
  TeamResult,
  EventResultDocument,
  EventSeries,
  ShopProduct,
  ShopCategoryConfig,
  DeliveryMethod,
  ShopPaymentMethod,
  ShopOrder,
  Challenge,
  ChallengeParticipation,
  ChallengeEntry,
  ChallengeEntryStatus,
  Message,
  Ticket,
  Certificate,
  Partner,
  GlobalInsuranceSettings,
  AdminActivityLog,
  SecuritySettings,
  OnlineSession,
  InfoPage,
  GoogleCalendarSettings,
  VirtualResultSubmission,
  VirtualResultSubmissionStatus,
  PaymentDetails,
  OrganizerEventLimit,
} from '@/types';
import {
  EMAIL_VARIABLES,
  SYSTEM_TRIGGER_TYPES,
  type CreateEmailTemplatePayload,
  EmailTemplate,
  type EmailPreviewRequest,
  type EmailPreviewResult,
  EmailSendLog,
  type EmailTemplateVariable,
  type SendEmailResult,
} from '@/types/email';
import type {
  CreateEventPayload,
  UpdateEventPayload,
  CreateUserPayload,
  UpdateUserPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  CreateRegistrationPayload,
  UpdateRegistrationPayload,
  CreateResultPayload,
  UpdateResultPayload,
  CreateOrderPayload,
  CreateInfoPagePayload,
  UpdateInfoPagePayload,
} from '../payloads';
import { STORAGE_KEYS } from '@/constants';

// ── Mock data imports ──
import { mockUsers } from '../mock/users.mock';
import { mockEvents } from '../mock/events.mock';
import {
  mockResults,
  mockPersonalRecords,
  mockTeamResults,
  mockResultDocuments,
} from '../mock/results.mock';
import { mockSeries } from '../mock/series.mock';
import {
  mockShopProducts,
  mockDeliveryMethods,
  mockShopPaymentMethods,
  mockShopOrders,
} from '../mock/shop.mock';
import { mockChallenges, mockChallengeParticipations } from '../mock/challenges.mock';
import { mockMessages } from '../mock/messages.mock';
import { mockTickets, mockCertificates } from '../mock/tickets.mock';
import { mockPartners } from '../mock/partners.mock';
import { mockGlobalInsuranceSettings } from '../mock/insurance.mock';
import {
  mockAdminActivityLogs,
  mockSecuritySettings,
  mockOnlineSessions,
  mockSalesStats,
} from '../mock/admin.mock';
import { mockInfoPages } from '../mock/cms.mock';
import { mockGoogleCalendarSettings } from '../mock/calendar.mock';
import { mockVirtualResultSubmissions } from '../mock/virtual-results.mock';
import { mockEmailTemplates, mockEmailSendLogs } from '../mock/email-templates.mock';

// ── Simulate network latency ──
const DELAY_MIN = 150;
const DELAY_MAX = 300;

async function delay(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
  return new Promise((r) => setTimeout(r, ms));
}

// ── Helpers ──
function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { data, success: true, message };
}

function fail<T>(data: T, message: string): ApiResponse<T> {
  return { data, success: false, message };
}

function paginated<T>(data: T[]): PaginatedResponse<T> {
  return { data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
}

// ── Mutable state for email templates (mock CRUD) ──
let emailTemplates: EmailTemplate[] = [...mockEmailTemplates];
let emailLogs: EmailSendLog[] = [...mockEmailSendLogs];
let nextTemplateId = 100;
let shopProducts: ShopProduct[] = [...mockShopProducts];
let partners: Partner[] = [...mockPartners];
let shopCategories: ShopCategoryConfig[] = Object.entries({
  apparel: 'Odzież',
  footwear: 'Obuwie',
  accessories: 'Akcesoria',
  nutrition: 'Odżywianie',
  electronics: 'Elektronika',
  services: 'Usługi',
}).map(([id, name], index) => ({ id, name, sortOrder: index, status: 'active' }));

const MOCK_TOKEN_PREFIX = 'mock-user:';
const MOCK_EVENT_LIMITS_KEY = 'mock-event-limits';

function getMockEventLimitsStore(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(MOCK_EVENT_LIMITS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function setMockEventLimit(organizerId: string, limit: number): void {
  const store = getMockEventLimitsStore();
  store[organizerId] = limit;
  window.localStorage.setItem(MOCK_EVENT_LIMITS_KEY, JSON.stringify(store));
  const organizer = mockUsers.find((user) => user.id === organizerId);
  if (organizer) organizer.eventLimit = limit;
}

function issueMockToken(user: User): string {
  return `${MOCK_TOKEN_PREFIX}${user.id}`;
}

function getMockTokenUser(): User | null {
  const token =
    typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEYS.API_TOKEN);
  if (!token?.startsWith(MOCK_TOKEN_PREFIX)) return null;
  const userId = token.slice(MOCK_TOKEN_PREFIX.length);
  return mockUsers.find((user) => user.id === userId) ?? null;
}

function storeMockToken(user: User): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.API_TOKEN, issueMockToken(user));
}

function clearMockToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.API_TOKEN);
}

function getMockOrganizerEventLimit(organizerId: string): OrganizerEventLimit {
  const store = getMockEventLimitsStore();
  const organizer = mockUsers.find((user) => user.id === organizerId);
  const limit = store[organizerId] ?? organizer?.eventLimit ?? 0;
  const used = mockEvents.filter(
    (event) => event.organizerId === organizerId && event.status !== 'deleted',
  ).length;

  return {
    limit,
    used,
    available: Math.max(0, limit - used),
  };
}

// ─────────────────────────────────────────────────────────
// Mock Adapter Implementation
// ─────────────────────────────────────────────────────────

export const mockAdapter: ApiAdapter = {
  // ── Events — delegated to HTTP adapter ──

  async getEvents(filters) {
    await delay();
    let filtered = [...mockEvents];
    if (!filters?.includePrivate) filtered = filtered.filter((event) => !event.isPrivate);
    if (!filters?.includeUnpublished) {
      filtered = filtered.filter((event) => ['active', 'past', 'archived'].includes(event.status));
    } else if (!filters?.includeDeleted) {
      filtered = filtered.filter((event) => event.status !== 'deleted');
    }
    if (filters?.discipline) {
      filtered = filtered.filter((event) => event.discipline === filters.discipline);
    }
    if (filters?.city) {
      filtered = filtered.filter((event) => event.city === filters.city);
    }
    if (filters?.status) {
      filtered = filtered.filter((event) => event.status === filters.status);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query),
      );
    }
    return paginated(filtered);
  },
  async getEventBySlug(slug) {
    await delay();
    return ok(mockEvents.find((event) => event.slug === slug) ?? null);
  },
  async getEventById(id) {
    await delay();
    return ok(mockEvents.find((event) => event.id === id) ?? null);
  },
  async createEvent(data) {
    await delay();
    const event: Event = {
      id: `e-${Date.now()}`,
      status: 'draft',
      featured: false,
      isVirtual: false,
      ...data,
      organizerName: data.organizerName ?? 'Mock Organizer',
      imageUrl: data.imageUrl ?? 'https://example.test/event.jpg',
      distances: data.distances ?? [],
    } as Event;
    mockEvents.push(event);
    return ok(event, 'Event created');
  },
  async updateEvent(id, data) {
    await delay();
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index === -1) return fail(null, 'Event not found');
    mockEvents[index] = { ...mockEvents[index], ...data };
    return ok(mockEvents[index]);
  },
  async deleteEvent(id) {
    await delay();
    const event = mockEvents.find((item) => item.id === id);
    if (event) event.status = 'deleted';
    return ok(undefined as unknown as void);
  },
  async updateEventStatus(id, status, reason) {
    await delay();
    if (['awaiting_approval', 'approved', 'active'].includes(status)) {
      return fail(null, 'Use moderation workflow actions');
    }
    const event = mockEvents.find((item) => item.id === id);
    if (!event) return fail(null, 'Event not found');
    event.status = status;
    event.rejectionReason = reason;
    return ok(event);
  },
  async submitEvent(id) {
    await delay();
    const event = mockEvents.find((item) => item.id === id);
    if (!event || event.status !== 'draft') return fail(null, 'Invalid status transition');
    event.status = 'awaiting_approval';
    event.submittedAt = new Date().toISOString();
    return ok(event);
  },
  async approveEvent(id) {
    await delay();
    const event = mockEvents.find((item) => item.id === id);
    if (!event || event.status !== 'awaiting_approval') {
      return fail(null, 'Invalid status transition');
    }
    event.status = 'approved';
    event.approvedAt = new Date().toISOString();
    return ok(event);
  },
  async rejectEvent(id, reason) {
    await delay();
    const event = mockEvents.find((item) => item.id === id);
    if (!event || event.status !== 'awaiting_approval') {
      return fail(null, 'Invalid status transition');
    }
    event.status = 'draft';
    event.rejectionReason = reason;
    return ok(event);
  },
  async publishEvent(id) {
    await delay();
    const event = mockEvents.find((item) => item.id === id);
    if (!event || event.status !== 'approved') return fail(null, 'Invalid status transition');
    event.status = 'active';
    event.publishedAt = new Date().toISOString();
    return ok(event);
  },
  async getFeaturedEvents() {
    await delay();
    return ok(mockEvents.filter((event) => event.featured && event.status === 'active'));
  },
  async getLiveEvents() {
    await delay();
    return ok(mockEvents.filter((event) => event.isLive && event.status === 'active'));
  },
  async getEventsByOrganizer(organizerId) {
    await delay();
    return ok(mockEvents.filter((event) => event.organizerId === organizerId));
  },
  async getOrganizerEventLimit(organizerId) {
    await delay();
    return ok(getMockOrganizerEventLimit(organizerId));
  },
  async updateOrganizerEventLimit(organizerId, limit) {
    await delay();
    setMockEventLimit(organizerId, limit);
    return ok(getMockOrganizerEventLimit(organizerId));
  },
  uploadEventImage: (...args) => httpAdapter.uploadEventImage(...args),
  uploadEventDocument: (...args) => httpAdapter.uploadEventDocument(...args),

  // ── Registrations — delegated to HTTP adapter ──

  getRegistrations: (...args) => httpAdapter.getRegistrations(...args),
  getRegistrationsByEvent: (...args) => httpAdapter.getRegistrationsByEvent(...args),
  getPublicStartList: (...args) => httpAdapter.getPublicStartList(...args),
  getRegistrationsByUser: (...args) => httpAdapter.getRegistrationsByUser(...args),
  createRegistration: (...args) => httpAdapter.createRegistration(...args),
  updateRegistration: (...args) => httpAdapter.updateRegistration(...args),
  cancelRegistration: (...args) => httpAdapter.cancelRegistration(...args),
  updatePaymentDetails: (...args) => httpAdapter.updatePaymentDetails(...args),

  async getUsers(filters) {
    await delay();
    let filtered = [...mockUsers];
    if (filters?.role) filtered = filtered.filter((u) => u.role === filters.role);
    if (filters?.status)
      filtered = filtered.filter((u) => (u.status ?? 'active') === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return paginated(filtered);
  },

  async getUserById(id) {
    await delay();
    const user = mockUsers.find((u) => u.id === id) ?? null;
    return user ? ok(user) : fail(null, 'User not found');
  },

  async getUserByEmail(email) {
    await delay();
    const user = mockUsers.find((u) => u.email === email) ?? null;
    return user ? ok(user) : fail(null, 'User not found');
  },

  async createUser(data) {
    await delay();
    const newUser: User = { id: `u-${Date.now()}`, ...data } as User;
    return ok(newUser);
  },

  async updateUser(id, data) {
    await delay();
    const user = mockUsers.find((u) => u.id === id);
    if (!user) return fail(null as unknown as User, 'User not found');
    return ok({ ...user, ...data });
  },

  async deleteUser(id) {
    await delay();
    return ok(undefined as unknown as void);
  },

  async updateUserRole(id, role) {
    return this.updateUser(id, { role });
  },

  async updateUserStatus(id, status) {
    return this.updateUser(id, { status });
  },

  async getParticipants() {
    await delay();
    return ok(mockUsers.filter((u) => u.role === 'participant'));
  },

  async getOrganizers() {
    await delay();
    return ok(mockUsers.filter((u) => u.role === 'organizer'));
  },

  async uploadAvatar(file) {
    await delay();
    return ok({ url: URL.createObjectURL(file) });
  },

  // ── Auth ──

  async login(credentials) {
    await delay();
    const user = mockUsers.find((u) => u.email === credentials.email) ?? null;
    if (!user) return fail(null, 'Invalid credentials');
    storeMockToken(user);
    return ok(user);
  },

  async loginByRole(role) {
    await delay();
    const user = mockUsers.find((u) => u.role === role) ?? null;
    if (!user) return fail(null, 'User not found');
    storeMockToken(user);
    return ok(user);
  },

  async logout() {
    await delay();
    clearMockToken();
    return ok(undefined as unknown as void);
  },

  async getCurrentUser() {
    await delay();
    return ok(getMockTokenUser());
  },

  async register(data) {
    await delay();
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role ?? 'participant',
      isNewUser: true,
    };
    mockUsers.push(newUser);
    storeMockToken(newUser);
    return ok(newUser);
  },

  async resetPassword(_payload) {
    await delay();
    return ok(undefined as unknown as void, 'Password reset email sent');
  },

  async changePassword(_payload) {
    await delay();
    return ok(undefined as unknown as void, 'Password changed');
  },

  // ── Results ──

  async getResults(filters) {
    await delay();
    let filtered = [...mockResults];
    if (filters?.eventId) filtered = filtered.filter((r) => r.eventId === filters.eventId);
    if (filters?.distanceId) filtered = filtered.filter((r) => r.distanceId === filters.distanceId);
    if (filters?.category) filtered = filtered.filter((r) => r.category === filters.category);
    if (filters?.gender) filtered = filtered.filter((r) => r.gender === filters.gender);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.bibNumber.includes(q),
      );
    }
    return paginated(filtered);
  },

  async getResultsByEvent(eventId, distanceId) {
    await delay();
    let results = mockResults.filter((r) => r.eventId === eventId);
    if (distanceId) results = results.filter((r) => r.distanceId === distanceId);
    return ok(results);
  },

  async getResultsByUser(userId) {
    await delay();
    return ok(mockResults.filter((r) => r.userId === userId));
  },

  async createResult(data) {
    await delay();
    const result: Result = { id: `res-${Date.now()}`, ...data } as Result;
    return ok(result);
  },

  async updateResult(id, data) {
    await delay();
    const result = mockResults.find((r) => r.id === id);
    if (!result) return fail(null as unknown as Result, 'Result not found');
    return ok({ ...result, ...data } as Result);
  },

  async deleteResult(id) {
    await delay();
    return ok(undefined as unknown as void);
  },

  async getPersonalRecords(userId) {
    await delay();
    void userId;
    return ok([...mockPersonalRecords]);
  },

  async getTeamResults(eventId) {
    await delay();
    return ok(mockTeamResults.filter((t) => t.eventId === eventId));
  },

  async getResultDocuments(eventId) {
    await delay();
    return ok(mockResultDocuments.filter((d) => d.eventId === eventId));
  },

  async uploadResultDocument(data) {
    await delay();
    const doc: EventResultDocument = {
      id: `doc-${Date.now()}`,
      eventId: '',
      name: '',
      type: 'open',
      fileUrl: '',
      uploadedAt: new Date().toISOString(),
      uploadedBy: '',
      ...data,
    } as EventResultDocument;
    return ok(doc);
  },

  // ── Series ──

  async getSeries(filters) {
    await delay();
    let filtered = [...mockSeries];
    if (filters?.type) filtered = filtered.filter((s) => s.type === filters.type);
    if (filters?.status) filtered = filtered.filter((s) => s.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }
    return paginated(filtered);
  },

  async getSeriesById(id) {
    await delay();
    const series = mockSeries.find((s) => s.id === id) ?? null;
    return series ? ok(series) : fail(null, 'Series not found');
  },

  async getSeriesBySlug(slug) {
    await delay();
    const series = mockSeries.find((s) => s.slug === slug) ?? null;
    return series ? ok(series) : fail(null, 'Series not found');
  },

  async createSeries(data) {
    await delay();
    const series = { id: `series-${Date.now()}`, ...data } as EventSeries;
    mockSeries.push(series);
    return ok(series);
  },

  async updateSeries(id, data) {
    await delay();
    const index = mockSeries.findIndex((s) => s.id === id);
    if (index === -1) return fail(null as unknown as EventSeries, 'Series not found');
    mockSeries[index] = { ...mockSeries[index], ...data } as EventSeries;
    return ok(mockSeries[index]);
  },

  async archiveSeries(id) {
    return this.updateSeries(id, { status: 'archived' });
  },

  // ── Shop ──

  async getProducts(filters) {
    await delay();
    let filtered = [...shopProducts];
    if (!filters?.includeArchived) filtered = filtered.filter((p) => p.status !== 'archived');
    if (filters?.category) filtered = filtered.filter((p) => p.category === filters.category);
    if (filters?.inStock !== undefined)
      filtered = filtered.filter((p) => p.inStock === filters.inStock);
    if (filters?.minPrice !== undefined)
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    if (filters?.maxPrice !== undefined)
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    return paginated(filtered);
  },

  async getProductBySlug(slug) {
    await delay();
    const product = shopProducts.find((p) => p.slug === slug && p.status !== 'archived') ?? null;
    return product ? ok(product) : fail(null, 'Product not found');
  },

  async getProductById(id) {
    await delay();
    const product = shopProducts.find((p) => p.id === id) ?? null;
    return product ? ok(product) : fail(null, 'Product not found');
  },

  async createProduct(data) {
    await delay();
    const product = { id: `prod-${Date.now()}`, status: 'active', ...data } as ShopProduct;
    shopProducts = [...shopProducts, product];
    return ok(product);
  },

  async updateProduct(id, data) {
    await delay();
    const index = shopProducts.findIndex((p) => p.id === id);
    if (index === -1) return fail(null as unknown as ShopProduct, 'Product not found');
    shopProducts[index] = { ...shopProducts[index], ...data };
    return ok(shopProducts[index]);
  },

  async deleteProduct(id) {
    await delay();
    shopProducts = shopProducts.map((p) => (p.id === id ? { ...p, status: 'archived' } : p));
    return ok(undefined as unknown as void);
  },

  async getShopCategories(includeArchived) {
    await delay();
    return ok(
      includeArchived
        ? [...shopCategories]
        : shopCategories.filter((category) => category.status !== 'archived'),
    );
  },

  async createShopCategory(data) {
    await delay();
    const category: ShopCategoryConfig = {
      id: data.id,
      name: data.name,
      sortOrder: data.sortOrder ?? shopCategories.length,
      status: 'active',
    };
    shopCategories = [...shopCategories, category];
    return ok(category);
  },

  async updateShopCategory(id, data) {
    await delay();
    const index = shopCategories.findIndex((category) => category.id === id);
    if (index === -1) return fail(null as unknown as ShopCategoryConfig, 'Category not found');
    shopCategories[index] = { ...shopCategories[index], ...data };
    return ok(shopCategories[index]);
  },

  async deleteShopCategory(id) {
    await delay();
    shopCategories = shopCategories.map((category) =>
      category.id === id ? { ...category, status: 'archived' } : category,
    );
    return ok(undefined as unknown as void);
  },

  async getDeliveryMethods() {
    await delay();
    return ok([...mockDeliveryMethods]);
  },

  async getShopPaymentMethods() {
    await delay();
    return ok([...mockShopPaymentMethods]);
  },

  async getOrders(userId) {
    await delay();
    const orders = userId ? mockShopOrders.filter((o) => o.userId === userId) : [...mockShopOrders];
    return ok(orders);
  },

  async getOrderById(id) {
    await delay();
    const order = mockShopOrders.find((o) => o.id === id) ?? null;
    return order ? ok(order) : fail(null, 'Order not found');
  },

  async createOrder(data) {
    await delay();
    const order: ShopOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      items: [],
      productTotal: 0,
      deliveryPrice: 0,
      paymentSurcharge: 0,
      totalPrice: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...data,
    } as ShopOrder;
    return ok(order);
  },

  async updateOrderStatus(id, status, trackingNumber) {
    await delay();
    const order = mockShopOrders.find((o) => o.id === id);
    if (!order) return fail(null as unknown as ShopOrder, 'Order not found');
    return ok({ ...order, status, trackingNumber: trackingNumber ?? order.trackingNumber });
  },

  // ── Challenges ──

  async getChallenges(filters) {
    await delay();
    let filtered = [...mockChallenges];
    if (!filters?.includeArchived) filtered = filtered.filter((c) => c.status !== 'archived');
    if (filters?.status) filtered = filtered.filter((c) => c.status === filters.status);
    if (filters?.seriesId) filtered = filtered.filter((c) => c.seriesId === filters.seriesId);
    if (filters?.search)
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(filters.search!.toLowerCase()),
      );
    return ok(filtered);
  },

  async getChallengeBySlug(slug) {
    await delay();
    const ch = mockChallenges.find((c) => c.slug === slug) ?? null;
    return ch ? ok(ch) : fail(null, 'Challenge not found');
  },

  async getChallengeById(id) {
    await delay();
    const ch = mockChallenges.find((c) => c.id === id) ?? null;
    return ch ? ok(ch) : fail(null, 'Challenge not found');
  },

  async createChallenge(data) {
    await delay();
    const challenge = {
      id: `challenge-${Date.now()}`,
      rewards: [],
      createdBy: 'mock',
      ...data,
    } as Challenge;
    mockChallenges.push(challenge);
    return ok(challenge);
  },

  async updateChallenge(id, data) {
    await delay();
    const index = mockChallenges.findIndex((c) => c.id === id);
    if (index === -1) return fail(null as unknown as Challenge, 'Challenge not found');
    mockChallenges[index] = { ...mockChallenges[index], ...data } as Challenge;
    return ok(mockChallenges[index]);
  },

  async archiveChallenge(id) {
    return this.updateChallenge(id, { status: 'archived' });
  },

  async getChallengeParticipations(challengeId, userId) {
    await delay();
    let result = [...mockChallengeParticipations];
    if (challengeId) result = result.filter((p) => p.challengeId === challengeId);
    if (userId) result = result.filter((p) => p.userId === userId);
    return ok(result);
  },

  async joinChallenge(challengeId) {
    await delay();
    const participation: ChallengeParticipation = {
      id: `cp-${Date.now()}`,
      challengeId,
      userId: '',
      userName: '',
      joinedAt: new Date().toISOString(),
      entries: [],
      completedCount: 0,
      isCompleted: false,
      rewardGranted: false,
    };
    return ok(participation);
  },

  async submitChallengeEntry(data) {
    await delay();
    const entry: ChallengeEntry = {
      id: `ce-${Date.now()}`,
      challengeId: '',
      userId: '',
      eventId: '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...data,
    } as ChallengeEntry;
    return ok(entry);
  },

  async reviewChallengeEntry(entryId, status, reason) {
    await delay();
    const entry: ChallengeEntry = {
      id: entryId,
      challengeId: '',
      userId: '',
      eventId: '',
      status,
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    } as ChallengeEntry;
    return ok(entry);
  },

  // ── Messages ──

  async getMessages(userId) {
    await delay();
    return ok(mockMessages.filter((m) => m.toId === userId || m.fromId === userId));
  },

  async getMessage(id) {
    await delay();
    const msg = mockMessages.find((m) => m.id === id) ?? null;
    return msg ? ok(msg) : fail(null, 'Message not found');
  },

  async sendMessage(data) {
    await delay();
    const msg: Message = {
      id: `msg-${Date.now()}`,
      fromId: '',
      fromName: '',
      toId: '',
      subject: '',
      content: '',
      sentAt: new Date().toISOString(),
      read: false,
      ...data,
    } as Message;
    return ok(msg);
  },

  async markAsRead(id) {
    await delay();
    const msg = mockMessages.find((m) => m.id === id);
    if (!msg) return fail(null as unknown as Message, 'Message not found');
    return ok({ ...msg, read: true });
  },

  // ── Tickets ──

  async getTickets(userId) {
    await delay();
    return ok(mockTickets.filter((t) => t.participantId === userId));
  },

  async getCertificates(userId) {
    await delay();
    void userId;
    return ok([...mockCertificates]);
  },

  // ── Partners ──

  async getPartners() {
    await delay();
    return ok([...partners]);
  },

  async getFeaturedPartners() {
    await delay();
    return ok(partners.filter((p) => p.featured));
  },

  async getPartnerById(id) {
    await delay();
    return ok(partners.find((p) => p.id === id) ?? null);
  },

  async createPartner(data) {
    await delay();
    const partner: Partner = {
      id: data.id ?? `partner-${Date.now()}`,
      name: data.name,
      logoUrl: data.logoUrl,
      logoDarkUrl: data.logoDarkUrl,
      websiteUrl: data.websiteUrl,
      featured: data.featured,
    };
    partners = [...partners, partner];
    return ok(partner);
  },

  async updatePartner(id, data) {
    await delay();
    const partner = partners.find((p) => p.id === id);
    if (!partner) return fail(null as unknown as Partner, 'Partner not found');
    const updated = { ...partner, ...data };
    partners = partners.map((p) => (p.id === id ? updated : p));
    return ok(updated);
  },

  async deletePartner(id) {
    await delay();
    partners = partners.filter((p) => p.id !== id);
    return ok(undefined as unknown as void);
  },

  async uploadPartnerLogo(file) {
    await delay();
    return ok({ url: URL.createObjectURL(file) });
  },

  // ── Event Backgrounds ──

  async getEventBackgrounds() {
    await delay();
    return ok([]);
  },

  async getEventBackgroundById() {
    await delay();
    return ok(null);
  },

  async getEventBackgroundUsages() {
    await delay();
    return ok([]);
  },

  async createEventBackground(data) {
    await delay();
    return ok({ id: crypto.randomUUID(), sortOrder: 0, createdAt: new Date().toISOString(), thumbnailUrl: undefined, ...data });
  },

  async updateEventBackground(id, data) {
    await delay();
    return ok({ id, name: '', imageUrl: '', sortOrder: 0, createdAt: new Date().toISOString(), ...data });
  },

  async deleteEventBackground() {
    await delay();
    return ok(undefined);
  },

  async uploadEventBackground(file) {
    await delay();
    return ok({ url: URL.createObjectURL(file) });
  },

  // ── Insurance ──

  async getGlobalInsuranceSettings() {
    await delay();
    return ok({ ...mockGlobalInsuranceSettings });
  },

  async updateGlobalInsuranceSettings(data) {
    await delay();
    return ok({ ...mockGlobalInsuranceSettings, ...data });
  },

  // ── Admin ──

  async getActivityLogs(filters) {
    await delay();
    let logs = [...mockAdminActivityLogs];
    if (filters?.action) logs = logs.filter((l) => l.action === filters.action);
    if (filters?.userId) logs = logs.filter((l) => l.userId === filters.userId);
    if (filters?.dateFrom) logs = logs.filter((l) => l.timestamp >= filters.dateFrom!);
    if (filters?.dateTo) logs = logs.filter((l) => l.timestamp <= filters.dateTo!);
    return ok(logs);
  },

  async getSecuritySettings() {
    await delay();
    return ok({ ...mockSecuritySettings });
  },

  async updateSecuritySettings(data) {
    await delay();
    return ok({ ...mockSecuritySettings, ...data });
  },

  async getOnlineSessions() {
    await delay();
    return ok([...mockOnlineSessions]);
  },

  async getSalesStats() {
    await delay();
    return ok({ ...mockSalesStats } as SalesStats);
  },

  // ── CMS ──

  async getInfoPages() {
    await delay();
    return ok([...mockInfoPages]);
  },

  async getInfoPageBySlug(slug) {
    await delay();
    const page = mockInfoPages.find((p) => p.slug === slug) ?? null;
    return page ? ok(page) : fail(null, 'Page not found');
  },

  async createInfoPage(data) {
    await delay();
    const page: InfoPage = {
      id: `page-${Date.now()}`,
      published: false,
      showInFooter: false,
      showInHeader: false,
      order: 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as InfoPage;
    return ok(page);
  },

  async updateInfoPage(id, data) {
    await delay();
    const page = mockInfoPages.find((p) => p.id === id);
    if (!page) return fail(null as unknown as InfoPage, 'Page not found');
    return ok({ ...page, ...data, updatedAt: new Date().toISOString() } as InfoPage);
  },

  async deleteInfoPage(id) {
    await delay();
    return ok(undefined as unknown as void);
  },

  async reorderInfoPages(ids) {
    await delay();
    void ids;
    return ok(undefined as unknown as void);
  },

  // ── Calendar ──

  async getCalendarSettings() {
    await delay();
    return ok({ ...mockGoogleCalendarSettings });
  },

  async updateCalendarSettings(data) {
    await delay();
    return ok({ ...mockGoogleCalendarSettings, ...data });
  },

  async addEventToCalendar(event) {
    await delay();
    void event;
    return ok(undefined as unknown as void, 'Event added to calendar');
  },

  // ── Virtual Results ──

  async getVirtualResultSubmissions(filters) {
    await delay();
    let results = [...mockVirtualResultSubmissions];
    if (filters?.eventId) results = results.filter((r) => r.eventId === filters.eventId);
    if (filters?.status) results = results.filter((r) => r.status === filters.status);
    return ok(results);
  },

  async submitVirtualResult(data) {
    await delay();
    const submission: VirtualResultSubmission = {
      id: `vrs-${Date.now()}`,
      eventId: '',
      eventName: '',
      distanceId: '',
      distanceName: '',
      userId: '',
      userName: '',
      userEmail: '',
      submittedTime: '',
      submittedTimeInSeconds: 0,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      ...data,
    } as VirtualResultSubmission;
    return ok(submission);
  },

  async reviewVirtualResult(id, status, reason) {
    await delay();
    const sub = mockVirtualResultSubmissions.find((s) => s.id === id);
    if (!sub) return fail(null as unknown as VirtualResultSubmission, 'Submission not found');
    return ok({ ...sub, status, rejectionReason: reason, reviewedAt: new Date().toISOString() });
  },

  // ── Email Templates ──

  async getEmailTemplates(eventId) {
    await delay();
    let filtered: EmailTemplate[];
    if (eventId === null) {
      filtered = emailTemplates.filter(
        (t) =>
          t.eventId === undefined &&
          (SYSTEM_TRIGGER_TYPES as readonly string[]).includes(t.triggerType),
      );
    } else if (eventId) {
      filtered = emailTemplates.filter((t) => t.eventId === eventId);
    } else {
      filtered = [...emailTemplates];
    }
    return paginated(filtered);
  },

  async getEmailTemplateById(id) {
    await delay();
    const template = emailTemplates.find((t) => t.id === id) ?? null;
    return template ? ok(template) : fail(null, 'Szablon nie został znaleziony');
  },

  async getEmailSendLogs(eventId) {
    await delay();
    const filtered = eventId ? emailLogs.filter((l) => l.eventId === eventId) : [...emailLogs];
    return ok(filtered);
  },

  async createEmailTemplate(payload) {
    await delay();
    const newTemplate: EmailTemplate = {
      ...payload,
      id: `tpl-${++nextTemplateId}`,
      createdAt: new Date().toISOString(),
      sentCount: 0,
    };
    emailTemplates = [...emailTemplates, newTemplate];
    return ok(newTemplate, 'Szablon został utworzony');
  },

  async updateEmailTemplate(id, data) {
    await delay();
    const index = emailTemplates.findIndex((t) => t.id === id);
    if (index === -1) return fail(emailTemplates[0], 'Szablon nie został znaleziony');
    const updated: EmailTemplate = { ...emailTemplates[index], ...data };
    emailTemplates = emailTemplates.map((t) => (t.id === id ? updated : t));
    return ok(updated, 'Szablon został zaktualizowany');
  },

  async deleteEmailTemplate(id) {
    await delay();
    const exists = emailTemplates.some((t) => t.id === id);
    if (!exists) return fail(undefined, 'Szablon nie został znaleziony');
    emailTemplates = emailTemplates.filter((t) => t.id !== id);
    return ok(undefined, 'Szablon został usunięty');
  },

  async toggleEmailTemplate(id, active) {
    return this.updateEmailTemplate(id, { active });
  },

  async sendEmailNow(templateId, recipientIds) {
    await delay();
    const template = emailTemplates.find((t) => t.id === templateId);
    if (!template) {
      return fail({ sent: 0, failed: 0, scheduled: 0 }, 'Szablon nie został znaleziony');
    }

    const targetCount = recipientIds ? recipientIds.length : 12;
    const failed = Math.floor(targetCount * 0.05);
    const sent = targetCount - failed;

    emailTemplates = emailTemplates.map((t) =>
      t.id === templateId
        ? { ...t, sentCount: t.sentCount + sent, lastSentAt: new Date().toISOString() }
        : t,
    );

    const newLogs: EmailSendLog[] = Array.from({ length: sent }, (_, i) => ({
      id: `log-${Date.now()}-${i}`,
      templateId,
      templateName: template.name,
      eventId: template.eventId,
      eventName: template.eventId ? 'Wydarzenie testowe' : undefined,
      recipientEmail: `uczestnik${i + 1}@example.com`,
      recipientName: `Uczestnik ${i + 1}`,
      subject: template.subject,
      sentAt: new Date().toISOString(),
      status: 'sent' as const,
    }));
    emailLogs = [...newLogs, ...emailLogs];

    return ok(
      { sent, failed, scheduled: 0 },
      `Wysłano do ${sent} odbiorców${failed > 0 ? `, ${failed} błędów` : ''}`,
    );
  },

  async previewEmailTemplate(request) {
    await delay();

    const sampleValues: Record<EmailTemplateVariable, string> = {
      '{{uczestnik.imie}}': 'Jan Kowalski',
      '{{uczestnik.email}}': 'jan.kowalski@example.com',
      '{{uczestnik.numer_startowy}}': '247',
      '{{uczestnik.dystans}}': 'Półmaraton (21,097 km)',
      '{{uczestnik.kategoria}}': 'M30',
      '{{uczestnik.status}}': 'Potwierdzony',
      '{{uczestnik.druzyna}}': 'Biegacze Warszawy',
      '{{wydarzenie.nazwa}}': 'Maraton Warszawski 2026',
      '{{wydarzenie.data}}': '15 marca 2026, 09:00',
      '{{wydarzenie.miasto}}': 'Warszawa',
      '{{wydarzenie.link}}': 'https://zmierzymyczas.pl/events/maraton-warszawski-2026',
      '{{wydarzenie.termin_rejestracji}}': '28 lutego 2026',
      '{{platnosc.kwota}}': '149,00',
      '{{platnosc.nr_konta}}': '12 3456 7890 1234 5678 9012 3456',
      '{{platnosc.tytul_przelewu}}': 'REJESTRACJA-247-MARATON2026',
      '{{uzytkownik.imie}}': 'Jan Kowalski',
      '{{uzytkownik.email}}': 'jan.kowalski@example.com',
      '{{platforma.nazwa}}': 'ZmierzymyCzas',
      '{{platforma.link}}': 'https://zmierzymyczas.pl',
    };

    let subject = request.subject;
    let body = request.body;

    for (const meta of EMAIL_VARIABLES) {
      const value = sampleValues[meta.variable];
      const regex = new RegExp(meta.variable.replace(/[{}]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return ok({ subject, body });
  },
};
