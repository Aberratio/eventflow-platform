import { createRegistration, disciplineLabels, getEventBySlug, getCare } from '@/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { ArrowLeft, Calendar, CheckCircle2, MapPin, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { RegistrationForm, RegistrationData } from '@/components/registration/RegistrationForm';
import { formatMoney } from '@/lib/discountValue';
import {
  ExternalRegistrationFrame,
  isExternalRegistrationActive,
  isExternalRegistrationEvent,
} from '@/components/event-details';
import type { MyCompetitor } from '@/types';

interface EventRegistrationPageProps {
  previewMode?: boolean;
}

const EventRegistrationPage = ({ previewMode = false }: EventRegistrationPageProps) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [previewRegistrationData, setPreviewRegistrationData] = useState<RegistrationData | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zapis Zawodnika pod moją opieką (kogoś innego niż ja)
  const [registeringForOther, setRegisteringForOther] = useState(false);
  const [selectedCompetitorRelId, setSelectedCompetitorRelId] = useState<string>('');
  const [grantorSearch, setGrantorSearch] = useState('');

  const isParticipant = user?.role === 'participant';

  const { data: careData } = useQuery({
    queryKey: ['care'],
    queryFn: () => getCare(),
    enabled: isParticipant && !previewMode,
    select: (r) => r.data,
  });

  const myCompetitors: MyCompetitor[] = useMemo(() => careData?.myCompetitors ?? [], [careData]);
  const hasGrantors = myCompetitors.length > 0;

  const competitorName = (c: MyCompetitor) => `${c.firstName} ${c.lastName}`.trim();

  const filteredGrantors = useMemo(() => {
    if (!grantorSearch.trim()) return myCompetitors;
    const q = grantorSearch.toLowerCase();
    return myCompetitors.filter(
      (g) =>
        competitorName(g).toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q),
    );
  }, [myCompetitors, grantorSearch]);

  const selectedGrantor = myCompetitors.find((g) => g.id === selectedCompetitorRelId) ?? null;

  const { data: eventResponse, isLoading } = useQuery({
    queryKey: ['event-by-slug', slug],
    queryFn: () => getEventBySlug(slug || ''),
    enabled: Boolean(slug),
  });

  const event = eventResponse?.data ?? null;
  const isUnpublished = event && event.publicationStatus === 'draft';
  const canManagePreview =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'moderator' ||
    (user?.role === 'organizer' && event?.organizerId === user?.id);
  const isPreviewAvailable = previewMode && Boolean(isUnpublished) && canManagePreview;

  const isPast = event ? new Date(event.date) < new Date() : false;
  const deadlinePassed = event ? new Date(event.registrationDeadline) < new Date() : false;
  const isClosedByOrganizer = event?.registrationStatus === 'closed';
  const registrationStartDate = event?.registrationEmbed?.startDate
    ? new Date(event.registrationEmbed.startDate)
    : null;
  const registrationNotStarted =
    event?.registrationStatus === 'none' ||
    (registrationStartDate !== null && registrationStartDate > new Date());
  const allDistancesFull = event
    ? event.distances.length > 0 &&
      event.distances.every((d) => d.limit != null && d.registeredCount >= d.limit)
    : false;
  const isRegistrationOpen = isPreviewAvailable
    ? !!event && event.distances.length > 0 && !allDistancesFull
    : !!event &&
      !isPast &&
      !deadlinePassed &&
      !isClosedByOrganizer &&
      !registrationNotStarted &&
      !allDistancesFull;

  useEffect(() => {
    if (isLoading) return;
    if (event && isExternalRegistrationEvent(event)) return;
    if (!previewMode && !isAuthenticated) {
      toast({
        title: 'Wymagane logowanie',
        description: 'Zaloguj się, aby zapisać się na zawody.',
      });
      navigate('/login', { state: { returnTo: `/events/${slug}/register` } });
    }
  }, [event, isAuthenticated, isLoading, navigate, previewMode]);

  useEffect(() => {
    if (event && isExternalRegistrationEvent(event)) return;
    if (event && !previewMode && !isRegistrationOpen) {
      toast({
        title: 'Zapisy zamknięte',
        description: 'Zapisy na te zawody są zamknięte.',
        variant: 'destructive',
      });
      navigate(`/events/${slug}`);
    }
  }, [event, isRegistrationOpen, navigate, previewMode, slug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Ładowanie formularza...</p>
        </div>
      </Layout>
    );
  }

  if (!event || (previewMode && !isPreviewAvailable)) {
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

  if (isExternalRegistrationEvent(event)) {
    const externalRegistrationActive = isExternalRegistrationActive(event);
    const active = isRegistrationOpen && externalRegistrationActive;

    return (
      <Layout>
        <div className="border-b bg-muted/30">
          <div className="container py-6">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do wydarzenia
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">{event.name}</h1>
          </div>
        </div>
        <div className="container py-8">
          <ExternalRegistrationFrame
            event={event}
            active={active}
            closedReason={
              externalRegistrationActive
                ? 'Zapisy na to wydarzenie są zamknięte.'
                : 'Zewnętrzny formularz zapisów nie jest teraz aktywny.'
            }
          />
        </div>
      </Layout>
    );
  }

  if (previewRegistrationData) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-xl text-center">
            <Card className="border-primary/20">
              <CardContent className="space-y-5 pt-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-9 w-9 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Testowa rejestracja zakończona</h1>
                  <p className="text-muted-foreground">
                    Zakończyłaś testową rejestrację na wydarzeniu w szkicu. Po opublikowaniu
                    wydarzenia zapisy będą prowadzone naprawdę.
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p>
                    Dystans:{' '}
                    <span className="font-medium">{previewRegistrationData.distanceName}</span>
                  </p>
                  <p>
                    Kwota testowego koszyka:{' '}
                    <span className="font-medium">
                      {formatMoney(previewRegistrationData.totalAmount)}
                    </span>
                  </p>
                </div>
                <Button onClick={() => navigate(`/events/${slug}/preview`)}>
                  Wróć do podglądu wydarzenia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isRegistrationOpen) {
    return null;
  }

  const handleComplete = async (data: RegistrationData) => {
    if (isPreviewAvailable) {
      setPreviewRegistrationData(data);
      return;
    }
    if (!user || isSubmitting) return;

    const registeredFor =
      registeringForOther && selectedGrantor
        ? {
            userId: selectedGrantor.competitorUserId ?? user.id,
            competitorId: selectedGrantor.competitorId,
            userName: competitorName(selectedGrantor),
            userEmail: selectedGrantor.email ?? '',
          }
        : { userId: user.id, competitorId: undefined, userName: user.name, userEmail: user.email };

    setIsSubmitting(true);
    try {
      await createRegistration({
        eventId: event.id,
        eventName: event.name,
        userId: registeredFor.userId,
        competitorId: registeredFor.competitorId,
        userName: registeredFor.userName,
        userEmail: registeredFor.userEmail,
        registeredById: registeringForOther && selectedGrantor ? user.id : undefined,
        distanceId: data.distanceId,
        distanceName: data.distanceName,
        category: data.category,
        teamName: data.teamName,
        discountCode: data.discountCode,
        discountAmount: data.discountAmount,
        pricePaid: Math.max(0, data.price - (data.discountAmount ?? 0)),
        totalAmount: data.totalAmount,
        merchandiseOrders: data.merchandiseOrders,
        paymentDetails: {
          startFeePaid: event.paymentConfig?.type !== 'organizer_bank',
          startFeePaidAt:
            event.paymentConfig?.type !== 'organizer_bank' ? new Date().toISOString() : undefined,
          startFeeAmount: Math.max(0, data.price - (data.discountAmount ?? 0)),
          insurancePaid: event.paymentConfig?.type !== 'organizer_bank',
          insurancePaidAt:
            event.paymentConfig?.type !== 'organizer_bank' && data.insurancePrice
              ? new Date().toISOString()
              : undefined,
          insuranceAmount: data.insurancePrice,
          merchandisePayments: data.merchandiseOrders.map((order) => ({
            merchandiseId: order.merchandiseId,
            merchandiseName: order.merchandiseName,
            paid: event.paymentConfig?.type !== 'organizer_bank',
            paidAt:
              event.paymentConfig?.type !== 'organizer_bank' ? new Date().toISOString() : undefined,
            amount: order.price,
          })),
        },
      });
    } catch (error) {
      toast({
        title: 'Nie udało się zapisać rejestracji',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

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
    navigate(isPreviewAvailable ? `/events/${slug}/preview` : `/events/${slug}`);
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
                {isPreviewAvailable && <Badge variant="outline">Tryb testowy</Badge>}
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
        {/* Zapis w imieniu kogoś innego */}
        {isParticipant && hasGrantors && !previewMode && (
          <div className="mx-auto mb-6 max-w-2xl">
            <div
              className={`rounded-lg border px-4 py-3 transition-colors ${registeringForOther ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  id="register-for-other"
                  checked={registeringForOther}
                  onCheckedChange={(v) => {
                    setRegisteringForOther(v === true);
                    if (!v) {
                      setSelectedCompetitorRelId('');
                      setGrantorSearch('');
                    } else if (myCompetitors.length === 1) {
                      setSelectedCompetitorRelId(myCompetitors[0].id);
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="register-for-other"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Zapisuję kogoś innego
                  </Label>
                </div>
              </label>

              {registeringForOther && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  {myCompetitors.length > 10 ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Szukaj osoby do zapisania
                      </Label>
                      <Input
                        placeholder="Imię lub adres e-mail..."
                        value={grantorSearch}
                        onChange={(e) => {
                          setGrantorSearch(e.target.value);
                          setSelectedCompetitorRelId('');
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      {grantorSearch && (
                        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                          {filteredGrantors.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              Nie znaleziono osoby
                            </p>
                          ) : (
                            filteredGrantors.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${selectedCompetitorRelId === g.id ? 'bg-primary/10 font-medium' : ''}`}
                                onClick={() => {
                                  setSelectedCompetitorRelId(g.id);
                                  setGrantorSearch(competitorName(g));
                                }}
                              >
                                <span className="font-medium">{competitorName(g)}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {g.email}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      {selectedGrantor && (
                        <p className="text-xs text-muted-foreground">
                          Zapisujesz:{' '}
                          <span className="font-medium text-foreground">
                            {competitorName(selectedGrantor)}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Kogo zapisujesz?</Label>
                      <Select
                        value={selectedCompetitorRelId}
                        onValueChange={setSelectedCompetitorRelId}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Wybierz osobę..." />
                        </SelectTrigger>
                        <SelectContent>
                          {myCompetitors.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              <span>{competitorName(g)}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{g.email}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <RegistrationForm
          event={event}
          onComplete={handleComplete}
          onCancel={handleCancel}
          previewMode={isPreviewAvailable}
          disabled={registeringForOther && !selectedGrantorId}
        />
      </div>
    </Layout>
  );
};

export default EventRegistrationPage;
