import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedEvents } from '@/components/home/FeaturedEvents';
import { OpenRegistrations } from '@/components/home/OpenRegistrations';
import { UpcomingEvents } from '@/components/home/UpcomingEvents';
import { RecentResults } from '@/components/home/RecentResults';
import { DisciplinesSection } from '@/components/home/DisciplinesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { mockEvents, mockRegistrations, mockResults } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  const userRegistrations = user 
    ? mockRegistrations.filter(r => r.userId === user.id)
    : [];
  
  const userResults = user
    ? mockResults.filter(r => r.userId === user.id)
    : [];

  return (
    <Layout>
      <HeroSection />
      <FeaturedEvents 
        events={mockEvents}
        userRegistrations={userRegistrations}
        userResults={userResults}
      />
      <OpenRegistrations 
        events={mockEvents}
        userRegistrations={userRegistrations}
      />
      <UpcomingEvents 
        events={mockEvents}
        userRegistrations={userRegistrations}
        userResults={userResults}
      />
      <RecentResults 
        events={mockEvents}
        results={mockResults}
        userId={user?.id}
      />
      <DisciplinesSection events={mockEvents} />
      <StatsSection 
        events={mockEvents}
        registrations={mockRegistrations}
        results={mockResults}
      />
    </Layout>
  );
};

export default Index;
