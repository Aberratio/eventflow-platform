import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/constants';

const TOKEN_STORAGE_KEY = 'zmierzymy_czas_api_token';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

describe('httpAdapter contract mapping', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps login response to current user and stores bearer token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: {
          token: 'jwt-token',
          user: {
            id: 'u1',
            name: 'Jan Kowalski',
            email: 'jan@example.com',
            role: 'participant',
            status: 'active',
          },
        },
      }),
    );

    const response = await httpAdapter.login({
      email: 'jan@example.com',
      password: 'demo1234',
    });

    expect(response).toEqual({
      success: true,
      data: expect.objectContaining({ id: 'u1', email: 'jan@example.com' }),
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-token');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'jan@example.com', password: 'demo1234' }),
      }),
    );
  });

  it('sends stored token as Authorization header for protected requests', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      }),
    );

    await httpAdapter.getUsers({ search: 'admin' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/users?search=admin',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('stores the rotated token returned by a password change (PP.7)', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'old-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { token: 'fresh-token' },
        message: 'Password changed',
      }),
    );

    await httpAdapter.changePassword({ oldPassword: 'demo1234', newPassword: 'NoweHaslo123' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/password/change',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ oldPassword: 'demo1234', newPassword: 'NoweHaslo123' }),
        headers: expect.objectContaining({ Authorization: 'Bearer old-token' }),
      }),
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('fresh-token');
  });

  it('keeps the stored token when a password change fails (PP.7)', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'old-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        { success: false, error: { code: 'invalid_current_password', message: 'x' } },
        422,
      ),
    );

    await expect(
      httpAdapter.changePassword({ oldPassword: 'bad', newPassword: 'NoweHaslo123' }),
    ).rejects.toThrow('Obecne hasło jest nieprawidłowe.');

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('old-token');
  });

  it('posts the reset token and new password to the confirm endpoint (PP.7)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));

    await httpAdapter.confirmPasswordReset({ token: 'a'.repeat(64), newPassword: 'NoweHaslo123' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/password/reset/confirm',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'a'.repeat(64), newPassword: 'NoweHaslo123' }),
      }),
    );
  });

  it('carries the API error code and status on thrown errors (PP.7)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'invalid_token', message: 'Link jest nieprawidłowy lub wygasł.' },
        },
        400,
      ),
    );

    const error = await httpAdapter
      .confirmPasswordReset({ token: 'bad', newPassword: 'NoweHaslo123' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      message: 'Link jest nieprawidłowy lub wygasł.',
      code: 'invalid_token',
      status: 400,
    });
  });

  it.each([
    ['verifyEmail', '/auth/email/verify', { token: 'a'.repeat(64) }],
    ['confirmEmailChange', '/auth/email/change/confirm', { token: 'b'.repeat(64) }],
    [
      'requestEmailChange',
      '/auth/email/change',
      { newEmail: 'nowy@example.test', currentPassword: 'demo1234' },
    ],
  ] as const)('%s posts its payload to %s (PP.7)', async (method, path, payload) => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));

    await (httpAdapter[method] as (p: unknown) => Promise<unknown>)(payload);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8081/api/v1${path}`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });

  it('posts the verification resend without a body (PP.7)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: { alreadyVerified: false } }),
    );

    const response = await httpAdapter.resendEmailVerification();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/email/verification/resend',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(response.data).toEqual({ alreadyVerified: false });
  });

  it('preserves paginated response shape for list endpoints', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        data: [{ id: 'e1', name: 'Bieg Testowy' }],
        total: 1,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      }),
    );

    const response = await httpAdapter.getEvents({ search: 'Bieg' });

    expect(response.data).toHaveLength(1);
    expect(response.total).toBe(1);
    expect(response.pageSize).toBe(25);
  });

  it('posts to the publish-official endpoint for the given event and distance (E2.3)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: {
          eventId: 'event-1',
          distanceId: 'distance-1',
          publicationStatus: 'official',
          updatedCount: 42,
        },
      }),
    );

    const response = await httpAdapter.publishOfficialResults('event-1', 'distance-1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/events/event-1/distances/distance-1/results/publish-official',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(response).toEqual({
      success: true,
      data: expect.objectContaining({ publicationStatus: 'official', updatedCount: 42 }),
    });
  });

  it('maps backend discount error codes to user-facing messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: {
            code: 'discount_code_used_up',
            message: 'Discount code usage limit has been reached.',
          },
        },
        422,
      ),
    );

    await expect(
      httpAdapter.createRegistration({
        eventId: 'e1',
        eventName: 'Bieg',
        userId: 'u1',
        userName: 'Jan',
        userEmail: 'jan@example.com',
        distanceId: 'd1',
        distanceName: '10 km',
        category: 'Open',
        discountCode: 'USED',
      }),
    ).rejects.toThrow('Kod rabatowy');
  });

  it('maps invalid organizer errors to a Polish actionable message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: {
            code: 'invalid_organizer',
            message: 'Active organizer is required',
          },
        },
        422,
      ),
    );

    await expect(
      httpAdapter.createEvent({
        name: 'Bieg',
        slug: 'bieg',
        discipline: 'running',
        date: '2026-01-01',
        location: 'Warszawa',
        city: 'Warszawa',
        description: 'Opis',
        imageUrl: 'https://example.com/image.jpg',
        distances: [],
        organizerId: 'org-1',
        organizerName: 'Organizator',
        registrationDeadline: '2025-12-31',
      }),
    ).rejects.toThrow('Wybierz aktywne konto organizatora');
  });

  it('maps the no-credit submit error to a Polish message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: {
            code: 'event_submit_no_organizer_credit',
            message: 'No available organizer package credit to submit this event',
          },
        },
        409,
      ),
    );

    await expect(httpAdapter.submitEvent('e1')).rejects.toThrow(
      'Brak dostępnego pakietu organizatora. Kup pakiet, aby oddać wydarzenie do sprawdzenia.',
    );
  });

  it('posts to /events/external for a barebones external event (E6.4)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: { id: 'evt-ext-1', name: 'Polmaraton Korony', isExternal: true },
      }),
    );

    const response = await httpAdapter.createExternalEvent({
      name: 'Polmaraton Korony',
      date: '2019-09-01',
      location: 'Rynek',
      city: 'Krakow',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/events/external',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Polmaraton Korony',
          date: '2019-09-01',
          location: 'Rynek',
          city: 'Krakow',
        }),
      }),
    );
    expect(response).toEqual({
      success: true,
      data: expect.objectContaining({ id: 'evt-ext-1', isExternal: true }),
    });
  });

  it('clears the stored token and emits an auth event on protected 401 responses', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    // AuthContext relies on this order: the slot is already empty when the event announces the token.
    let announced: unknown;
    let slotAtDispatch: string | null | undefined;
    const onExpired = vi.fn((event: Event) => {
      announced = (event as CustomEvent).detail;
      slotAtDispatch = localStorage.getItem(TOKEN_STORAGE_KEY);
    });
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'unauthorized', message: 'Invalid or expired token' },
        },
        401,
      ),
    );

    await expect(httpAdapter.getCurrentUser()).rejects.toThrow('Twoja sesja wygasła');

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(announced).toEqual({ token: 'expired-token' });
    expect(slotAtDispatch).toBeNull();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  });

  it('does not clear a newer token when an older protected request returns 401', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'old-token');
    const onExpired = vi.fn();
    const pending = deferred<Response>();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    vi.mocked(fetch).mockReturnValueOnce(pending.promise);

    const request = httpAdapter.getCurrentUser();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'fresh-token');
    pending.resolve(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'unauthorized', message: 'Invalid or expired token' },
        },
        401,
      ),
    );

    await expect(request).rejects.toThrow('Twoja sesja wygasła');

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('fresh-token');
    expect(onExpired).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  });

  it('does not clear mock-mode tokens when delegated HTTP endpoints return 401', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'mock-user:test-organizer');
    const onExpired = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'unauthorized', message: 'Invalid or expired token' },
        },
        401,
      ),
    );

    await expect(httpAdapter.getCurrentUser()).rejects.toThrow('Twoja sesja wygasła');

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('mock-user:test-organizer');
    expect(onExpired).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  });

  it('rejects unsupported image files before upload', async () => {
    const file = new File(['<svg />'], 'logo.svg', { type: 'image/svg+xml' });

    await expect(httpAdapter.uploadEventImage(file)).rejects.toThrow(
      'Nieobsługiwany format obrazu',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('maps backend upload errors to Polish messages', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'image_dimensions_too_large', message: 'Image dimensions are too large' },
        },
        422,
      ),
    );

    const file = new File(['jpg'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(httpAdapter.uploadEventImage(file)).rejects.toThrow(
      'Obraz ma zbyt dużą rozdzielczość',
    );
  });

  it('requests own orders from /me/orders and normalizes money fields (PP.17)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        data: [
          {
            id: 'o1',
            productTotal: '45.00',
            deliveryPrice: '0.00',
            paymentSurcharge: '0.00',
            totalPrice: '45.00',
            items: [],
          },
        ],
      }),
    );

    const result = await httpAdapter.getMyOrders();

    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url.endsWith('/me/orders')).toBe(true);
    expect(url).not.toContain('userId');
    expect(result.data[0].totalPrice).toBe(45);
  });
});

// E2.6: start-list export — the one adapter method that downloads a file
// instead of returning parsed JSON.
describe('httpAdapter.exportStartList (E2.6)', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });
    clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mockFileResponse(body: BlobPart, headers: Record<string, string> = {}): Response {
    const headerMap = new Map(Object.entries(headers));
    return {
      ok: true,
      status: 200,
      headers: { get: (name: string) => headerMap.get(name) ?? null },
      blob: vi.fn().mockResolvedValue(new Blob([body])),
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response;
  }

  it('requests the correct URL and query params for a CSV export', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFileResponse('id;name\n1;Jan', {
        'Content-Disposition': 'attachment; filename="lista-startowa-10-km.csv"',
      }),
    );

    await httpAdapter.exportStartList('event-1', 'distance-1', 'csv');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/events/event-1/distances/distance-1/start-list-export?format=csv',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
  });

  it('requests format=xml and downloads the file (G-11)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFileResponse('<startList/>'));

    await httpAdapter.exportStartList('event-1', 'distance-1', 'xml');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/events/event-1/distances/distance-1/start-list-export?format=xml',
      expect.anything(),
    );
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('triggers a browser download named from the server Content-Disposition header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFileResponse('binary-xlsx-bytes', {
        'Content-Disposition': 'attachment; filename="lista-startowa-10-km.xlsx"',
      }),
    );

    await httpAdapter.exportStartList('event-1', 'distance-1', 'xlsx');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('falls back to a generic filename when Content-Disposition is missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFileResponse('id;name\n1;Jan'));

    await httpAdapter.exportStartList('event-1', 'distance-1', 'csv');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('throws a mapped error message on a failed export instead of downloading anything', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: false, error: { code: 'forbidden' } }, 403),
    );

    await expect(httpAdapter.exportStartList('event-1', 'distance-1', 'csv')).rejects.toThrow(
      'Nie masz uprawnień do wykonania tej operacji.',
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });
});

describe('httpAdapter getEventBySlug access code', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards the private-event access code as a query parameter', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));
    await httpAdapter.getEventBySlug('bieg', 'KOD 1');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(
      /\/events\/slug\/bieg\?accessCode=KOD\+1$/,
    );
  });

  it('sends no query string without an access code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));
    await httpAdapter.getEventBySlug('bieg');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/events\/slug\/bieg$/);
  });
});

describe('httpAdapter event write payloads (PP.96)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const withCounters = {
    discountCodes: [
      {
        id: 'srv-1',
        code: 'A',
        discountType: 'percent',
        discountValue: 10,
        active: true,
        usedCount: 5,
        usedBy: [{ registrationId: 'r1' }],
      },
    ],
    distances: [{ id: 'd1', name: '5 km', price: 50, registeredCount: 7 }],
  } as unknown as Parameters<typeof httpAdapter.updateEvent>[1];

  const sentBody = () => {
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  };

  it('does not send usedCount, usedBy or registeredCount on PATCH /events/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));
    await httpAdapter.updateEvent('e1', withCounters);

    const body = sentBody();
    expect(JSON.stringify(body)).not.toMatch(/usedCount|usedBy|registeredCount/);
    expect(body.discountCodes).toEqual([
      { id: 'srv-1', code: 'A', discountType: 'percent', discountValue: 10, active: true },
    ]);
  });

  it('does not send usedCount, usedBy or registeredCount on POST /events', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));
    await httpAdapter.createEvent(
      withCounters as unknown as Parameters<typeof httpAdapter.createEvent>[0],
    );

    expect(JSON.stringify(sentBody())).not.toMatch(/usedCount|usedBy|registeredCount/);
  });
});

describe('event money normalisation (PP.103)', () => {
  // PHP/PDO returns DECIMAL columns as numeric strings.
  const rawEvent = () => ({
    id: 'e1',
    name: 'Bieg',
    distances: [
      {
        id: 'd1',
        price: '55.00',
        length: '10.000',
        pricingVariants: [{ id: 'v1', price: '40.50' }],
      },
      { id: 'd2', price: '0.00', length: null },
    ],
    merchandise: [
      { id: 'm1', price: '79.99', originalPrice: null },
      { id: 'm2', price: '10.00', originalPrice: '12.50' },
    ],
    discountCodes: [{ id: 'c1', discountValue: '10.00' }],
  });

  type Normalised = ReturnType<typeof rawEvent>;
  const asEvent = (data: unknown) =>
    data as unknown as {
      distances: { price: number; length: number | null; pricingVariants?: { price: number }[] }[];
      merchandise: { price: number; originalPrice?: number | null }[];
      discountCodes: { discountValue: number }[];
    };

  const expectNumbers = (data: unknown) => {
    const e = asEvent(data);
    expect(e.distances[0].price).toBe(55);
    expect(e.distances[0].length).toBe(10);
    expect(e.distances[0].pricingVariants?.[0].price).toBe(40.5);
    expect(e.distances[1].price).toBe(0);
    expect(e.distances[1].length).toBeNull();
    expect(e.merchandise[0].price).toBe(79.99);
    expect(e.merchandise[0].originalPrice ?? null).toBeNull();
    expect(e.merchandise[1].originalPrice).toBe(12.5);
    expect(e.discountCodes[0].discountValue).toBe(10);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ok = (data: unknown) =>
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data }));

  it('getEventById returns numbers', async () => {
    ok(rawEvent());
    expectNumbers((await httpAdapter.getEventById('e1')).data);
  });

  it('getEventById keeps null data', async () => {
    ok(null);
    expect((await httpAdapter.getEventById('e1')).data).toBeNull();
  });

  it('getEventBySlug returns numbers and keeps null data', async () => {
    ok(rawEvent());
    expectNumbers((await httpAdapter.getEventBySlug('bieg')).data);
    ok(null);
    expect((await httpAdapter.getEventBySlug('bieg')).data).toBeNull();
  });

  it('getEvents (paginated) normalises each row and keeps paging fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: [rawEvent()], total: 1, page: 1, pageSize: 20 }),
    );
    const res = await httpAdapter.getEvents();
    expectNumbers(res.data[0]);
    expect(res.total).toBe(1);
  });

  it('updateEvent returns numbers', async () => {
    ok(rawEvent());
    expectNumbers((await httpAdapter.updateEvent('e1', {})).data);
  });

  it.each([
    [
      'createEvent',
      () => httpAdapter.createEvent({} as Parameters<typeof httpAdapter.createEvent>[0]),
    ],
    ['submitEvent', () => httpAdapter.submitEvent('e1')],
    ['approveEvent', () => httpAdapter.approveEvent('e1')],
    ['rejectEvent', () => httpAdapter.rejectEvent('e1', 'x')],
    ['cancelEvent', () => httpAdapter.cancelEvent('e1')],
    ['setEventVisibility', () => httpAdapter.setEventVisibility('e1', 'public')],
    ['setEventIsTest', () => httpAdapter.setEventIsTest('e1', true)],
    [
      'createExternalEvent',
      () =>
        httpAdapter.createExternalEvent({
          name: 'n',
          date: '2027-01-01',
          location: 'l',
          city: 'c',
        }),
    ],
  ])('%s returns numbers', async (_name, call) => {
    ok(rawEvent());
    expectNumbers((await call()).data);
  });

  it.each([
    ['getFeaturedEvents', () => httpAdapter.getFeaturedEvents()],
    ['getLiveEvents', () => httpAdapter.getLiveEvents()],
    ['getEventsByOrganizer', () => httpAdapter.getEventsByOrganizer('o1')],
  ])('%s normalises each row', async (_name, call) => {
    ok([rawEvent()]);
    expectNumbers((await call()).data[0]);
  });

  it('does not add collections that were absent', async () => {
    ok({ id: 'e1', name: 'Bieg' });
    const data = (await httpAdapter.getEventById('e1')).data as unknown as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(['id', 'name']);
  });

  it('does not mutate-away unrelated fields', async () => {
    const raw: Normalised = rawEvent();
    ok(raw);
    const data = (await httpAdapter.getEventById('e1')).data as unknown as { name: string };
    expect(data.name).toBe('Bieg');
  });
});

describe('httpAdapter info page block format (B-08)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const block = { id: 'b', type: 'text', format: 'html', title: '', content: '<p>x</p>' } as const;

  it('sends the text block format on PATCH /info-pages/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));
    await httpAdapter.updateInfoPage('p1', { content: [block] });

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ content: [block] });
  });

  it('returns the block format from GET /info-pages/slug/{slug}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: { id: 'p1', slug: 's', content: [block] } }),
    );
    const res = await httpAdapter.getInfoPageBySlug('s');
    expect(res.data?.content[0].format).toBe('html');
  });
});

describe('httpAdapter calendar (R-17)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    return {
      url,
      method: init.method,
      body: JSON.parse(String(init.body)) as Record<string, unknown>,
    };
  };

  it('PATCH /calendar/settings sends only the writable fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));
    await httpAdapter.updateCalendarSettings({
      enabled: true,
      calendarId: 'a@b',
      connected: true,
      credentialsConfigured: true,
      lastSyncAt: '2026-01-01T00:00:00Z',
    });

    const call = lastCall();
    expect(call.url).toContain('/calendar/settings');
    expect(call.method).toBe('PATCH');
    expect(call.body).toEqual({ enabled: true, calendarId: 'a@b' });
  });

  it('POST /calendar/events sends just the event id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));
    await httpAdapter.addEventToCalendar({ id: 'e1', name: 'Bieg' } as never);

    const call = lastCall();
    expect(call.url).toContain('/calendar/events');
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ id: 'e1' });
  });
});
