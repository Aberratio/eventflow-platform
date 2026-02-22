import { Layout } from '@/components/layout/Layout';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedEventsSection } from '@/components/home/FeaturedEventsSection';
import { LiveResultsBanner } from '@/components/home/LiveResultsBanner';
import { RecentResultsSection } from '@/components/home/RecentResultsSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { mockEvents, mockPartners } from '@/data/mockData';

const Index = () => {
  return (
    <Layout>
      <HomeHero />
      <LiveResultsBanner events={mockEvents} />
      <FeaturedEventsSection events={mockEvents} />
      <RecentResultsSection events={mockEvents} />
      <PartnersSection partners={mockPartners} />
    </Layout>
  );
};

export default Index;
