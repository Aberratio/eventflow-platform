import {
  createEvent,
  getEventById,
  getOrganizerEventLimit,
  getOrganizers,
  mockEvents,
  updateEvent,
} from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Event,
  SportDiscipline,
  BannerCropArea,
  PaymentConfigType,
  AgeCategory,
  SpecialCategory,
  DistanceRouteFile,
  RegistrationFormConfig,
  EventDisplayOptions,
  OrganizerEventLimit,
} from '@/types';

export interface DistanceFormData {
  id: string;
  name: string;
  length: string;
  unit: 'km' | 'm';
  price: string;
  limit: string;
  disabledCategoryIds: string[];
  routeMapUrl: string;
  routeElevationProfile: string;
  routeGpxUrl: string;
  routeFiles: DistanceRouteFile[];
}

const DEFAULT_FORM_CONFIG: RegistrationFormConfig = {
  collectPhone: true,
  collectClub: true,
  collectBirthDate: true,
  collectTeam: true,
  collectInsurance: true,
  collectMerchandise: true,
  customFields: [],
};

const DEFAULT_DISPLAY_OPTIONS: EventDisplayOptions = {
  defaultSort: 'name',
  uppercaseNames: false,
  hideUnpaid: false,
};

export const useEventFormState = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  const [existingEvent, setExistingEvent] = useState<Event | null>(
    isEditing ? mockEvents.find((e) => e.id === id) ?? null : null,
  );
  const canChooseOrganizer =
    user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';
  const canManageFeatured = canChooseOrganizer;
  const [organizers, setOrganizers] = useState(
    canChooseOrganizer ? [] : user?.role === 'organizer' && user ? [user] : [],
  );
  const [selectedOrganizerId, setSelectedOrganizerId] = useState(
    existingEvent?.organizerId || (user?.role === 'organizer' ? user.id : ''),
  );
  const [eventLimit, setEventLimit] = useState<OrganizerEventLimit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [step, setStep] = useState(1);

  // Step 1 - Basic info
  const [name, setName] = useState(existingEvent?.name || '');
  const [discipline, setDiscipline] = useState<SportDiscipline>(
    existingEvent?.discipline || 'running',
  );
  const [date, setDate] = useState(existingEvent?.date || '');
  const [registrationDeadline, setRegistrationDeadline] = useState(
    existingEvent?.registrationDeadline || '',
  );
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [city, setCity] = useState(existingEvent?.city || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [imageUrl, setImageUrl] = useState(existingEvent?.imageUrl || '');
  const [featured, setFeatured] = useState(existingEvent?.featured || false);

  // Virtual event
  const [isVirtual, setIsVirtual] = useState(existingEvent?.isVirtual || false);
  const [startDate, setStartDate] = useState(existingEvent?.startDate || '');
  const [endDate, setEndDate] = useState(existingEvent?.endDate || '');

  // Private event
  const [isPrivate, setIsPrivate] = useState(existingEvent?.isPrivate || false);
  const [accessCode, setAccessCode] = useState(existingEvent?.accessCode || '');

  // Media
  const [bannerUrl, setBannerUrl] = useState(existingEvent?.bannerUrl || '');
  const [bannerCropArea, setBannerCropArea] = useState<BannerCropArea | undefined>(
    existingEvent?.bannerCropArea,
  );
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState(existingEvent?.organizerLogoUrl || '');
  const [showBannerCropper, setShowBannerCropper] = useState(false);

  // Payment
  const [paymentConfigType, setPaymentConfigType] = useState<PaymentConfigType>(
    existingEvent?.paymentConfig?.type || 'admin_gateway',
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    existingEvent?.paymentConfig?.bankAccountNumber || '',
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    existingEvent?.paymentConfig?.bankAccountHolder || '',
  );
  const [transferTitle, setTransferTitle] = useState(
    existingEvent?.paymentConfig?.transferTitle || 'OpĹ‚ata za {eventName} - {participantName}',
  );

  // Rich text
  const [organizersHtml, setOrganizersHtml] = useState(existingEvent?.organizersHtml || '');
  const [rulesHtml, setRulesHtml] = useState(existingEvent?.rulesHtml || '');
  const [requireFinalAcceptance, setRequireFinalAcceptance] = useState(
    existingEvent?.requireFinalAcceptance || false,
  );
  const [finalAcceptanceHtml, setFinalAcceptanceHtml] = useState(
    existingEvent?.finalAcceptanceHtml || '',
  );

  // Registration mode
  const [registrationMode, setRegistrationMode] = useState<'internal' | 'external_embed'>(
    existingEvent?.registrationEmbed?.mode || 'internal',
  );
  const [externalRegistrationUrl, setExternalRegistrationUrl] = useState(
    existingEvent?.registrationEmbed?.externalUrl || '',
  );
  const [embedStartDate, setEmbedStartDate] = useState(
    existingEvent?.registrationEmbed?.startDate || '',
  );
  const [embedEndDate, setEmbedEndDate] = useState(existingEvent?.registrationEmbed?.endDate || '');

  // Form config
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig>(
    existingEvent?.registrationFormConfig || DEFAULT_FORM_CONFIG,
  );

  // Display options
  const [displayOptions, setDisplayOptions] = useState<EventDisplayOptions>(
    existingEvent?.displayOptions || DEFAULT_DISPLAY_OPTIONS,
  );

  // Categories
  const getEventYear = () => {
    return date
      ? parseInt(date.substring(0, 4)) || new Date().getFullYear()
      : new Date().getFullYear();
  };

  const generateStandardAgeCategories = (): AgeCategory[] => {
    const eventYear = getEventYear();
    const ranges = [
      { label: '18-29', from: eventYear - 29, to: eventYear - 18 },
      { label: '30-39', from: eventYear - 39, to: eventYear - 30 },
      { label: '40-49', from: eventYear - 49, to: eventYear - 40 },
      { label: '50-59', from: eventYear - 59, to: eventYear - 50 },
      { label: '60+', from: eventYear - 100, to: eventYear - 60 },
    ];
    const categories: AgeCategory[] = [];
    for (const gender of ['K', 'M'] as const) {
      for (const r of ranges) {
        categories.push({
          id: `cat-${gender}-${r.label}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${gender}${r.label}`,
          gender,
          birthYearFrom: r.from,
          birthYearTo: r.to,
        });
      }
    }
    return categories;
  };

  const existingAgeCats = existingEvent?.distances?.[0]?.ageCategories;
  const existingSpecialCats = existingEvent?.distances?.[0]?.specialCategories;

  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(
    existingAgeCats && existingAgeCats.length > 0
      ? existingAgeCats
      : generateStandardAgeCategories(),
  );
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>(
    existingSpecialCats || [],
  );

  // Distances
  const [distances, setDistances] = useState<DistanceFormData[]>(
    existingEvent?.distances.map((d) => ({
      id: d.id,
      name: d.name,
      length: d.length.toString(),
      unit: d.unit,
      price: d.price.toString(),
      limit: d.limit?.toString() || '',
      disabledCategoryIds: [],
      routeMapUrl: d.routeMapUrl || '',
      routeElevationProfile: d.routeElevationProfile || '',
      routeGpxUrl: d.routeGpxUrl || '',
      routeFiles: d.routeFiles || [],
    })) || [],
  );

  useEffect(() => {
    if (!isEditing || !id) return;
    getEventById(id)
      .then((response) => {
        if (response.data) setExistingEvent(response.data);
      })
      .catch(() => undefined);
  }, [id, isEditing]);

  useEffect(() => {
    if (!existingEvent) return;

    setSelectedOrganizerId(existingEvent.organizerId);
    setName(existingEvent.name || '');
    setDiscipline(existingEvent.discipline || 'running');
    setDate(existingEvent.date || '');
    setRegistrationDeadline(existingEvent.registrationDeadline || '');
    setLocation(existingEvent.location || '');
    setCity(existingEvent.city || '');
    setDescription(existingEvent.description || '');
    setImageUrl(existingEvent.imageUrl || '');
    setFeatured(existingEvent.featured || false);
    setIsVirtual(existingEvent.isVirtual || false);
    setStartDate(existingEvent.startDate || '');
    setEndDate(existingEvent.endDate || '');
    setIsPrivate(existingEvent.isPrivate || false);
    setAccessCode(existingEvent.accessCode || '');
    setBannerUrl(existingEvent.bannerUrl || '');
    setBannerCropArea(existingEvent.bannerCropArea);
    setOrganizerLogoUrl(existingEvent.organizerLogoUrl || '');
    setPaymentConfigType(existingEvent.paymentConfig?.type || 'admin_gateway');
    setBankAccountNumber(existingEvent.paymentConfig?.bankAccountNumber || '');
    setBankAccountHolder(existingEvent.paymentConfig?.bankAccountHolder || '');
    setTransferTitle(
      existingEvent.paymentConfig?.transferTitle || 'OpĹ‚ata za {eventName} - {participantName}',
    );
    setOrganizersHtml(existingEvent.organizersHtml || '');
    setRulesHtml(existingEvent.rulesHtml || '');
    setRequireFinalAcceptance(existingEvent.requireFinalAcceptance || false);
    setFinalAcceptanceHtml(existingEvent.finalAcceptanceHtml || '');
    setRegistrationMode(existingEvent.registrationEmbed?.mode || 'internal');
    setExternalRegistrationUrl(existingEvent.registrationEmbed?.externalUrl || '');
    setEmbedStartDate(existingEvent.registrationEmbed?.startDate || '');
    setEmbedEndDate(existingEvent.registrationEmbed?.endDate || '');
    setFormConfig(existingEvent.registrationFormConfig || DEFAULT_FORM_CONFIG);
    setDisplayOptions(existingEvent.displayOptions || DEFAULT_DISPLAY_OPTIONS);
    setAgeCategories(
      existingEvent.distances?.[0]?.ageCategories?.length
        ? existingEvent.distances[0].ageCategories
        : generateStandardAgeCategories(),
    );
    setSpecialCategories(existingEvent.distances?.[0]?.specialCategories || []);
    setDistances(
      existingEvent.distances.map((d) => ({
        id: d.id,
        name: d.name,
        length: d.length.toString(),
        unit: d.unit,
        price: d.price.toString(),
        limit: d.limit?.toString() || '',
        disabledCategoryIds: [],
        routeMapUrl: d.routeMapUrl || '',
        routeElevationProfile: d.routeElevationProfile || '',
        routeGpxUrl: d.routeGpxUrl || '',
        routeFiles: d.routeFiles || [],
      })),
    );
  }, [existingEvent]);

  useEffect(() => {
    if (!canChooseOrganizer) return;
    getOrganizers()
      .then((response) => {
        setOrganizers(response.data);
        if (!selectedOrganizerId && response.data[0]) {
          setSelectedOrganizerId(response.data[0].id);
        }
      })
      .catch(() => undefined);
  }, [canChooseOrganizer, selectedOrganizerId]);

  useEffect(() => {
    if (canChooseOrganizer || user?.role !== 'organizer') return;
    setOrganizers([user]);
    if (!selectedOrganizerId) {
      setSelectedOrganizerId(user.id);
    }
  }, [canChooseOrganizer, selectedOrganizerId, user]);

  useEffect(() => {
    if (!selectedOrganizerId) {
      setEventLimit(null);
      return;
    }
    getOrganizerEventLimit(selectedOrganizerId)
      .then((response) => setEventLimit(response.data))
      .catch(() => setEventLimit(null));
  }, [selectedOrganizerId]);

  // Distance handlers
  const addDistance = () => {
    setDistances((prev) => [
      ...prev,
      {
        id: `dist-${Date.now()}`,
        name: '',
        length: '',
        unit: 'km',
        price: '',
        limit: '',
        disabledCategoryIds: [],
        routeMapUrl: '',
        routeElevationProfile: '',
        routeGpxUrl: '',
        routeFiles: [],
      },
    ]);
  };

  const removeDistance = (index: number) => {
    setDistances((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDistance = (
    index: number,
    field: keyof DistanceFormData,
    value: string | string[] | DistanceRouteFile[],
  ) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRouteFile = (distIndex: number) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: [
          ...updated[distIndex].routeFiles,
          { id: `rf-${Date.now()}`, name: '', type: 'image', url: '' },
        ],
      };
      return updated;
    });
  };

  const removeRouteFile = (distIndex: number, fileId: string) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: updated[distIndex].routeFiles.filter((f) => f.id !== fileId),
      };
      return updated;
    });
  };

  const updateRouteFile = (
    distIndex: number,
    fileId: string,
    field: keyof DistanceRouteFile,
    value: string,
  ) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: updated[distIndex].routeFiles.map((f) =>
          f.id === fileId ? { ...f, [field]: value } : f,
        ),
      };
      return updated;
    });
  };

  const toggleCategoryForDistance = (distIndex: number, categoryId: string) => {
    setDistances((prev) => {
      const updated = [...prev];
      const dist = updated[distIndex];
      const disabled = dist.disabledCategoryIds.includes(categoryId)
        ? dist.disabledCategoryIds.filter((id) => id !== categoryId)
        : [...dist.disabledCategoryIds, categoryId];
      updated[distIndex] = { ...dist, disabledCategoryIds: disabled };
      return updated;
    });
  };

  // Category handlers
  const addAgeCategory = () => {
    const eventYear = getEventYear();
    setAgeCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        name: '',
        gender: 'M',
        birthYearFrom: eventYear - 39,
        birthYearTo: eventYear - 30,
      },
    ]);
  };

  const removeAgeCategory = (catIndex: number) => {
    const removedId = ageCategories[catIndex].id;
    setAgeCategories((prev) => prev.filter((_, i) => i !== catIndex));
    setDistances((prev) =>
      prev.map((d) => ({
        ...d,
        disabledCategoryIds: d.disabledCategoryIds.filter((id) => id !== removedId),
      })),
    );
  };

  const updateAgeCategory = (
    catIndex: number,
    field: keyof AgeCategory,
    value: string | number,
  ) => {
    setAgeCategories((prev) => {
      const cats = [...prev];
      cats[catIndex] = { ...cats[catIndex], [field]: value };
      return cats;
    });
  };

  const applyStandardTemplate = () => setAgeCategories(generateStandardAgeCategories());

  const addSpecialCategory = () => {
    setSpecialCategories((prev) => [
      ...prev,
      { id: `scat-${Date.now()}`, name: '', description: '' },
    ]);
  };

  const removeSpecialCategory = (catIndex: number) => {
    const removedId = specialCategories[catIndex].id;
    setSpecialCategories((prev) => prev.filter((_, i) => i !== catIndex));
    setDistances((prev) =>
      prev.map((d) => ({
        ...d,
        disabledCategoryIds: d.disabledCategoryIds.filter((id) => id !== removedId),
      })),
    );
  };

  const updateSpecialCategory = (catIndex: number, field: keyof SpecialCategory, value: string) => {
    setSpecialCategories((prev) => {
      const cats = [...prev];
      cats[catIndex] = { ...cats[catIndex], [field]: value };
      return cats;
    });
  };

  // Validation
  const validateStep1 = (): boolean => {
    if (!name || !date || !registrationDeadline) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'WypeĹ‚nij wszystkie wymagane pola',
        variant: 'destructive',
      });
      return false;
    }
    if (registrationDeadline > date) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Termin rejestracji nie moze byc pozniejszy niz data wydarzenia',
        variant: 'destructive',
      });
      return false;
    }
    if (!isVirtual && (!location || !city)) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'WypeĹ‚nij lokalizacjÄ™ i miasto',
        variant: 'destructive',
      });
      return false;
    }
    if (isVirtual && startDate > endDate) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Data rozpoczecia okna wirtualnego nie moze byc pozniejsza niz data zakonczenia',
        variant: 'destructive',
      });
      return false;
    }
    if (isPrivate && !accessCode.trim()) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Podaj kod dostepu dla wydarzenia prywatnego',
        variant: 'destructive',
      });
      return false;
    }
    if (isVirtual && (!startDate || !endDate)) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'WypeĹ‚nij daty rozpoczÄ™cia i zakoĹ„czenia okna wirtualnego',
        variant: 'destructive',
      });
      return false;
    }
    if (registrationMode === 'external_embed') {
      const trimmedUrl = externalRegistrationUrl.trim();
      if (!trimmedUrl) {
        toast({
          title: 'BĹ‚Ä…d',
          description: 'Podaj link do zewnetrznego formularza zapisow.',
          variant: 'destructive',
        });
        return false;
      }
      try {
        const parsedUrl = new URL(trimmedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Unsupported protocol');
        }
      } catch {
        toast({
          title: 'BĹ‚Ä…d',
          description: 'Link do zewnetrznego formularza musi byc pelnym adresem http lub https.',
          variant: 'destructive',
        });
        return false;
      }
    }
    if (
      paymentConfigType === 'organizer_bank' &&
      (!bankAccountNumber.trim() || !bankAccountHolder.trim())
    ) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Podaj numer konta i wĹ‚aĹ›ciciela dla pĹ‚atnoĹ›ci przelewem bankowym',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (distances.length === 0) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Dodaj przynajmniej jeden dystans',
        variant: 'destructive',
      });
      return false;
    }
    for (const dist of distances) {
      if (!dist.name || !dist.length || !dist.price) {
        toast({
          title: 'BĹ‚Ä…d',
          description: 'WypeĹ‚nij wszystkie pola dystansĂłw',
          variant: 'destructive',
        });
        return false;
      }
      if (Number(dist.length) <= 0 || Number(dist.price) < 0) {
        toast({
          title: 'BĹ‚Ä…d',
          description: 'Dlugosc dystansu musi byc dodatnia, a cena nie moze byc ujemna',
          variant: 'destructive',
        });
        return false;
      }
      if (dist.limit && Number(dist.limit) <= 0) {
        toast({
          title: 'BĹ‚Ä…d',
          description: 'Limit uczestnikow musi byc dodatni albo pusty',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const buildPayload = () => {
    const organizer = organizers.find((o) => o.id === selectedOrganizerId) || user;
    const payload = {
      name,
      slug: generateSlug(name),
      discipline,
      date,
      location,
      city,
      description,
      imageUrl,
      distances: distances.map((dist) => ({
        id: dist.id,
        name: dist.name,
        length: Number(dist.length),
        unit: dist.unit,
        price: Number(dist.price),
        limit: dist.limit ? Number(dist.limit) : undefined,
        registeredCount:
          existingEvent?.distances.find((d) => d.id === dist.id)?.registeredCount || 0,
        categories: allCategories
          .filter((cat) => !dist.disabledCategoryIds.includes(cat.id))
          .map((cat) => cat.name),
        ageCategories,
        specialCategories,
        routeMapUrl: dist.routeMapUrl || undefined,
        routeElevationProfile: dist.routeElevationProfile || undefined,
        routeGpxUrl: dist.routeGpxUrl || undefined,
        routeFiles: dist.routeFiles,
      })),
      organizerId: selectedOrganizerId,
      organizerName: organizer?.companyName || organizer?.name || '',
      registrationDeadline,
      bannerUrl: bannerUrl || undefined,
      bannerCropArea,
      organizerLogoUrl: organizerLogoUrl || undefined,
      isVirtual,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentConfig: {
        type: paymentConfigType,
        bankAccountNumber: bankAccountNumber || undefined,
        bankAccountHolder: bankAccountHolder || undefined,
        transferTitle: transferTitle || undefined,
      },
      organizersHtml,
      rulesHtml,
      finalAcceptanceHtml,
      requireFinalAcceptance,
      isPrivate,
      accessCode: accessCode || undefined,
      registrationEmbed: {
        enabled: registrationMode === 'external_embed',
        mode: registrationMode,
        externalUrl:
          registrationMode === 'external_embed' ? externalRegistrationUrl.trim() : undefined,
        startDate: embedStartDate || undefined,
        endDate: embedEndDate || undefined,
      },
      registrationFormConfig: formConfig,
      displayOptions,
    };
    return canManageFeatured ? { ...payload, featured } : payload;
  };

  const selectedEventLimit = eventLimit;

  const handleSubmit = async () => {
    if (!selectedOrganizerId) {
      toast({
        title: 'BĹ‚Ä…d',
        description: 'Wybierz organizatora wydarzenia',
        variant: 'destructive',
      });
      return;
    }
    if (!isEditing && selectedEventLimit && selectedEventLimit.available <= 0) {
      toast({
        title: 'Limit wydarzeń wyczerpany',
        description: 'Organizator nie ma wolnego miejsca na kolejne wydarzenie.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      let saved: Event;
      if (isEditing && id) {
        const response = await updateEvent(id, payload);
        if (!response.success) {
          throw new Error(response.message || 'Nie udało się zapisać wydarzenia.');
        }
        saved = response.data;
      } else {
        const response = await createEvent(payload);
        if (!response.success) {
          throw new Error(response.message || 'Nie udało się utworzyć wydarzenia.');
        }
        saved = response.data;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organizer-events', selectedOrganizerId] }),
        queryClient.invalidateQueries({ queryKey: ['organizer-event-limit', selectedOrganizerId] }),
        queryClient.invalidateQueries({ queryKey: ['event', saved.id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);

      toast({
        title: isEditing ? 'Wydarzenie zaktualizowane' : 'Wydarzenie utworzone',
        description: 'Wydarzenie zostało zapisane jako szkic.',
      });
      navigate(isEditing ? `/organizer/events/${saved.id}` : '/organizer/events');
    } catch (error) {
      toast({
        title: 'Nie udaĹ‚o siÄ™ zapisaÄ‡ wydarzenia',
        description: error instanceof Error ? error.message : 'SprĂłbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  const generateSlug = (eventName: string) => {
    return eventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const allCategories = [
    ...ageCategories.map((c) => ({ id: c.id, name: c.name, type: 'age' as const })),
    ...specialCategories.map((c) => ({ id: c.id, name: c.name, type: 'special' as const })),
  ];

  return {
    // Meta
    isEditing,
    originalIsPrivate: existingEvent?.isPrivate || false,
    privacyChanged: isEditing && (existingEvent?.isPrivate || false) !== isPrivate,
    step,
    navigate,
    toast,
    user,
    canChooseOrganizer,
    canManageFeatured,
    organizers,
    selectedOrganizerId,
    setSelectedOrganizerId,
    eventLimit,
    selectedEventLimit,
    isSaving,

    // Step 1
    name,
    setName,
    discipline,
    setDiscipline,
    date,
    setDate,
    registrationDeadline,
    setRegistrationDeadline,
    location,
    setLocation,
    city,
    setCity,
    description,
    setDescription,
    imageUrl,
    setImageUrl,
    featured,
    setFeatured,
    isVirtual,
    setIsVirtual,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isPrivate,
    setIsPrivate,
    accessCode,
    setAccessCode,
    bannerUrl,
    setBannerUrl,
    bannerCropArea,
    setBannerCropArea,
    organizerLogoUrl,
    setOrganizerLogoUrl,
    showBannerCropper,
    setShowBannerCropper,
    paymentConfigType,
    setPaymentConfigType,
    bankAccountNumber,
    setBankAccountNumber,
    bankAccountHolder,
    setBankAccountHolder,
    transferTitle,
    setTransferTitle,
    organizersHtml,
    setOrganizersHtml,
    rulesHtml,
    setRulesHtml,
    requireFinalAcceptance,
    setRequireFinalAcceptance,
    finalAcceptanceHtml,
    setFinalAcceptanceHtml,
    registrationMode,
    setRegistrationMode,
    externalRegistrationUrl,
    setExternalRegistrationUrl,
    embedStartDate,
    setEmbedStartDate,
    embedEndDate,
    setEmbedEndDate,
    formConfig,
    setFormConfig,
    displayOptions,
    setDisplayOptions,

    // Step 2
    ageCategories,
    addAgeCategory,
    removeAgeCategory,
    updateAgeCategory,
    applyStandardTemplate,
    specialCategories,
    addSpecialCategory,
    removeSpecialCategory,
    updateSpecialCategory,
    distances,
    addDistance,
    removeDistance,
    updateDistance,
    addRouteFile,
    removeRouteFile,
    updateRouteFile,
    toggleCategoryForDistance,
    allCategories,

    // Step 3
    // Actions
    nextStep,
    prevStep,
    handleSubmit,
    generateAccessCode,
    generateSlug,
  };
};

export type EventFormState = ReturnType<typeof useEventFormState>;


