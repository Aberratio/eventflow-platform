import {
  getCurrentPrice,
  getVariantPrice,
  applyDiscount,
  isTierExpired,
  type RegistrationMerchandiseSelection,
} from '@/api';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  ShoppingBag,
  AlertCircle,
  Plus,
  Minus,
  Ticket,
  User,
  Shield,
  Users,
  Building2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  UserCog,
  Star,
} from 'lucide-react';
import { Event, EventMerchandise, MerchandiseOrder } from '@/types';
import { DistanceRouteDialog, hasRouteArtifacts } from '@/components/DistanceRouteDialog';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import {
  useRegistrationForm,
  type InitialTeamJoin,
  type RegistrationParticipant,
} from '@/hooks/useRegistrationForm';
import { appLogger } from '@/lib/logger';
import { formatMoney } from '@/lib/format';

interface RegistrationFormProps {
  event: Event;
  onComplete: (data: RegistrationData) => void;
  onCancel: () => void;
  previewMode?: boolean;
  disabled?: boolean;
  /** E7.2: pre-fills "join this exact team" when arriving via an invitation link. */
  initialTeamJoin?: InitialTeamJoin | null;
  /** PP.44: the ward being registered; null/undefined = the logged-in user themself. */
  participant?: RegistrationParticipant | null;
}

/**
 * Client-side representation of a completed registration form. This carries
 * PREVIEW money fields (`price`, `discountAmount`, `insurancePrice`,
 * `totalAmount`, `modifiersTotal`) purely for on-screen display (Summary
 * step, and the local-only "test registration" preview for draft events) —
 * they are NEVER sent to the server as-is. The actual `createRegistration`
 * call (see `EventRegistrationPage.handleComplete`) forwards only the
 * selection fields (`pricingVariantId`, `discountCode`, `merchandise`,
 * `insuranceVariantId`) per the E1.2 contract: the server recomputes and
 * freezes the authoritative amounts.
 */
export interface RegistrationData {
  distanceId: string;
  distanceName: string;
  category: string;
  birthDate?: string;
  price: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders: MerchandiseOrder[];
  merchandise: RegistrationMerchandiseSelection[];
  insurancePrice?: number;
  modifiersTotal: number;
  totalAmount: number;
  teamName?: string;
  /** E7.1: real server-assigned team id when joining an existing relay Drużyna. */
  teamId?: string;
  /** PP.54: the captain's invitation token (from the `&invite=` link) — required to join someone else's Drużyna. */
  teamInviteToken?: string;
  /** E7.1: explicit "create a new Drużyna" intent (relay Dystans only). */
  createTeam?: boolean;
  /**
   * E7.5: the captain's manually declared Kategoria specjalna for a
   * newly-created Drużyna — only meaningful together with `createTeam`.
   */
  teamSpecialCategory?: string;
  pricingVariantId?: string;
  insuranceVariantId?: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 63 }, (_, i) => currentYear - 18 - i);
/** PP.44: a ward is often a child — offer every year back from the current one. */
const wardYears = Array.from({ length: 101 }, (_, i) => currentYear - i);
const mutedWarningCallout =
  'border-warning/20 bg-warning/[0.06] text-foreground [&>svg]:text-warning/70';
const mutedWarningDescription = 'text-muted-foreground';
const mutedWarningAction =
  'border-border bg-background/80 text-foreground hover:bg-accent hover:text-accent-foreground';
const months = [
  { value: '01', label: 'Styczeń' },
  { value: '02', label: 'Luty' },
  { value: '03', label: 'Marzec' },
  { value: '04', label: 'Kwiecień' },
  { value: '05', label: 'Maj' },
  { value: '06', label: 'Czerwiec' },
  { value: '07', label: 'Lipiec' },
  { value: '08', label: 'Sierpień' },
  { value: '09', label: 'Wrzesień' },
  { value: '10', label: 'Październik' },
  { value: '11', label: 'Listopad' },
  { value: '12', label: 'Grudzień' },
];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const stepIcons: Record<string, typeof Ticket> = {
  Dystans: Ticket,
  Dane: User,
  Drużyna: Users,
  Ubezpieczenie: Shield,
  Gadżety: ShoppingBag,
  Rabat: Tag,
  Podsumowanie: Check,
};

export const RegistrationForm = ({
  event,
  onComplete,
  onCancel,
  previewMode = false,
  disabled = false,
  initialTeamJoin = null,
  participant = null,
}: RegistrationFormProps) => {
  const form = useRegistrationForm(event, initialTeamJoin, participant);

  const handleSubmit = () => {
    const data = form.buildSubmitData();
    if (data) {
      if (!previewMode) {
        appLogger.registration(
          'registration_submit',
          `Rejestracja na wydarzenie «${event.name}» — dystans: ${data.distanceName}`,
          {
            targetType: 'event',
            targetId: event.id,
            targetName: event.name,
            metadata: {
              distanceId: data.distanceId,
              distanceName: data.distanceName,
              totalAmount: data.totalAmount,
            },
          },
        );
      }
      onComplete(data);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Krok {form.activeSteps.findIndex((s) => s.id === form.step) + 1} z{' '}
            {form.activeSteps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {form.activeSteps.find((s) => s.id === form.step)?.name}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((form.activeSteps.findIndex((s) => s.id === form.step) + 1) / form.activeSteps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-between overflow-x-auto pb-2">
        {form.activeSteps.map((s, index) => {
          const isActive = s.id === form.step;
          const isCompleted = form.activeSteps.findIndex((as) => as.id === form.step) > index;
          const Icon = stepIcons[s.name] || Ticket;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex min-w-[60px] flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : ''} ${isCompleted ? 'bg-primary/20 text-primary' : ''} ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`mt-2 text-center text-xs ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
                >
                  {s.name}
                </span>
              </div>
              {index < form.activeSteps.length - 1 && (
                <div
                  className={`mx-1 hidden h-0.5 w-8 sm:block md:w-12 ${isCompleted ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {previewMode && (
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>Tryb testowy formularza</AlertTitle>
          <AlertDescription>
            Przejdziesz przez formularz z realnymi cenami, ale bez prawdziwego zapisu i bez
            płatności.
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Distance Selection */}
      {form.step === 1 && <DistanceStep event={event} form={form} />}

      {/* Step 2: Personal Data */}
      {form.step === 2 && form.selectedDistance && <PersonalDataStep form={form} />}

      {/* Step 25: Team */}
      {form.step === 25 && form.isStepInActiveSteps(25) && <TeamStep form={form} />}

      {/* Step 3: Insurance */}
      {form.step === 3 && form.isStepInActiveSteps(3) && form.hasInsurance && (
        <InsuranceStep event={event} form={form} />
      )}

      {/* Step 4: Merchandise */}
      {form.step === 4 && form.isStepInActiveSteps(4) && form.hasMerchandise && (
        <MerchandiseStep event={event} form={form} />
      )}

      {/* Step 5: Discount */}
      {form.step === 5 && form.isStepInActiveSteps(5) && <DiscountStep event={event} form={form} />}

      {/* Step 6: Summary */}
      {form.step === 6 && form.isStepInActiveSteps(6) && form.selectedDistance && (
        <SummaryStep event={event} form={form} previewMode={previewMode} />
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {form.isFirstStep ? (
          <Button variant="ghost" onClick={onCancel}>
            Anuluj
          </Button>
        ) : (
          <Button variant="outline" onClick={form.handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Wstecz
          </Button>
        )}
        {form.isLastStep ? (
          <Button onClick={handleSubmit} disabled={!form.agreedToTerms || disabled} size="lg">
            {previewMode
              ? 'Zakończ testowo, bez płatności'
              : event.paymentConfig?.type === 'organizer_bank'
                ? 'Zapisz się'
                : `Płacę ${formatMoney(form.totalAmount)}`}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={form.handleNext} disabled={!form.canProceed() || disabled}>
            Dalej <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Step Components ───

type FormHook = ReturnType<typeof useRegistrationForm>;

const DistanceStep = ({ event, form }: { event: Event; form: FormHook }) => (
  <Card>
    <CardHeader>
      <CardTitle>Wybierz dystans</CardTitle>
      <CardDescription>Wybierz dystans, na który chcesz się zapisać</CardDescription>
    </CardHeader>
    <CardContent>
      <RadioGroup value={form.selectedDistanceId} onValueChange={form.setSelectedDistanceId}>
        <div className="space-y-4">
          {event.distances.map((distance) => {
            const publicVariants = (distance.pricingVariants ?? [])
              .filter((v) => !v.officeOnly && (v.visibleInPublicForm ?? true))
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const { price, tierName } =
              publicVariants.length > 0
                ? getVariantPrice(publicVariants[0], distance.registeredCount)
                : getCurrentPrice(distance);
            const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0;
            return (
              <div
                key={distance.id}
                role="button"
                tabIndex={isFull ? -1 : 0}
                onClick={() => {
                  if (!isFull) form.setSelectedDistanceId(distance.id);
                }}
                onKeyDown={(event) => {
                  if (!isFull && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    form.setSelectedDistanceId(distance.id);
                  }
                }}
                className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all ${form.selectedDistanceId === distance.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${isFull ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <RadioGroupItem value={distance.id} disabled={isFull} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{distance.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {distance.length != null ? `${distance.length} ${distance.unit}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{price} zł</div>
                      <Badge variant="secondary" className="text-xs">
                        {tierName}
                      </Badge>
                    </div>
                  </div>
                  {publicVariants.length === 0 &&
                    distance.priceTiers &&
                    distance.priceTiers.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {distance.priceTiers.map((tier) => {
                          const isCurrentTier = tier.name === tierName;
                          const tierPrice =
                            tier.price ??
                            applyDiscount(distance.price, tier.discountType, tier.discountValue);
                          const dimmed = isTierExpired(tier, distance.registeredCount);
                          return (
                            <div
                              key={tier.id}
                              className={`flex justify-between text-xs ${isCurrentTier ? 'font-medium text-primary' : dimmed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
                            >
                              <span>{tier.name}</span>
                              <span>
                                {tierPrice} zł
                                {tier.endDate &&
                                  ` do ${format(new Date(tier.endDate), 'd MMM', { locale: pl })}`}
                                {tier.participantLimit != null &&
                                  ` (do ${tier.participantLimit} os.)`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    {distance.startType === 'relay' && (
                      <Badge variant="outline">
                        Sztafeta
                        {distance.relayMinTeamSize && distance.relayMaxTeamSize
                          ? `: ${distance.relayMinTeamSize}-${distance.relayMaxTeamSize} os.`
                          : ''}
                      </Badge>
                    )}
                    {isFull ? (
                      <Badge variant="destructive">Brak miejsc</Badge>
                    ) : spotsLeft !== null && spotsLeft <= 50 ? (
                      <Badge variant="destructive" className="animate-pulse">
                        Ostatnie {spotsLeft} miejsc!
                      </Badge>
                    ) : (
                      <span>
                        {distance.registeredCount} zapisanych
                        {distance.limit && ` / ${distance.limit}`}
                      </span>
                    )}
                  </div>
                  {hasRouteArtifacts(distance) && (
                    <div className="mt-2" onClick={(e) => e.preventDefault()}>
                      <DistanceRouteDialog distance={distance} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      {/* Wariant opłaty selection — only rendered as a chooser when 2+ Warianty
          exist; a single Wariant is auto-selected silently (E1.2 resolution #1). */}
      {form.selectedDistance && form.pricingVariants.length > 1 && (
        <div className="mt-4 space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <Label className="text-sm font-medium">Wariant opłaty</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Wybierz wariant zapisu, który Cię dotyczy.
          </p>
          <RadioGroup
            value={form.selectedPricingVariantId}
            onValueChange={form.setSelectedPricingVariantId}
          >
            <div className="space-y-2">
              {form.pricingVariants.map((variant) => {
                const { price: variantPrice } = getVariantPrice(
                  variant,
                  form.selectedDistance!.registeredCount,
                );
                return (
                  <label
                    key={variant.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-2 hover:bg-muted/50"
                  >
                    <RadioGroupItem value={variant.id} />
                    <span className="flex-1 text-sm">{variant.name}</span>
                    <span className="text-sm font-semibold text-primary">{variantPrice} zł</span>
                  </label>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}
    </CardContent>
  </Card>
);

const PersonalDataStep = ({ form }: { form: FormHook }) => {
  const selectedDistance = form.selectedDistance!;
  const ageCategories = selectedDistance.ageCategories ?? [];
  const userGender = form.participant.gender;
  const userBirthYear = form.birthYear ? parseInt(form.birthYear) : null;
  const categoriesMatchingBirthYear = userBirthYear
    ? ageCategories.filter((cat) => {
        const fromOk = cat.birthYearFrom == null || userBirthYear >= cat.birthYearFrom;
        const toOk = cat.birthYearTo == null || userBirthYear <= cat.birthYearTo;
        return fromOk && toOk;
      })
    : [];
  const matchedCategory =
    userGender && userBirthYear
      ? categoriesMatchingBirthYear.find(
          (cat) => cat.gender == null || cat.gender === userGender,
        ) || null
      : null;
  const singleFallbackCategory =
    categoriesMatchingBirthYear.length === 1 ? categoriesMatchingBirthYear[0] : null;
  const singleFallbackGenderOk =
    singleFallbackCategory == null ||
    singleFallbackCategory.gender == null ||
    singleFallbackCategory.gender === userGender;
  const autoCategory = matchedCategory ?? (singleFallbackGenderOk ? singleFallbackCategory : null);
  const genderMismatch =
    !autoCategory &&
    userBirthYear !== null &&
    userGender != null &&
    categoriesMatchingBirthYear.length > 0 &&
    categoriesMatchingBirthYear.every((cat) => cat.gender != null && cat.gender !== userGender);

  const genderLabel =
    userGender === 'M' ? 'Mężczyzna' : userGender === 'K' ? 'Kobieta' : 'nie podano';

  useEffect(() => {
    if (autoCategory && form.selectedCategory !== autoCategory.name) {
      form.setSelectedCategory(autoCategory.name);
    }
  }, [autoCategory, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane osobowe</CardTitle>
        <CardDescription>
          {form.isWard
            ? `Data urodzenia i kategoria: ${form.participant.name}`
            : 'Podaj swoją datę urodzenia i wybierz kategorię wiekową'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {form.isProfileComplete ? (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">
              {form.isWard ? 'Dane podopiecznego' : 'Dane pobrane z profilu'}
            </AlertTitle>
            <AlertDescription className="text-success/80">
              {form.isWard && <>{form.participant.name} • </>}
              Rok urodzenia: <strong>{form.participant.birthYear}</strong> (
              {currentYear - (form.participant.birthYear || 0)} lat) • Płeć:{' '}
              <strong>{genderLabel}</strong>
            </AlertDescription>
          </Alert>
        ) : form.isWard ? (
          <Alert className={mutedWarningCallout}>
            <UserCog className="h-4 w-4" />
            <AlertTitle>Brak daty urodzenia podopiecznego</AlertTitle>
            <AlertDescription className={mutedWarningDescription}>
              Podaj datę urodzenia poniżej, aby dobrać kategorię.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className={mutedWarningCallout}>
            <UserCog className="h-4 w-4" />
            <AlertTitle>Uzupełnij swój profil</AlertTitle>
            <AlertDescription
              className={`flex flex-col gap-2 ${mutedWarningDescription} sm:flex-row sm:items-center sm:justify-between`}
            >
              <span>
                Dodaj datę urodzenia i płeć w profilu, aby automatycznie uzupełniać formularze.
              </span>
              <Button variant="outline" size="sm" asChild className={mutedWarningAction}>
                <Link to="/participant?tab=profile">Przejdź do profilu</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Label className="text-base font-medium">Data urodzenia</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="birth-day" className="text-xs text-muted-foreground">
                Dzień
              </Label>
              <Select value={form.birthDay} onValueChange={form.setBirthDay}>
                <SelectTrigger id="birth-day">
                  <SelectValue placeholder="Dzień" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="birth-month" className="text-xs text-muted-foreground">
                Miesiąc
              </Label>
              <Select value={form.birthMonth} onValueChange={form.setBirthMonth}>
                <SelectTrigger id="birth-month">
                  <SelectValue placeholder="Miesiąc" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="birth-year" className="text-xs text-muted-foreground">
                Rok
              </Label>
              <Select value={form.birthYear} onValueChange={form.setBirthYear}>
                <SelectTrigger id="birth-year">
                  <SelectValue placeholder="Rok" />
                </SelectTrigger>
                <SelectContent>
                  {(form.isWard ? wardYears : years).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.age && (
            <p className="text-sm text-muted-foreground">
              {form.isWard ? 'Wiek:' : 'Twój wiek:'}{' '}
              <span className="font-medium text-foreground">{form.age} lat</span>
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-medium">Kategoria</Label>
          {ageCategories.length > 0 ? (
            <>
              {autoCategory ? (
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
                  <p className="mb-1 text-sm text-muted-foreground">
                    Automatycznie przypisana kategoria:
                  </p>
                  <p className="text-lg font-semibold">{autoCategory.name}</p>
                  {(autoCategory.gender || autoCategory.birthYearFrom) && (
                    <p className="text-xs text-muted-foreground">
                      {autoCategory.gender
                        ? `Płeć: ${autoCategory.gender === 'K' ? 'Kobieta' : 'Mężczyzna'}`
                        : ''}
                      {autoCategory.gender && autoCategory.birthYearFrom ? ' • ' : ''}
                      {autoCategory.birthYearFrom
                        ? `Roczniki: ${autoCategory.birthYearFrom}–${autoCategory.birthYearTo}`
                        : ''}
                    </p>
                  )}
                </div>
              ) : genderMismatch ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {form.isWard
                      ? 'Nie można zapisać tej osoby na ten dystans'
                      : 'Nie możesz zapisać się na to wydarzenie'}
                  </AlertTitle>
                  <AlertDescription className="space-y-1">
                    {form.isWard ? (
                      <p>
                        Dane podopiecznego nie pasują do żadnej kategorii tego dystansu. Skontaktuj
                        się z organizatorem, jeśli uważasz, że to pomyłka.
                      </p>
                    ) : (
                      <>
                        <p>
                          Twój profil nie pasuje do żadnej z dostępnych kategorii tego dystansu. Aby
                          wziąć udział, możesz:
                        </p>
                        <ul className="ml-4 list-disc space-y-0.5">
                          <li>
                            zmienić dane (płeć, rok urodzenia) w swoim profilu, jeśli zawierają
                            błąd,
                          </li>
                          <li>
                            zalogować się na właściwe konto — zapisy możliwe tylko z własnego
                            profilu,
                          </li>
                          <li>skontaktować się z organizatorem, jeśli uważasz, że to pomyłka.</li>
                        </ul>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              ) : userBirthYear && categoriesMatchingBirthYear.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Wybierz kategorię pasującą do rocznika {userBirthYear}.
                  </p>
                  <RadioGroup
                    value={form.selectedCategory}
                    onValueChange={form.setSelectedCategory}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {categoriesMatchingBirthYear.map((category) => (
                        <label
                          key={category.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${form.selectedCategory === category.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                          <RadioGroupItem value={category.name} />
                          <span className="font-medium">
                            {category.name}
                            {category.gender
                              ? ` (${category.gender === 'K' ? 'kobiety' : 'mężczyźni'})`
                              : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ) : !userBirthYear ? (
                <div className="space-y-3">
                  <Alert className={mutedWarningCallout}>
                    <UserCog className="h-4 w-4" />
                    <AlertTitle>Podaj datę urodzenia</AlertTitle>
                    <AlertDescription className={mutedWarningDescription}>
                      Po wybraniu daty formularz pokaże pasujące kategorie.
                    </AlertDescription>
                  </Alert>
                  <RadioGroup
                    value={form.selectedCategory}
                    onValueChange={form.setSelectedCategory}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {ageCategories.map((category) => (
                        <label
                          key={category.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${form.selectedCategory === category.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                          <RadioGroupItem value={category.name} />
                          <span className="font-medium">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Brak pasującej kategorii</AlertTitle>
                  <AlertDescription>
                    Nie znaleziono kategorii dla rocznika {userBirthYear}.
                  </AlertDescription>
                </Alert>
              )}
              {selectedDistance.specialCategories &&
                selectedDistance.specialCategories.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <Label className="text-base font-medium">
                      Kategorie specjalne (opcjonalne)
                    </Label>
                    <div className="space-y-2">
                      {selectedDistance.specialCategories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={form.selectedCategory.includes(cat.name)}
                            onCheckedChange={(checked) => {
                              if (checked)
                                form.setSelectedCategory((prev) =>
                                  prev ? `${prev}, ${cat.name}` : cat.name,
                                );
                              else
                                form.setSelectedCategory((prev) =>
                                  prev
                                    .replace(`, ${cat.name}`, '')
                                    .replace(cat.name, '')
                                    .replace(/^, |, $/g, ''),
                                );
                            }}
                          />
                          <div>
                            <span className="font-medium">{cat.name}</span>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground">{cat.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
            </>
          ) : selectedDistance.categories.length > 0 ? (
            <RadioGroup value={form.selectedCategory} onValueChange={form.setSelectedCategory}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedDistance.categories.map((category) => (
                  <label
                    key={category}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${form.selectedCategory === category ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <RadioGroupItem value={category} />
                    <span className="font-medium">{category}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const TeamStep = ({ form }: { form: FormHook }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />{' '}
        {form.isRelayDistance ? 'Zapis sztafetowy' : 'Zapis drużynowy (opcjonalne)'}
      </CardTitle>
      <CardDescription>
        {form.isRelayDistance
          ? `Ten dystans wymaga druzyny${form.relayTeamSizeLabel ? `: ${form.relayTeamSizeLabel}` : ''}.`
          : 'Zapisz się jako część drużyny'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {form.hasInvitationLink && (
        <Alert className="border-primary/30 bg-primary/5">
          <Users className="h-4 w-4" />
          <AlertTitle>Dołączasz przez link zaproszenia</AlertTitle>
          <AlertDescription>
            Kapitan drużyny wysłał Ci link, więc Twoja drużyna jest już wybrana poniżej. Wypełnij
            swoje dane, aby dokończyć własny zapis.
          </AlertDescription>
        </Alert>
      )}
      <div
        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${form.wantsTeam ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onClick={() => {
          if (!form.isRelayDistance) form.setWantsTeam(!form.wantsTeam);
        }}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="team"
            checked={form.wantsTeam}
            disabled={form.isRelayDistance}
            onCheckedChange={(checked) => {
              if (!form.isRelayDistance) form.setWantsTeam(checked === true);
            }}
          />
          <div className="flex-1">
            <label htmlFor="team" className="cursor-pointer font-medium">
              {form.isRelayDistance
                ? 'Ten dystans jest sztafeta'
                : 'Chcę zapisać się jako część drużyny'}
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.isRelayDistance
                ? 'Utworz druzyne sztafetowa albo dolacz do druzyny, ktora ma jeszcze wolne miejsce.'
                : 'Zaznacz, jeśli rejestrujesz się wraz z innymi osobami z tej samej drużyny lub klubu.'}
            </p>
          </div>
        </div>
      </div>

      {form.wantsTeam && (
        <div className="ml-2 space-y-4 border-l-2 border-primary/30 pl-2">
          <RadioGroup
            value={form.teamMode}
            onValueChange={(v) => form.setTeamMode(v as 'create' | 'join')}
          >
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${form.teamMode === 'create' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <RadioGroupItem value="create" />
                <span className="font-medium">Utwórz nową drużynę</span>
              </label>
              {form.teamMode === 'create' && (
                <div className="ml-7 space-y-2">
                  <Label htmlFor="newTeamName">Nazwa drużyny / klubu</Label>
                  <Input
                    id="newTeamName"
                    placeholder="np. KB Górskie Wilki"
                    value={form.teamName}
                    onChange={(e) => form.setTeamName(e.target.value)}
                    className={form.teamNameError ? 'border-destructive' : ''}
                  />
                  {form.teamNameError && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {form.teamNameError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-50 znaków. Użyj tej samej nazwy co pozostali członkowie drużyny.
                  </p>
                  {/*
                    E7.5 (issue 23 Answer §7, "Kategoria specjalna: deklaracja
                    ręczna kapitana"): a manual, one-time choice from the same
                    per-Dystans configured list as the individual "Kategorie
                    specjalne" checkboxes below (ticket 10) — never derived
                    from who ends up on the roster, and not re-asked at join
                    time (only the captain, creating the team, declares it).
                  */}
                  {(form.selectedDistance?.specialCategories?.length ?? 0) > 0 && (
                    <fieldset className="space-y-2 pt-2">
                      <legend className="text-sm font-medium text-foreground">
                        Kategoria specjalna drużyny (opcjonalnie)
                      </legend>
                      <Label htmlFor="teamSpecialCategory" className="sr-only">
                        Kategoria specjalna drużyny
                      </Label>
                      <Select
                        value={form.teamSpecialCategory || 'none'}
                        onValueChange={(v) => form.setTeamSpecialCategory(v === 'none' ? '' : v)}
                      >
                        <SelectTrigger id="teamSpecialCategory">
                          <SelectValue placeholder="Brak kategorii specjalnej" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Brak kategorii specjalnej</SelectItem>
                          {form.selectedDistance?.specialCategories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Deklaracja jednorazowa — skład drużyny może się później zmienić (wymiana
                        zawodnika), ale kategoria specjalna nie jest przeliczana automatycznie.
                      </p>
                    </fieldset>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${form.teamMode === 'join' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${form.existingTeams.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <RadioGroupItem value="join" disabled={form.existingTeams.length === 0} />
                <div>
                  <span className="font-medium">Dołącz do istniejącej drużyny</span>
                  {form.existingTeams.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {form.isRelayDistance
                        ? 'Do drużyny innej osoby dołączysz przez link zaproszenia od jej kapitana.'
                        : 'Brak drużyn zapisanych na te zawody'}
                    </p>
                  )}
                </div>
              </label>
              {form.teamMode === 'join' && form.existingTeams.length > 0 && (
                <div className="ml-7 space-y-2">
                  <Label>Wybierz drużynę</Label>
                  <Select
                    value={form.selectedExistingTeam}
                    onValueChange={form.setSelectedExistingTeam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz drużynę..." />
                    </SelectTrigger>
                    <SelectContent>
                      {form.existingTeams.map((team) => (
                        // E7.1: a relay Dystans's existingTeams entries carry
                        // a real server-assigned `id` (from getTeamsForDistance)
                        // — select on that so the join is validated against
                        // the real team, not its (potentially non-unique)
                        // display name; the legacy non-relay classification
                        // path has no `id` and keeps selecting on `name`.
                        <SelectItem key={team.id ?? team.name} value={team.id ?? team.name}>
                          <div className="flex items-center gap-2">
                            <span>{team.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {team.memberCount}{' '}
                              {team.memberCount === 1
                                ? 'osoba'
                                : team.memberCount < 5
                                  ? 'osoby'
                                  : 'osób'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </RadioGroup>
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * NNW premium preview for one catalog variant. Age is computed as of the
 * EVENT date (E1.2 resolution #9), not today — mirrors
 * `calculateInsurancePreview` in `@/api/pricing`, kept inline here since the
 * form already has `birthDate`/`event.date` at hand for the render.
 */
const previewInsurancePremium = (
  variant: { baseFee: number; ageMultiplier: number; maxAge: number },
  birthDate: string,
  eventDate: string,
): { available: boolean; amount: number } => {
  const ref = new Date(eventDate);
  const birth = new Date(birthDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const hadBirthday =
    ref.getMonth() > birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  if (age > variant.maxAge) return { available: false, amount: 0 };
  return {
    available: true,
    amount: Math.round(variant.baseFee + Math.max(0, age - 18) * variant.ageMultiplier),
  };
};

const InsuranceStep = ({ event, form }: { event: Event; form: FormHook }) => {
  if (form.singleInsuranceVariant) {
    const variant = form.singleInsuranceVariant;
    const premium = form.birthDate
      ? previewInsurancePremium(variant, form.birthDate, event.date)
      : null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> {variant.name} (opcjonalne)
          </CardTitle>
          <CardDescription>Zabezpiecz się na wypadek kontuzji podczas zawodów</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {variant.infoHtml && (
            <div className="rounded-lg bg-muted/50 p-4">
              <RichTextDisplay html={variant.infoHtml} />
            </div>
          )}
          <div
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${form.wantsInsurance ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onClick={() => form.setWantsInsurance(!form.wantsInsurance)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="insurance"
                checked={form.wantsInsurance}
                onCheckedChange={(checked) => form.setWantsInsurance(checked === true)}
              />
              <div className="flex-1">
                <label htmlFor="insurance" className="cursor-pointer font-medium">
                  Chcę wykupić ubezpieczenie {variant.name}
                </label>
                {premium && (
                  <div className="mt-2 text-sm">
                    {!premium.available ? (
                      <span className="text-destructive">
                        Ubezpieczenie niedostępne dla osób powyżej {variant.maxAge} lat (na dzień
                        zawodów)
                      </span>
                    ) : (
                      <span className="font-bold text-primary">
                        Składka: {premium.amount} zł (wiek na dzień zawodów)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> Ubezpieczenie NNW (opcjonalne)
        </CardTitle>
        <CardDescription>Wybierz wariant ubezpieczenia lub zrezygnuj</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <RadioGroup
          value={form.selectedInsuranceVariantId}
          onValueChange={form.setSelectedInsuranceVariantId}
        >
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-md border p-2 hover:bg-muted/50">
              <RadioGroupItem value="" />
              <span className="text-sm">Bez ubezpieczenia</span>
            </label>
            {form.insuranceVariants.map((variant) => {
              const premium = form.birthDate
                ? previewInsurancePremium(variant, form.birthDate, event.date)
                : null;
              return (
                <div key={variant.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border p-2 hover:bg-muted/50">
                    <RadioGroupItem value={variant.id} disabled={premium?.available === false} />
                    <span className="flex-1 text-sm">{variant.name}</span>
                    <span className="text-sm font-semibold text-primary">
                      {premium?.available === false
                        ? `niedostępne pow. ${variant.maxAge} lat`
                        : premium
                          ? `${premium.amount} zł`
                          : '—'}
                    </span>
                  </label>
                  {form.selectedInsuranceVariantId === variant.id && variant.infoHtml && (
                    <div className="ml-7 mt-2 rounded-lg bg-muted/50 p-3">
                      <RichTextDisplay html={variant.infoHtml} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

const MerchandiseStep = ({ event, form }: { event: Event; form: FormHook }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5" /> Dodatkowe produkty (opcjonalne)
      </CardTitle>
      <CardDescription>Zamów oficjalne gadżety razem z pakietem startowym</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {event.merchandise?.map((item) => {
        const orderKey = Array.from(form.merchandiseOrders.keys()).find((k) =>
          k.startsWith(item.id),
        );
        const existingOrder = orderKey ? form.merchandiseOrders.get(orderKey) : undefined;
        return (
          <MerchandiseItem
            key={item.id}
            item={item}
            order={existingOrder}
            onUpdate={(qty, size, color, colorHex) =>
              form.updateMerchandise(item, qty, size, color, colorHex)
            }
          />
        );
      })}
      {form.merchandiseTotal > 0 && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between font-semibold">
            <span>Suma produktów:</span>
            <span className="text-primary">{form.merchandiseTotal} zł</span>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const DiscountStep = ({ event, form }: { event: Event; form: FormHook }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Tag className="h-5 w-5" /> Kod rabatowy (opcjonalne)
      </CardTitle>
      <CardDescription>Jeśli posiadasz kod rabatowy, wpisz go tutaj</CardDescription>
    </CardHeader>
    <CardContent>
      {form.appliedDiscount ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                Kod <span className="font-bold">{form.discountCode.toUpperCase()}</span>{' '}
                zastosowany!
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={form.handleRemoveDiscount}>
              Usuń
            </Button>
          </div>
          <p className="mt-1 text-sm text-success">
            Oszczędzasz {formatMoney(form.discountAmount)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={form.discountCode}
              onChange={(e) => {
                form.setDiscountCode(e.target.value.toUpperCase());
                form.setDiscountError('');
              }}
              placeholder="Wpisz kod rabatowy"
              className="uppercase"
            />
            <Button onClick={form.handleApplyDiscount} variant="secondary">
              Zastosuj
            </Button>
          </div>
          {form.discountError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {form.discountError}
            </div>
          )}
          {event.discountCodes && event.discountCodes.filter((dc) => dc.active).length > 0 && (
            <p className="text-sm text-muted-foreground">
              💡 Dostępne są kody rabatowe dla tego wydarzenia
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

const SummaryStep = ({
  event,
  form,
  previewMode,
}: {
  event: Event;
  form: FormHook;
  previewMode: boolean;
}) => {
  const selectedDistance = form.selectedDistance!;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5" /> Podsumowanie zamówienia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="text-lg font-semibold">{event.name}</h4>
          <p className="text-muted-foreground">
            {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • {event.city}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div>
              <span className="font-medium">{selectedDistance.name}</span>
              {selectedDistance.length != null && (
                <span className="ml-2 text-muted-foreground">
                  ({selectedDistance.length} {selectedDistance.unit})
                </span>
              )}
            </div>
            <span>{formatMoney(form.distancePrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Kategoria: {form.selectedCategory}</span>
          </div>
          {form.getFinalTeamName() && (
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Drużyna: {form.getFinalTeamName()}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-muted-foreground">
            <span>Modyfikatory</span>
            <span>{formatMoney(form.modifiersTotal)}</span>
          </div>
          {form.insurancePrice > 0 && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Ubezpieczenie NNW
                </span>
                <span>{formatMoney(form.insurancePrice)}</span>
              </div>
            </>
          )}
          {form.merchandiseOrders.size > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Produkty dodatkowe:</span>
                {Array.from(form.merchandiseOrders.values()).map((order, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {order.merchandiseName}
                      {order.size && ` (${order.size})`}
                      {order.color && `, ${order.color}`}
                      {order.quantity > 1 && ` x${order.quantity}`}
                    </span>
                    <span>{formatMoney(order.price)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {form.discountAmount > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-success">
                <span>Rabat ({form.discountCode})</span>
                <span>-{formatMoney(form.discountAmount)}</span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>Do zapłaty</span>
            <span className="text-primary">{formatMoney(form.totalAmount)}</span>
          </div>
        </div>
        {!previewMode && event.paymentConfig?.type === 'organizer_bank' && (
          <BankTransferDetails
            event={event}
            user={{ name: form.participant.name }}
            selectedDistance={selectedDistance}
            birthDate={
              form.birthYear && form.birthMonth && form.birthDay
                ? `${form.birthYear}-${form.birthMonth}-${form.birthDay}`
                : undefined
            }
            totalAmount={form.totalAmount}
          />
        )}
        <div className="flex items-start gap-3 pt-4">
          <Checkbox
            id="terms"
            checked={form.agreedToTerms}
            onCheckedChange={(checked) => form.setAgreedToTerms(checked === true)}
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-muted-foreground">
            Akceptuję{' '}
            <a href="#" className="text-primary underline">
              regulamin zawodów
            </a>{' '}
            oraz{' '}
            <a href="#" className="text-primary underline">
              politykę prywatności
            </a>
            . Oświadczam, że będę startować na własną odpowiedzialność.
          </label>
        </div>
        {event.requireFinalAcceptance && event.finalAcceptanceHtml && (
          <div className="mt-4 flex items-start gap-3 border-t pt-2">
            <Checkbox
              id="finalAcceptance"
              checked={form.agreedToFinalAcceptance}
              onCheckedChange={(checked) => form.setAgreedToFinalAcceptance(checked === true)}
              className="mt-1"
            />
            <label htmlFor="finalAcceptance" className="cursor-pointer text-sm">
              <RichTextDisplay html={event.finalAcceptanceHtml} className="text-sm" />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Utility Components ───

interface BankTransferDetailsProps {
  event: Event;
  user: { name?: string } | null;
  selectedDistance?: { name: string };
  birthDate?: string;
  totalAmount: number;
}

const BankTransferDetails = ({
  event,
  user,
  selectedDistance,
  birthDate,
  totalAmount,
}: BankTransferDetailsProps) => {
  const generateTransferTitle = () => {
    if (!event.paymentConfig?.transferTitle) return `${event.name} - ${user?.name || 'Uczestnik'}`;
    return event.paymentConfig.transferTitle
      .replace('{eventName}', event.name)
      .replace('{participantName}', user?.name || 'Uczestnik')
      .replace('{distanceName}', selectedDistance?.name || '')
      .replace('{birthDate}', birthDate || '');
  };
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Skopiowano', description: `${label} został skopiowany do schowka` });
    });
  };
  if (!event.paymentConfig) return null;
  return (
    <div className="mt-6 space-y-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex items-center gap-2 text-warning">
        <Building2 className="h-5 w-5" />
        <h4 className="font-semibold">Dane do przelewu bankowego</h4>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Numer konta</p>
            <p className="truncate font-mono font-medium">
              {event.paymentConfig.bankAccountNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Kopiuj numer konta"
            onClick={() =>
              copyToClipboard(event.paymentConfig!.bankAccountNumber || '', 'Numer konta')
            }
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Odbiorca</p>
            <p className="truncate font-medium">{event.paymentConfig.bankAccountHolder}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Kopiuj odbiorcę"
            onClick={() =>
              copyToClipboard(event.paymentConfig!.bankAccountHolder || '', 'Odbiorca')
            }
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Tytuł przelewu</p>
            <p className="truncate font-medium">{generateTransferTitle()}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Kopiuj tytuł przelewu"
            onClick={() => copyToClipboard(generateTransferTitle(), 'Tytuł przelewu')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Kwota</p>
            <p className="text-lg font-bold">{formatMoney(totalAmount)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Kopiuj kwotę"
            onClick={() => copyToClipboard(`${totalAmount.toFixed(2)}`, 'Kwota')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-start gap-2 border-t border-warning/30 pt-2 text-xs text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Płatność przelewem bankowym wymaga ręcznego potwierdzenia przez organizatora. Twój zapis
          zostanie potwierdzony po zaksięgowaniu wpłaty.
        </p>
      </div>
    </div>
  );
};

interface MerchandiseItemProps {
  item: EventMerchandise;
  order?: MerchandiseOrder;
  onUpdate: (quantity: number, size?: string, color?: string, colorHex?: string) => void;
}

const MerchandiseItem = ({ item, order, onUpdate }: MerchandiseItemProps) => {
  const [selectedSize, setSelectedSize] = useState(
    order?.size || (item.sizes.length > 0 ? item.sizes[0] : undefined),
  );
  const [selectedColor, setSelectedColor] = useState(
    order?.color || (item.colors.length > 0 ? item.colors[0].name : undefined),
  );
  const [quantity, setQuantity] = useState(order?.quantity || 0);
  const selectedColorHex = item.colors.find((c) => c.name === selectedColor)?.hex;
  const handleQuantityChange = (newQty: number) => {
    setQuantity(Math.max(0, newQty));
    onUpdate(Math.max(0, newQty), selectedSize, selectedColor, selectedColorHex);
  };
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (quantity > 0) onUpdate(quantity, size, selectedColor, selectedColorHex);
  };
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const hex = item.colors.find((c) => c.name === color)?.hex;
    if (quantity > 0) onUpdate(quantity, selectedSize, color, hex);
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${quantity > 0 ? 'border-primary bg-primary/5' : 'border-border'}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
            <span className="font-bold text-primary">{item.price} zł</span>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {item.sizes.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Rozmiar</Label>
                <Select value={selectedSize} onValueChange={handleSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {item.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {item.colors.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Kolor</Label>
                <div className="flex gap-2">
                  {item.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleColorChange(color.name)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Kolor: ${color.name}`}
                      aria-pressed={selectedColor === color.name}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity === 0}
                aria-label={`Zmniejsz ilość: ${item.name}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold" aria-live="polite">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity + 1)}
                aria-label={`Zwiększ ilość: ${item.name}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
