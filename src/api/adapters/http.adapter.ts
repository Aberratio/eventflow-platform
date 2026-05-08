import type { ApiAdapter } from '../contract';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'zmierzymy_czas_api_token';

type QueryValue = string | number | boolean | null | undefined;

function query(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? payload?.message ?? `API error ${response.status}`);
  }
  return payload as ApiResponse<T>;
}

async function paginated<T>(
  endpoint: string,
  params?: Record<string, QueryValue>,
): Promise<PaginatedResponse<T>> {
  return request<T[]>(`${endpoint}${query(params)}`) as unknown as Promise<PaginatedResponse<T>>;
}

function json(method: string, data?: unknown): RequestInit {
  return { method, body: data === undefined ? undefined : JSON.stringify(data) };
}

export const httpAdapter: ApiAdapter = {
  getEvents: (filters) => paginated('/events', filters as Record<string, QueryValue>),
  getEventBySlug: (slug) => request(`/events/slug/${encodeURIComponent(slug)}`),
  getEventById: (id) => request(`/events/${encodeURIComponent(id)}`),
  createEvent: (data) => request('/events', json('POST', data)),
  updateEvent: (id, data) => request(`/events/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteEvent: (id) => request(`/events/${encodeURIComponent(id)}`, json('DELETE')),
  updateEventStatus: (id, status, reason) =>
    request(`/events/${encodeURIComponent(id)}/status`, json('PATCH', { status, reason })),
  submitEvent: (id) => request(`/events/${encodeURIComponent(id)}/submit`, json('POST')),
  approveEvent: (id) => request(`/events/${encodeURIComponent(id)}/approve`, json('POST')),
  rejectEvent: (id, reason) =>
    request(`/events/${encodeURIComponent(id)}/reject`, json('POST', { reason })),
  publishEvent: (id) => request(`/events/${encodeURIComponent(id)}/publish`, json('POST')),
  getFeaturedEvents: () => request('/events/featured'),
  getLiveEvents: () => request('/events/live'),
  getEventsByOrganizer: (organizerId) =>
    request(`/organizers/${encodeURIComponent(organizerId)}/events`),
  getOrganizerEventLimit: (organizerId) =>
    request(`/organizers/${encodeURIComponent(organizerId)}/event-limit`),
  updateOrganizerEventLimit: (organizerId, limit) =>
    request(
      `/organizers/${encodeURIComponent(organizerId)}/event-limit`,
      json('PATCH', { limit }),
    ),

  getUsers: (filters) => paginated('/users', filters as Record<string, QueryValue>),
  getUserById: (id) => request(`/users/${encodeURIComponent(id)}`),
  getUserByEmail: (email) =>
    request(`/users${query({ search: email })}`).then((r) => ({
      data: (r as unknown as PaginatedResponse<User>).data.find((u) => u.email === email) ?? null,
      success: true,
    })),
  createUser: (data) => request('/users', json('POST', data)),
  updateUser: (id, data) => request(`/users/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteUser: (id) => request(`/users/${encodeURIComponent(id)}`, json('DELETE')),
  updateUserRole: (id, role) =>
    request(`/users/${encodeURIComponent(id)}/role`, json('PATCH', { role })),
  updateUserStatus: (id, status) =>
    request(`/users/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
  getParticipants: () => request('/participants'),
  getOrganizers: () => request('/organizers'),

  async login(credentials) {
    const raw = await request<{ user: User; token: string }>(
      '/auth/login',
      json('POST', credentials),
    );
    localStorage.setItem(TOKEN_STORAGE_KEY, raw.data.token);
    return { data: raw.data.user, success: true };
  },
  loginByRole: async () => ({ data: null, success: false, message: 'Role login is mock-only' }),
  async logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return request('/auth/logout', json('POST'));
  },
  getCurrentUser: () => request('/auth/me'),
  register: (data) => request('/auth/register', json('POST', data)),
  resetPassword: (payload) => request('/auth/password/reset', json('POST', payload)),
  changePassword: (payload) => request('/auth/password/change', json('POST', payload)),

  getRegistrations: (filters) => paginated('/registrations', filters as Record<string, QueryValue>),
  getRegistrationsByEvent: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/registrations`),
  getRegistrationsByUser: (userId) => request(`/users/${encodeURIComponent(userId)}/registrations`),
  createRegistration: (data) => request('/registrations', json('POST', data)),
  updateRegistration: (id, data) =>
    request(`/registrations/${encodeURIComponent(id)}`, json('PATCH', data)),
  cancelRegistration: (id) =>
    request(`/registrations/${encodeURIComponent(id)}/cancel`, json('POST')),
  updatePaymentDetails: (id, paymentDetails) =>
    request(
      `/registrations/${encodeURIComponent(id)}/payment-details`,
      json('PATCH', paymentDetails),
    ),

  getResults: (filters) => paginated('/results', filters as Record<string, QueryValue>),
  getResultsByEvent: (eventId, distanceId) =>
    request(`/events/${encodeURIComponent(eventId)}/results${query({ distanceId })}`),
  getResultsByUser: (userId) => request(`/users/${encodeURIComponent(userId)}/results`),
  createResult: (data) => request('/results', json('POST', data)),
  updateResult: (id, data) => request(`/results/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteResult: (id) => request(`/results/${encodeURIComponent(id)}`, json('DELETE')),
  getPersonalRecords: (userId) => request(`/users/${encodeURIComponent(userId)}/personal-records`),
  getTeamResults: (eventId) => request(`/events/${encodeURIComponent(eventId)}/team-results`),
  getResultDocuments: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/result-documents`),
  uploadResultDocument: (data) =>
    request(
      `/events/${encodeURIComponent(data.eventId ?? '')}/result-documents`,
      json('POST', data),
    ),

  getSeries: (filters) => paginated('/series', filters as Record<string, QueryValue>),
  getSeriesById: (id) => request(`/series/${encodeURIComponent(id)}`),
  getSeriesBySlug: (slug) => request(`/series/slug/${encodeURIComponent(slug)}`),
  createSeries: (data) => request('/series', json('POST', data)),
  updateSeries: (id, data) => request(`/series/${encodeURIComponent(id)}`, json('PATCH', data)),
  archiveSeries: (id) => request(`/series/${encodeURIComponent(id)}/archive`, json('POST')),

  getProducts: (filters) => paginated('/shop/products', filters as Record<string, QueryValue>),
  getProductBySlug: (slug) => request(`/shop/products/slug/${encodeURIComponent(slug)}`),
  getProductById: (id) => request(`/shop/products/${encodeURIComponent(id)}`),
  createProduct: (data) => request('/shop/products', json('POST', data)),
  updateProduct: (id, data) =>
    request(`/shop/products/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteProduct: (id) => request(`/shop/products/${encodeURIComponent(id)}`, json('DELETE')),
  getShopCategories: (includeArchived) =>
    request(`/shop/categories${query({ includeArchived })}`),
  createShopCategory: (data) => request('/shop/categories', json('POST', data)),
  updateShopCategory: (id, data) =>
    request(`/shop/categories/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteShopCategory: (id) => request(`/shop/categories/${encodeURIComponent(id)}`, json('DELETE')),
  getDeliveryMethods: () => request('/shop/delivery-methods'),
  getShopPaymentMethods: () => request('/shop/payment-methods'),
  getOrders: (userId) => request(`/shop/orders${query({ userId })}`),
  getOrderById: (id) => request(`/shop/orders/${encodeURIComponent(id)}`),
  createOrder: (data) => request('/shop/orders', json('POST', data)),
  updateOrderStatus: (id, status, trackingNumber) =>
    request(
      `/shop/orders/${encodeURIComponent(id)}/status`,
      json('PATCH', { status, trackingNumber }),
    ),

  getChallenges: (filters) => request(`/challenges${query(filters as Record<string, QueryValue>)}`),
  getChallengeBySlug: (slug) => request(`/challenges/slug/${encodeURIComponent(slug)}`),
  getChallengeById: (id) => request(`/challenges/${encodeURIComponent(id)}`),
  createChallenge: (data) => request('/challenges', json('POST', data)),
  updateChallenge: (id, data) =>
    request(`/challenges/${encodeURIComponent(id)}`, json('PATCH', data)),
  archiveChallenge: (id) => request(`/challenges/${encodeURIComponent(id)}/archive`, json('POST')),
  getChallengeParticipations: (challengeId, userId) =>
    request(`/challenge-participations${query({ challengeId, userId })}`),
  joinChallenge: (challengeId) =>
    request(`/challenges/${encodeURIComponent(challengeId)}/join`, json('POST')),
  submitChallengeEntry: (data) => request('/challenge-entries', json('POST', data)),
  reviewChallengeEntry: (entryId, status, reason) =>
    request(
      `/challenge-entries/${encodeURIComponent(entryId)}/review`,
      json('PATCH', { status, reason }),
    ),

  getMessages: (userId) => request(`/users/${encodeURIComponent(userId)}/messages`),
  getMessage: (id) => request(`/messages/${encodeURIComponent(id)}`),
  sendMessage: (data) => request('/messages', json('POST', data)),
  markAsRead: (id) => request(`/messages/${encodeURIComponent(id)}/read`, json('POST')),

  getTickets: (userId) => request(`/users/${encodeURIComponent(userId)}/tickets`),
  getCertificates: (userId) => request(`/users/${encodeURIComponent(userId)}/certificates`),

  getPartners: () => request('/partners'),
  getFeaturedPartners: () => request('/partners/featured'),

  getGlobalInsuranceSettings: () => request('/insurance/settings'),
  updateGlobalInsuranceSettings: (data) => request('/insurance/settings', json('PATCH', data)),

  getActivityLogs: (filters) =>
    request(`/admin/activity-logs${query(filters as Record<string, QueryValue>)}`),
  getSecuritySettings: () => request('/admin/security-settings'),
  updateSecuritySettings: (data) => request('/admin/security-settings', json('PATCH', data)),
  getOnlineSessions: () => request('/admin/online-sessions'),
  getSalesStats: () => request('/admin/sales-stats'),

  getInfoPages: () => request('/info-pages'),
  getInfoPageBySlug: (slug) => request(`/info-pages/slug/${encodeURIComponent(slug)}`),
  createInfoPage: (data) => request('/info-pages', json('POST', data)),
  updateInfoPage: (id, data) =>
    request(`/info-pages/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteInfoPage: (id) => request(`/info-pages/${encodeURIComponent(id)}`, json('DELETE')),
  reorderInfoPages: (ids) => request('/info-pages/reorder', json('POST', { ids })),

  getCalendarSettings: () => request('/calendar/settings'),
  updateCalendarSettings: (data) => request('/calendar/settings', json('PATCH', data)),
  addEventToCalendar: (event) => request('/calendar/events', json('POST', event)),

  getVirtualResultSubmissions: (filters) =>
    request(`/virtual-results${query(filters as Record<string, QueryValue>)}`),
  submitVirtualResult: (data) => request('/virtual-results', json('POST', data)),
  reviewVirtualResult: (id, status, reason) =>
    request(`/virtual-results/${encodeURIComponent(id)}/review`, json('PATCH', { status, reason })),

  getEmailTemplates: (eventId) => paginated('/email-templates', { eventId: eventId ?? undefined }),
  getEmailTemplateById: (id) => request(`/email-templates/${encodeURIComponent(id)}`),
  getEmailSendLogs: (eventId) => request(`/email-send-logs${query({ eventId })}`),
  createEmailTemplate: (payload) => request('/email-templates', json('POST', payload)),
  updateEmailTemplate: (id, data) =>
    request(`/email-templates/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteEmailTemplate: (id) =>
    request(`/email-templates/${encodeURIComponent(id)}`, json('DELETE')),
  toggleEmailTemplate: (id, active) =>
    request(`/email-templates/${encodeURIComponent(id)}/active`, json('PATCH', { active })),
  sendEmailNow: (templateId, recipientIds) =>
    request(
      `/email-templates/${encodeURIComponent(templateId)}/send`,
      json('POST', { recipientIds }),
    ),
  previewEmailTemplate: (requestPayload) =>
    request('/email-templates/preview', json('POST', requestPayload)),
};
