import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Star
} from 'lucide-react';
import { Event, EventMerchandise, MerchandiseOrder, VipPrice } from '@/types';
import { DistanceRouteDialog, hasRouteArtifacts } from '@/components/DistanceRouteDialog';
import { getCurrentPrice, validateDiscountCode, mockGroupDiscountCodes, getExistingTeamsForEvent, validateTeamName, mockGlobalInsuranceSettings } from '@/data/mockData';
import { applyDiscount } from '@/api/mock/helpers';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

interface RegistrationFormProps {
  event: Event;
  onComplete: (data: RegistrationData) => void;
  onCancel: () => void;
}

export interface RegistrationData {
  distanceId: string;
  distanceName: string;
  category: string;
  price: number;
  discountCode?: string;
  discountAmount?: number;
  merchandiseOrders: MerchandiseOrder[];
  insurancePrice?: number;
  totalAmount: number;
  teamName?: string;
  vipPriceId?: string;
  vipPriceName?: string;
  vipCustomFieldValue?: string;
}

// Generate years for birth date (18-80 years old)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 63 }, (_, i) => currentYear - 18 - i);
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

export const RegistrationForm = ({ event, onComplete, onCancel }: RegistrationFormProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [wantsInsurance, setWantsInsurance] = useState(false);
  const [merchandiseOrders, setMerchandiseOrders] = useState<Map<string, MerchandiseOrder>>(new Map());
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'percent' | 'fixed'; value: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToFinalAcceptance, setAgreedToFinalAcceptance] = useState(false);
  
  // Team registration state
  const [wantsTeam, setWantsTeam] = useState(false);
  type TeamMode = 'create' | 'join';
  const [teamMode, setTeamMode] = useState<TeamMode>('create');
  const [teamName, setTeamName] = useState('');
  const [selectedExistingTeam, setSelectedExistingTeam] = useState('');
  const [teamNameError, setTeamNameError] = useState('');

  // VIP price state
  const [selectedVipId, setSelectedVipId] = useState<string>('');
  const [vipCustomFieldValue, setVipCustomFieldValue] = useState<string>('');

  // Profile completeness check
  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    return !!(user.birthYear && user.gender);
  }, [user]);

  // Auto-fill from profile
  useEffect(() => {
    if (isProfileComplete && user?.birthYear) {
      setBirthYear(String(user.birthYear));
      setBirthMonth('01');
      setBirthDay('01');
    }
  }, [isProfileComplete, user]);

  // Get existing teams for this event
  const existingTeams = useMemo(() => {
    return getExistingTeamsForEvent(event.id);
  }, [event.id]);

  const selectedDistance = event.distances.find(d => d.id === selectedDistanceId);
  const hasMerchandise = event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0;
  const hasInsurance = event.insuranceOption?.enabled;
  const hasTeamOption = true; // Always show team option
  
  // Build steps dynamically
  const buildSteps = () => {
    const steps: Array<{ id: number; name: string; icon: typeof Ticket }> = [
      { id: 1, name: 'Dystans', icon: Ticket },
      { id: 2, name: 'Dane', icon: User },
    ];
    
    // Add team step after personal data
    if (hasTeamOption) {
      steps.push({ id: 25, name: 'Drużyna', icon: Users });
    }
    
    if (hasInsurance) {
      steps.push({ id: 3, name: 'Ubezpieczenie', icon: Shield });
    }
    
    if (hasMerchandise) {
      steps.push({ id: 4, name: 'Gadżety', icon: ShoppingBag });
    }
    
    steps.push({ id: 5, name: 'Rabat', icon: Tag });
    steps.push({ id: 6, name: 'Podsumowanie', icon: Check });
    
    return steps;
  };
  
  const activeSteps = buildSteps();

  // Calculate age from birth year
  const age = birthYear ? currentYear - parseInt(birthYear) : null;

  // Calculate insurance price using global settings
  const insurancePrice = useMemo(() => {
    if (!hasInsurance || !wantsInsurance || !age) return 0;
    const { baseFee, ageMultiplier, maxAge } = mockGlobalInsuranceSettings;
    if (age > maxAge) return 0;
    return Math.round(baseFee + Math.max(0, age - 18) * ageMultiplier);
  }, [hasInsurance, wantsInsurance, age]);

  // Find current active VIP price object
   const activeVip = useMemo(() => {
    if (!selectedDistance || !selectedVipId) return null;
    return selectedDistance.vipPrices?.find(v => v.id === selectedVipId) || null;
  }, [selectedDistance, selectedVipId]);

  const distancePrice = useMemo(() => {
    if (!selectedDistance) return 0;
    const { price } = getCurrentPrice(selectedDistance);
    if (activeVip) {
      return applyDiscount(selectedDistance.price, activeVip.discountType, activeVip.discountValue);
    }
    return price;
  }, [selectedDistance, activeVip]);

  const merchandiseTotal = useMemo(() => {
    let total = 0;
    merchandiseOrders.forEach(order => {
      total += order.price;
    });
    return total;
  }, [merchandiseOrders]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percent') {
      return Math.round(distancePrice * (appliedDiscount.value / 100));
    }
    return Math.min(appliedDiscount.value, distancePrice);
  }, [appliedDiscount, distancePrice]);

  const totalAmount = distancePrice - discountAmount + merchandiseTotal + insurancePrice;

  // Validate team name on change
  useEffect(() => {
    if (wantsTeam && teamMode === 'create' && teamName) {
      const result = validateTeamName(teamName);
      setTeamNameError(result.valid ? '' : (result.error || ''));
    } else {
      setTeamNameError('');
    }
  }, [teamName, wantsTeam, teamMode]);

  // Get final team name
  const getFinalTeamName = (): string | undefined => {
    if (!wantsTeam) return undefined;
    if (teamMode === 'create') {
      return teamName.trim() || undefined;
    }
    return selectedExistingTeam || undefined;
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError('Wpisz kod rabatowy');
      return;
    }
    
    const result = validateDiscountCode(discountCode, event, selectedDistanceId);
    if (result.valid && result.discount) {
      setAppliedDiscount(result.discount);
      setDiscountError('');
    } else {
      setDiscountError(result.message);
      setAppliedDiscount(null);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const updateMerchandise = (item: EventMerchandise, quantity: number, size?: string, color?: string, colorHex?: string) => {
    const key = `${item.id}-${size || 'none'}-${color || 'none'}`;
    
    if (quantity <= 0) {
      const newOrders = new Map(merchandiseOrders);
      newOrders.delete(key);
      setMerchandiseOrders(newOrders);
    } else {
      setMerchandiseOrders(new Map(merchandiseOrders).set(key, {
        merchandiseId: item.id,
        merchandiseName: item.name,
        size,
        color,
        colorHex,
        quantity,
        price: item.price * quantity,
      }));
    }
  };

  const getNextStep = () => {
    const currentIndex = activeSteps.findIndex(s => s.id === step);
    if (currentIndex < activeSteps.length - 1) {
      return activeSteps[currentIndex + 1].id;
    }
    return step;
  };

  const getPrevStep = () => {
    const currentIndex = activeSteps.findIndex(s => s.id === step);
    if (currentIndex > 0) {
      return activeSteps[currentIndex - 1].id;
    }
    return step;
  };

  const isStepInActiveSteps = (stepId: number) => {
    return activeSteps.some(s => s.id === stepId);
  };

  const canProceed = () => {
    switch (step) {
      case 1: {
        if (!selectedDistanceId) return false;
        // VIP custom field validation
        if (activeVip?.customFieldRequired && !vipCustomFieldValue.trim()) return false;
        // Check distance capacity
        const dist = event.distances.find(d => d.id === selectedDistanceId);
        if (dist?.limit != null && dist.registeredCount >= dist.limit) return false;
        return true;
      }
      case 2: return !!selectedCategory && !!birthYear && !!birthMonth && !!birthDay;
      case 25: 
        // Team is optional, but if user wants a team, validate
        if (!wantsTeam) return true;
        if (teamMode === 'create') {
          return teamName.trim().length >= 3 && !teamNameError;
        }
        return !!selectedExistingTeam;
      case 3: return true; // Insurance is optional
      case 4: return true; // Merchandise is optional
      case 5: return true; // Discount is optional
      case 6: 
        const termsOk = agreedToTerms;
        const finalAcceptanceOk = !event.requireFinalAcceptance || agreedToFinalAcceptance;
        return termsOk && finalAcceptanceOk;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setStep(getNextStep());
  };

  const handleBack = () => {
    setStep(getPrevStep());
  };

  const handleSubmit = () => {
    if (!agreedToTerms || !selectedDistance) return;
    
    onComplete({
      distanceId: selectedDistanceId,
      distanceName: selectedDistance.name,
      category: selectedCategory,
      price: distancePrice,
      discountCode: appliedDiscount ? discountCode : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      merchandiseOrders: Array.from(merchandiseOrders.values()),
      insurancePrice: insurancePrice > 0 ? insurancePrice : undefined,
      totalAmount,
      teamName: getFinalTeamName(),
      vipPriceId: activeVip ? selectedVipId : undefined,
      vipPriceName: activeVip?.name,
      vipCustomFieldValue: activeVip?.customFieldLabel ? vipCustomFieldValue : undefined,
    });
  };

  const isLastStep = step === activeSteps[activeSteps.length - 1].id;
  const isFirstStep = step === activeSteps[0].id;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Krok {activeSteps.findIndex(s => s.id === step) + 1} z {activeSteps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {activeSteps.find(s => s.id === step)?.name}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((activeSteps.findIndex(s => s.id === step) + 1) / activeSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {activeSteps.map((s, index) => {
          const isActive = s.id === step;
          const isCompleted = activeSteps.findIndex(as => as.id === step) > index;
          const Icon = s.icon;
          
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-[60px]">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                  ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-2 text-xs text-center ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {s.name}
                </span>
              </div>
              {index < activeSteps.length - 1 && (
                <div className={`hidden sm:block w-8 md:w-12 h-0.5 mx-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Distance Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz dystans</CardTitle>
            <CardDescription>
              Wybierz dystans, na który chcesz się zapisać
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedDistanceId} onValueChange={setSelectedDistanceId}>
              <div className="space-y-4">
                {event.distances.map(distance => {
                  const { price, tierName } = getCurrentPrice(distance);
                  const spotsLeft = distance.limit ? distance.limit - distance.registeredCount : null;
                  const isFull = spotsLeft !== null && spotsLeft <= 0;
                  
                  return (
                    <label
                      key={distance.id}
                      className={`
                        flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedDistanceId === distance.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        ${isFull ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <RadioGroupItem value={distance.id} disabled={isFull} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{distance.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {distance.length} {distance.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{price} zł</div>
                            <Badge variant="secondary" className="text-xs">{tierName}</Badge>
                          </div>
                        </div>
                        
                        {/* Price tiers */}
                        {distance.priceTiers && distance.priceTiers.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {distance.priceTiers.map(tier => {
                              const isCurrentTier = tier.name === tierName;
                              const mode = distance.priceTierMode || 'date';
                              const tierPrice = applyDiscount(distance.price, tier.discountType, tier.discountValue);
                              const isPast = mode === 'date' && tier.endDate ? new Date(tier.endDate) < new Date() : false;
                              const isOverLimit = mode === 'participants' && tier.participantLimit != null && distance.registeredCount >= tier.participantLimit;
                              const dimmed = isPast || isOverLimit;
                              
                              return (
                                <div 
                                  key={tier.id} 
                                  className={`text-xs flex justify-between ${
                                    isCurrentTier ? 'text-primary font-medium' : 
                                    dimmed ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                                  }`}
                                >
                                  <span>{tier.name}</span>
                                  <span>
                                    {tierPrice} zł
                                    {mode === 'date' && tier.endDate && ` do ${format(new Date(tier.endDate), 'd MMM', { locale: pl })}`}
                                    {mode === 'participants' && tier.participantLimit != null && ` (do ${tier.participantLimit} os.)`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Spots info */}
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          {isFull ? (
                            <Badge variant="destructive">Brak miejsc</Badge>
                          ) : spotsLeft !== null && spotsLeft <= 50 ? (
                            <Badge variant="destructive" className="animate-pulse">
                              Ostatnie {spotsLeft} miejsc!
                            </Badge>
                          ) : (
                            <span>{distance.registeredCount} zapisanych{distance.limit && ` / ${distance.limit}`}</span>
                          )}
                        </div>

                        {/* Route preview button */}
                        {hasRouteArtifacts(distance) && (
                          <div className="mt-2" onClick={e => e.preventDefault()}>
                            <DistanceRouteDialog distance={distance} />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>

            {/* VIP Price Selection */}
            {selectedDistance && (() => {
              const { price: tierPrice } = getCurrentPrice(selectedDistance);
              const vipOptions = selectedDistance.vipPrices || [];
              if (vipOptions.length === 0) return null;

              return (
                <div className="mt-4 p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <Label className="text-sm font-medium">Ceny specjalne (VIP)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jeśli kwalifikujesz się do ceny specjalnej, wybierz odpowiednią opcję poniżej.
                  </p>
                  <RadioGroup value={selectedVipId} onValueChange={(v) => { setSelectedVipId(v); setVipCustomFieldValue(''); }}>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="" />
                        <span className="text-sm">Cena standardowa — {tierPrice} zł</span>
                      </label>
                      {vipOptions.map(vip => {
                        const vipFinalPrice = applyDiscount(selectedDistance.price, vip.discountType, vip.discountValue);
                        return (
                          <div key={vip.id}>
                            <label className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50">
                              <RadioGroupItem value={vip.id} />
                              <span className="text-sm flex-1">{vip.name}</span>
                              <span className="text-sm font-semibold text-primary">{vipFinalPrice} zł</span>
                            </label>
                            {selectedVipId === vip.id && vip.customFieldLabel && (
                              <div className="ml-7 mt-2 space-y-1">
                                <Label className="text-xs">{vip.customFieldLabel} {vip.customFieldRequired && <span className="text-destructive">*</span>}</Label>
                                <Input
                                  value={vipCustomFieldValue}
                                  onChange={(e) => setVipCustomFieldValue(e.target.value)}
                                  placeholder={vip.customFieldLabel}
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personal Data & Category */}
      {step === 2 && selectedDistance && (
        <Card>
          <CardHeader>
            <CardTitle>Dane osobowe</CardTitle>
            <CardDescription>
              Podaj swoją datę urodzenia i wybierz kategorię wiekową
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile completeness callout */}
            {isProfileComplete ? (
              <Alert className="border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle className="text-success">Dane pobrane z profilu</AlertTitle>
                <AlertDescription className="text-success/80">
                  <span>
                    Rok urodzenia: <strong>{user?.birthYear}</strong> ({currentYear - (user?.birthYear || 0)} lat) • 
                    Płeć: <strong>{user?.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}</strong>
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <UserCog className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">Uzupełnij swój profil</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-amber-700 dark:text-amber-300">
                  <span>
                    Dodaj datę urodzenia i płeć w profilu, aby automatycznie uzupełniać formularze.
                  </span>
                  <Button variant="outline" size="sm" asChild className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900">
                    <Link to="/participant?tab=profile">Przejdź do profilu</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Birth date */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Data urodzenia</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Dzień</Label>
                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Dzień" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Miesiąc</Label>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Miesiąc" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rok</Label>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rok" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {age && (
                <p className="text-sm text-muted-foreground">
                  Twój wiek: <span className="font-medium text-foreground">{age} lat</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Category selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Kategoria wiekowa</Label>
              {selectedDistance.ageCategories && selectedDistance.ageCategories.length > 0 ? (
                (() => {
                  // Auto-assign based on birth year and gender from profile
                  const userGender = user?.gender;
                  const userBirthYear = birthYear ? parseInt(birthYear) : null;
                  const matchedCategory = userGender && userBirthYear
                    ? selectedDistance.ageCategories.find(
                        cat => cat.gender === userGender && userBirthYear >= cat.birthYearFrom && userBirthYear <= cat.birthYearTo
                      )
                    : null;

                  // Auto-select matched category
                  if (matchedCategory && selectedCategory !== matchedCategory.name) {
                    setTimeout(() => setSelectedCategory(matchedCategory.name), 0);
                  }

                  return (
                    <>
                      {matchedCategory ? (
                        <div className="p-3 rounded-lg border-2 border-primary bg-primary/5">
                          <p className="text-sm text-muted-foreground mb-1">Automatycznie przypisana kategoria:</p>
                          <p className="font-semibold text-lg">{matchedCategory.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Płeć: {matchedCategory.gender === 'K' ? 'Kobieta' : 'Mężczyzna'} • Roczniki: {matchedCategory.birthYearFrom}–{matchedCategory.birthYearTo}
                          </p>
                        </div>
                      ) : !userGender || !userBirthYear ? (
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                          <UserCog className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800 dark:text-amber-200">Uzupełnij profil</AlertTitle>
                          <AlertDescription className="text-amber-700 dark:text-amber-300">
                            Aby automatycznie przypisać kategorię wiekową, uzupełnij datę urodzenia i płeć w swoim profilu.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Brak pasującej kategorii</AlertTitle>
                          <AlertDescription>
                            Nie znaleziono pasującej kategorii wiekowej dla Twoich danych (rok: {userBirthYear}, płeć: {userGender === 'K' ? 'Kobieta' : 'Mężczyzna'}). Sprawdź dane w profilu.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Special categories as checkboxes */}
                      {selectedDistance.specialCategories && selectedDistance.specialCategories.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <Label className="text-base font-medium">Kategorie specjalne (opcjonalne)</Label>
                          <div className="space-y-2">
                            {selectedDistance.specialCategories.map(cat => (
                              <label
                                key={cat.id}
                                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={selectedCategory.includes(cat.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCategory(prev => prev ? `${prev}, ${cat.name}` : cat.name);
                                    } else {
                                      setSelectedCategory(prev => prev.replace(`, ${cat.name}`, '').replace(cat.name, '').replace(/^, |, $/g, ''));
                                    }
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
                  );
                })()
              ) : (
                <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedDistance.categories.map(category => (
                      <label
                        key={category}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${selectedCategory === category ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                      >
                        <RadioGroupItem value={category} />
                        <span className="font-medium">{category}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 25: Team Registration */}
      {step === 25 && isStepInActiveSteps(25) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Zapis drużynowy (opcjonalne)
            </CardTitle>
            <CardDescription>
              Zapisz się jako część drużyny i skorzystaj ze zniżek grupowych
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team option */}
            <div
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                wantsTeam ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setWantsTeam(!wantsTeam)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="team"
                  checked={wantsTeam}
                  onCheckedChange={(checked) => setWantsTeam(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="team" className="font-medium cursor-pointer">
                    Chcę zapisać się jako część drużyny
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Zaznacz, jeśli rejestrujesz się wraz z innymi osobami z tej samej drużyny lub klubu.
                  </p>
                </div>
              </div>
            </div>

            {/* Team mode selection */}
            {wantsTeam && (
              <div className="space-y-4 pl-2 border-l-2 border-primary/30 ml-2">
                <RadioGroup value={teamMode} onValueChange={(v) => setTeamMode(v as TeamMode)}>
                  {/* Create new team */}
                  <div className="space-y-3">
                    <label
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${teamMode === 'create' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <RadioGroupItem value="create" />
                      <span className="font-medium">Utwórz nową drużynę</span>
                    </label>
                    
                    {teamMode === 'create' && (
                      <div className="ml-7 space-y-2">
                        <Label htmlFor="newTeamName">Nazwa drużyny / klubu</Label>
                        <Input
                          id="newTeamName"
                          placeholder="np. KB Górskie Wilki, Biegacze Warszawa"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className={teamNameError ? 'border-destructive' : ''}
                        />
                        {teamNameError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {teamNameError}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          3-50 znaków. Użyj tej samej nazwy co pozostali członkowie drużyny.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Join existing team */}
                  <div className="space-y-3">
                    <label
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${teamMode === 'join' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        ${existingTeams.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <RadioGroupItem value="join" disabled={existingTeams.length === 0} />
                      <div>
                        <span className="font-medium">Dołącz do istniejącej drużyny</span>
                        {existingTeams.length === 0 && (
                          <p className="text-xs text-muted-foreground">Brak drużyn zapisanych na te zawody</p>
                        )}
                      </div>
                    </label>
                    
                    {teamMode === 'join' && existingTeams.length > 0 && (
                      <div className="ml-7 space-y-2">
                        <Label>Wybierz drużynę</Label>
                        <Select value={selectedExistingTeam} onValueChange={setSelectedExistingTeam}>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz drużynę..." />
                          </SelectTrigger>
                          <SelectContent>
                            {existingTeams.map(team => (
                              <SelectItem key={team.name} value={team.name}>
                                <div className="flex items-center gap-2">
                                  <span>{team.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {team.memberCount} {team.memberCount === 1 ? 'osoba' : team.memberCount < 5 ? 'osoby' : 'osób'}
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

            {/* Group discount info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Zniżki grupowe
              </h4>
              <p className="text-sm text-muted-foreground">
                Zniżki są naliczane automatycznie po zapisaniu minimalnej liczby osób z tej samej drużyny:
              </p>
              <ul className="text-sm space-y-2">
                {mockGroupDiscountCodes.map((discount) => (
                  <li key={discount.id} className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {discount.minParticipants}+ osób
                    </Badge>
                    <span className="text-primary font-medium">-{discount.discountValue}%</span>
                    <span className="text-muted-foreground">rabatu</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Zniżka zostanie przypisana do wszystkich członków drużyny po osiągnięciu minimalnej liczby zapisanych.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Insurance */}
      {step === 3 && isStepInActiveSteps(3) && hasInsurance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Ubezpieczenie NNW (opcjonalne)
            </CardTitle>
            <CardDescription>
              Zabezpiecz się na wypadek kontuzji podczas zawodów
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global insurance info from admin settings */}
            <div className="bg-muted/50 rounded-lg p-4">
              <RichTextDisplay html={mockGlobalInsuranceSettings.infoHtml} />
            </div>

            <div className={`
              border-2 rounded-lg p-4 transition-all cursor-pointer
              ${wantsInsurance ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `} onClick={() => setWantsInsurance(!wantsInsurance)}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="insurance"
                  checked={wantsInsurance}
                  onCheckedChange={(checked) => setWantsInsurance(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="insurance" className="font-medium cursor-pointer">
                    Chcę wykupić ubezpieczenie NNW
                  </label>
                  {age && (
                    <div className="mt-2 text-sm">
                      {age > mockGlobalInsuranceSettings.maxAge ? (
                        <span className="text-destructive">
                          Ubezpieczenie niedostępne dla osób powyżej {mockGlobalInsuranceSettings.maxAge} lat
                        </span>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Składka dla Twojego wieku ({age} lat): </span>
                          <span className="font-bold text-primary">
                            {Math.round(mockGlobalInsuranceSettings.baseFee + Math.max(0, age - 18) * mockGlobalInsuranceSettings.ageMultiplier)} zł
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            (składka bazowa {mockGlobalInsuranceSettings.baseFee} zł + dodatek wiekowy {Math.max(0, age - 18) * mockGlobalInsuranceSettings.ageMultiplier} zł)
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Merchandise */}
      {step === 4 && isStepInActiveSteps(4) && hasMerchandise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Dodatkowe produkty (opcjonalne)
            </CardTitle>
            <CardDescription>
              Zamów oficjalne gadżety razem z pakietem startowym
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.merchandise?.map(item => {
              const orderKey = Array.from(merchandiseOrders.keys()).find(k => k.startsWith(item.id));
              const existingOrder = orderKey ? merchandiseOrders.get(orderKey) : undefined;
              
              return (
                <MerchandiseItem
                  key={item.id}
                  item={item}
                  order={existingOrder}
                  onUpdate={(qty, size, color, colorHex) => updateMerchandise(item, qty, size, color, colorHex)}
                />
              );
            })}
            
            {merchandiseTotal > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Suma produktów:</span>
                  <span className="text-primary">{merchandiseTotal} zł</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Discount Code */}
      {step === 5 && isStepInActiveSteps(5) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Kod rabatowy (opcjonalne)
            </CardTitle>
            <CardDescription>
              Jeśli posiadasz kod rabatowy, wpisz go tutaj
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appliedDiscount ? (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      Kod <span className="font-bold">{discountCode.toUpperCase()}</span> zastosowany!
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveDiscount}>
                    Usuń
                  </Button>
                </div>
                <p className="text-sm text-success mt-1">
                  Oszczędzasz {discountAmount} zł
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountError('');
                    }}
                    placeholder="Wpisz kod rabatowy"
                    className="uppercase"
                  />
                  <Button onClick={handleApplyDiscount} variant="secondary">
                    Zastosuj
                  </Button>
                </div>
                {discountError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {discountError}
                  </div>
                )}
                
                {event.discountCodes && event.discountCodes.filter(dc => dc.active).length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    💡 Dostępne są kody rabatowe dla tego wydarzenia
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 6: Summary */}
      {step === 6 && isStepInActiveSteps(6) && selectedDistance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Podsumowanie zamówienia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-lg">{event.name}</h4>
              <p className="text-muted-foreground">
                {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • {event.city}
              </p>
            </div>

            {/* Order details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{selectedDistance.name}</span>
                  <span className="text-muted-foreground ml-2">({selectedDistance.length} {selectedDistance.unit})</span>
                </div>
                <span>{distancePrice} zł</span>
              </div>
              
              <div className="flex justify-between text-muted-foreground">
                <span>Kategoria: {selectedCategory}</span>
              </div>

              {getFinalTeamName() && (
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Drużyna: {getFinalTeamName()}
                  </span>
                </div>
              )}

              {insurancePrice > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Ubezpieczenie NNW
                    </span>
                    <span>{insurancePrice} zł</span>
                  </div>
                </>
              )}

              {merchandiseOrders.size > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Produkty dodatkowe:</span>
                    {Array.from(merchandiseOrders.values()).map((order, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {order.merchandiseName}
                          {order.size && ` (${order.size})`}
                          {order.color && `, ${order.color}`}
                          {order.quantity > 1 && ` x${order.quantity}`}
                        </span>
                        <span>{order.price} zł</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {discountAmount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-success">
                    <span>Rabat ({discountCode})</span>
                    <span>-{discountAmount} zł</span>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Do zapłaty</span>
                <span className="text-primary">{totalAmount} zł</span>
              </div>
            </div>

            {/* Bank transfer details */}
            {event.paymentConfig?.type === 'organizer_bank' && (
              <BankTransferDetails
                event={event}
                user={user}
                selectedDistance={selectedDistance}
                totalAmount={totalAmount}
              />
            )}

            {/* Terms agreement */}
            <div className="flex items-start gap-3 pt-4">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                Akceptuję <a href="#" className="text-primary underline">regulamin zawodów</a> oraz{' '}
                <a href="#" className="text-primary underline">politykę prywatności</a>. 
                Oświadczam, że będę startować na własną odpowiedzialność.
              </label>
            </div>

            {/* Final Acceptance - only if event requires it */}
            {event.requireFinalAcceptance && event.finalAcceptanceHtml && (
              <div className="flex items-start gap-3 pt-2 border-t mt-4">
                <Checkbox
                  id="finalAcceptance"
                  checked={agreedToFinalAcceptance}
                  onCheckedChange={(checked) => setAgreedToFinalAcceptance(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="finalAcceptance" className="text-sm cursor-pointer">
                  <RichTextDisplay html={event.finalAcceptanceHtml} className="text-sm" />
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {isFirstStep ? (
          <Button variant="ghost" onClick={onCancel}>
            Anuluj
          </Button>
        ) : (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wstecz
          </Button>
        )}

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={!agreedToTerms} size="lg">
            {event.paymentConfig?.type === 'organizer_bank' 
              ? 'Zapisz się' 
              : `Płacę ${totalAmount} zł`}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Dalej
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Bank Transfer Details Component
interface BankTransferDetailsProps {
  event: Event;
  user: { name?: string } | null;
  selectedDistance?: { name: string };
  totalAmount: number;
}

const BankTransferDetails = ({ event, user, selectedDistance, totalAmount }: BankTransferDetailsProps) => {
  const generateTransferTitle = () => {
    if (!event.paymentConfig?.transferTitle) {
      return `${event.name} - ${user?.name || 'Uczestnik'}`;
    }
    
    return event.paymentConfig.transferTitle
      .replace('{eventName}', event.name)
      .replace('{participantName}', user?.name || 'Uczestnik')
      .replace('{distanceName}', selectedDistance?.name || '');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Skopiowano',
        description: `${label} został skopiowany do schowka`,
      });
    });
  };

  if (!event.paymentConfig) return null;

  return (
    <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-4">
      <div className="flex items-center gap-2 text-warning">
        <Building2 className="h-5 w-5" />
        <h4 className="font-semibold">Dane do przelewu bankowego</h4>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Account number */}
        <div className="flex justify-between items-center">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Numer konta</p>
            <p className="font-mono font-medium truncate">{event.paymentConfig.bankAccountNumber}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyToClipboard(event.paymentConfig!.bankAccountNumber || '', 'Numer konta')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Account holder */}
        <div className="flex justify-between items-center">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Odbiorca</p>
            <p className="font-medium truncate">{event.paymentConfig.bankAccountHolder}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyToClipboard(event.paymentConfig!.bankAccountHolder || '', 'Odbiorca')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Transfer title */}
        <div className="flex justify-between items-center">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Tytuł przelewu</p>
            <p className="font-medium truncate">{generateTransferTitle()}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyToClipboard(generateTransferTitle(), 'Tytuł przelewu')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Amount */}
        <div className="flex justify-between items-center">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Kwota</p>
            <p className="font-bold text-lg">{totalAmount.toFixed(2)} PLN</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copyToClipboard(`${totalAmount.toFixed(2)}`, 'Kwota')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Warning */}
      <div className="flex items-start gap-2 text-xs text-warning pt-2 border-t border-warning/30">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Płatność przelewem bankowym wymaga ręcznego potwierdzenia przez organizatora. 
          Twój zapis zostanie potwierdzony po zaksięgowaniu wpłaty.
        </p>
      </div>
    </div>
  );
};

// Merchandise Item Component
interface MerchandiseItemProps {
  item: EventMerchandise;
  order?: MerchandiseOrder;
  onUpdate: (quantity: number, size?: string, color?: string, colorHex?: string) => void;
}

const MerchandiseItem = ({ item, order, onUpdate }: MerchandiseItemProps) => {
  const [selectedSize, setSelectedSize] = useState(order?.size || (item.sizes.length > 0 ? item.sizes[0] : undefined));
  const [selectedColor, setSelectedColor] = useState(order?.color || (item.colors.length > 0 ? item.colors[0].name : undefined));
  const [quantity, setQuantity] = useState(order?.quantity || 0);

  const selectedColorHex = item.colors.find(c => c.name === selectedColor)?.hex;

  const handleQuantityChange = (newQty: number) => {
    setQuantity(Math.max(0, newQty));
    onUpdate(Math.max(0, newQty), selectedSize, selectedColor, selectedColorHex);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (quantity > 0) {
      onUpdate(quantity, size, selectedColor, selectedColorHex);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const hex = item.colors.find(c => c.name === color)?.hex;
    if (quantity > 0) {
      onUpdate(quantity, selectedSize, color, hex);
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-colors ${quantity > 0 ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
            <span className="font-bold text-primary">{item.price} zł</span>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            {item.sizes.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Rozmiar</Label>
                <Select value={selectedSize} onValueChange={handleSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {item.sizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {item.colors.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Kolor</Label>
                <div className="flex gap-2">
                  {item.colors.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleColorChange(color.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color.name ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity + 1)}
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
