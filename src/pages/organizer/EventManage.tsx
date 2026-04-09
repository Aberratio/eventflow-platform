import { mockEvents, mockRegistrations } from '@/api';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventOverviewTab } from './components/EventOverviewTab';
import { ParticipantsTab } from './components/ParticipantsTab';
import { ResultsTab } from './components/ResultsTab';
import { VirtualResultsVerificationTab } from './components/VirtualResultsVerificationTab';
import { EventSettingsTab } from './components/EventSettingsTab';
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  Globe,
  Tag,
  Mail,
} from 'lucide-react';
import { DiscountCode } from '@/types';
import { EmailTemplatesManager } from '@/components/email/EmailTemplatesManager';
import { useAuth } from '@/contexts/AuthContext';

const EventManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const event = mockEvents.find((e) => e.id === id);
  const registrations = mockRegistrations.filter((r) => r.eventId === id);

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(event?.discountCodes || []);

  const canManage =
    user?.role === 'admin' ||
    user?.role === 'moderator' ||
    (user?.role === 'organizer' && event?.organizerId === user?.id);

  if (!event || !canManage) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {!event ? 'Wydarzenie nie znalezione' : 'Brak dostępu'}
            </h1>
            <Button onClick={() => navigate(-1)}>Powrót do panelu</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">
            {event.isVirtual
              ? 'Wydarzenie wirtualne • Cały świat'
              : `${event.city} • ${event.date}`}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Przegląd</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Uczestnicy</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              {event.isVirtual ? <Globe className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
              <span className="hidden sm:inline">{event.isVirtual ? 'Weryfikacja' : 'Wyniki'}</span>
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Kody rabatowe</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emaile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ustawienia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EventOverviewTab event={event} registrations={registrations} />
          </TabsContent>

          <TabsContent value="participants">
            <ParticipantsTab event={event} registrations={registrations} />
          </TabsContent>

          <TabsContent value="results">
            {event.isVirtual ? (
              <VirtualResultsVerificationTab event={event} />
            ) : (
              <ResultsTab event={event} registrations={registrations} />
            )}
          </TabsContent>

          <TabsContent value="discounts">
            <DiscountCodesEditor
              discountCodes={discountCodes}
              distances={event.distances}
              onChange={setDiscountCodes}
            />
          </TabsContent>

          <TabsContent value="emails">
            <EmailTemplatesManager eventId={event.id} scope="event" />
          </TabsContent>

          <TabsContent value="settings">
            <EventSettingsTab event={event} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EventManage;
