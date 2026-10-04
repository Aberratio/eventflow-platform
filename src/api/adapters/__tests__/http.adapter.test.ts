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
      mockJsonResponse({ success: true, data: { token: 'fresh-token' }, message: 'Password changed' }),
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

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
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
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/events\/slug\/bieg\?accessCode=KOD\+1$/);
  });

  it('sends no query string without an access code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: null }));
    await httpAdapter.getEventBySlug('bieg');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/events\/slug\/bieg$/);
  });
});
