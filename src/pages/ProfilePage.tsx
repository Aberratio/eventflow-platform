import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ParticipantProfileTab from './participant/components/ParticipantProfileTab';
import OrganizerProfileTab from './organizer/components/OrganizerProfileTab';
import { ModeratorProfileTab } from './moderator/components/ModeratorProfileTab';
import AdminProfileTab from './admin/components/AdminProfileTab';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/logowanie" replace />;
  }

  const renderProfile = () => {
    switch (user.role) {
      case 'participant':
        return <ParticipantProfileTab />;
      case 'organizer':
        return <OrganizerProfileTab />;
      case 'moderator':
        return <ModeratorProfileTab />;
      case 'admin':
        return <AdminProfileTab />;
      default:
        return <ParticipantProfileTab />;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Mój profil</h1>
          <p className="text-muted-foreground">Zarządzaj swoimi danymi</p>
        </div>
        {renderProfile()}
      </div>
    </Layout>
  );
};

export default ProfilePage;
