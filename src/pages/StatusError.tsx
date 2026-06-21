import { StatusErrorPage } from '@/components/errors/StatusErrorPage';

export type StatusErrorCode = '400' | '401' | '405' | '409' | '422' | '429' | '502' | '504';

const errorCopy: Record<
  StatusErrorCode,
  {
    title: string;
    description: string;
    primaryLabel?: string;
    primaryTo?: string;
    primaryIcon?: 'refresh' | 'back' | 'login';
  }
> = {
  '400': {
    title: 'Nieprawidłowe żądanie',
    description:
      'Serwer nie mógł poprawnie odczytać tej akcji. Wróć i spróbuj wykonać ją ponownie.',
    primaryLabel: 'Wróć i popraw',
    primaryIcon: 'back',
  },
  '401': {
    title: 'Sesja wymaga logowania',
    description: 'Ta część serwisu wymaga aktywnej sesji. Zaloguj się i wróć do wykonywanej akcji.',
    primaryLabel: 'Zaloguj się',
    primaryTo: '/logowanie',
    primaryIcon: 'login',
  },
  '405': {
    title: 'Ta metoda jest niedostępna',
    description:
      'Ten adres nie obsługuje wybranej operacji. Najczęściej pomaga powrót do poprzedniego widoku.',
    primaryLabel: 'Wróć do poprzedniej strony',
    primaryIcon: 'back',
  },
  '409': {
    title: 'Wystąpił konflikt danych',
    description:
      'Dane zmieniły się w międzyczasie albo ta akcja jest już nieaktualna. Odśwież widok i spróbuj ponownie.',
  },
  '422': {
    title: 'Nie udało się przetworzyć danych',
    description:
      'Formularz zawiera dane, których nie możemy zapisać w tej postaci. Wróć i sprawdź oznaczone pola.',
    primaryLabel: 'Wróć do formularza',
    primaryIcon: 'back',
  },
  '429': {
    title: 'Za dużo prób',
    description: 'Wysłano zbyt wiele żądań w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.',
  },
  '502': {
    title: 'Brama serwera nie odpowiada',
    description:
      'Aplikacja nie dostała poprawnej odpowiedzi z usługi pośredniej. To zwykle chwilowy problem infrastruktury.',
  },
  '504': {
    title: 'Przekroczono czas oczekiwania',
    description:
      'Serwer czekał zbyt długo na odpowiedź. Odśwież stronę albo wróć do akcji za chwilę.',
  },
};

type StatusErrorProps = {
  code: StatusErrorCode;
};

const StatusError = ({ code }: StatusErrorProps) => {
  const copy = errorCopy[code];

  return (
    <StatusErrorPage
      code={code}
      title={copy.title}
      description={copy.description}
      primaryLabel={copy.primaryLabel}
      primaryIcon={copy.primaryIcon}
      primaryTo={copy.primaryTo}
      onPrimaryClick={
        copy.primaryIcon === 'back' ? () => window.history.back() : () => window.location.reload()
      }
    />
  );
};

export default StatusError;
