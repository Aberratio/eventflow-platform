import { useState, useMemo, useEffect } from 'react';
import { Event, EventMerchandise, MerchandiseOrder, VipPrice } from '@/types';
import { getCurrentPrice, getExistingTeamsForEvent, validateDiscountCode, validateTeamName } from '@/api/mock/helpers';
import { mockGlobalInsuranceSettings } from '@/api/mock/insurance.mock';
import { mockRegistrations } from '@/api/mock/registrations.mock';
import { mockGroupDiscountCodes } from '@/api/mock/shop.mock';
import { applyDiscount } from '@/api/mock/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { RegistrationData } from '@/components/registration/RegistrationForm';

const currentYear = new Date().getFullYear();

export const useRegistrationForm = (event: Event) => {
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

  // Team registration
  const [wantsTeam, setWantsTeam] = useState(false);
  type TeamMode = 'create' | 'join';
  const [teamMode, setTeamMode] = useState<TeamMode>('create');
  const [teamName, setTeamName] = useState('');
  const [selectedExistingTeam, setSelectedExistingTeam] = useState('');
  const [teamNameError, setTeamNameError] = useState('');

  // VIP
  const [selectedVipId, setSelectedVipId] = useState<string>('');
  const [vipCustomFieldValue, setVipCustomFieldValue] = useState<string>('');

  // Profile completeness
  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    return !!(user.birthYear && user.gender);
  }, [user]);

  useEffect(() => {
    if (isProfileComplete && user?.birthYear) {
      setBirthYear(String(user.birthYear));
      setBirthMonth('01');
      setBirthDay('01');
    }
  }, [isProfileComplete, user]);

  const existingTeams = useMemo(() => getExistingTeamsForEvent(mockRegistrations, event.id), [event.id]);

  const selectedDistance = event.distances.find(d => d.id === selectedDistanceId);
  const formCfg = event.registrationFormConfig;
  const hasMerchandise = (formCfg?.collectMerchandise ?? true) && event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0;
  const hasInsurance = (formCfg?.collectInsurance ?? true) && event.insuranceOption?.enabled;
  const hasTeamOption = formCfg?.collectTeam ?? true;

  // Build steps dynamically
  const activeSteps = useMemo(() => {
    const steps: Array<{ id: number; name: string }> = [
      { id: 1, name: 'Dystans' },
      { id: 2, name: 'Dane' },
    ];
    if (hasTeamOption) steps.push({ id: 25, name: 'Drużyna' });
    if (hasInsurance) steps.push({ id: 3, name: 'Ubezpieczenie' });
    if (hasMerchandise) steps.push({ id: 4, name: 'Gadżety' });
    steps.push({ id: 5, name: 'Rabat' });
    steps.push({ id: 6, name: 'Podsumowanie' });
    return steps;
  }, [hasTeamOption, hasInsurance, hasMerchandise]);

  const age = birthYear ? currentYear - parseInt(birthYear) : null;

  const insurancePrice = useMemo(() => {
    if (!hasInsurance || !wantsInsurance || !age) return 0;
    const { baseFee, ageMultiplier, maxAge } = mockGlobalInsuranceSettings;
    if (age > maxAge) return 0;
    return Math.round(baseFee + Math.max(0, age - 18) * ageMultiplier);
  }, [hasInsurance, wantsInsurance, age]);

  const activeVip = useMemo(() => {
    if (!selectedDistance || !selectedVipId) return null;
    return selectedDistance.vipPrices?.find(v => v.id === selectedVipId) || null;
  }, [selectedDistance, selectedVipId]);

  const distancePrice = useMemo(() => {
    if (!selectedDistance) return 0;
    const { price } = getCurrentPrice(selectedDistance);
    if (activeVip) return applyDiscount(selectedDistance.price, activeVip.discountType, activeVip.discountValue);
    return price;
  }, [selectedDistance, activeVip]);

  const merchandiseTotal = useMemo(() => {
    let total = 0;
    merchandiseOrders.forEach(order => { total += order.price; });
    return total;
  }, [merchandiseOrders]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percent') return Math.round(distancePrice * (appliedDiscount.value / 100));
    return Math.min(appliedDiscount.value, distancePrice);
  }, [appliedDiscount, distancePrice]);

  const totalAmount = distancePrice - discountAmount + merchandiseTotal + insurancePrice;

  useEffect(() => {
    if (wantsTeam && teamMode === 'create' && teamName) {
      const result = validateTeamName(teamName);
      setTeamNameError(result.valid ? '' : (result.error || ''));
    } else {
      setTeamNameError('');
    }
  }, [teamName, wantsTeam, teamMode]);

  const getFinalTeamName = (): string | undefined => {
    if (!wantsTeam) return undefined;
    return teamMode === 'create' ? (teamName.trim() || undefined) : (selectedExistingTeam || undefined);
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) { setDiscountError('Wpisz kod rabatowy'); return; }
    const result = validateDiscountCode(discountCode, event, selectedDistanceId);
    if (result.valid && result.discount) { setAppliedDiscount(result.discount); setDiscountError(''); }
    else { setDiscountError(result.message); setAppliedDiscount(null); }
  };

  const handleRemoveDiscount = () => { setAppliedDiscount(null); setDiscountCode(''); setDiscountError(''); };

  const updateMerchandise = (item: EventMerchandise, quantity: number, size?: string, color?: string, colorHex?: string) => {
    const key = `${item.id}-${size || 'none'}-${color || 'none'}`;
    if (quantity <= 0) {
      const newOrders = new Map(merchandiseOrders);
      newOrders.delete(key);
      setMerchandiseOrders(newOrders);
    } else {
      setMerchandiseOrders(new Map(merchandiseOrders).set(key, {
        merchandiseId: item.id, merchandiseName: item.name, size, color, colorHex, quantity, price: item.price * quantity,
      }));
    }
  };

  const getNextStep = () => {
    const idx = activeSteps.findIndex(s => s.id === step);
    return idx < activeSteps.length - 1 ? activeSteps[idx + 1].id : step;
  };
  const getPrevStep = () => {
    const idx = activeSteps.findIndex(s => s.id === step);
    return idx > 0 ? activeSteps[idx - 1].id : step;
  };
  const isStepInActiveSteps = (stepId: number) => activeSteps.some(s => s.id === stepId);

  const canProceed = () => {
    switch (step) {
      case 1: {
        if (!selectedDistanceId) return false;
        if (activeVip?.customFieldRequired && !vipCustomFieldValue.trim()) return false;
        const dist = event.distances.find(d => d.id === selectedDistanceId);
        if (dist?.limit != null && dist.registeredCount >= dist.limit) return false;
        return true;
      }
      case 2: return !!selectedCategory && !!birthYear && !!birthMonth && !!birthDay;
      case 25:
        if (!wantsTeam) return true;
        if (teamMode === 'create') return teamName.trim().length >= 3 && !teamNameError;
        return !!selectedExistingTeam;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: {
        const termsOk = agreedToTerms;
        const finalAcceptanceOk = !event.requireFinalAcceptance || agreedToFinalAcceptance;
        return termsOk && finalAcceptanceOk;
      }
      default: return false;
    }
  };

  const handleNext = () => { if (canProceed()) setStep(getNextStep()); };
  const handleBack = () => setStep(getPrevStep());

  const buildSubmitData = (): RegistrationData | null => {
    if (!agreedToTerms || !selectedDistance) return null;
    return {
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
    };
  };

  const isLastStep = step === activeSteps[activeSteps.length - 1].id;
  const isFirstStep = step === activeSteps[0].id;

  return {
    user, step, activeSteps,
    selectedDistanceId, setSelectedDistanceId,
    selectedCategory, setSelectedCategory,
    birthYear, setBirthYear, birthMonth, setBirthMonth, birthDay, setBirthDay,
    wantsInsurance, setWantsInsurance,
    merchandiseOrders, updateMerchandise,
    discountCode, setDiscountCode, appliedDiscount, discountError, setDiscountError,
    handleApplyDiscount, handleRemoveDiscount,
    agreedToTerms, setAgreedToTerms,
    agreedToFinalAcceptance, setAgreedToFinalAcceptance,
    wantsTeam, setWantsTeam, teamMode, setTeamMode, teamName, setTeamName,
    selectedExistingTeam, setSelectedExistingTeam, teamNameError, existingTeams,
    selectedVipId, setSelectedVipId, vipCustomFieldValue, setVipCustomFieldValue,
    isProfileComplete, selectedDistance, formCfg,
    hasMerchandise, hasInsurance, hasTeamOption,
    age, insurancePrice, activeVip, distancePrice,
    merchandiseTotal, discountAmount, totalAmount,
    isStepInActiveSteps, canProceed, handleNext, handleBack,
    getFinalTeamName, buildSubmitData, isLastStep, isFirstStep,
  };
};
