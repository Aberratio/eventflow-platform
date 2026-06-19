import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

const TOKEN_STORAGE_KEY = 'zmierzymy_czas_api_token';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
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
});
