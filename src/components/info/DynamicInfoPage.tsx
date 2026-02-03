import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { mockInfoPages } from '@/data/mockData';
import { HeroSection } from './sections/HeroSection';
import { TextSection } from './sections/TextSection';
import { CardsSection } from './sections/CardsSection';
import { FaqSection } from './sections/FaqSection';
import { StatsSection } from './sections/StatsSection';
import { TeamSection } from './sections/TeamSection';
import { PricingSection } from './sections/PricingSection';
import { CtaSection } from './sections/CtaSection';
import { InfoPageSection } from '@/types';

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

export const DynamicInfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const page = mockInfoPages.find(p => p.slug === slug);

  // If page doesn't exist or is not published, show 404
  if (!page || !page.published) {
    return <Navigate to="/404" replace />;
  }

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
