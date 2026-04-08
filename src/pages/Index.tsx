import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedEventsSection } from '@/components/home/FeaturedEventsSection';
import { LiveResultsBanner } from '@/components/home/LiveResultsBanner';
import { RecentResultsSection } from '@/components/home/RecentResultsSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { getEvents, getFeaturedPartners } from '@/api';
import { QUERY_KEYS } from '@/constants';

const Index = () => {
  const { data: eventsData } = useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: () => getEvents(),
  });

  const { data: partnersData } = useQuery({
    queryKey: QUERY_KEYS.featuredPartners,
    queryFn: () => getFeaturedPartners(),
  });

  const events = eventsData?.data ?? [];
  const partners = partnersData?.data ?? [];

  return (
    <Layout>
      <HomeHero />
      <LiveResultsBanner events={events} />
      <FeaturedEventsSection events={events} />
      <RecentResultsSection events={events} />
      <PartnersSection partners={partners} />
    </Layout>
  );
};

export default Index;
