import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';
import { registrationFormFieldErrors } from '../../errors';

const BASE = 'http://localhost:8081/api/v1';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

const lastCall = () => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(-1) as [string, RequestInit];
  return { url, init, body: init.body ? JSON.parse(init.body as string) : undefined };
};

const base = {
  eventId: 'e1',
  eventName: 'Bieg',
  userId: 'u1',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'Open',
};

describe('httpAdapter createRegistration with the registration form (B-07)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends formFieldAnswers and identity in the one POST /registrations, with no PUT after it', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: true,
          data: {
            id: 'r1',
            totalAmount: 85,
            settlementItems: [
              { id: 's1', name: 'Opłata', basis: 'distance_price', amount: 80 },
              { id: 's2', name: 'Posiłek: Wegetariański', basis: 'modifier', amount: 5 },
            ],
          },
        },
        201,
      ),
    );
    const response = await httpAdapter.createRegistration({
      ...base,
      formFieldAnswers: [
        { fieldId: 'f-meal', value: 'veg' },
        { fieldId: 'f-extras', value: ['a', 'b'] },
        { fieldId: 'f-consent', value: true },
      ],
      identity: { phone: '+48 600 100 200', voivodeship: 'pomorskie', isAnonymized: false },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/registrations`);
    expect(call.init.method).toBe('POST');
    expect(call.body.formFieldAnswers).toEqual([
      { fieldId: 'f-meal', value: 'veg' },
      { fieldId: 'f-extras', value: ['a', 'b'] },
      { fieldId: 'f-consent', value: true },
    ]);
    expect(call.body.identity).toEqual({
      phone: '+48 600 100 200',
      voivodeship: 'pomorskie',
      isAnonymized: false,
    });
    expect(response.data.settlementItems?.map((i) => i.basis)).toEqual([
      'distance_price',
      'modifier',
    ]);
  });

  it('exposes the 422 registration_form_invalid details as per-field errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: false,
          error: {
            code: 'registration_form_invalid',
            message: 'Formularz zawiera błędy.',
            details: {
              fields: [
                {
                  fieldId: 'f1',
                  fieldKey: 'custom_size',
                  code: 'required',
                  message: 'To pole jest wymagane.',
                },
                {
                  fieldId: 's1',
                  fieldKey: 'phone',
                  code: 'required',
                  message: 'To pole jest wymagane.',
                },
              ],
            },
          },
        },
        422,
      ),
    );
    const error = await httpAdapter.createRegistration(base).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'registration_form_invalid', status: 422 });
    expect(registrationFormFieldErrors(error).map((e) => e.fieldKey)).toEqual([
      'custom_size',
      'phone',
    ]);
    expect(registrationFormFieldErrors(new Error('x'))).toEqual([]);
  });
});

describe('httpAdapter createRegistration closed and test-mode outcomes (B-01, G-08)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws an ApiRequestError with code registration_closed, status 409 and the server message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'registration_closed', message: 'Zapisy na to wydarzenie są zamknięte.' },
        },
        409,
      ),
    );

    const error = await httpAdapter.createRegistration(base).catch((e: unknown) => e);

    expect(error).toMatchObject({
      name: 'ApiRequestError',
      code: 'registration_closed',
      status: 409,
      message: 'Zapisy na to wydarzenie są zamknięte.',
    });
  });

  it('returns the dry-run response with isTest and its Rozliczenie, in a single request', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: true,
          data: { id: 'r-dry', isTest: true, totalAmount: 80, settlementItems: [] },
        },
        201,
      ),
    );

    const response = await httpAdapter.createRegistration(base);

    expect(response.data.isTest).toBe(true);
    expect(response.data.totalAmount).toBe(80);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('httpAdapter quoteRegistration (B-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the create payload to /registrations/quote and returns the priced lines', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({
        success: true,
        data: {
          eventName: 'Bieg',
          distanceName: '10 km',
          totalAmount: 75,
          discountCode: null,
          settlementItems: [
            { name: 'Opłata', basis: 'distance_price', amount: 80 },
            { name: 'Losowanie: Biorę udział', basis: 'modifier', amount: -5 },
          ],
        },
      }),
    );

    const response = await httpAdapter.quoteRegistration({
      ...base,
      formFieldAnswers: [{ fieldId: 'f-draw', value: 'yes' }],
    });

    const call = lastCall();
    expect(call.url).toBe(`${BASE}/registrations/quote`);
    expect(call.init.method).toBe('POST');
    expect(call.body.formFieldAnswers).toEqual([{ fieldId: 'f-draw', value: 'yes' }]);
    expect(response.data.totalAmount).toBe(75);
    expect(response.data.settlementItems[1].amount).toBe(-5);
  });

  it('keeps the per-field errors of a 422 so the form can be shown as invalid', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: false,
          error: {
            code: 'registration_form_invalid',
            message: 'Formularz zapisu zawiera błędy.',
            details: { fields: [{ fieldId: 'f1', fieldKey: 'k', code: 'required', message: 'x' }] },
          },
        },
        422,
      ),
    );

    const error = await httpAdapter.quoteRegistration(base).catch((e: unknown) => e);

    expect(registrationFormFieldErrors(error)).toHaveLength(1);
  });
});
