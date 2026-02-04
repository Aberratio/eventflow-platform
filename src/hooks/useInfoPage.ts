import { useState, useEffect } from 'react';
import { mockInfoPages } from '@/data/mockData';
import { InfoPage } from '@/types';

export interface InfoPageResponse {
  page: InfoPage | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook symulujący pobieranie danych strony informacyjnej z backendu.
 * W przyszłości można łatwo zamienić na prawdziwe API (np. Supabase).
 * 
 * @param slug - Slug strony do pobrania
 * @returns Obiekt z danymi strony, stanem ładowania i błędami
 */
export const useInfoPage = (slug: string | undefined): InfoPageResponse => {
  const [page, setPage] = useState<InfoPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      setError(null);
      setPage(null);
      
      // Symulacja opóźnienia sieciowego (300-500ms)
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      
      if (!slug) {
        setError('Brak adresu strony');
        setIsLoading(false);
        return;
      }
      
      // "Pobieranie" z mockData (symulacja odpowiedzi z backendu)
      // W przyszłości tutaj będzie fetch do API
      const foundPage = mockInfoPages.find(p => p.slug === slug);
      
      if (!foundPage) {
        setError('Strona nie istnieje');
      } else if (!foundPage.published) {
        setError('Strona nie jest opublikowana');
      } else {
        setPage(foundPage);
      }
      
      setIsLoading(false);
    };

    fetchPage();
  }, [slug]);

  return { page, isLoading, error };
};
