/**
 * API barrel — single import point for all API operations.
 *
 * Usage:
 *   import { api } from '@/api';
 *   const events = await api.getEvents({ discipline: 'running' });
 *
 * Or import individual functions (delegated to the active adapter):
 *   import { getEvents, getEventBySlug } from '@/api'
 *
 * Architecture:
 *   - contract.ts    → ApiAdapter interface (every method signature)
 *   - payloads.ts    → Typed create/update payloads
 *   - provider.ts    → Runtime adapter selection (mock by default)
 *   - adapters/      → Implementations (mock.adapter.ts, future supabase.ts)
 *   - types.ts       → Response wrappers & filter types
 */

import { getAdapter } from './provider';
import type { ApiAdapter } from './contract';

// ─── Lazy proxy ─────────────────────────────────────────
// Creates a proxy that lazily initializes the adapter on first call.
// This avoids top-level await while keeping a clean `api.getEvents()` syntax.

let _cachedAdapter: ApiAdapter | null = null;

async function ensureAdapter(): Promise<ApiAdapter> {
  if (!_cachedAdapter) {
    _cachedAdapter = await getAdapter();
  }
  return _cachedAdapter;
}

// ─── Delegate functions ─────────────────────────────────
// Each function delegates to the active adapter. This preserves
// the current import pattern: `import { getEvents } from '@/api'`

// Events
export const getEvents: ApiAdapter['getEvents'] = (...args) => ensureAdapter().then((a) => a.getEvents(...args));
export const getEventBySlug: ApiAdapter['getEventBySlug'] = (...args) => ensureAdapter().then((a) => a.getEventBySlug(...args));
export const getEventById: ApiAdapter['getEventById'] = (...args) => ensureAdapter().then((a) => a.getEventById(...args));
export const createEvent: ApiAdapter['createEvent'] = (...args) => ensureAdapter().then((a) => a.createEvent(...args));
export const updateEvent: ApiAdapter['updateEvent'] = (...args) => ensureAdapter().then((a) => a.updateEvent(...args));
export const deleteEvent: ApiAdapter['deleteEvent'] = (...args) => ensureAdapter().then((a) => a.deleteEvent(...args));
export const updateEventStatus: ApiAdapter['updateEventStatus'] = (...args) => ensureAdapter().then((a) => a.updateEventStatus(...args));
export const getFeaturedEvents: ApiAdapter['getFeaturedEvents'] = (...args) => ensureAdapter().then((a) => a.getFeaturedEvents(...args));
export const getLiveEvents: ApiAdapter['getLiveEvents'] = (...args) => ensureAdapter().then((a) => a.getLiveEvents(...args));
export const getEventsByOrganizer: ApiAdapter['getEventsByOrganizer'] = (...args) => ensureAdapter().then((a) => a.getEventsByOrganizer(...args));

// Users
export const getUsers: ApiAdapter['getUsers'] = (...args) => ensureAdapter().then((a) => a.getUsers(...args));
export const getUserById: ApiAdapter['getUserById'] = (...args) => ensureAdapter().then((a) => a.getUserById(...args));
export const getUserByEmail: ApiAdapter['getUserByEmail'] = (...args) => ensureAdapter().then((a) => a.getUserByEmail(...args));
export const createUser: ApiAdapter['createUser'] = (...args) => ensureAdapter().then((a) => a.createUser(...args));
export const updateUser: ApiAdapter['updateUser'] = (...args) => ensureAdapter().then((a) => a.updateUser(...args));
export const deleteUser: ApiAdapter['deleteUser'] = (...args) => ensureAdapter().then((a) => a.deleteUser(...args));
export const updateUserRole: ApiAdapter['updateUserRole'] = (...args) => ensureAdapter().then((a) => a.updateUserRole(...args));
export const updateUserStatus: ApiAdapter['updateUserStatus'] = (...args) => ensureAdapter().then((a) => a.updateUserStatus(...args));
export const getParticipants: ApiAdapter['getParticipants'] = (...args) => ensureAdapter().then((a) => a.getParticipants(...args));
export const getOrganizers: ApiAdapter['getOrganizers'] = (...args) => ensureAdapter().then((a) => a.getOrganizers(...args));

// Auth
export const login: ApiAdapter['login'] = (...args) => ensureAdapter().then((a) => a.login(...args));
export const loginByRole: ApiAdapter['loginByRole'] = (...args) => ensureAdapter().then((a) => a.loginByRole(...args));
export const logout: ApiAdapter['logout'] = (...args) => ensureAdapter().then((a) => a.logout(...args));
export const getCurrentUser: ApiAdapter['getCurrentUser'] = (...args) => ensureAdapter().then((a) => a.getCurrentUser(...args));
export const register: ApiAdapter['register'] = (...args) => ensureAdapter().then((a) => a.register(...args));
export const resetPassword: ApiAdapter['resetPassword'] = (...args) => ensureAdapter().then((a) => a.resetPassword(...args));
export const changePassword: ApiAdapter['changePassword'] = (...args) => ensureAdapter().then((a) => a.changePassword(...args));

// Registrations
export const getRegistrations: ApiAdapter['getRegistrations'] = (...args) => ensureAdapter().then((a) => a.getRegistrations(...args));
export const getRegistrationsByEvent: ApiAdapter['getRegistrationsByEvent'] = (...args) => ensureAdapter().then((a) => a.getRegistrationsByEvent(...args));
export const getRegistrationsByUser: ApiAdapter['getRegistrationsByUser'] = (...args) => ensureAdapter().then((a) => a.getRegistrationsByUser(...args));
export const createRegistration: ApiAdapter['createRegistration'] = (...args) => ensureAdapter().then((a) => a.createRegistration(...args));
export const updateRegistration: ApiAdapter['updateRegistration'] = (...args) => ensureAdapter().then((a) => a.updateRegistration(...args));
export const cancelRegistration: ApiAdapter['cancelRegistration'] = (...args) => ensureAdapter().then((a) => a.cancelRegistration(...args));
export const updatePaymentDetails: ApiAdapter['updatePaymentDetails'] = (...args) => ensureAdapter().then((a) => a.updatePaymentDetails(...args));

// Results
export const getResults: ApiAdapter['getResults'] = (...args) => ensureAdapter().then((a) => a.getResults(...args));
export const getResultsByEvent: ApiAdapter['getResultsByEvent'] = (...args) => ensureAdapter().then((a) => a.getResultsByEvent(...args));
export const getResultsByUser: ApiAdapter['getResultsByUser'] = (...args) => ensureAdapter().then((a) => a.getResultsByUser(...args));
export const createResult: ApiAdapter['createResult'] = (...args) => ensureAdapter().then((a) => a.createResult(...args));
export const updateResult: ApiAdapter['updateResult'] = (...args) => ensureAdapter().then((a) => a.updateResult(...args));
export const deleteResult: ApiAdapter['deleteResult'] = (...args) => ensureAdapter().then((a) => a.deleteResult(...args));
export const getPersonalRecords: ApiAdapter['getPersonalRecords'] = (...args) => ensureAdapter().then((a) => a.getPersonalRecords(...args));
export const getTeamResults: ApiAdapter['getTeamResults'] = (...args) => ensureAdapter().then((a) => a.getTeamResults(...args));
export const getResultDocuments: ApiAdapter['getResultDocuments'] = (...args) => ensureAdapter().then((a) => a.getResultDocuments(...args));
export const uploadResultDocument: ApiAdapter['uploadResultDocument'] = (...args) => ensureAdapter().then((a) => a.uploadResultDocument(...args));

// Series
export const getSeries: ApiAdapter['getSeries'] = (...args) => ensureAdapter().then((a) => a.getSeries(...args));
export const getSeriesById: ApiAdapter['getSeriesById'] = (...args) => ensureAdapter().then((a) => a.getSeriesById(...args));
export const getSeriesBySlug: ApiAdapter['getSeriesBySlug'] = (...args) => ensureAdapter().then((a) => a.getSeriesBySlug(...args));

// Shop
export const getProducts: ApiAdapter['getProducts'] = (...args) => ensureAdapter().then((a) => a.getProducts(...args));
export const getProductBySlug: ApiAdapter['getProductBySlug'] = (...args) => ensureAdapter().then((a) => a.getProductBySlug(...args));
export const getProductById: ApiAdapter['getProductById'] = (...args) => ensureAdapter().then((a) => a.getProductById(...args));
export const getDeliveryMethods: ApiAdapter['getDeliveryMethods'] = (...args) => ensureAdapter().then((a) => a.getDeliveryMethods(...args));
export const getShopPaymentMethods: ApiAdapter['getShopPaymentMethods'] = (...args) => ensureAdapter().then((a) => a.getShopPaymentMethods(...args));
export const getOrders: ApiAdapter['getOrders'] = (...args) => ensureAdapter().then((a) => a.getOrders(...args));
export const getOrderById: ApiAdapter['getOrderById'] = (...args) => ensureAdapter().then((a) => a.getOrderById(...args));
export const createOrder: ApiAdapter['createOrder'] = (...args) => ensureAdapter().then((a) => a.createOrder(...args));
export const updateOrderStatus: ApiAdapter['updateOrderStatus'] = (...args) => ensureAdapter().then((a) => a.updateOrderStatus(...args));

// Challenges
export const getChallenges: ApiAdapter['getChallenges'] = (...args) => ensureAdapter().then((a) => a.getChallenges(...args));
export const getChallengeBySlug: ApiAdapter['getChallengeBySlug'] = (...args) => ensureAdapter().then((a) => a.getChallengeBySlug(...args));
export const getChallengeById: ApiAdapter['getChallengeById'] = (...args) => ensureAdapter().then((a) => a.getChallengeById(...args));
export const getChallengeParticipations: ApiAdapter['getChallengeParticipations'] = (...args) => ensureAdapter().then((a) => a.getChallengeParticipations(...args));
export const joinChallenge: ApiAdapter['joinChallenge'] = (...args) => ensureAdapter().then((a) => a.joinChallenge(...args));
export const submitChallengeEntry: ApiAdapter['submitChallengeEntry'] = (...args) => ensureAdapter().then((a) => a.submitChallengeEntry(...args));
export const reviewChallengeEntry: ApiAdapter['reviewChallengeEntry'] = (...args) => ensureAdapter().then((a) => a.reviewChallengeEntry(...args));

// Messages
export const getMessages: ApiAdapter['getMessages'] = (...args) => ensureAdapter().then((a) => a.getMessages(...args));
export const getMessage: ApiAdapter['getMessage'] = (...args) => ensureAdapter().then((a) => a.getMessage(...args));
export const sendMessage: ApiAdapter['sendMessage'] = (...args) => ensureAdapter().then((a) => a.sendMessage(...args));
export const markAsRead: ApiAdapter['markAsRead'] = (...args) => ensureAdapter().then((a) => a.markAsRead(...args));

// Tickets
export const getTickets: ApiAdapter['getTickets'] = (...args) => ensureAdapter().then((a) => a.getTickets(...args));
export const getCertificates: ApiAdapter['getCertificates'] = (...args) => ensureAdapter().then((a) => a.getCertificates(...args));

// Partners
export const getPartners: ApiAdapter['getPartners'] = (...args) => ensureAdapter().then((a) => a.getPartners(...args));
export const getFeaturedPartners: ApiAdapter['getFeaturedPartners'] = (...args) => ensureAdapter().then((a) => a.getFeaturedPartners(...args));

// Insurance
export const getGlobalInsuranceSettings: ApiAdapter['getGlobalInsuranceSettings'] = (...args) => ensureAdapter().then((a) => a.getGlobalInsuranceSettings(...args));
export const updateGlobalInsuranceSettings: ApiAdapter['updateGlobalInsuranceSettings'] = (...args) => ensureAdapter().then((a) => a.updateGlobalInsuranceSettings(...args));

// Admin
export const getActivityLogs: ApiAdapter['getActivityLogs'] = (...args) => ensureAdapter().then((a) => a.getActivityLogs(...args));
export const getSecuritySettings: ApiAdapter['getSecuritySettings'] = (...args) => ensureAdapter().then((a) => a.getSecuritySettings(...args));
export const updateSecuritySettings: ApiAdapter['updateSecuritySettings'] = (...args) => ensureAdapter().then((a) => a.updateSecuritySettings(...args));
export const getOnlineSessions: ApiAdapter['getOnlineSessions'] = (...args) => ensureAdapter().then((a) => a.getOnlineSessions(...args));
export const getSalesStats: ApiAdapter['getSalesStats'] = (...args) => ensureAdapter().then((a) => a.getSalesStats(...args));

// CMS
export const getInfoPages: ApiAdapter['getInfoPages'] = (...args) => ensureAdapter().then((a) => a.getInfoPages(...args));
export const getInfoPageBySlug: ApiAdapter['getInfoPageBySlug'] = (...args) => ensureAdapter().then((a) => a.getInfoPageBySlug(...args));
export const createInfoPage: ApiAdapter['createInfoPage'] = (...args) => ensureAdapter().then((a) => a.createInfoPage(...args));
export const updateInfoPage: ApiAdapter['updateInfoPage'] = (...args) => ensureAdapter().then((a) => a.updateInfoPage(...args));
export const deleteInfoPage: ApiAdapter['deleteInfoPage'] = (...args) => ensureAdapter().then((a) => a.deleteInfoPage(...args));
export const reorderInfoPages: ApiAdapter['reorderInfoPages'] = (...args) => ensureAdapter().then((a) => a.reorderInfoPages(...args));

// Calendar
export const getCalendarSettings: ApiAdapter['getCalendarSettings'] = (...args) => ensureAdapter().then((a) => a.getCalendarSettings(...args));
export const updateCalendarSettings: ApiAdapter['updateCalendarSettings'] = (...args) => ensureAdapter().then((a) => a.updateCalendarSettings(...args));
export const addEventToCalendar: ApiAdapter['addEventToCalendar'] = (...args) => ensureAdapter().then((a) => a.addEventToCalendar(...args));

// Virtual Results
export const getVirtualResultSubmissions: ApiAdapter['getVirtualResultSubmissions'] = (...args) => ensureAdapter().then((a) => a.getVirtualResultSubmissions(...args));
export const submitVirtualResult: ApiAdapter['submitVirtualResult'] = (...args) => ensureAdapter().then((a) => a.submitVirtualResult(...args));
export const reviewVirtualResult: ApiAdapter['reviewVirtualResult'] = (...args) => ensureAdapter().then((a) => a.reviewVirtualResult(...args));

// Email Templates
export const getEmailTemplates: ApiAdapter['getEmailTemplates'] = (...args) => ensureAdapter().then((a) => a.getEmailTemplates(...args));
export const getEmailTemplateById: ApiAdapter['getEmailTemplateById'] = (...args) => ensureAdapter().then((a) => a.getEmailTemplateById(...args));
export const getEmailSendLogs: ApiAdapter['getEmailSendLogs'] = (...args) => ensureAdapter().then((a) => a.getEmailSendLogs(...args));
export const createEmailTemplate: ApiAdapter['createEmailTemplate'] = (...args) => ensureAdapter().then((a) => a.createEmailTemplate(...args));
export const updateEmailTemplate: ApiAdapter['updateEmailTemplate'] = (...args) => ensureAdapter().then((a) => a.updateEmailTemplate(...args));
export const deleteEmailTemplate: ApiAdapter['deleteEmailTemplate'] = (...args) => ensureAdapter().then((a) => a.deleteEmailTemplate(...args));
export const toggleEmailTemplate: ApiAdapter['toggleEmailTemplate'] = (...args) => ensureAdapter().then((a) => a.toggleEmailTemplate(...args));
export const sendEmailNow: ApiAdapter['sendEmailNow'] = (...args) => ensureAdapter().then((a) => a.sendEmailNow(...args));
export const previewEmailTemplate: ApiAdapter['previewEmailTemplate'] = (...args) => ensureAdapter().then((a) => a.previewEmailTemplate(...args));

// ─── Re-exports for convenience ─────────────────────────

// Types
export type { ApiResponse, PaginatedResponse, ApiError } from './types';
export type {
  EventFilters,
  UserFilters,
  ResultFilters,
  RegistrationFilters,
  ShopProductFilters,
  OrderFilters,
  ActivityLogFilters,
  VirtualResultFilters,
  ChallengeParticipationFilters,
  SeriesFilters,
} from './types';
export type { ApiAdapter } from './contract';
export type {
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
} from './payloads';

// Provider
export { setApiAdapter } from './provider';

// Utility re-exports (synchronous helpers used in UI)
export {
  getCurrentPrice,
  applyDiscount,
  validateDiscountCode,
  validateTeamName,
  getExistingTeamsForEvent,
} from './mock/helpers';
export {
  seriesTypeLabels,
  disciplineLabels,
  shopCategoryLabels,
  defaultPaymentMethods,
} from './mock/labels';

// Legacy client (for backward compatibility)
export { simulateDelay } from './client';
