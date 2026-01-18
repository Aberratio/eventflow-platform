import { Layout } from '@/components/layout/Layout';
import { UpcomingEvents } from '@/components/home/UpcomingEvents';
import { LiveResultsSection } from '@/components/home/LiveResultsSection';
import { RecentResultsSection } from '@/components/home/RecentResultsSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { mockEvents, mockRegistrations, mockPartners } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  const userRegistrations = user 
    ? mockRegistrations.filter(r => r.userId === user.id)
    : [];

  return (
    <Layout>
      <UpcomingEvents 
        events={mockEvents}
        userRegistrations={userRegistrations}
      />
      <LiveResultsSection events={mockEvents} />
      <RecentResultsSection events={mockEvents} />
      <PartnersSection partners={mockPartners} />
    </Layout>
  );
};

export default Index;