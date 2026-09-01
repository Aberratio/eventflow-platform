import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRegistrationEmail } from '@/hooks/useRegistrationEmail';
import type { RegistrationData } from '@/components/registration/RegistrationForm';
import type { PaymentConfig, Registration } from '@/types';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, React.createElement(AuthProvider, null, children));

const baseRegistrationData: RegistrationData = {
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'OPEN',
  birthDate: '1990-01-01',
  price: 80,
  merchandiseOrders: [],
  merchandise: [],
  modifiersTotal: 0,
  totalAmount: 80,
};

const bankTransferPaymentConfig: PaymentConfig = {
  type: 'organizer_bank',
  bankAccountNumber: '12345678901234567890123456',
  bankAccountHolder: 'Organizator Sp. z o.o.',
  transferTitle: '{eventName} - {participantName}',
};

const baseRegistration: Registration = {
  id: 'reg-1',
  eventId: 'e1',
  eventName: 'Test Event',
  userId: 'u1',
  userName: 'Jan Kowalski',
  userEmail: 'jan@example.com',
  distanceId: 'd1',
  distanceName: '10 km',
  category: 'OPEN',
  registeredAt: new Date().toISOString(),
  status: 'pending',
};

describe('useRegistrationEmail', () => {
  it('uses the server-computed deterministic transferTitle (ZC-{id}) when present', async () => {
    const { result } = renderHook(() => useRegistrationEmail(), { wrapper });

    let emailData: Awaited<ReturnType<typeof result.current.sendRegistrationEmail>>;
    await act(async () => {
      emailData = await result.current.sendRegistrationEmail({
        registrationData: baseRegistrationData,
        registration: { ...baseRegistration, transferTitle: 'ZC-42' },
        eventName: 'Test Event',
        eventDate: '2026-06-15',
        eventCity: 'Warszawa',
        eventSlug: 'test-event',
        paymentConfig: bankTransferPaymentConfig,
      });
    });

    expect(emailData!.bankTransfer?.transferTitle).toBe('ZC-42');
  });

  it('falls back to the legacy template when registration has no transferTitle (older registrations)', async () => {
    const { result } = renderHook(() => useRegistrationEmail(), { wrapper });

    let emailData: Awaited<ReturnType<typeof result.current.sendRegistrationEmail>>;
    await act(async () => {
      emailData = await result.current.sendRegistrationEmail({
        registrationData: baseRegistrationData,
        registration: { ...baseRegistration, transferTitle: undefined },
        eventName: 'Test Event',
        eventDate: '2026-06-15',
        eventCity: 'Warszawa',
        eventSlug: 'test-event',
        paymentConfig: bankTransferPaymentConfig,
      });
    });

    // Legacy template substitutes {eventName}/{participantName} - not the
    // ambiguous per-event string, and definitely not the ZC- deterministic form.
    expect(emailData!.bankTransfer?.transferTitle).toContain('Test Event');
    expect(emailData!.bankTransfer?.transferTitle).not.toMatch(/^ZC-/);
  });

  it('falls back to the legacy template when no registration object is passed at all', async () => {
    const { result } = renderHook(() => useRegistrationEmail(), { wrapper });

    let emailData: Awaited<ReturnType<typeof result.current.sendRegistrationEmail>>;
    await act(async () => {
      emailData = await result.current.sendRegistrationEmail({
        registrationData: baseRegistrationData,
        eventName: 'Test Event',
        eventDate: '2026-06-15',
        eventCity: 'Warszawa',
        eventSlug: 'test-event',
        paymentConfig: bankTransferPaymentConfig,
      });
    });

    expect(emailData!.bankTransfer?.transferTitle).toContain('Test Event');
  });
});
