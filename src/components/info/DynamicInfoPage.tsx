import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useInfoPage } from '@/hooks/useInfoPage';
import { HeroSection } from './sections/HeroSection';
import { TextSection } from './sections/TextSection';
import { CardsSection } from './sections/CardsSection';
import { FaqSection } from './sections/FaqSection';
import { StatsSection } from './sections/StatsSection';
import { TeamSection } from './sections/TeamSection';
import { PricingSection } from './sections/PricingSection';
import { CtaSection } from './sections/CtaSection';
import { InfoPageSection } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const SectionRenderer = ({ section }: { section: InfoPageSection }) => {
  switch (section.type) {
    case 'hero':
      return <HeroSection section={section} />;
    case 'text':
      return <TextSection section={section} />;
    case 'cards':
      return <CardsSection section={section} />;
    case 'faq':
      return <FaqSection section={section} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'team':
      return <TeamSection section={section} />;
    case 'pricing':
      return <PricingSection section={section} />;
    case 'cta':
      return <CtaSection section={section} />;
    default:
      return null;
  }
};

/**
 * Komponent strony informacyjnej ładowanej dynamicznie na podstawie sluga.
 * Symuluje pobieranie struktury strony (JSON) z backendu.
 */
export const DynamicInfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { page, isLoading, error } = useInfoPage(slug);

  // Stan ładowania - pokazujemy szkielety
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          {/* Skeleton dla sekcji Hero */}
          <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
            <div className="container">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <Skeleton className="h-12 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
              </div>
            </div>
          </section>
          
          {/* Skeleton dla treści */}
          <div className="container py-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Błąd lub brak strony - przekierowanie na 404
  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  // Renderowanie strony na podstawie struktury JSON z backendu
  return (
    <Layout>
      <div className="min-h-screen">
        {page.content.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </Layout>
  );
};
