export const USER_ROLES = {
  PARTICIPANT: 'participant',
  ORGANIZER: 'organizer',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  participant: 'Uczestnik',
  organizer: 'Organizator',
  moderator: 'Moderator',
  admin: 'Administrator',
  superadmin: 'Superadmin',
};

export const EVENT_STATUSES = {
  DRAFT: 'draft',
  AWAITING_APPROVAL: 'awaiting_approval',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAST: 'past',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  awaiting_approval: 'Do sprawdzenia',
  approved: 'Zatwierdzone',
  active: 'Aktywne',
  past: 'Przeszłe',
  archived: 'Zarchiwizowane',
  deleted: 'Usunięte',
};

export const REGISTRATION_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  WAITLIST: 'waitlist',
} as const;

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekuje',
  confirmed: 'Potwierdzona',
  cancelled: 'Anulowana',
  waitlist: 'Lista rezerwowa',
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekuje',
  completed: 'Opłacone',
  failed: 'Nieudana',
  refunded: 'Zwrócona',
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Nowe',
  processing: 'W realizacji',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

export const SERIES_STATUS_LABELS: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  upcoming: 'Nadchodząca',
  archived: 'Archiwalna',
};

export const STORAGE_KEYS = {
  AUTH: 'zmierzymyczas_auth',
  EVENTS_FILTERS: 'events-page-filters',
  COOKIE_CONSENT: 'cookie-consent',
} as const;

export const QUERY_KEYS = {
  events: ['events'] as const,
  featuredEvents: ['events', 'featured'] as const,
  liveEvents: ['events', 'live'] as const,
  event: (id: string) => ['events', id] as const,
  eventBySlug: (slug: string) => ['events', 'slug', slug] as const,
  series: ['series'] as const,
  seriesById: (id: string) => ['series', id] as const,
  seriesBySlug: (slug: string) => ['series', 'slug', slug] as const,
  products: ['products'] as const,
  productBySlug: (slug: string) => ['products', 'slug', slug] as const,
  shopCategories: ['shopCategories'] as const,
  partners: ['partners'] as const,
  featuredPartners: ['partners', 'featured'] as const,
  results: ['results'] as const,
  resultsByEvent: (eventId: string) => ['results', 'event', eventId] as const,
  resultsByUser: (userId: string) => ['results', 'user', userId] as const,
  registrations: ['registrations'] as const,
  registrationsByEvent: (eventId: string) => ['registrations', 'event', eventId] as const,
  registrationsByUser: (userId: string) => ['registrations', 'user', userId] as const,
  challenges: ['challenges'] as const,
  challenge: (id: string) => ['challenges', id] as const,
  challengeBySlug: (slug: string) => ['challenges', 'slug', slug] as const,
  challengeParticipations: ['challengeParticipations'] as const,
  messages: ['messages'] as const,
  tickets: ['tickets'] as const,
  orders: ['orders'] as const,
  infoPages: ['infoPages'] as const,
  infoPageBySlug: (slug: string) => ['infoPages', 'slug', slug] as const,
  emailTemplates: ['emailTemplates'] as const,
  activityLogs: ['activityLogs'] as const,
  salesStats: ['salesStats'] as const,
  calendarSettings: ['calendarSettings'] as const,
  insuranceSettings: ['insuranceSettings'] as const,
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const MOCK_PASSWORD = 'demo1234';
