/**
 * Mock API Adapter — implements the full ApiAdapter contract using in-memory data.
 *
 * This is the default adapter used during development.
 * Replace with a real adapter (e.g., Supabase) for production.
 */

import type { ApiAdapter } from '../contract';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { SalesStats } from '@/types/admin';
import type {
  Event,
  User,
  UserRole,
  Registration,
  Result,
  PersonalRecord,
  TeamResult,
  EventResultDocument,
  EventSeries,
  ShopProduct,
  DeliveryMethod,
  ShopPaymentMethod,
  ShopOrder,
  EventCreditKind,
  OrganizerEventCredits,
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
} from '@/types';
import type {
  EmailTemplate,
  EmailSendLog,
  CreateEmailTemplatePayload,
  SendEmailResult,
  EmailPreviewRequest,
  EmailPreviewResult,
  EmailTemplateVariable,
} from '@/types/email';
import { SYSTEM_TRIGGER_TYPES, EMAIL_VARIABLES } from '@/types/email';
import type {
  EventFilters,
  UserFilters,
  ResultFilters,
  RegistrationFilters,
  ShopProductFilters,
  ActivityLogFilters,
  VirtualResultFilters,
  SeriesFilters,
} from '../types';
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

// ── Mock data imports ──
import { mockEvents } from '../mock/events.mock';
import { mockUsers } from '../mock/users.mock';
import { mockRegistrations } from '../mock/registrations.mock';
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
type OrganizerEventCreditState = Record<EventCreditKind, { total: number; used: number }>;

const createCreditState = (
  standard: { total: number; used: number },
  virtual: { total: number; used: number },
  timing: { total: number; used: number },
): OrganizerEventCreditState => ({ standard, virtual, timing });

const organizerEventCredits: Record<string, OrganizerEventCreditState> = {
  o1: createCreditState({ total: 3, used: 1 }, { total: 1, used: 1 }, { total: 0, used: 0 }),
  o2: createCreditState({ total: 5, used: 2 }, { total: 2, used: 0 }, { total: 1, used: 0 }),
  o3: createCreditState({ total: 2, used: 0 }, { total: 0, used: 0 }, { total: 0, used: 0 }),
};

const emptyCreditState = (): OrganizerEventCreditState =>
  createCreditState({ total: 0, used: 0 }, { total: 0, used: 0 }, { total: 0, used: 0 });

const toOrganizerEventCredits = (state: OrganizerEventCreditState): OrganizerEventCredits => {
  const byType = Object.fromEntries(
    (Object.entries(state) as Array<[EventCreditKind, { total: number; used: number }]>).map(
      ([kind, credit]) => [
        kind,
        {
          total: credit.total,
          used: credit.used,
          available: Math.max(0, credit.total - credit.used),
        },
      ],
    ),
  ) as Record<EventCreditKind, OrganizerEventCredits['byType'][EventCreditKind]>;

  return {
    total: Object.values(byType).reduce((sum, credit) => sum + credit.total, 0),
    used: Object.values(byType).reduce((sum, credit) => sum + credit.used, 0),
    available: Object.values(byType).reduce((sum, credit) => sum + credit.available, 0),
    byType,
  };
};

// ─────────────────────────────────────────────────────────
// Mock Adapter Implementation
// ─────────────────────────────────────────────────────────

export const mockAdapter: ApiAdapter = {
  // ── Events ──

  async getEvents(filters) {
    await delay();
    let filtered = [...mockEvents];
    if (!filters?.includePrivate) filtered = filtered.filter((e) => !e.isPrivate);
    if (filters?.discipline) filtered = filtered.filter((e) => e.discipline === filters.discipline);
    if (filters?.city)
      filtered = filtered.filter((e) => e.city.toLowerCase().includes(filters.city!.toLowerCase()));
    if (filters?.status) filtered = filtered.filter((e) => e.status === filters.status);
    if (filters?.seriesId) filtered = filtered.filter((e) => e.seriesId === filters.seriesId);
    if (filters?.registrationStatus)
      filtered = filtered.filter((e) => e.registrationStatus === filters.registrationStatus);
    if (filters?.dateFrom) filtered = filtered.filter((e) => e.date >= filters.dateFrom!);
    if (filters?.dateTo) filtered = filtered.filter((e) => e.date <= filters.dateTo!);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (e) => e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q),
      );
    }
    return paginated(filtered);
  },

  async getEventBySlug(slug) {
    await delay();
    const event = mockEvents.find((e) => e.slug === slug) ?? null;
    return event ? ok(event) : fail(null, 'Event not found');
  },

  async getEventById(id) {
    await delay();
    const event = mockEvents.find((e) => e.id === id) ?? null;
    return event ? ok(event) : fail(null, 'Event not found');
  },

  async createEvent(data) {
    await delay();
    const credits = organizerEventCredits[data.organizerId];
    const creditKind: EventCreditKind = data.isVirtual ? 'virtual' : 'standard';
    const credit = credits?.[creditKind];
    if (credit && credit.used >= credit.total) {
      return fail(
        null as unknown as Event,
        'Organizer has no available event credits for this event type',
      );
    }
    if (credit) credit.used += 1;
    const newEvent: Event = {
      id: `e-${Date.now()}`,
      status: 'draft',
      featured: false,
      ...data,
    } as Event;
    mockEvents.push(newEvent);
    return ok(newEvent);
  },

  async updateEvent(id, data) {
    await delay();
    const eventIndex = mockEvents.findIndex((e) => e.id === id);
    const event = mockEvents[eventIndex];
    if (!event) return fail(null as unknown as Event, 'Event not found');
    const updated = { ...event, ...data } as Event;
    mockEvents[eventIndex] = updated;
    return ok(updated);
  },

  async deleteEvent(id) {
    await delay();
    const exists = mockEvents.some((e) => e.id === id);
    return exists
      ? ok(undefined as unknown as void)
      : fail(undefined as unknown as void, 'Event not found');
  },

  async updateEventStatus(id, status, reason) {
    await delay();
    const eventIndex = mockEvents.findIndex((e) => e.id === id);
    const event = mockEvents[eventIndex];
    if (!event) return fail(null as unknown as Event, 'Event not found');
    const updated = { ...event, status, rejectionReason: reason };
    mockEvents[eventIndex] = updated;
    return ok(updated);
  },

  async submitEvent(id) {
    return this.updateEventStatus(id, 'awaiting_approval');
  },

  async approveEvent(id) {
    await delay();
    const eventIndex = mockEvents.findIndex((e) => e.id === id);
    const event = mockEvents[eventIndex];
    if (!event) return fail(null as unknown as Event, 'Event not found');
    const updated = {
      ...event,
      status: 'approved',
      rejectionReason: undefined,
      approvedAt: new Date().toISOString(),
    };
    mockEvents[eventIndex] = updated;
    return ok(updated);
  },

  async rejectEvent(id, reason) {
    return this.updateEventStatus(id, 'rejected', reason);
  },

  async publishEvent(id) {
    await delay();
    const eventIndex = mockEvents.findIndex((e) => e.id === id);
    const event = mockEvents[eventIndex];
    if (!event) return fail(null as unknown as Event, 'Event not found');
    const updated = { ...event, status: 'published', publishedAt: new Date().toISOString() };
    mockEvents[eventIndex] = updated;
    return ok(updated);
  },

  async getFeaturedEvents() {
    await delay();
    return ok(mockEvents.filter((e) => e.featured));
  },

  async getLiveEvents() {
    await delay();
    return ok(mockEvents.filter((e) => e.isLive));
  },

  async getEventsByOrganizer(organizerId) {
    await delay();
    return ok(mockEvents.filter((e) => e.organizerId === organizerId));
  },

  async getOrganizerEventCredits(organizerId) {
    await delay();
    return ok(toOrganizerEventCredits(organizerEventCredits[organizerId] ?? emptyCreditState()));
  },

  async grantOrganizerEventCredits(organizerId, count, kind = 'standard') {
    await delay();
    const current = organizerEventCredits[organizerId] ?? emptyCreditState();
    current[kind].total += count;
    organizerEventCredits[organizerId] = current;
    return ok(toOrganizerEventCredits(current));
  },

  // ── Users ──

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

  // ── Auth ──

  async login(credentials) {
    await delay();
    const user = mockUsers.find((u) => u.email === credentials.email) ?? null;
    return user ? ok(user) : fail(null, 'Invalid credentials');
  },

  async loginByRole(role) {
    await delay();
    const user = mockUsers.find((u) => u.role === role) ?? null;
    return user ? ok(user) : fail(null, 'User not found');
  },

  async logout() {
    await delay();
    return ok(undefined as unknown as void);
  },

  async getCurrentUser() {
    await delay();
    return ok(null);
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

  // ── Registrations ──

  async getRegistrations(filters) {
    await delay();
    let filtered = [...mockRegistrations];
    if (filters?.eventId) filtered = filtered.filter((r) => r.eventId === filters.eventId);
    if (filters?.userId) filtered = filtered.filter((r) => r.userId === filters.userId);
    if (filters?.status) filtered = filtered.filter((r) => r.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q),
      );
    }
    return paginated(filtered);
  },

  async getRegistrationsByEvent(eventId) {
    await delay();
    return ok(mockRegistrations.filter((r) => r.eventId === eventId));
  },

  async getRegistrationsByUser(userId) {
    await delay();
    return ok(mockRegistrations.filter((r) => r.userId === userId));
  },

  async createRegistration(data) {
    await delay();
    const reg: Registration = {
      id: `reg-${Date.now()}`,
      registeredAt: new Date().toISOString(),
      status: 'pending',
      ...data,
    } as Registration;
    return ok(reg);
  },

  async updateRegistration(id, data) {
    await delay();
    const reg = mockRegistrations.find((r) => r.id === id);
    if (!reg) return fail(null as unknown as Registration, 'Registration not found');
    return ok({ ...reg, ...data } as Registration);
  },

  async cancelRegistration(id) {
    return this.updateRegistration(id, { status: 'cancelled' });
  },

  async updatePaymentDetails(id, paymentDetails) {
    return this.updateRegistration(id, { paymentDetails });
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

  // ── Shop ──

  async getProducts(filters) {
    await delay();
    let filtered = [...mockShopProducts];
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
    const product = mockShopProducts.find((p) => p.slug === slug) ?? null;
    return product ? ok(product) : fail(null, 'Product not found');
  },

  async getProductById(id) {
    await delay();
    const product = mockShopProducts.find((p) => p.id === id) ?? null;
    return product ? ok(product) : fail(null, 'Product not found');
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

  async getChallenges() {
    await delay();
    return ok([...mockChallenges]);
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
    return ok([...mockPartners]);
  },

  async getFeaturedPartners() {
    await delay();
    return ok(mockPartners.filter((p) => p.featured));
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
