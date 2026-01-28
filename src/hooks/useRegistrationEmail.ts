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
    distanceName: string
  ): string => {
    const baseTemplate = template || '{eventName} - {participantName}';
    return baseTemplate
      .replace('{eventName}', eventName)
      .replace('{participantName}', user?.name || 'Uczestnik')
      .replace('{distanceName}', distanceName);
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
    
    // Build email content
    const emailData = {
      to: user?.email || 'participant@example.com',
      subject: isBankTransfer 
        ? `Rejestracja wstępna: ${eventName} - oczekuje na płatność`
        : `Potwierdzenie rejestracji: ${eventName}`,
      
      // Email body sections
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
        discountAmount: registrationData.discountAmount && registrationData.discountAmount > 0 
          ? formatPrice(registrationData.discountAmount) 
          : null,
        discountCode: registrationData.discountCode || null,
        insurance: registrationData.insurancePrice && registrationData.insurancePrice > 0 ? {
          name: 'Ubezpieczenie NNW',
          price: formatPrice(registrationData.insurancePrice),
        } : null,
        merchandise: registrationData.merchandiseOrders?.map(item => ({
          name: `${item.merchandiseName} (${[item.size, item.color].filter(Boolean).join(', ') || 'bez rozmiaru'})`,
          quantity: item.quantity,
          price: formatPrice(item.price),
        })) || [],
        totalAmount: formatPrice(registrationData.totalAmount),
      },

      // Bank transfer details (only for bank transfer payments)
      bankTransfer: isBankTransfer && paymentConfig ? {
        accountNumber: paymentConfig.bankAccountNumber || '',
        accountHolder: paymentConfig.bankAccountHolder || '',
        transferTitle: generateTransferTitle(
          paymentConfig.transferTitle,
          eventName,
          registrationData.distanceName || ''
        ),
        amount: formatPrice(registrationData.totalAmount),
        instructions: [
          'Wpłać dokładną kwotę na podane konto',
          'Użyj podanego tytułu przelewu',
          'Twoja rejestracja zostanie potwierdzona po zaksięgowaniu wpłaty',
          'Status płatności możesz sprawdzić w panelu uczestnika',
        ],
      } : null,

      footer: {
        eventUrl: `${window.location.origin}/events/${eventSlug}`,
        registrationsUrl: `${window.location.origin}/participant`,
      },
    };

    // Mock email sending - log to console
    console.group('📧 Email rejestracyjny (MOCK)');
    console.log('Do:', emailData.to);
    console.log('Temat:', emailData.subject);
    console.log('---');
    console.log('Nagłówek:', emailData.header);
    console.log('Szczegóły rejestracji:', emailData.registrationDetails);
    
    if (emailData.bankTransfer) {
      console.log('---');
      console.log('🏦 Dane do przelewu bankowego:');
      console.log('  Numer konta:', emailData.bankTransfer.accountNumber);
      console.log('  Odbiorca:', emailData.bankTransfer.accountHolder);
      console.log('  Tytuł:', emailData.bankTransfer.transferTitle);
      console.log('  Kwota:', emailData.bankTransfer.amount);
      console.log('  Instrukcje:', emailData.bankTransfer.instructions);
    }
    
    console.log('---');
    console.log('Linki:', emailData.footer);
    console.groupEnd();

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('✅ Email rejestracyjny został "wysłany" (mock)');
  };

  return { sendRegistrationEmail };
};
