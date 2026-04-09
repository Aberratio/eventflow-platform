// ─── API Types ───
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
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
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from './types';

// ─── Client ───
export { simulateDelay, apiRequest } from './client';

// ─── Events ───
export {
  getEvents,
  getEventBySlug,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getFeaturedEvents,
  getLiveEvents,
  getEventsByOrganizer,
} from './events.api';

// ─── Users ───
export {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  getParticipants,
  getOrganizers,
} from './users.api';

// ─── Auth ───
export {
  login,
  loginByRole,
  logout,
  getCurrentUser,
  register,
  resetPassword,
  changePassword,
} from './auth.api';

// ─── Registrations ───
export {
  getRegistrations,
  getRegistrationsByEvent,
  getRegistrationsByUser,
  createRegistration,
  updateRegistration,
  cancelRegistration,
  updatePaymentDetails,
} from './registrations.api';

// ─── Results ───
export {
  getResults,
  getResultsByEvent,
  getResultsByUser,
  createResult,
  updateResult,
  deleteResult,
  getPersonalRecords,
  getTeamResults,
  getResultDocuments,
  uploadResultDocument,
} from './results.api';

// ─── Series ───
export { getSeries, getSeriesById, getSeriesBySlug } from './series.api';

// ─── Shop ───
export {
  getProducts,
  getProductBySlug,
  getProductById,
  getDeliveryMethods,
  getShopPaymentMethods,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from './shop.api';

// ─── Challenges ───
export {
  getChallenges,
  getChallengeBySlug,
  getChallengeById,
  getChallengeParticipations,
  joinChallenge,
  submitChallengeEntry,
  reviewChallengeEntry,
} from './challenges.api';

// ─── Messages ───
export { getMessages, getMessage, sendMessage, markAsRead } from './messages.api';

// ─── Tickets ───
export { getTickets, getCertificates } from './tickets.api';

// ─── Partners ───
export { getPartners, getFeaturedPartners } from './partners.api';

// ─── Insurance ───
export { getGlobalInsuranceSettings, updateGlobalInsuranceSettings } from './insurance.api';

// ─── Admin ───
export {
  getActivityLogs,
  getSecuritySettings,
  updateSecuritySettings,
  getOnlineSessions,
  getSalesStats,
} from './admin.api';

// ─── CMS ───
export {
  getInfoPages,
  getInfoPageBySlug,
  createInfoPage,
  updateInfoPage,
  deleteInfoPage,
  reorderInfoPages,
} from './cms.api';

// ─── Calendar ───
export { getCalendarSettings, updateCalendarSettings, addEventToCalendar } from './calendar.api';

// ─── Virtual Results ───
export {
  getVirtualResultSubmissions,
  submitVirtualResult,
  reviewVirtualResult,
} from './virtual-results.api';

// ─── Email Templates ───
export {
  getEmailTemplates,
  getEmailTemplateById,
  getEmailSendLogs,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  toggleEmailTemplate,
  sendEmailNow,
  previewEmailTemplate,
} from './email-templates.api';

// ─── Mock helpers & labels (synchronous, for filters/sidebars) ───
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
