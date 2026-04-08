/**
 * Backward-compatibility re-export layer.
 * All mock data now lives in src/api/mock/*.mock.ts files.
 * New code should import directly from the domain-specific mock files.
 */

// CMS
export { mockInfoPages } from '@/api/mock/cms.mock';

// Series
export { mockSeries } from '@/api/mock/series.mock';

// Labels
export { seriesTypeLabels, disciplineLabels } from '@/api/mock/labels';

// Users
export { mockUsers, defaultPaymentMethods } from '@/api/mock/users.mock';

// Events
export { mockMerchandise, mockEvents } from '@/api/mock/events.mock';

// Partners
export { mockPartners } from '@/api/mock/partners.mock';

// Insurance
export { mockGlobalInsuranceSettings, getExistingTeamsForEvent } from '@/api/mock/insurance.mock';

// Registrations
export { mockRegistrations } from '@/api/mock/registrations.mock';

// Results
export { mockResults, mockPersonalRecords, mockMessages, mockCertificates, mockTeamResults, mockResultDocuments } from '@/api/mock/results.mock';

// Shop
export { mockShopProducts, mockDeliveryMethods, mockShopPaymentMethods, mockTickets, mockShopOrders, mockGroupDiscountCodes, shopCategoryLabels } from '@/api/mock/shop.mock';

// Admin
export { mockSalesStats, mockAdminActivityLogs, mockSecuritySettings } from '@/api/mock/admin.mock';

// Virtual
export { mockVirtualEvents, mockVirtualResultSubmissions } from '@/api/mock/virtual-results.mock';

// Online sessions & Calendar
export { mockOnlineSessions, mockGoogleCalendarSettings } from '@/api/mock/calendar.mock';

// Challenges
export { mockChallenges, mockChallengeParticipations } from '@/api/mock/challenges.mock';

// Helpers (re-exported from api/mock/helpers)
export { getCurrentPrice, validateDiscountCode, validateTeamName } from '@/api/mock/helpers';
