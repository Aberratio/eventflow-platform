import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Shield
} from 'lucide-react';
import { Event, EventMerchandise, MerchandiseOrder } from '@/types';
import { getCurrentPrice, validateDiscountCode } from '@/data/mockData';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

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

  const selectedDistance = event.distances.find(d => d.id === selectedDistanceId);
  const hasMerchandise = event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0;
  const hasInsurance = event.insuranceOption?.enabled;
  
  // Build steps dynamically
  const buildSteps = () => {
    const steps = [
      { id: 1, name: 'Dystans', icon: Ticket },
      { id: 2, name: 'Dane', icon: User },
    ];
    
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

  // Calculate insurance price
  const insurancePrice = useMemo(() => {
    if (!hasInsurance || !wantsInsurance || !age || !event.insuranceOption) return 0;
    const { baseFee, ageMultiplier } = event.insuranceOption;
    return Math.round(baseFee + Math.max(0, age - 18) * ageMultiplier);
  }, [hasInsurance, wantsInsurance, age, event.insuranceOption]);

  const distancePrice = useMemo(() => {
    if (!selectedDistance) return 0;
    const { price } = getCurrentPrice(selectedDistance);
    return price;
  }, [selectedDistance]);

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
      case 1: return !!selectedDistanceId;
      case 2: return !!selectedCategory && !!birthYear && !!birthMonth && !!birthDay;
      case 3: return true; // Insurance is optional
      case 4: return true; // Merchandise is optional
      case 5: return true; // Discount is optional
      case 6: return agreedToTerms;
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
                              const isPast = new Date(tier.endDate) < new Date();
                              
                              return (
                                <div 
                                  key={tier.id} 
                                  className={`text-xs flex justify-between ${
                                    isCurrentTier ? 'text-primary font-medium' : 
                                    isPast ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                                  }`}
                                >
                                  <span>{tier.name}</span>
                                  <span>
                                    {tier.price} zł do {format(new Date(tier.endDate), 'd MMM', { locale: pl })}
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
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Insurance */}
      {step === 3 && isStepInActiveSteps(3) && hasInsurance && event.insuranceOption && (
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
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">{event.insuranceOption.name}</h4>
              <p className="text-sm text-muted-foreground">{event.insuranceOption.description}</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Ochrona podczas całych zawodów
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Pokrycie kosztów leczenia
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Świadczenie za uszczerbek na zdrowiu
                </li>
              </ul>
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
                      <span className="text-muted-foreground">Cena dla Twojego wieku ({age} lat): </span>
                      <span className="font-bold text-primary">
                        {Math.round(event.insuranceOption.baseFee + Math.max(0, age - 18) * event.insuranceOption.ageMultiplier)} zł
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Składka bazowa: {event.insuranceOption.baseFee} zł + dodatek wiekowy
                  </p>
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
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      Kod <span className="font-bold">{discountCode.toUpperCase()}</span> zastosowany!
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveDiscount}>
                    Usuń
                  </Button>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
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
                  <div className="flex justify-between text-green-600 dark:text-green-400">
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
            Płacę {totalAmount} zł
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
