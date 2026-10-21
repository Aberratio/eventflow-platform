import {
  getCurrentPrice,
  getVariantPrice,
  calculateInsurancePreview,
  getExistingTeamsForEvent,
  validateDiscountCode,
  validateTeamName,
  getRegistrationsByEvent,
  getTeamsForDistance,
  getPublicFormFields,
} from '@/api';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Event,
  EventMerchandise,
  FormFieldAnswerValue,
  MerchandiseOrder,
  RegistrationFormFieldError,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import type { RegistrationData } from '@/components/registration/RegistrationForm';
import { roundToCents } from '@/lib/discountValue';
import {
  answersToSubmit,
  formStepFields,
  identityToSubmit,
  modifierPreviewTotal,
  mapServerFieldErrors,
  validateFormFieldAnswers,
  visibleCustomFields,
  visibleIdentityFields,
} from '@/lib/formFields';

const currentYear = new Date().getFullYear();

/**
 * E7.2 (issue 23 Answer §1, "link do zaproszenia dla pozostałych miejsc"):
 * the resolved target of a `?joinTeam={teamId}&invite={token}` invitation link — already
 * validated (exists, belongs to this event, not full) by the caller
 * (`EventRegistrationPage`, via `getTeamById`) before this hook ever sees
 * it. Applying it here only pre-fills the form's own state (distance +
 * "join this team"); the actual join is still fully re-validated by the
 * server at submit time (RegistrationRepository::resolveTeamForRegistration).
 * PP.54: `inviteToken` is the captain's secret from the link; the server
 * refuses to let anyone join someone else's team without it, so it is sent
 * as `teamInviteToken` whenever this invited team is the one being joined.
 */
export interface InitialTeamJoin {
  teamId: string;
  distanceId: string;
  inviteToken: string;
}

/**
 * PP.44: the Zawodnik under the caller's Opieka being registered ("Zapisuję kogoś innego").
 * When given, the personal-data step is filled from THIS person, never from the logged-in Konto.
 */
export interface RegistrationParticipant {
  /** Zawodnik id (competitorId) — also used by the page as the form's React key. */
  key: string;
  /** "Imię Nazwisko" of the ward, for display and the transfer-title preview. */
  name: string;
  /** `YYYY-MM-DD` (competitors.birth_date) when known. */
  birthDate?: string;
  gender?: 'M' | 'K';
}

export const useRegistrationForm = (
  event: Event,
  initialTeamJoin?: InitialTeamJoin | null,
  ward?: RegistrationParticipant | null,
) => {
  const { user } = useAuth();
  const wardKey = ward?.key ?? null;
  const wardBirthDate = ward?.birthDate ?? '';
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
  // E7.5 (issue 23 Answer §7): the captain's manually declared Kategoria
  // specjalna for a brand-new Drużyna — only sent to the server together
  // with `createTeam`, never re-derived from the roster.
  const [teamSpecialCategory, setTeamSpecialCategory] = useState('');

  // Wariant opłaty (E1.2, step 1-2 of the "Rozliczenie" algorithm)
  const [selectedPricingVariantId, setSelectedPricingVariantId] = useState<string>('');

  // NNW (insurance) — id of the selected catalog InsuranceVariant, '' = none
  const [selectedInsuranceVariantId, setSelectedInsuranceVariantId] = useState<string>('');

  // Profile completeness
  const isProfileComplete = useMemo(() => {
    if (ward) return /^\d{4}-\d{2}-\d{2}/.test(ward.birthDate ?? '');
    if (!user) return false;
    return !!(user.birthYear && user.gender);
  }, [ward, user]);

  useEffect(() => {
    // E7.2: an invitation link already dictates the distance — don't let the
    // "only one distance available" convenience auto-select fight it.
    if (initialTeamJoin) return;
    const availableDistances = event.distances.filter(
      (distance) => distance.limit == null || distance.registeredCount < distance.limit,
    );

    if (availableDistances.length === 1 && selectedDistanceId !== availableDistances[0].id) {
      setSelectedDistanceId(availableDistances[0].id);
    }
  }, [event.distances, selectedDistanceId, initialTeamJoin]);

  // E7.2: apply the invitation link's target exactly once — after this, the
  // invitee can still freely change distance/team mode like anyone else
  // (this only sets the initial defaults, it never re-forces them).
  const appliedInitialTeamJoinRef = useRef(false);
  useEffect(() => {
    if (!initialTeamJoin || appliedInitialTeamJoinRef.current) return;
    appliedInitialTeamJoinRef.current = true;
    setSelectedDistanceId(initialTeamJoin.distanceId);
    setWantsTeam(true);
    setTeamMode('join');
    setSelectedExistingTeam(initialTeamJoin.teamId);
  }, [initialTeamJoin]);

  useEffect(() => {
    if (wardKey !== null) {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(wardBirthDate);
      if (match) {
        setBirthYear(match[1]);
        setBirthMonth(match[2]);
        setBirthDay(match[3]);
      }
      return;
    }
    if (isProfileComplete && user?.birthYear) {
      setBirthYear(String(user.birthYear));
      setBirthMonth('01');
      setBirthDay('01');
    }
  }, [wardKey, wardBirthDate, isProfileComplete, user]);

  const participant = useMemo(
    () =>
      ward
        ? {
            name: ward.name,
            birthYear: ward.birthDate ? parseInt(ward.birthDate.slice(0, 4), 10) : undefined,
            gender: ward.gender,
          }
        : { name: user?.name ?? '', birthYear: user?.birthYear, gender: user?.gender },
    [ward, user],
  );

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

  // E1.13: the organizer-configured form. The public route lists every non-hidden position
  // in the order the organizer set; this form renders the custom ones. A failed load simply
  // leaves the fixed fields (the registration must not depend on this optional list).
  const { data: publicFormFields } = useQuery({
    // R-04: the form of the chosen distance (event form + its overrides + its own fields).
    queryKey: ['form-fields', 'public', event.id, selectedDistanceId],
    queryFn: () => getPublicFormFields(event.id, selectedDistanceId || undefined),
    select: (r) => r.data ?? [],
    retry: false,
  });
  const customFormFields = useMemo(() => visibleCustomFields(publicFormFields), [publicFormFields]);
  // B-07: identity system positions (phone, club, ..., anonymization) by their tri-state.
  const identityFormFields = useMemo(
    () => visibleIdentityFields(publicFormFields),
    [publicFormFields],
  );
  const stepFormFields = useMemo(() => formStepFields(publicFormFields), [publicFormFields]);
  const [formFieldAnswers, setFormFieldAnswers] = useState<Record<string, FormFieldAnswerValue>>(
    {},
  );
  // B-07: messages from a 422 `registration_form_invalid`, by form-field id; cleared per field on edit.
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const setFormFieldAnswer = (fieldId: string, value: FormFieldAnswerValue) => {
    setFormFieldAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setServerFieldErrors((prev) => {
      if (!(fieldId in prev)) return prev;
      const { [fieldId]: _dropped, ...rest } = prev;
      return rest;
    });
  };
  const formFieldErrors = useMemo(
    () => validateFormFieldAnswers(stepFormFields, formFieldAnswers),
    [stepFormFields, formFieldAnswers],
  );

  const { data: eventRegsData } = useQuery({
    queryKey: ['registrations', 'event', event.id],
    queryFn: () => getRegistrationsByEvent(event.id),
    // E7.1: only the legacy, non-relay `collectTeam` classification path
    // still needs this (grouping registrations by their free-text
    // `teamName`) — a relay Dystans reads real Drużyny from
    // `getTeamsForDistance` below instead.
    enabled: hasTeamOption && !isRelayDistance,
    select: (r) => r.data ?? [],
  });

  // E7.1 (issue 23 Answer §1): for a relay Dystans, "which teams can I
  // join" is now a server-validated read (real `teams` rows + derived
  // completeness) rather than the client grouping registrations by a raw
  // text label — the server is the actual source of truth once
  // RegistrationRepository::create() validates a join against it.
  const { data: relayTeamsData } = useQuery({
    queryKey: ['teams', 'distance', event.id, selectedDistanceId],
    queryFn: () => getTeamsForDistance(event.id, selectedDistanceId),
    enabled: hasTeamOption && isRelayDistance && !!selectedDistanceId,
    select: (r) => r.data ?? [],
  });

  const existingTeams = useMemo((): Array<{
    id?: string;
    name: string;
    memberCount: number;
  }> => {
    if (isRelayDistance) {
      // PP.54: the server only lets a Zapis into a team through the captain's invitation, or the
      // captain themself — so the picker offers only the user's own teams plus the invited team.
      const invitedTeamId = initialTeamJoin?.teamId;
      return (relayTeamsData ?? [])
        .filter(
          (team) =>
            (!!team.createdByUserId && team.createdByUserId === user?.id) ||
            team.id === invitedTeamId,
        )
        .filter((team) => team.maxSize === null || team.memberCount < team.maxSize)
        .map((team) => ({ id: team.id, name: team.name, memberCount: team.memberCount }));
    }
    return getExistingTeamsForEvent(eventRegsData ?? [], event.id, selectedDistanceId).filter(
      (team) => !relayMaxTeamSize || team.memberCount < relayMaxTeamSize,
    );
  }, [
    isRelayDistance,
    relayTeamsData,
    eventRegsData,
    event.id,
    selectedDistanceId,
    relayMaxTeamSize,
    initialTeamJoin?.teamId,
    user?.id,
  ]);

  // Build steps dynamically
  const activeSteps = useMemo(() => {
    const steps: Array<{ id: number; name: string }> = [
      { id: 1, name: 'Dystans' },
      { id: 2, name: 'Dane' },
    ];
    if (stepFormFields.length > 0) steps.push({ id: 26, name: 'Formularz' });
    if (hasTeamOption) steps.push({ id: 25, name: 'Drużyna' });
    if (hasInsurance) steps.push({ id: 3, name: 'Ubezpieczenie' });
    if (hasMerchandise) steps.push({ id: 4, name: 'Gadżety' });
    steps.push({ id: 5, name: 'Rabat' });
    steps.push({ id: 6, name: 'Podsumowanie' });
    return steps;
  }, [hasTeamOption, hasInsurance, hasMerchandise, stepFormFields.length]);

  useEffect(() => {
    if (isRelayDistance) {
      setWantsTeam(true);
    } else if (!(formCfg?.collectTeam ?? true)) {
      setWantsTeam(false);
    }
  }, [formCfg?.collectTeam, isRelayDistance]);

  // E7.2: whether the relevant "which teams exist" query has actually
  // resolved at least once — guards the clearing effect below so a
  // selection made before that first response lands (in particular, the
  // invitation-link pre-selection above, which sets a team id before its
  // own list request has had a chance to complete) isn't wiped out just
  // because the list looked empty for one render.
  const existingTeamsLoaded = isRelayDistance
    ? relayTeamsData !== undefined
    : eventRegsData !== undefined;

  useEffect(() => {
    if (
      existingTeamsLoaded &&
      teamMode === 'join' &&
      selectedExistingTeam &&
      !existingTeams.some((team) =>
        isRelayDistance ? team.id === selectedExistingTeam : team.name === selectedExistingTeam,
      )
    ) {
      setSelectedExistingTeam('');
    }
  }, [existingTeams, existingTeamsLoaded, selectedExistingTeam, teamMode, isRelayDistance]);

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
   * Step 4 preview: the variant prices of the choices made so far (`options[].price` from
   * the public form fields, may be negative). Display-only — the server computes the binding
   * Modyfikatory and total; the success page renders its `settlementItems`.
   */
  const modifiersTotal = roundToCents(modifierPreviewTotal(customFormFields, formFieldAnswers));

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

  // E7.5: a stale selection could otherwise survive a mode/distance switch
  // and get silently resubmitted against a different Dystans's (different)
  // configured list — clear it whenever it's no longer the "create a team"
  // path, or the distance (and therefore the configured list) changes.
  useEffect(() => {
    if (!wantsTeam || teamMode !== 'create') {
      if (teamSpecialCategory) setTeamSpecialCategory('');
    }
  }, [wantsTeam, teamMode, teamSpecialCategory]);

  useEffect(() => {
    setTeamSpecialCategory('');
  }, [selectedDistanceId]);

  const getFinalTeamName = (): string | undefined => {
    if (!wantsTeam) return undefined;
    if (teamMode === 'create') return teamName.trim() || undefined;
    // E7.1: for a relay Dystans `selectedExistingTeam` now holds the real
    // team id (see existingTeams above), not its label — resolve the label
    // back out for display purposes. The server ignores this field anyway
    // once `teamId` is set (RegistrationRepository::resolveTeamForRegistration
    // derives the name from the real team, never from client-sent text).
    if (isRelayDistance) {
      return existingTeams.find((team) => team.id === selectedExistingTeam)?.name;
    }
    return selectedExistingTeam || undefined;
  };

  /**
   * E7.1: the real server-assigned team id to join — only meaningful for a
   * relay Dystans, where `existingTeams` is backed by real `teams` rows
   * (see `getTeamsForDistance` above). The unrelated, non-relay
   * `collectTeam` classification path never sends a `teamId` — it keeps
   * working exactly as before, a plain `teamName` string.
   */
  const getFinalTeamId = (): string | undefined => {
    if (!wantsTeam || teamMode !== 'join' || !isRelayDistance) return undefined;
    return selectedExistingTeam || undefined;
  };

  /**
   * E7.1: explicit "create a new Drużyna" intent, sent to the server only
   * for a relay Dystans — see `CreateRegistrationPayload.createTeam`'s own
   * docblock for why this flag (not just a non-empty `teamName`) is what
   * the server keys team creation off of.
   */
  const getCreateTeamFlag = (): boolean => wantsTeam && teamMode === 'create' && isRelayDistance;

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
      case 26:
        return Object.keys(formFieldErrors).length === 0;
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

  /**
   * B-07: puts the server's per-field messages next to their fields and returns the user to the
   * step that holds the first offending field. Returns the entries that match no field.
   */
  const applyServerFieldErrors = (errors: RegistrationFormFieldError[]) => {
    const { byFieldId, unmatched } = mapServerFieldErrors(publicFormFields ?? [], errors);
    setServerFieldErrors(byFieldId);
    const firstId = Object.keys(byFieldId)[0];
    if (firstId) {
      const inFormStep = stepFormFields.some((f) => f.id === firstId);
      setStep(inFormStep ? 26 : 2);
    }
    return unmatched;
  };

  const handleNext = () => {
    if (canProceed()) setStep(getNextStep());
  };
  const handleBack = () => setStep(getPrevStep());

  /**
   * The form as filled in so far, as `RegistrationData`. Unlike `buildSubmitData` it does not need the
   * terms to be accepted, so the summary can ask the server for a price (B-02) before the final tick.
   */
  const buildRegistrationData = (): RegistrationData | null => {
    if (!selectedDistance) return null;

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
      formFieldAnswers: answersToSubmit(customFormFields, formFieldAnswers),
      identity: identityToSubmit(identityFormFields, formFieldAnswers),
      teamName: getFinalTeamName(),
      teamId: getFinalTeamId(),
      teamInviteToken:
        initialTeamJoin && getFinalTeamId() === initialTeamJoin.teamId
          ? initialTeamJoin.inviteToken
          : undefined,
      createTeam: getCreateTeamFlag() || undefined,
      teamSpecialCategory: getCreateTeamFlag() ? teamSpecialCategory || undefined : undefined,
      pricingVariantId: selectedPricingVariantId || undefined,
      insuranceVariantId: selectedInsuranceVariantId || undefined,
    };
  };

  const buildSubmitData = (): RegistrationData | null =>
    agreedToTerms ? buildRegistrationData() : null;

  const isLastStep = step === activeSteps[activeSteps.length - 1].id;
  const isFirstStep = step === activeSteps[0].id;

  return {
    user,
    participant,
    isWard: Boolean(ward),
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
    teamSpecialCategory,
    setTeamSpecialCategory,
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
    // E7.2: true whenever this render was reached via a `?joinTeam=`
    // invitation link — used purely for the "you're joining via invite
    // link" banner text, never to change validation (the join is still
    // fully server-validated at submit time regardless of this flag).
    hasInvitationLink: Boolean(initialTeamJoin),
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
    customFormFields,
    identityFormFields,
    stepFormFields,
    serverFieldErrors,
    applyServerFieldErrors,
    formFieldAnswers,
    setFormFieldAnswer,
    formFieldErrors,
    isStepInActiveSteps,
    canProceed,
    handleNext,
    handleBack,
    getFinalTeamName,
    getFinalTeamId,
    getCreateTeamFlag,
    buildRegistrationData,
    buildSubmitData,
    isLastStep,
    isFirstStep,
  };
};
