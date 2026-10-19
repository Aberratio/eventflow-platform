import {
  claimChallengeReward,
  getChallengeBySlug,
  getChallengeParticipations,
  getDeliveryMethods,
  getShopPaymentMethods,
  joinChallenge,
  submitChallengeEntry,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  PackageCheck,
  Target,
  Trophy,
  Upload,
  XCircle,
} from 'lucide-react';
import { ChallengeEntryStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { ChallengeRankingCard } from '@/pages/challenges/ChallengeRankingCard';
import { formatMoney } from '@/lib/format';

// E5.3's client-side mirror of OrderRepository::DELIVERY_METHODS_REQUIRING_ADDRESS
// (same duplication CartPage.tsx already carries — the server stays
// authoritative, this is UX only).
const DELIVERY_METHODS_REQUIRING_ADDRESS = ['courier', 'paczkomat'];

const entryStatus: Record<ChallengeEntryStatus, { label: string; icon: React.ReactNode }> = {
  approved: { label: 'Zatwierdzone', icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
  pending: { label: 'Oczekuje', icon: <Clock className="h-4 w-4 text-warning" /> },
  rejected: { label: 'Odrzucone', icon: <XCircle className="h-4 w-4 text-destructive" /> },
  not_submitted: { label: 'Niezgłoszone', icon: <div className="h-4 w-4 rounded border" /> },
};

const ChallengeDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [position, setPosition] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const { data: challengeData, isLoading: challengeLoading } = useQuery({
    queryKey: slug ? QUERY_KEYS.challengeBySlug(slug) : ['challenge'],
    queryFn: () => getChallengeBySlug(slug!),
    enabled: !!slug,
  });
  const challenge = challengeData?.data;
  const { data: participationsData } = useQuery({
    queryKey: [...QUERY_KEYS.challengeParticipations, challenge?.id, user?.id],
    queryFn: () => getChallengeParticipations(challenge!.id, user!.id),
    enabled: !!challenge?.id && !!user,
  });
  const participation = participationsData?.data?.[0];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challengeParticipations });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges });
  };

  const joinMutation = useMutation({
    mutationFn: () => joinChallenge(challenge!.id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Dołączono do wyzwania' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitChallengeEntry({
        challengeId: challenge!.id,
        eventId: selectedEventId!,
        submittedTime: time,
        submittedPosition: position ? Number(position) : undefined,
        proofUrl,
      }),
    onSuccess: () => {
      invalidate();
      setSelectedEventId(null);
      setTime('');
      setPosition('');
      setProofUrl('');
      toast({ title: 'Wynik zgłoszony', description: 'Zgłoszenie oczekuje na weryfikację.' });
    },
  });

  // E6.5 (issue 15 §4-5): reward selection, shown once the tree evaluator
  // (server-side, via participation.isCompleted) reports completion and the
  // reward hasn't been claimed yet (participation.rewardGranted).
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  // '' (not undefined) on purpose: Radix's <Select> warns when its `value`
  // prop switches from undefined (uncontrolled) to a string (controlled)
  // later on — starting controlled with an empty string (falsy, so every
  // `!!selectedDeliveryId` check below still treats it as "nothing chosen
  // yet") avoids that.
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [rewardAddress, setRewardAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    phone: '',
    paczkomatId: '',
  });

  const canClaimReward =
    !!participation && participation.isCompleted && !participation.rewardGranted;

  const { data: deliveryMethodsData } = useQuery({
    queryKey: ['delivery-methods'],
    queryFn: getDeliveryMethods,
    enabled: rewardDialogOpen,
    staleTime: 10 * 60 * 1000,
  });
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: getShopPaymentMethods,
    enabled: rewardDialogOpen,
    staleTime: 10 * 60 * 1000,
  });
  const deliveryMethods = deliveryMethodsData?.data ?? [];
  const paymentMethods = paymentMethodsData?.data ?? [];
  const selectedReward = challenge?.rewards.find(
    (reward) => (reward.productId ?? reward.id) === selectedRewardId,
  );
  const requiresShippingAddress =
    !!selectedDeliveryId && DELIVERY_METHODS_REQUIRING_ADDRESS.includes(selectedDeliveryId);

  useEffect(() => {
    if (rewardDialogOpen && challenge && !selectedRewardId && challenge.rewards.length > 0) {
      const first = challenge.rewards[0];
      setSelectedRewardId(first.productId ?? first.id);
      setSelectedSize(first.sizes?.[0]);
    }
  }, [rewardDialogOpen, challenge, selectedRewardId]);

  const claimRewardMutation = useMutation({
    mutationFn: () => {
      const delivery = deliveryMethods.find((method) => method.id === selectedDeliveryId);
      const payment = paymentMethods.find((method) => method.id === selectedPaymentId);
      if (!challenge || !selectedReward || !delivery || !payment) {
        throw new Error('Uzupełnij wszystkie wymagane pola.');
      }
      return claimChallengeReward(challenge.id, {
        productId: selectedReward.productId ?? selectedReward.id,
        size: selectedSize,
        deliveryMethod: delivery,
        paymentMethod: payment,
        shippingAddress: requiresShippingAddress
          ? {
              fullName: rewardAddress.fullName.trim(),
              street: rewardAddress.street.trim(),
              city: rewardAddress.city.trim(),
              postalCode: rewardAddress.postalCode.trim(),
              ...(rewardAddress.phone.trim() ? { phone: rewardAddress.phone.trim() } : {}),
              ...(selectedDeliveryId === 'paczkomat'
                ? { paczkomatId: rewardAddress.paczkomatId.trim() }
                : {}),
            }
          : undefined,
      });
    },
    onSuccess: () => {
      invalidate();
      setRewardDialogOpen(false);
      toast({ title: 'Nagroda odebrana', description: 'Zamówienie zostało utworzone.' });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Nie udało się odebrać nagrody',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    },
  });

  const canSubmitRewardClaim =
    !!selectedReward &&
    !!selectedDeliveryId &&
    !!selectedPaymentId &&
    (!requiresShippingAddress ||
      (rewardAddress.fullName.trim() &&
        rewardAddress.street.trim() &&
        rewardAddress.city.trim() &&
        rewardAddress.postalCode.trim() &&
        (selectedDeliveryId !== 'paczkomat' || rewardAddress.paczkomatId.trim())));

  if (challengeLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">
          Ładowanie wyzwania...
        </div>
      </Layout>
    );
  }

  if (!challenge) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Wyzwanie nie znalezione</h1>
          <Button asChild className="mt-4">
            <Link to="/challenges">Wróć do listy</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const progress = participation
    ? (participation.completedCount / challenge.rule.minCompleted) * 100
    : 0;
  const getEntry = (eventId: string) =>
    participation?.entries.find((entry) => entry.eventId === eventId);

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/challenges">
            <ArrowLeft className="mr-2 h-4 w-4" /> Wyzwania
          </Link>
        </Button>

        <Card className="mb-6 overflow-hidden">
          {challenge.imageUrl && (
            <img
              src={challenge.imageUrl}
              alt={challenge.name}
              className="h-64 w-full object-cover"
            />
          )}
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  <Trophy className="mr-1 h-3 w-3" /> Wyzwanie
                </Badge>
                <h1 className="text-3xl font-bold">{challenge.name}</h1>
                <p className="mt-2 text-muted-foreground">{challenge.description}</p>
              </div>
              {!participation && user?.role === 'participant' && (
                <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                  Dołącz
                </Button>
              )}
              {!user && (
                <Button asChild>
                  <Link to="/logowanie" state={{ returnTo: `/challenges/${challenge.slug}` }}>
                    Zaloguj się, aby dołączyć
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                <Target className="h-4 w-4" /> {challenge.rule.minCompleted}/
                {challenge.events.length} wydarzeń
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                <Gift className="h-4 w-4" /> {challenge.rewards.length} nagród
              </span>
              {challenge.startDate && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                  <Calendar className="h-4 w-4" /> {challenge.startDate} - {challenge.endDate}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {participation && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">Twój postęp</span>
                <span>
                  {participation.completedCount}/{challenge.rule.minCompleted}
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} />
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Produkty i nagrody</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {challenge.rewards.map((reward) => (
              <div key={reward.id} className="rounded border p-3">
                <p className="font-medium">{reward.name}</p>
                <p className="text-sm text-muted-foreground">
                  {reward.price ? formatMoney(reward.price) : 'Darmowe'}
                </p>
              </div>
            ))}
          </CardContent>
          {participation && challenge.rewards.length > 0 && (
            <CardContent className="border-t pt-4">
              {participation.rewardGranted ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <PackageCheck className="h-4 w-4" />
                  <span>
                    Nagroda odebrana
                    {participation.rewardGrantedAt ? ` · ${participation.rewardGrantedAt}` : ''}
                  </span>
                </div>
              ) : canClaimReward ? (
                <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="claim-reward-trigger">
                      <Gift className="mr-2 h-4 w-4" /> Odbierz nagrodę
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Wybierz nagrodę</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reward-select">Nagroda</Label>
                        <Select
                          value={selectedRewardId ?? undefined}
                          onValueChange={(value) => {
                            setSelectedRewardId(value);
                            const reward = challenge.rewards.find(
                              (r) => (r.productId ?? r.id) === value,
                            );
                            setSelectedSize(reward?.sizes?.[0]);
                          }}
                        >
                          <SelectTrigger id="reward-select">
                            <SelectValue placeholder="Wybierz nagrodę" />
                          </SelectTrigger>
                          <SelectContent>
                            {challenge.rewards.map((reward) => (
                              <SelectItem key={reward.id} value={reward.productId ?? reward.id}>
                                {reward.name}{' '}
                                {reward.price ? `(${formatMoney(reward.price)})` : '(Darmowe)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedReward?.sizes && selectedReward.sizes.length > 0 && (
                        <div className="space-y-1.5">
                          <Label htmlFor="reward-size">Rozmiar</Label>
                          <Select value={selectedSize} onValueChange={setSelectedSize}>
                            <SelectTrigger id="reward-size">
                              <SelectValue placeholder="Wybierz rozmiar" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedReward.sizes.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="reward-delivery">Metoda dostawy</Label>
                        <Select value={selectedDeliveryId} onValueChange={setSelectedDeliveryId}>
                          <SelectTrigger id="reward-delivery">
                            <SelectValue placeholder="Wybierz metodę dostawy" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}{' '}
                                {method.price ? `(${formatMoney(method.price)})` : '(bezpłatnie)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {requiresShippingAddress && (
                        <fieldset className="space-y-3 rounded-lg border p-3">
                          <legend className="px-1 text-sm font-medium">Adres wysyłki</legend>
                          <div className="space-y-1.5">
                            <Label htmlFor="reward-fullname">Imię i nazwisko</Label>
                            <Input
                              id="reward-fullname"
                              value={rewardAddress.fullName}
                              onChange={(e) =>
                                setRewardAddress({ ...rewardAddress, fullName: e.target.value })
                              }
                              required
                            />
                          </div>
                          {selectedDeliveryId === 'paczkomat' ? (
                            <div className="space-y-1.5">
                              <Label htmlFor="reward-paczkomat">Numer paczkomatu</Label>
                              <Input
                                id="reward-paczkomat"
                                value={rewardAddress.paczkomatId}
                                onChange={(e) =>
                                  setRewardAddress({
                                    ...rewardAddress,
                                    paczkomatId: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label htmlFor="reward-street">Ulica i numer</Label>
                              <Input
                                id="reward-street"
                                value={rewardAddress.street}
                                onChange={(e) =>
                                  setRewardAddress({ ...rewardAddress, street: e.target.value })
                                }
                                required
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="reward-postal">Kod pocztowy</Label>
                              <Input
                                id="reward-postal"
                                placeholder="00-000"
                                value={rewardAddress.postalCode}
                                onChange={(e) =>
                                  setRewardAddress({ ...rewardAddress, postalCode: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="reward-city">Miejscowość</Label>
                              <Input
                                id="reward-city"
                                value={rewardAddress.city}
                                onChange={(e) =>
                                  setRewardAddress({ ...rewardAddress, city: e.target.value })
                                }
                                required
                              />
                            </div>
                          </div>
                        </fieldset>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="reward-payment">Metoda płatności</Label>
                        <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                          <SelectTrigger id="reward-payment">
                            <SelectValue placeholder="Wybierz metodę płatności" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-full"
                        disabled={!canSubmitRewardClaim || claimRewardMutation.isPending}
                        onClick={() => claimRewardMutation.mutate()}
                      >
                        {claimRewardMutation.isPending
                          ? 'Wysyłanie...'
                          : 'Potwierdź odbiór nagrody'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ukończ Wyzwanie, aby odblokować wybór nagrody.
                </p>
              )}
            </CardContent>
          )}
        </Card>

        <ChallengeRankingCard challengeId={challenge.id} />

        <Card>
          <CardHeader>
            <CardTitle>Wydarzenia w wyzwaniu</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {challenge.events.map((event) => {
              const entry = getEntry(event.eventId);
              const status = entry?.status ?? 'not_submitted';
              return (
                <div key={event.eventId} className="flex items-center gap-3 p-4">
                  {entryStatus[status].icon}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{event.eventName}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.eventDate} · {entryStatus[status].label}
                      {entry?.submittedTime ? ` · ${entry.submittedTime}` : ''}
                    </p>
                  </div>
                  {participation && status === 'not_submitted' && (
                    <Dialog
                      open={selectedEventId === event.eventId}
                      onOpenChange={(open) => setSelectedEventId(open ? event.eventId : null)}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Upload className="mr-1 h-4 w-4" /> Zgłoś
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Zgłoś wynik - {event.eventName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Czas</Label>
                            <Input
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              placeholder="01:45:30"
                            />
                          </div>
                          <div>
                            <Label>Miejsce</Label>
                            <Input
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              type="number"
                            />
                          </div>
                          <div>
                            <Label>Link do dowodu</Label>
                            <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
                          </div>
                          <Button
                            className="w-full"
                            disabled={!time || submitMutation.isPending}
                            onClick={() => submitMutation.mutate()}
                          >
                            Wyślij
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChallengeDetailsPage;
