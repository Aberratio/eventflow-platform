import type { ApiAdapter } from '../contract';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { ResultImportBatch, ShopOrder, User } from '@/types';
import { AUTH_SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '@/constants';
import { resolveApiAssetUrl } from '@/lib/utils';
import { ApiRequestError } from '../errors';
import { toEventWritePayload } from '../eventChildren';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';
const TOKEN_STORAGE_KEY = STORAGE_KEYS.API_TOKEN;
const MOCK_TOKEN_PREFIX = 'mock-user:';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type QueryValue = string | number | boolean | null | undefined;

const API_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Twoja sesja wygasła. Zaloguj się ponownie.',
  forbidden: 'Nie masz uprawnień do wykonania tej operacji.',
  event_limit_exceeded:
    'Limit wydarzeń został wyczerpany. Skontaktuj się z administratorem, aby zwiększyć limit.',
  event_limit_below_usage: 'Limit nie może być niższy niż aktualna liczba wydarzeń organizatora.',
  invalid_organizer: 'Wybierz aktywne konto organizatora wydarzenia.',
  event_submit_no_organizer_credit:
    'Brak dostępnego pakietu organizatora. Kup pakiet, aby oddać wydarzenie do sprawdzenia.',
  published_organizer_locked:
    'Nie mozna przeniesc opublikowanego wydarzenia do innego organizatora.',
  event_delete_forbidden:
    'Usunąć można tylko szkic wydarzenia bez otwartych zapisów. Wydarzenia po starcie przenieś do archiwum.',
  event_archive_before_start: 'Archiwizować można tylko wydarzenia, które już się zakończyły.',
  discount_code_invalid: 'Nieprawidłowy kod rabatowy.',
  discount_code_inactive: 'Kod rabatowy jest nieaktywny.',
  discount_code_not_started: 'Kod rabatowy nie jest jeszcze aktywny.',
  discount_code_expired: 'Kod rabatowy wygasł.',
  discount_code_used_up: 'Kod rabatowy został już wykorzystany maksymalną liczbę razy.',
  discount_code_distance_mismatch: 'Kod rabatowy nie dotyczy wybranego dystansu.',
  registration_distance_invalid: 'Wybrany dystans jest nieprawidłowy.',
  // E7.2: surfaced both when submitting the registration form (existing E7.1
  // 409/404s from RegistrationRepository::resolveTeamForRegistration) and
  // when resolving a `?joinTeam=` invitation link up front (GET /teams/{id},
  // `team_not_found`) — same wording either way, so an invitee sees one
  // consistent message regardless of when the check happened to fire.
  registration_team_full: 'Ta drużyna ma już komplet zawodników. Poproś kapitana o inny link.',
  registration_team_not_found: 'Nie znaleziono tej drużyny. Link zaproszenia mógł wygasnąć.',
  team_not_found: 'Nie znaleziono tej drużyny. Link zaproszenia mógł wygasnąć.',
  registration_team_distance_mismatch: 'Ten link zaproszenia dotyczy innego dystansu.',
  registration_team_requires_relay_distance:
    'Drużyny można tworzyć tylko dla dystansów sztafetowych.',
  registration_team_name_required: 'Podaj nazwę drużyny.',
  virtual_event_required: 'Wynik można zgłosić tylko dla wydarzenia wirtualnego.',
  virtual_result_window_closed: 'Wynik można zgłosić tylko w aktywnym oknie startowym.',
  virtual_result_registration_required: 'Nie znaleziono aktywnej rejestracji na ten dystans.',
  virtual_result_duplicate: 'Wynik dla tego dystansu został już zgłoszony.',
  result_event_not_open:
    'Wyniki mozna wgrywac tylko do wydarzen trwajacych albo zakonczonych, ktorymi zarzadzasz.',
  pdf_text_not_detected: 'Nie udalo sie odczytac tekstu z PDF. To moze byc skan wymagajacy OCR.',
  pdf_table_not_detected:
    'Odczytano tekst z PDF, ale nie wykryto wierszy wynikow. Wgraj CSV/XLSX albo popraw dane po konwersji.',
  validation_error: 'Sprawdź poprawność danych i spróbuj ponownie.',
  invalid_current_password: 'Obecne hasło jest nieprawidłowe.',
  password_too_short: 'Nowe hasło musi mieć co najmniej 8 znaków.',
  password_too_long: 'Nowe hasło jest za długie.',
  password_unchanged: 'Nowe hasło musi różnić się od obecnego.',
  file_too_large: 'Plik jest za duży. Maksymalny rozmiar to 5 MB.',
  unsupported_file_type: 'Nieobsługiwany format pliku. Dozwolone są JPG, PNG i WebP.',
  invalid_image_dimensions: 'Nie udało się odczytać wymiarów obrazu. Wybierz inny plik.',
  image_dimensions_too_large: 'Obraz ma zbyt dużą rozdzielczość. Zmniejsz go i spróbuj ponownie.',
  upload_dir_unavailable: 'Nie można teraz zapisać pliku na serwerze.',
  upload_failed: 'Nie udało się wgrać pliku. Spróbuj ponownie.',
};

function apiErrorCode(payload: unknown): string | undefined {
  return (payload as { error?: { code?: string } })?.error?.code;
}

function apiErrorDetails(payload: unknown): unknown {
  return (payload as { error?: { details?: unknown } })?.error?.details;
}

function apiErrorMessage(payload: unknown, fallback: string, preferServerMessage = false): string {
  const errorPayload = payload as { error?: { code?: string; message?: string }; message?: string };
  const code = errorPayload?.error?.code;
  if (preferServerMessage && code === 'validation_error' && errorPayload?.error?.message) {
    return errorPayload.error.message;
  }
  return (
    (code ? API_ERROR_MESSAGES[code] : undefined) ??
    errorPayload?.error?.message ??
    errorPayload?.message ??
    fallback
  );
}

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  return ALLOWED_IMAGE_TYPES.has(type) || (type === '' && /\.(jpe?g|png|webp)$/i.test(file.name));
}

function getImageFileValidationError(file: File): string | null {
  if (!isAllowedImageFile(file)) {
    return 'Nieobsługiwany format obrazu. Wgraj plik JPG, PNG albo WebP.';
  }
  if (file.size <= 0) {
    return 'Wybrany plik jest pusty. Wybierz inny obraz.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Obraz jest za duży. Maksymalny rozmiar pliku to 5 MB.';
  }
  return null;
}

function query(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

/** No answer within this long = the request failed (otherwise the UI would load forever). */
export const REQUEST_TIMEOUT_MS = 15_000;
/** Multipart uploads and file exports move far more bytes, so they get a much longer budget. */
export const UPLOAD_TIMEOUT_MS = 120_000;

const TIMEOUT_MESSAGE = 'Serwer nie odpowiada. Sprawdź połączenie i spróbuj ponownie.';

/**
 * fetch() + body parsing under one deadline. An expired deadline surfaces as an
 * ApiRequestError (code `timeout`) so pages show the same error state as for a 5xx.
 */
async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ response: Response; payload: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: init.signal ?? controller.signal });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiRequestError(TIMEOUT_MESSAGE, 'timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  preferServerMessage = false,
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const { response, payload } = await fetchJsonWithTimeout(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    },
    REQUEST_TIMEOUT_MS,
  );
  if (!response.ok) {
    if (
      response.status === 401 &&
      endpoint !== '/auth/login' &&
      !token?.startsWith(MOCK_TOKEN_PREFIX)
    ) {
      if (!token || localStorage.getItem(TOKEN_STORAGE_KEY) === token) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token } }));
      }
    }

    throw new ApiRequestError(
      apiErrorMessage(payload, `Błąd API ${response.status}`, preferServerMessage),
      apiErrorCode(payload),
      response.status,
      apiErrorDetails(payload),
    );
  }
  return payload as ApiResponse<T>;
}

/**
 * Detail routes answer 404 `not_found` for an unknown record (D-01; they used to answer
 * 200 with `data: null`). Pages treat both the same way ("not found"), so a 404 is folded
 * back into `data: null`; every other failure (5xx, network, timeout) still throws.
 */
function nullOn404<T>(promise: Promise<ApiResponse<T | null>>): Promise<ApiResponse<T | null>> {
  return promise.catch((error: unknown) => {
    if (error instanceof ApiRequestError && error.status === 404) {
      return { success: true, data: null } as ApiResponse<T | null>;
    }
    throw error;
  });
}

// TD.18: PHP/PDO returns DECIMAL columns as numeric strings ("45.00"), not
// JSON numbers — `shop_orders`' money columns (productTotal/deliveryPrice/
// paymentSurcharge/totalPrice) come back that way from every one of these
// endpoints. `ShopOrder`'s TypeScript type says `number`, so nothing else in
// the app defensively re-parses them — every consumer (CartPage's
// order-success handoff, the participant/admin/moderator orders tabs) calls
// `.toFixed()` straight on the field and crashes. Normalized once, here, at
// the one seam every order response passes through, rather than patched at
// each of those call sites (found live: a real checkout run crashed
// OrderSuccessPage with `lastOrder.productTotal.toFixed is not a
// function`).
function normalizeShopOrder(order: ShopOrder): ShopOrder {
  return {
    ...order,
    productTotal: Number(order.productTotal),
    deliveryPrice: Number(order.deliveryPrice),
    paymentSurcharge: Number(order.paymentSurcharge),
    totalPrice: Number(order.totalPrice),
  };
}

// PP.103: same root cause as TD.18, for the Event payload. `event_distances`
// (price, length), `event_distance_pricing_variants.price`,
// `event_merchandise` (price, originalPrice) and `event_discount_codes.
// discountValue` are DECIMAL columns, so PHP/PDO serialises them as numeric
// strings ("55.00"). The TypeScript types say `number`, and consumers such as
// PriceTierPreview call `.toFixed()` on them (admin /events/:id crashed with
// "price.toFixed is not a function"). Normalised once here, for every
// Event-returning method. Collections that are absent stay absent (list
// endpoints may omit children); nullable columns keep their null.
const num = (value: unknown): number => Number(value ?? 0);
const numOrNull = (value: unknown): number | null =>
  value == null || value === '' ? null : Number(value);

function normalizeEvent(event: Event): Event {
  const normalized: Event = { ...event };
  if (event.distances) {
    normalized.distances = event.distances.map((distance) => ({
      ...distance,
      price: num(distance.price),
      length: numOrNull(distance.length),
      ...(distance.pricingVariants && {
        pricingVariants: distance.pricingVariants.map((variant) => ({
          ...variant,
          price: num(variant.price),
        })),
      }),
    }));
  }
  if (event.merchandise) {
    normalized.merchandise = event.merchandise.map((item) => ({
      ...item,
      price: num(item.price),
      ...(item.originalPrice != null && { originalPrice: num(item.originalPrice) }),
    }));
  }
  if (event.discountCodes) {
    normalized.discountCodes = event.discountCodes.map((code) => ({
      ...code,
      discountValue: num(code.discountValue),
    }));
  }
  return normalized;
}

const eventOne = (r: ApiResponse<Event>): ApiResponse<Event> => ({
  ...r,
  data: normalizeEvent(r.data),
});
const eventOrNull = (r: ApiResponse<Event | null>): ApiResponse<Event | null> => ({
  ...r,
  data: r.data ? normalizeEvent(r.data) : r.data,
});
const eventList = (r: ApiResponse<Event[]>): ApiResponse<Event[]> => ({
  ...r,
  data: r.data.map(normalizeEvent),
});

async function requestForm<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const { response, payload } = await fetchJsonWithTimeout(
    `${API_BASE_URL}${endpoint}`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
    UPLOAD_TIMEOUT_MS,
  );
  if (!response.ok) {
    if (response.status === 401 && !token?.startsWith(MOCK_TOKEN_PREFIX)) {
      if (!token || localStorage.getItem(TOKEN_STORAGE_KEY) === token) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { token } }));
      }
    }

    throw new ApiRequestError(
      apiErrorMessage(payload, `Błąd API ${response.status}`),
      apiErrorCode(payload),
      response.status,
    );
  }
  return payload as ApiResponse<T>;
}

/**
 * E2.6: fetches a server-generated file (CSV/XLSX export) and triggers a
 * real browser download — the one case in this adapter where the response
 * body isn't JSON, so it can't go through request(). Mirrors the existing
 * client-side download idiom (lib/exportUtils.ts's exportToCSV/exportToXML:
 * createObjectURL -> anchor -> click -> revokeObjectURL) rather than
 * inventing a new one, just fed by a server Blob instead of a locally-built
 * string. The filename comes from the server's Content-Disposition header
 * when present (it always is on a successful response here) so the
 * server — which already knows the Distance name — stays the single source
 * of truth for it; a fallback covers the unexpected case where that header
 * is missing.
 */
async function downloadFile(endpoint: string, fallbackFilename: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new ApiRequestError(TIMEOUT_MESSAGE, 'timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiRequestError(
      apiErrorMessage(payload, `Błąd API ${response.status}`),
      apiErrorCode(payload),
      response.status,
    );
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = filenameMatch?.[1] ?? fallbackFilename;

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
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

/** B-03: global templates live under /admin, per-event ones under /events/{id}. */
const mailTemplatesBase = (eventId?: string | null): string =>
  eventId ? `/events/${encodeURIComponent(eventId)}/mail-templates` : '/admin/mail-templates';

export const httpAdapter: ApiAdapter = {
  getEvents: (filters) =>
    paginated<Event>('/events', filters as Record<string, QueryValue>).then((r) => ({
      ...r,
      data: r.data.map(normalizeEvent),
    })),
  getEventBySlug: (slug, accessCode) =>
    nullOn404(
      request<Event | null>(`/events/slug/${encodeURIComponent(slug)}${query({ accessCode })}`),
    ).then(eventOrNull),
  getEventById: (id) =>
    nullOn404(request<Event | null>(`/events/${encodeURIComponent(id)}`)).then(eventOrNull),
  createEvent: (data) =>
    request<Event>('/events', json('POST', toEventWritePayload(data))).then(eventOne),
  updateEvent: (id, data) =>
    request<Event>(
      `/events/${encodeURIComponent(id)}`,
      json('PATCH', toEventWritePayload(data)),
    ).then(eventOne),
  deleteEvent: (id) => request(`/events/${encodeURIComponent(id)}`, json('DELETE')),
  submitEvent: (id) =>
    request<Event>(`/events/${encodeURIComponent(id)}/submit`, json('POST')).then(eventOne),
  approveEvent: (id) =>
    request<Event>(`/events/${encodeURIComponent(id)}/approve`, json('POST')).then(eventOne),
  rejectEvent: (id, reason) =>
    request<Event>(`/events/${encodeURIComponent(id)}/reject`, json('POST', { reason })).then(
      eventOne,
    ),
  cancelEvent: (id) =>
    request<Event>(`/events/${encodeURIComponent(id)}/cancel`, json('POST')).then(eventOne),
  setEventVisibility: (id, visibility, accessCode) =>
    request<Event>(
      `/events/${encodeURIComponent(id)}/visibility`,
      json('PATCH', { visibility, accessCode }),
    ).then(eventOne),
  setEventIsTest: (id, isTest) =>
    request<Event>(`/events/${encodeURIComponent(id)}/is-test`, json('PATCH', { isTest })).then(
      eventOne,
    ),
  createExternalEvent: (data) =>
    request<Event>('/events/external', json('POST', data)).then(eventOne),
  getFeaturedEvents: () => request<Event[]>('/events/featured').then(eventList),
  getLiveEvents: () => request<Event[]>('/events/live').then(eventList),
  getEventsByOrganizer: (organizerId) =>
    request<Event[]>(`/organizers/${encodeURIComponent(organizerId)}/events`).then(eventList),
  getOrganizerEventLimit: (organizerId) =>
    request(`/organizers/${encodeURIComponent(organizerId)}/event-limit`),
  updateOrganizerEventLimit: (organizerId, limit) =>
    request(`/organizers/${encodeURIComponent(organizerId)}/event-limit`, json('PATCH', { limit })),
  uploadEventImage: (file) => {
    const validationError = getImageFileValidationError(file);
    if (validationError) return Promise.reject(new Error(validationError));
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ url: string }>('/uploads/event-images', formData).then((response) => ({
      ...response,
      data: { ...response.data, url: resolveApiAssetUrl(response.data.url) },
    }));
  },
  uploadEventDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ url: string; originalName: string; mimeType: string }>(
      '/uploads/event-documents',
      formData,
    ).then((response) => ({
      ...response,
      data: { ...response.data, url: resolveApiAssetUrl(response.data.url) },
    }));
  },

  getEventBackgrounds: () => request('/event-backgrounds'),
  getEventBackgroundById: (id) =>
    nullOn404(request(`/event-backgrounds/${encodeURIComponent(id)}`)),
  getEventBackgroundUsages: (id) => request(`/event-backgrounds/${encodeURIComponent(id)}/usages`),
  createEventBackground: (data) => request('/event-backgrounds', json('POST', data)),
  updateEventBackground: (id, data) =>
    request(`/event-backgrounds/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteEventBackground: (id) =>
    request(`/event-backgrounds/${encodeURIComponent(id)}`, json('DELETE')),
  uploadEventBackground: (file) => {
    const validationError = getImageFileValidationError(file);
    if (validationError) return Promise.reject(new Error(validationError));
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ url: string }>('/uploads/event-backgrounds', formData).then(
      (response) => ({
        ...response,
        data: { ...response.data, url: resolveApiAssetUrl(response.data.url) },
      }),
    );
  },

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
  uploadAvatar: (file) => {
    const validationError = getImageFileValidationError(file);
    if (validationError) return Promise.reject(new Error(validationError));
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ url: string }>('/uploads/avatars', formData).then((response) => ({
      ...response,
      data: { ...response.data, url: resolveApiAssetUrl(response.data.url) },
    }));
  },

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
    try {
      return await request('/auth/logout', json('POST'));
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
  getCurrentUser: () => request('/auth/me'),
  register: (data) => request('/auth/register', json('POST', data)),
  resetPassword: (payload) => request('/auth/password/reset', json('POST', payload)),
  confirmPasswordReset: (payload) => request('/auth/password/reset/confirm', json('POST', payload)),
  verifyEmail: (payload) => request('/auth/email/verify', json('POST', payload)),
  resendEmailVerification: () => request('/auth/email/verification/resend', json('POST')),
  requestEmailChange: (payload) => request('/auth/email/change', json('POST', payload)),
  confirmEmailChange: (payload) => request('/auth/email/change/confirm', json('POST', payload)),
  async changePassword(payload) {
    // PP.7: a password change ends every session, including this device's old token; the server answers
    // with a fresh one. Store it before the next request so this device stays signed in.
    const raw = await request<{ token?: string } | null>(
      '/auth/password/change',
      json('POST', payload),
    );
    if (raw.data?.token) localStorage.setItem(TOKEN_STORAGE_KEY, raw.data.token);
    return { data: undefined, success: raw.success, message: raw.message };
  },

  getRegistrations: (filters) => paginated('/registrations', filters as Record<string, QueryValue>),
  getRegistrationsByEvent: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/registrations`),
  getTeamsForDistance: (eventId, distanceId) =>
    request(
      `/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/teams`,
    ),
  getTeamById: (teamId) => request(`/teams/${encodeURIComponent(teamId)}`),
  getTeamInvite: (teamId) => request(`/teams/${encodeURIComponent(teamId)}/invite`),
  getTeamMembers: (teamId) => request(`/teams/${encodeURIComponent(teamId)}/members`),
  swapTeamMember: (teamId, registrationId, data) =>
    request(
      `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(registrationId)}/swap`,
      json('POST', data),
    ),
  getPublicStartList: (eventId) => request(`/events/${encodeURIComponent(eventId)}/start-list`),
  getEventEmbedPublicConfig: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/embed/public`),
  getRegistrationsByUser: (userId) => request(`/users/${encodeURIComponent(userId)}/registrations`),
  createRegistration: (data) => request('/registrations', json('POST', data)),
  quoteRegistration: (data) => request('/registrations/quote', json('POST', data)),
  updateRegistration: (id, data) =>
    request(`/registrations/${encodeURIComponent(id)}`, json('PATCH', data)),
  cancelRegistration: (id) =>
    request(`/registrations/${encodeURIComponent(id)}/cancel`, json('POST')),
  getRegistrationChanges: (id) => request(`/registrations/${encodeURIComponent(id)}/changes`),
  quoteDistanceChange: (id, data) =>
    request(`/registrations/${encodeURIComponent(id)}/distance-change/quote`, json('POST', data)),
  changeRegistrationDistance: (id, data) =>
    request(`/registrations/${encodeURIComponent(id)}/distance-change`, json('POST', data)),
  transferRegistration: (id, data) =>
    request(`/registrations/${encodeURIComponent(id)}/transfer`, json('POST', data)),
  updatePaymentDetails: (id, paymentDetails) =>
    request(
      `/registrations/${encodeURIComponent(id)}/payment-details`,
      json('PATCH', paymentDetails),
    ),
  requestRefund: (id, reason) =>
    request(`/registrations/${encodeURIComponent(id)}/refund-request`, json('POST', { reason })),
  approveRefund: (id, amount) =>
    request(`/registrations/${encodeURIComponent(id)}/refund-approve`, json('POST', { amount })),
  completeRefund: (id) =>
    request(`/registrations/${encodeURIComponent(id)}/refund-complete`, json('POST')),
  retryPayment: (id) =>
    request(`/registrations/${encodeURIComponent(id)}/retry-payment`, json('POST')),
  markRegistrationPaid: (id) =>
    request(`/registrations/${encodeURIComponent(id)}/mark-paid`, json('POST')),

  getResults: (filters) => paginated('/results', filters as Record<string, QueryValue>),
  getResultsByEvent: (eventId, distanceId) =>
    request(`/events/${encodeURIComponent(eventId)}/results${query({ distanceId })}`),
  getResultsByUser: (userId) => request(`/users/${encodeURIComponent(userId)}/results`),
  createResult: (data) => request('/results', json('POST', data)),
  updateResult: (id, data) => request(`/results/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteResult: (id) => request(`/results/${encodeURIComponent(id)}`, json('DELETE')),
  getResultCorrections: (id) => request(`/results/${encodeURIComponent(id)}/corrections`),
  getPersonalRecords: (userId) => request(`/users/${encodeURIComponent(userId)}/personal-records`),
  getTeamResults: (eventId) => request(`/events/${encodeURIComponent(eventId)}/team-results`),
  getTeamClassification: (eventId, distanceId) =>
    request(
      `/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/team-results`,
    ),
  getResultDocuments: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/result-documents`),
  uploadResultDocument: (data) =>
    request(
      `/events/${encodeURIComponent(data.eventId ?? '')}/result-documents`,
      json('POST', data),
    ),
  createResultImport: (eventId, distanceId, file, mode) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return requestForm<ResultImportBatch>(
      `/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/result-imports`,
      formData,
    );
  },
  updateResultImportMapping: (importId, mapping, sheetName) =>
    request(
      `/result-imports/${encodeURIComponent(importId)}/mapping`,
      json('PATCH', { mapping, sheetName }),
    ),
  updateResultImportRow: (rowId, data) =>
    request(`/result-import-rows/${encodeURIComponent(rowId)}`, json('PATCH', data)),
  commitResultImport: (importId) =>
    request(`/result-imports/${encodeURIComponent(importId)}/commit`, json('POST')),
  publishOfficialResults: (eventId, distanceId) =>
    request(
      `/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/results/publish-official`,
      json('POST'),
    ),

  getSeries: (filters) => paginated('/series', filters as Record<string, QueryValue>),
  getSeriesById: (id) => nullOn404(request(`/series/${encodeURIComponent(id)}`)),
  getSeriesBySlug: (slug) => nullOn404(request(`/series/slug/${encodeURIComponent(slug)}`)),
  createSeries: (data) => request('/series', json('POST', data)),
  updateSeries: (id, data) => request(`/series/${encodeURIComponent(id)}`, json('PATCH', data)),
  archiveSeries: (id) => request(`/series/${encodeURIComponent(id)}/archive`, json('POST')),

  getProducts: (filters) => paginated('/shop/products', filters as Record<string, QueryValue>),
  getProductBySlug: (slug) => nullOn404(request(`/shop/products/slug/${encodeURIComponent(slug)}`)),
  getProductById: (id) => request(`/shop/products/${encodeURIComponent(id)}`),
  createProduct: (data) => request('/shop/products', json('POST', data)),
  updateProduct: (id, data) =>
    request(`/shop/products/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteProduct: (id) => request(`/shop/products/${encodeURIComponent(id)}`, json('DELETE')),
  getShopCategories: (includeArchived) => request(`/shop/categories${query({ includeArchived })}`),
  createShopCategory: (data) => request('/shop/categories', json('POST', data)),
  updateShopCategory: (id, data) =>
    request(`/shop/categories/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteShopCategory: (id) => request(`/shop/categories/${encodeURIComponent(id)}`, json('DELETE')),
  getDeliveryMethods: () => request('/shop/delivery-methods'),
  getShopPaymentMethods: () => request('/shop/payment-methods'),
  getOrders: (userId) =>
    request<ShopOrder[]>(`/shop/orders${query({ userId })}`).then((r) => ({
      ...r,
      data: r.data.map(normalizeShopOrder),
    })),
  getMyOrders: () =>
    request<ShopOrder[]>('/me/orders').then((r) => ({
      ...r,
      data: r.data.map(normalizeShopOrder),
    })),
  getOrderById: (id) =>
    request<ShopOrder | null>(`/shop/orders/${encodeURIComponent(id)}`).then((r) => ({
      ...r,
      data: r.data ? normalizeShopOrder(r.data) : r.data,
    })),
  createOrder: (data) =>
    request<ShopOrder>('/shop/orders', json('POST', data)).then((r) => ({
      ...r,
      data: normalizeShopOrder(r.data),
    })),
  updateOrderStatus: (id, status, trackingNumber) =>
    request<ShopOrder>(
      `/shop/orders/${encodeURIComponent(id)}/status`,
      json('PATCH', { status, trackingNumber }),
    ).then((r) => ({ ...r, data: normalizeShopOrder(r.data) })),

  getChallenges: (filters) => request(`/challenges${query(filters as Record<string, QueryValue>)}`),
  getChallengeBySlug: (slug) => nullOn404(request(`/challenges/slug/${encodeURIComponent(slug)}`)),
  getChallengeById: (id) => nullOn404(request(`/challenges/${encodeURIComponent(id)}`)),
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
  claimChallengeReward: (challengeId, data) =>
    request(`/challenges/${encodeURIComponent(challengeId)}/claim-reward`, json('POST', data)),
  getChallengeRanking: (challengeId) =>
    request(`/challenges/${encodeURIComponent(challengeId)}/ranking`),
  getSeriesRanking: (seriesId) => request(`/series/${encodeURIComponent(seriesId)}/ranking`),

  getMessages: (userId) => request(`/users/${encodeURIComponent(userId)}/messages`),
  getMessage: (id) => request(`/messages/${encodeURIComponent(id)}`),
  sendMessage: (data) => request('/messages', json('POST', data)),
  markAsRead: (id) => request(`/messages/${encodeURIComponent(id)}/read`, json('POST')),

  getTickets: (userId) => request(`/users/${encodeURIComponent(userId)}/tickets`),
  getCertificates: (userId) => request(`/users/${encodeURIComponent(userId)}/certificates`),

  getPartners: () => request('/partners'),
  getFeaturedPartners: () => request('/partners/featured'),
  getPartnerById: (id) => nullOn404(request(`/partners/${encodeURIComponent(id)}`)),
  createPartner: (data) => request('/partners', json('POST', data)),
  updatePartner: (id, data) => request(`/partners/${encodeURIComponent(id)}`, json('PATCH', data)),
  deletePartner: (id) => request(`/partners/${encodeURIComponent(id)}`, json('DELETE')),
  uploadPartnerLogo: (file) => {
    const validationError = getImageFileValidationError(file);
    if (validationError) return Promise.reject(new Error(validationError));
    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ url: string }>('/uploads/partner-logos', formData).then((response) => ({
      ...response,
      data: { ...response.data, url: resolveApiAssetUrl(response.data.url) },
    }));
  },

  getGlobalInsuranceSettings: () => request('/insurance/settings'),
  updateGlobalInsuranceSettings: (data) => request('/insurance/settings', json('PATCH', data)),

  getChallengePointsSettings: () => request('/challenge-points-settings'),
  updateChallengePointsSettings: (data) =>
    request('/challenge-points-settings', json('PATCH', data)),

  getActivityLogs: (filters) =>
    request(`/admin/activity-logs${query(filters as Record<string, QueryValue>)}`),
  getEventActivityLogs: (eventId, filters) =>
    request(
      `/events/${encodeURIComponent(eventId)}/activity-logs${query(filters as Record<string, QueryValue>)}`,
    ),
  getFormFieldAggregates: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/form-field-aggregates`),
  // E1.13: the server's 422 text is field-specific ("To pole jest wymagane."), so keep it
  // instead of the generic validation_error copy.
  getPublicFormFields: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/form-fields/public`),
  getFormFields: (eventId) => request(`/events/${encodeURIComponent(eventId)}/form-fields`),
  createFormField: (eventId, data) =>
    request(`/events/${encodeURIComponent(eventId)}/form-fields`, json('POST', data), true),
  updateFormField: (eventId, fieldId, data) =>
    request(
      `/events/${encodeURIComponent(eventId)}/form-fields/${encodeURIComponent(fieldId)}`,
      json('PATCH', data),
      true,
    ),
  deleteFormField: (eventId, fieldId) =>
    request(
      `/events/${encodeURIComponent(eventId)}/form-fields/${encodeURIComponent(fieldId)}`,
      json('DELETE'),
      true,
    ),
  reorderFormFields: (eventId, orderedIds) =>
    request(
      `/events/${encodeURIComponent(eventId)}/form-fields/reorder`,
      json('PUT', { orderedIds }),
      true,
    ),
  saveFormFieldAnswer: (registrationId, fieldId, value) =>
    request(
      `/registrations/${encodeURIComponent(registrationId)}/form-field-answers/${encodeURIComponent(fieldId)}`,
      json('PUT', { value }),
      true,
    ),
  getFormFieldAnswers: (registrationId) =>
    request(`/registrations/${encodeURIComponent(registrationId)}/form-field-answers`),
  getRegistrationStats: (eventId) =>
    request(`/events/${encodeURIComponent(eventId)}/registration-stats`),
  exportStartList: (eventId, distanceId, format) =>
    downloadFile(
      `/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/start-list-export${query({ format })}`,
      `lista-startowa.${format}`,
    ),
  getSecuritySettings: () => request('/admin/security-settings'),
  updateSecuritySettings: (data) => request('/admin/security-settings', json('PATCH', data)),
  getOnlineSessions: () => request('/admin/online-sessions'),
  getSalesStats: () => request('/admin/sales-stats'),
  getPlatformStats: () => request('/admin/platform-stats'),

  getInfoPages: () => request('/info-pages'),
  getInfoPageBySlug: (slug) => nullOn404(request(`/info-pages/slug/${encodeURIComponent(slug)}`)),
  createInfoPage: (data) => request('/info-pages', json('POST', data)),
  updateInfoPage: (id, data) =>
    request(`/info-pages/${encodeURIComponent(id)}`, json('PATCH', data)),
  deleteInfoPage: (id) => request(`/info-pages/${encodeURIComponent(id)}`, json('DELETE')),
  reorderInfoPages: (ids) => request('/info-pages/reorder', json('POST', { ids })),

  getCalendarSettings: () => request('/calendar/settings'),
  // Only enabled / calendarId / timeZone are writable; the derived flags stay on the server.
  updateCalendarSettings: (data) =>
    request(
      '/calendar/settings',
      json('PATCH', {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.calendarId !== undefined && { calendarId: data.calendarId }),
        ...(data.timeZone !== undefined && { timeZone: data.timeZone }),
      }),
    ),
  // The server reads the Event from its own database; only the id selects it.
  addEventToCalendar: (event) => request('/calendar/events', json('POST', { id: event.id })),

  getVirtualResultSubmissions: (filters) =>
    request(`/virtual-results${query(filters as Record<string, QueryValue>)}`),
  submitVirtualResult: (data) => request('/virtual-results', json('POST', data)),
  reviewVirtualResult: (id, status, reason) =>
    request(`/virtual-results/${encodeURIComponent(id)}/review`, json('PATCH', { status, reason })),

  getMailTemplates: (eventId) => request(mailTemplatesBase(eventId)),
  saveMailTemplate: (mailType, payload, eventId) =>
    request(`${mailTemplatesBase(eventId)}/${encodeURIComponent(mailType)}`, json('PUT', payload)),
  resetMailTemplate: (mailType, eventId) =>
    request(`${mailTemplatesBase(eventId)}/${encodeURIComponent(mailType)}`, json('DELETE')),
  previewMailTemplate: (mailType, payload, eventId) =>
    request(
      `${mailTemplatesBase(eventId)}/${encodeURIComponent(mailType)}/preview`,
      json('POST', payload),
    ),
  getMailLog: (filters, eventId) =>
    paginated(
      `${eventId ? `/events/${encodeURIComponent(eventId)}` : '/admin'}/mail-log`,
      filters as Record<string, QueryValue>,
    ),

  getCare: () => request('/care'),
  grantCareByEmail: (email) => request('/care', json('POST', { email })),
  addCompetitor: (payload) => request('/care', json('POST', payload)),
  revokeCare: (id) => request(`/care/${encodeURIComponent(id)}`, json('DELETE')),
  checkCompetitorDuplicates: (firstName, lastName, birthDate) =>
    request(
      `/competitors/duplicates?${new URLSearchParams({
        firstName,
        lastName,
        ...(birthDate ? { birthDate } : {}),
      }).toString()}`,
    ),
  setCompetitorAnonymization: (competitorId, isAnonymized) =>
    request(
      `/competitors/${encodeURIComponent(competitorId)}/anonymization`,
      json('POST', { isAnonymized }),
    ),
  rotateIdentityCode: (competitorId) =>
    request(`/competitors/${encodeURIComponent(competitorId)}/rotate-identity-code`, json('POST')),

  searchCompetitorsForMerge: (q) =>
    request(`/admin/competitors/search?${new URLSearchParams({ q }).toString()}`),
  getCompetitorMergeComparison: (competitorIdA, competitorIdB) =>
    request(
      `/admin/competitors/${encodeURIComponent(competitorIdA)}/merge-comparison/${encodeURIComponent(competitorIdB)}`,
    ),
  mergeCompetitors: (payload) => request('/admin/competitors/merge', json('POST', payload)),
};
