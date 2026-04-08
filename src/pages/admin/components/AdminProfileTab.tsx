import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { SecuritySection } from './security/SecuritySection';
import { ActivityLogsSection } from './security/ActivityLogsSection';

const AdminProfileTab = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <ProfileForm user={user}>
        <SecuritySection />
        <ActivityLogsSection />
      </ProfileForm>
    </div>
  );
};

export default AdminProfileTab;
