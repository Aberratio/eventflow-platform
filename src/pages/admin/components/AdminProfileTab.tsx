import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ChangeEmailCard } from '@/components/profile/ChangeEmailCard';
import { SecuritySection } from './security/SecuritySection';
import { ActivityLogsSection } from './security/ActivityLogsSection';
import { SystemLogsPanel } from './security/SystemLogsPanel';

const AdminProfileTab = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <ProfileForm user={user}>
        <SecuritySection />
        <ActivityLogsSection />
        <SystemLogsPanel />
      </ProfileForm>
      <ChangeEmailCard />
    </div>
  );
};

export default AdminProfileTab;
