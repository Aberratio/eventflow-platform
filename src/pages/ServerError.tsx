import { StatusErrorPage } from '@/components/errors/StatusErrorPage';

const ServerError = () => (
  <StatusErrorPage
    code="500"
    title="Coś poszło nie tak!"
    description={
      <>
        Aplikacja napotkała nieoczekiwany błąd.
        <br />
        Nasz zespół został już o tym poinformowany.
      </>
    }
  />
);

export default ServerError;
