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

const SectionRenderer = ({ section, index }: { section: InfoPageSection; index: number }) => {
  const isEven = index % 2 === 0;

  const content = (() => {
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
  })();

  if (!content) return null;

  // Hero, stats, and cta handle their own backgrounds
  if (['hero', 'stats', 'cta'].includes(section.type)) {
    return content;
  }

  return (
    <div className={isEven ? '' : 'bg-muted/20'}>
      {content}
    </div>
  );
};

export const DynamicInfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { page, isLoading, error } = useInfoPage(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          <section className="bg-gradient-to-b from-secondary/80 to-background py-10 md:py-16">
            <div className="container">
              <div className="max-w-3xl mx-auto text-center space-y-3">
                <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                <Skeleton className="h-9 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-1/2 mx-auto" />
              </div>
            </div>
          </section>
          <div className="container py-8 md:py-12">
            <div className="max-w-3xl mx-auto space-y-5">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-7 w-1/4 mt-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {page.content.map((section, index) => (
          <SectionRenderer key={section.id} section={section} index={index} />
        ))}
      </div>
    </Layout>
  );
};
