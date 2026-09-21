import { useAuth } from '@/contexts/AuthContext';
import { RegistrationData } from '@/components/registration/RegistrationForm';
import { PaymentConfig, Registration } from '@/types';
import { formatMoney } from '@/lib/format';

interface SendRegistrationEmailParams {
  registrationData: RegistrationData;
  /**
   * The server's frozen registration response (E1.2), when available.
   * Carries `transferTitle` (E1.8) — the deterministic `ZC-{id}` title that
   * must be used instead of the legacy per-event template, see
   * `resolveTransferTitle` below.
   */
  registration?: Registration;
  eventName: string;
  eventDate: string;
  eventCity: string;
  eventSlug: string;
  paymentConfig?: PaymentConfig;
}

export const useRegistrationEmail = () => {
  const { user } = useAuth();

  const generateTransferTitle = (
    template: string | undefined,
    eventName: string,
    distanceName: string,
    birthDate?: string,
  ): string => {
    const baseTemplate = template || '{eventName} - {participantName}';
    return baseTemplate
      .replace('{eventName}', eventName)
      .replace('{participantName}', user?.name || 'Uczestnik')
      .replace('{distanceName}', distanceName)
      .replace('{birthDate}', birthDate || '');
  };

  // E1.8: prefer the server-computed, deterministic `ZC-{id}` title — it is
  // what actually gets matched against incoming bank transfers. The
  // template-based title below is a legacy fallback for a registration that
  // predates this field (same fallback idiom as EventSidebar.tsx and
  // RegistrationSuccessPage.tsx).
  const resolveTransferTitle = (
    registration: Registration | undefined,
    template: string | undefined,
    eventName: string,
    distanceName: string,
    birthDate?: string,
  ): string => {
    if (registration?.transferTitle) {
      return registration.transferTitle;
    }
    return generateTransferTitle(template, eventName, distanceName, birthDate);
  };

  const sendRegistrationEmail = async ({
    registrationData,
    registration,
    eventName,
    eventDate,
    eventCity,
    eventSlug,
    paymentConfig,
  }: SendRegistrationEmailParams) => {
    const isBankTransfer = paymentConfig?.type === 'organizer_bank';

    // Build email payload (ready for real API integration)
    const emailData = {
      to: user?.email || 'participant@example.com',
      subject: isBankTransfer
        ? `Rejestracja wstępna: ${eventName} - oczekuje na płatność`
        : `Potwierdzenie rejestracji: ${eventName}`,
      header: {
        title: isBankTransfer ? 'Rejestracja wstępna zakończona!' : 'Rejestracja zakończona!',
        eventName,
        eventDate,
        eventCity,
      },
      registrationDetails: {
        distanceName: registrationData.distanceName,
        category: registrationData.category,
        basePrice: formatMoney(registrationData.price),
        discountAmount:
          registrationData.discountAmount && registrationData.discountAmount > 0
            ? formatMoney(registrationData.discountAmount)
            : null,
        discountCode: registrationData.discountCode || null,
        insurance:
          registrationData.insurancePrice && registrationData.insurancePrice > 0
            ? {
                name: 'Ubezpieczenie NNW',
                price: formatMoney(registrationData.insurancePrice),
              }
            : null,
        merchandise:
          registrationData.merchandiseOrders?.map((item) => ({
            name: `${item.merchandiseName} (${[item.size, item.color].filter(Boolean).join(', ') || 'bez rozmiaru'})`,
            quantity: item.quantity,
            price: formatMoney(item.price),
          })) || [],
        totalAmount: formatMoney(registrationData.totalAmount),
      },
      bankTransfer:
        isBankTransfer && paymentConfig
          ? {
              accountNumber: paymentConfig.bankAccountNumber || '',
              accountHolder: paymentConfig.bankAccountHolder || '',
              transferTitle: resolveTransferTitle(
                registration,
                paymentConfig.transferTitle,
                eventName,
                registrationData.distanceName || '',
                registrationData.birthDate,
              ),
              amount: formatMoney(registrationData.totalAmount),
              instructions: [
                'Wpłać dokładną kwotę na podane konto',
                'Użyj podanego tytułu przelewu',
                'Twoja rejestracja zostanie potwierdzona po zaksięgowaniu wpłaty',
                'Status płatności możesz sprawdzić w panelu uczestnika',
              ],
            }
          : null,
      footer: {
        eventUrl: `${window.location.origin}/events/${eventSlug}`,
        registrationsUrl: `${window.location.origin}/participant`,
      },
    };

    // Simulate async email sending (replace with real API call)
    await new Promise((resolve) => setTimeout(resolve, 100));

    return emailData;
  };

  return { sendRegistrationEmail };
};
