import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEvents, disciplineLabels } from '@/data/mockData';
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

  const event = mockEvents.find(e => e.slug === slug);

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
          <h1 className="text-2xl font-bold mb-4">Wydarzenie nie zostało znalezione</h1>
          <Button asChild>
            <Link to="/events">Wróć do listy wydarzeń</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const isRegistrationOpen = !isPast && new Date(event.registrationDeadline) > new Date();

  if (!isRegistrationOpen) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Zapisy zamknięte</h1>
          <p className="text-muted-foreground mb-4">
            {isPast ? 'Zawody już się odbyły.' : 'Termin zapisów minął.'}
          </p>
          <Button asChild>
            <Link to={`/events/${slug}`}>Wróć do wydarzenia</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleComplete = (data: RegistrationData) => {
    toast({
      title: 'Zapisano na zawody!',
      description: `Zostałeś zapisany na ${event.name} - ${data.distanceName}. Kwota do zapłaty: ${data.totalAmount} zł`,
    });
    navigate(`/events/${slug}`);
  };

  const handleCancel = () => {
    navigate(`/events/${slug}`);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to={`/events/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do wydarzenia
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="flex items-center gap-1.5">
                  <DisciplineIcon discipline={event.discipline} size="sm" className="text-current" />
                  {disciplineLabels[event.discipline]}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
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
        <RegistrationForm 
          event={event} 
          onComplete={handleComplete} 
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default EventRegistrationPage;
