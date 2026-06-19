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

    await expect(httpAdapter.createEvent({ name: 'Bieg' })).rejects.toThrow(
      'Wybierz aktywne konto organizatora',
    );
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
