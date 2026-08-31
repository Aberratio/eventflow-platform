import {
  getCurrentPrice,
  getVariantPrice,
  calculateInsurancePreview,
  getExistingTeamsForEvent,
  validateDiscountCode,
  validateTeamName,
  getRegistrationsByEvent,
} from '@/api';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Event, EventMerchandise, MerchandiseOrder } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import type { RegistrationData } from '@/components/registration/RegistrationForm';
import { roundToCents } from '@/lib/discountValue';

const currentYear = new Date().getFullYear();

export const useRegistrationForm = (event: Event) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [merchandiseOrders, setMerchandiseOrders] = useState<Map<string, MerchandiseOrder>>(
    new Map(),
  );
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: 'percent' | 'fixed';
    value: number;
  } | null>(null);
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

  // Wariant opłaty (E1.2, step 1-2 of the "Rozliczenie" algorithm)
  const [selectedPricingVariantId, setSelectedPricingVariantId] = useState<string>('');

  // NNW (insurance) — id of the selected catalog InsuranceVariant, '' = none
  const [selectedInsuranceVariantId, setSelectedInsuranceVariantId] = useState<string>('');

  // Profile completeness
  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    return !!(user.birthYear && user.gender);
  }, [user]);

  useEffect(() => {
    const availableDistances = event.distances.filter(
      (distance) => distance.limit == null || distance.registeredCount < distance.limit,
    );

    if (availableDistances.length === 1 && selectedDistanceId !== availableDistances[0].id) {
      setSelectedDistanceId(availableDistances[0].id);
    }
  }, [event.distances, selectedDistanceId]);

  useEffect(() => {
    if (isProfileComplete && user?.birthYear) {
      setBirthYear(String(user.birthYear));
      setBirthMonth('01');
      setBirthDay('01');
    }
  }, [isProfileComplete, user]);

  const selectedDistance = event.distances.find((d) => d.id === selectedDistanceId);
  const formCfg = event.registrationFormConfig;
  const hasMerchandise =
    (formCfg?.collectMerchandise ?? true) &&
    event.enableMerchandiseInRegistration &&
    event.merchandise &&
    event.merchandise.length > 0;

  // Warianty opłaty visible on the public form for the selected distance
  // (office-only variants are for in-person race-office sign-up only — E0.3
  // resolution #13). Empty = distance was never migrated to Warianty; the
  // legacy distance.price/priceTiers pricing applies instead.
  const pricingVariants = useMemo(
    () =>
      (selectedDistance?.pricingVariants ?? []).filter(
        (v) => !v.officeOnly && (v.visibleInPublicForm ?? true),
      ),
    [selectedDistance],
  );

  useEffect(() => {
    if (pricingVariants.length === 1) {
      if (selectedPricingVariantId !== pricingVariants[0].id) {
        setSelectedPricingVariantId(pricingVariants[0].id);
      }
    } else if (pricingVariants.length === 0) {
      if (selectedPricingVariantId !== '') setSelectedPricingVariantId('');
    } else if (!pricingVariants.some((v) => v.id === selectedPricingVariantId)) {
      setSelectedPricingVariantId('');
    }
  }, [pricingVariants, selectedPricingVariantId]);

  const selectedPricingVariant = useMemo(
    () => pricingVariants.find((v) => v.id === selectedPricingVariantId) ?? null,
    [pricingVariants, selectedPricingVariantId],
  );

  // Catalog NNW variants offered by this event (E1.2, resolution #9). Empty
  // means no insurance step at all.
  const insuranceVariants = useMemo(
    () => ((formCfg?.collectInsurance ?? true) ? (event.insuranceVariants ?? []) : []),
    [formCfg?.collectInsurance, event.insuranceVariants],
  );
  const hasInsurance = insuranceVariants.length > 0;
  const singleInsuranceVariant = insuranceVariants.length === 1 ? insuranceVariants[0] : null;

  useEffect(() => {
    if (
      selectedInsuranceVariantId &&
      !insuranceVariants.some((v) => v.id === selectedInsuranceVariantId)
    ) {
      setSelectedInsuranceVariantId('');
    }
  }, [insuranceVariants, selectedInsuranceVariantId]);

  const selectedInsuranceVariant = useMemo(
    () => insuranceVariants.find((v) => v.id === selectedInsuranceVariantId) ?? null,
    [insuranceVariants, selectedInsuranceVariantId],
  );

  /** Convenience for the single-variant checkbox UX ("Chcę wykupić NNW"). */
  const wantsInsurance = selectedInsuranceVariantId !== '';
  const setWantsInsurance = (checked: boolean) => {
    if (singleInsuranceVariant) {
      setSelectedInsuranceVariantId(checked ? singleInsuranceVariant.id : '');
    }
  };

  const isRelayDistance = selectedDistance?.startType === 'relay';
  const relayMaxTeamSize = selectedDistance?.relayMaxTeamSize;
  const relayMinTeamSize = selectedDistance?.relayMinTeamSize;
  const relayTeamCompletionDeadline = selectedDistance?.relayTeamCompletionDeadline;
  const hasTeamOption = (formCfg?.collectTeam ?? true) || isRelayDistance;
  const relayTeamSizeLabel =
    selectedDistance?.relayMinTeamSize && selectedDistance?.relayMaxTeamSize
      ? `${selectedDistance.relayMinTeamSize}-${selectedDistance.relayMaxTeamSize} os.`
      : selectedDistance?.relayMinTeamSize
        ? `od ${selectedDistance.relayMinTeamSize} os.`
        : selectedDistance?.relayMaxTeamSize
          ? `do ${selectedDistance.relayMaxTeamSize} os.`
          : '';

  const { data: eventRegsData } = useQuery({
    queryKey: ['registrations', 'event', event.id],
    queryFn: () => getRegistrationsByEvent(event.id),
    enabled: hasTeamOption,
    select: (r) => r.data ?? [],
  });

  const existingTeams = useMemo(
    () =>
      getExistingTeamsForEvent(eventRegsData ?? [], event.id, selectedDistanceId).filter(
        (team) => !relayMaxTeamSize || team.memberCount < relayMaxTeamSize,
      ),
    [eventRegsData, event.id, selectedDistanceId, relayMaxTeamSize],
  );

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

  useEffect(() => {
    if (isRelayDistance) {
      setWantsTeam(true);
    } else if (!(formCfg?.collectTeam ?? true)) {
      setWantsTeam(false);
    }
  }, [formCfg?.collectTeam, isRelayDistance]);

  useEffect(() => {
    if (
      teamMode === 'join' &&
      selectedExistingTeam &&
      !existingTeams.some((team) => team.name === selectedExistingTeam)
    ) {
      setSelectedExistingTeam('');
    }
  }, [existingTeams, selectedExistingTeam, teamMode]);

  const age = birthYear ? currentYear - parseInt(birthYear) : null;
  const birthDate =
    birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : undefined;

  /**
   * PREVIEW ONLY. NNW premium (step 6): age computed as of the EVENT date
   * (E1.2 resolution #9), not today and not the registration date. The
   * server recomputes and freezes the real amount.
   */
  const insurancePrice = useMemo(() => {
    if (!hasInsurance || !selectedInsuranceVariant || !birthDate) return 0;
    return calculateInsurancePreview(selectedInsuranceVariant, birthDate, event.date);
  }, [hasInsurance, selectedInsuranceVariant, birthDate, event.date]);

  /**
   * PREVIEW ONLY. Steps 1-2 of the "Rozliczenie" algorithm: the selected
   * Wariant's own price + its own tier list. Falls back to the legacy
   * distance-level tiers when the distance has no Warianty configured yet.
   */
  const variantPricePreview = useMemo(() => {
    if (!selectedDistance) return { price: 0, tierName: 'Cena standardowa' };
    if (selectedPricingVariant) {
      return getVariantPrice(selectedPricingVariant, selectedDistance.registeredCount);
    }
    return getCurrentPrice(selectedDistance);
  }, [selectedDistance, selectedPricingVariant]);

  const distancePrice = variantPricePreview.price;

  const merchandiseTotal = useMemo(() => {
    let total = 0;
    merchandiseOrders.forEach((order) => {
      total += order.price;
    });
    return total;
  }, [merchandiseOrders]);

  /** Step 3: discount code bites only the result of step 2, result >= 0. */
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percent')
      return roundToCents(distancePrice * (Number(appliedDiscount.value) / 100));
    return roundToCents(Math.min(Number(appliedDiscount.value), distancePrice));
  }, [appliedDiscount, distancePrice]);

  /**
   * Step 4 placeholder. Modyfikatory (form-field-variant price modifiers)
   * are not built yet (ticket E1.13 / "10") — always zero today, but kept as
   * an explicit line in the breakdown rather than silently absent so the
   * preview UI already has a real (if empty) "Modyfikatory" row, matching
   * the server which reserves the same empty stage.
   */
  const modifiersTotal = 0;

  const totalAmount = Math.max(
    0,
    roundToCents(
      distancePrice - discountAmount + modifiersTotal + merchandiseTotal + insurancePrice,
    ),
  );

  useEffect(() => {
    if (!selectedDistance) return;

    const hasAgeCategories = (selectedDistance.ageCategories?.length ?? 0) > 0;
    if (hasAgeCategories) return;

    const regularCategories = selectedDistance.categories ?? [];
    const selectedBaseCategory = selectedCategory.split(',')[0]?.trim() ?? '';

    if (regularCategories.length === 1 && !selectedBaseCategory) {
      setSelectedCategory(regularCategories[0]);
    } else if (
      regularCategories.length > 0 &&
      selectedBaseCategory &&
      !regularCategories.includes(selectedBaseCategory)
    ) {
      setSelectedCategory(regularCategories.length === 1 ? regularCategories[0] : '');
    }
  }, [selectedDistance, selectedCategory]);

  useEffect(() => {
    if (wantsTeam && teamMode === 'create' && teamName) {
      const result = validateTeamName(teamName);
      setTeamNameError(result.valid ? '' : result.error || '');
    } else {
      setTeamNameError('');
    }
  }, [teamName, wantsTeam, teamMode]);

  const getFinalTeamName = (): string | undefined => {
    if (!wantsTeam) return undefined;
    return teamMode === 'create' ? teamName.trim() || undefined : selectedExistingTeam || undefined;
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

  const updateMerchandise = (
    item: EventMerchandise,
    quantity: number,
    size?: string,
    color?: string,
    colorHex?: string,
  ) => {
    const key = `${item.id}-${size || 'none'}-${color || 'none'}`;
    if (quantity <= 0) {
      const newOrders = new Map(merchandiseOrders);
      newOrders.delete(key);
      setMerchandiseOrders(newOrders);
    } else {
      setMerchandiseOrders(
        new Map(merchandiseOrders).set(key, {
          merchandiseId: item.id,
          merchandiseName: item.name,
          size,
          color,
          colorHex,
          quantity,
          price: item.price * quantity,
        }),
      );
    }
  };

  const getNextStep = () => {
    const idx = activeSteps.findIndex((s) => s.id === step);
    return idx < activeSteps.length - 1 ? activeSteps[idx + 1].id : step;
  };
  const getPrevStep = () => {
    const idx = activeSteps.findIndex((s) => s.id === step);
    return idx > 0 ? activeSteps[idx - 1].id : step;
  };
  const isStepInActiveSteps = (stepId: number) => activeSteps.some((s) => s.id === stepId);

  const canProceed = () => {
    switch (step) {
      case 1: {
        if (!selectedDistanceId) return false;
        if (pricingVariants.length > 1 && !selectedPricingVariantId) return false;
        const dist = event.distances.find((d) => d.id === selectedDistanceId);
        if (dist?.limit != null && dist.registeredCount >= dist.limit) return false;
        return true;
      }
      case 2: {
        if (!birthYear || !birthMonth || !birthDay) return false;
        const dist = event.distances.find((d) => d.id === selectedDistanceId);
        const hasAgeCats = (dist?.ageCategories?.length ?? 0) > 0;
        const hasRegularCats = (dist?.categories?.length ?? 0) > 0;
        if (!hasAgeCats && !hasRegularCats) return true;
        return !!selectedCategory;
      }
      case 25:
        if (isRelayDistance && !wantsTeam) return false;
        if (!wantsTeam) return true;
        if (teamMode === 'create') return teamName.trim().length >= 3 && !teamNameError;
        return !!selectedExistingTeam;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6: {
        const termsOk = agreedToTerms;
        const finalAcceptanceOk = !event.requireFinalAcceptance || agreedToFinalAcceptance;
        return termsOk && finalAcceptanceOk;
      }
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) setStep(getNextStep());
  };
  const handleBack = () => setStep(getPrevStep());

  const buildSubmitData = (): RegistrationData | null => {
    if (!agreedToTerms || !selectedDistance) return null;

    return {
      distanceId: selectedDistanceId,
      distanceName: selectedDistance.name,
      category: selectedCategory,
      birthDate,
      price: distancePrice,
      discountCode: appliedDiscount ? discountCode : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      merchandiseOrders: Array.from(merchandiseOrders.values()),
      merchandise: Array.from(merchandiseOrders.values()).map((order) => ({
        merchandiseId: order.merchandiseId,
        size: order.size,
        color: order.color,
        quantity: order.quantity,
      })),
      insurancePrice: insurancePrice > 0 ? insurancePrice : undefined,
      modifiersTotal,
      totalAmount,
      teamName: getFinalTeamName(),
      pricingVariantId: selectedPricingVariantId || undefined,
      insuranceVariantId: selectedInsuranceVariantId || undefined,
    };
  };

  const isLastStep = step === activeSteps[activeSteps.length - 1].id;
  const isFirstStep = step === activeSteps[0].id;

  return {
    user,
    step,
    activeSteps,
    selectedDistanceId,
    setSelectedDistanceId,
    selectedCategory,
    setSelectedCategory,
    birthYear,
    setBirthYear,
    birthMonth,
    setBirthMonth,
    birthDay,
    setBirthDay,
    wantsInsurance,
    setWantsInsurance,
    merchandiseOrders,
    updateMerchandise,
    discountCode,
    setDiscountCode,
    appliedDiscount,
    discountError,
    setDiscountError,
    handleApplyDiscount,
    handleRemoveDiscount,
    agreedToTerms,
    setAgreedToTerms,
    agreedToFinalAcceptance,
    setAgreedToFinalAcceptance,
    wantsTeam,
    setWantsTeam,
    teamMode,
    setTeamMode,
    teamName,
    setTeamName,
    selectedExistingTeam,
    setSelectedExistingTeam,
    teamNameError,
    existingTeams,
    pricingVariants,
    selectedPricingVariantId,
    setSelectedPricingVariantId,
    selectedPricingVariant,
    variantPricePreview,
    insuranceVariants,
    singleInsuranceVariant,
    selectedInsuranceVariantId,
    setSelectedInsuranceVariantId,
    selectedInsuranceVariant,
    isProfileComplete,
    selectedDistance,
    formCfg,
    hasMerchandise,
    hasInsurance,
    hasTeamOption,
    isRelayDistance,
    relayMinTeamSize,
    relayMaxTeamSize,
    relayTeamCompletionDeadline,
    relayTeamSizeLabel,
    age,
    birthDate,
    insurancePrice,
    distancePrice,
    merchandiseTotal,
    modifiersTotal,
    discountAmount,
    totalAmount,
    isStepInActiveSteps,
    canProceed,
    handleNext,
    handleBack,
    getFinalTeamName,
    buildSubmitData,
    isLastStep,
    isFirstStep,
  };
};
