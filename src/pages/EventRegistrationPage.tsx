import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/api/mock/events.mock';
import { disciplineLabels } from '@/api/mock/labels';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { RegistrationForm, RegistrationData } from '@/components/registration/RegistrationForm';

const EventRegistrationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const event = mockEvents.find((e) => e.slug === slug);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Wymagane logowanie',
        description: 'Zaloguj się, aby zapisać się na zawody.',
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!event) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Wydarzenie nie zostało znalezione</h1>
          <Button asChild>
            <Link to="/events">Wróć do listy wydarzeń</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isClosedByOrganizer = event.registrationStatus === 'closed';
  const allDistancesFull =
    event.distances.length > 0 &&
    event.distances.every((d) => d.limit != null && d.registeredCount >= d.limit);
  const isRegistrationOpen =
    !isPast && !deadlinePassed && !isClosedByOrganizer && !allDistancesFull;

  useEffect(() => {
    if (!isRegistrationOpen) {
      toast({
        title: 'Zapisy zamknięte',
        description: 'Zapisy na te zawody są zamknięte.',
        variant: 'destructive',
      });
      navigate(`/events/${slug}`);
    }
  }, [isRegistrationOpen, navigate, slug]);

  if (!isRegistrationOpen) {
    return null;
  }

  const handleComplete = (data: RegistrationData) => {
    // Redirect to success page with registration data
    navigate(`/events/${slug}/register/success`, {
      state: {
        registrationData: data,
        eventId: event.id,
        eventName: event.name,
        eventSlug: slug,
        eventDate: event.date,
        eventCity: event.city,
        paymentConfig: event.paymentConfig,
      },
    });
  };

  const handleCancel = () => {
    navigate(`/events/${slug}`);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container py-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do wydarzenia
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge className="flex items-center gap-1.5">
                  <DisciplineIcon
                    discipline={event.discipline}
                    size="sm"
                    className="text-current"
                  />
                  {disciplineLabels[event.discipline]}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold md:text-3xl">{event.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="container py-8">
        <RegistrationForm event={event} onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    </Layout>
  );
};

export default EventRegistrationPage;
