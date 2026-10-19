import { getInfoPageBySlug } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { InfoPage } from '@/types';

export interface InfoPageResponse {
  page: InfoPage | null | undefined;
  isLoading: boolean;
  error: string | null;
}

export const useInfoPage = (slug: string | undefined): InfoPageResponse => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['info-page', slug],
    queryFn: () => getInfoPageBySlug(slug!),
    enabled: !!slug,
    select: (r) => r.data,
  });

  const page = data ?? null;
  const error = isError
    ? 'Nie udało się załadować strony'
    : !slug
      ? 'Brak adresu strony'
      : !isLoading && page === null
        ? 'Strona nie istnieje'
        : null;

  return { page, isLoading, error };
};
