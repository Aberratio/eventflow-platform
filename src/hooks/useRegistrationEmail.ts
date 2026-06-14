import { useAuth } from '@/contexts/AuthContext';
import { RegistrationData } from '@/components/registration/RegistrationForm';
import { PaymentConfig } from '@/types';

interface SendRegistrationEmailParams {
  registrationData: RegistrationData;
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

  const formatPrice = (amount: number): string => {
    return `${amount.toFixed(2)} zł`;
  };

  const sendRegistrationEmail = async ({
    registrationData,
    eventName,
    eventDate,
    eventCity,
    eventSlug,
    paymentConfig,
  }: SendRegistrationEmailParams): Promise<void> => {
    const isBankTransfer = paymentConfig?.type === 'organizer_bank';

    // Build email payload (ready for real API integration)
    const _emailData = {
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
        basePrice: formatPrice(registrationData.price),
        discountAmount:
          registrationData.discountAmount && registrationData.discountAmount > 0
            ? formatPrice(registrationData.discountAmount)
            : null,
        discountCode: registrationData.discountCode || null,
        insurance:
          registrationData.insurancePrice && registrationData.insurancePrice > 0
            ? {
                name: 'Ubezpieczenie NNW',
                price: formatPrice(registrationData.insurancePrice),
              }
            : null,
        merchandise:
          registrationData.merchandiseOrders?.map((item) => ({
            name: `${item.merchandiseName} (${[item.size, item.color].filter(Boolean).join(', ') || 'bez rozmiaru'})`,
            quantity: item.quantity,
            price: formatPrice(item.price),
          })) || [],
        totalAmount: formatPrice(registrationData.totalAmount),
      },
      bankTransfer:
        isBankTransfer && paymentConfig
          ? {
              accountNumber: paymentConfig.bankAccountNumber || '',
              accountHolder: paymentConfig.bankAccountHolder || '',
              transferTitle: generateTransferTitle(
                paymentConfig.transferTitle,
                eventName,
                registrationData.distanceName || '',
                registrationData.birthDate,
              ),
              amount: formatPrice(registrationData.totalAmount),
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
  };

  return { sendRegistrationEmail };
};
