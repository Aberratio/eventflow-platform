import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { mockEvents } from '@/api/mock/events.mock';
import {
  SportDiscipline,
  BannerCropArea,
  PaymentConfigType,
  AgeCategory,
  SpecialCategory,
  DistanceRouteFile,
  RegistrationFormConfig,
  EventDisplayOptions,
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
  const { toast } = useToast();
  const isEditing = Boolean(id);
  const existingEvent = isEditing ? mockEvents.find(e => e.id === id) : null;

  const [step, setStep] = useState(1);

  // Step 1 - Basic info
  const [name, setName] = useState(existingEvent?.name || '');
  const [discipline, setDiscipline] = useState<SportDiscipline>(existingEvent?.discipline || 'running');
  const [date, setDate] = useState(existingEvent?.date || '');
  const [registrationDeadline, setRegistrationDeadline] = useState(existingEvent?.registrationDeadline || '');
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
  const [bannerCropArea, setBannerCropArea] = useState<BannerCropArea | undefined>(existingEvent?.bannerCropArea);
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState(existingEvent?.organizerLogoUrl || '');
  const [showBannerCropper, setShowBannerCropper] = useState(false);

  // Payment
  const [paymentConfigType, setPaymentConfigType] = useState<PaymentConfigType>(
    existingEvent?.paymentConfig?.type || 'admin_gateway'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(existingEvent?.paymentConfig?.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(existingEvent?.paymentConfig?.bankAccountHolder || '');
  const [transferTitle, setTransferTitle] = useState(
    existingEvent?.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}'
  );

  // Rich text
  const [organizersHtml, setOrganizersHtml] = useState(existingEvent?.organizersHtml || '');
  const [rulesHtml, setRulesHtml] = useState(existingEvent?.rulesHtml || '');
  const [requireFinalAcceptance, setRequireFinalAcceptance] = useState(existingEvent?.requireFinalAcceptance || false);
  const [finalAcceptanceHtml, setFinalAcceptanceHtml] = useState(existingEvent?.finalAcceptanceHtml || '');

  // Embed
  const [embedEnabled, setEmbedEnabled] = useState(existingEvent?.registrationEmbed?.enabled || false);
  const [embedStartDate, setEmbedStartDate] = useState(existingEvent?.registrationEmbed?.startDate || '');
  const [embedEndDate, setEmbedEndDate] = useState(existingEvent?.registrationEmbed?.endDate || '');

  // Form config
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig>(
    existingEvent?.registrationFormConfig || DEFAULT_FORM_CONFIG
  );

  // Display options
  const [displayOptions, setDisplayOptions] = useState<EventDisplayOptions>(
    existingEvent?.displayOptions || DEFAULT_DISPLAY_OPTIONS
  );

  // Categories
  const getEventYear = () => {
    return date ? parseInt(date.substring(0, 4)) || new Date().getFullYear() : new Date().getFullYear();
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
    existingAgeCats && existingAgeCats.length > 0 ? existingAgeCats : generateStandardAgeCategories()
  );
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>(existingSpecialCats || []);

  // Distances
  const [distances, setDistances] = useState<DistanceFormData[]>(
    existingEvent?.distances.map(d => ({
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
    })) || []
  );

  const [status, setStatus] = useState<'draft' | 'awaiting_approval' | 'published'>(
    existingEvent?.status === 'published' ? 'published' :
    existingEvent?.status === 'awaiting_approval' ? 'awaiting_approval' : 'draft'
  );

  // Distance handlers
  const addDistance = () => {
    setDistances(prev => [...prev, {
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
    }]);
  };

  const removeDistance = (index: number) => {
    setDistances(prev => prev.filter((_, i) => i !== index));
  };

  const updateDistance = (index: number, field: keyof DistanceFormData, value: string | string[] | DistanceRouteFile[]) => {
    setDistances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRouteFile = (distIndex: number) => {
    setDistances(prev => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: [...updated[distIndex].routeFiles, { id: `rf-${Date.now()}`, name: '', type: 'image', url: '' }],
      };
      return updated;
    });
  };

  const removeRouteFile = (distIndex: number, fileId: string) => {
    setDistances(prev => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: updated[distIndex].routeFiles.filter(f => f.id !== fileId),
      };
      return updated;
    });
  };

  const updateRouteFile = (distIndex: number, fileId: string, field: keyof DistanceRouteFile, value: string) => {
    setDistances(prev => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        routeFiles: updated[distIndex].routeFiles.map(f => f.id === fileId ? { ...f, [field]: value } : f),
      };
      return updated;
    });
  };

  const toggleCategoryForDistance = (distIndex: number, categoryId: string) => {
    setDistances(prev => {
      const updated = [...prev];
      const dist = updated[distIndex];
      const disabled = dist.disabledCategoryIds.includes(categoryId)
        ? dist.disabledCategoryIds.filter(id => id !== categoryId)
        : [...dist.disabledCategoryIds, categoryId];
      updated[distIndex] = { ...dist, disabledCategoryIds: disabled };
      return updated;
    });
  };

  // Category handlers
  const addAgeCategory = () => {
    const eventYear = getEventYear();
    setAgeCategories(prev => [...prev, {
      id: `cat-${Date.now()}`,
      name: '',
      gender: 'M',
      birthYearFrom: eventYear - 39,
      birthYearTo: eventYear - 30,
    }]);
  };

  const removeAgeCategory = (catIndex: number) => {
    const removedId = ageCategories[catIndex].id;
    setAgeCategories(prev => prev.filter((_, i) => i !== catIndex));
    setDistances(prev => prev.map(d => ({
      ...d,
      disabledCategoryIds: d.disabledCategoryIds.filter(id => id !== removedId),
    })));
  };

  const updateAgeCategory = (catIndex: number, field: keyof AgeCategory, value: string | number) => {
    setAgeCategories(prev => {
      const cats = [...prev];
      cats[catIndex] = { ...cats[catIndex], [field]: value };
      return cats;
    });
  };

  const applyStandardTemplate = () => setAgeCategories(generateStandardAgeCategories());

  const addSpecialCategory = () => {
    setSpecialCategories(prev => [...prev, { id: `scat-${Date.now()}`, name: '', description: '' }]);
  };

  const removeSpecialCategory = (catIndex: number) => {
    const removedId = specialCategories[catIndex].id;
    setSpecialCategories(prev => prev.filter((_, i) => i !== catIndex));
    setDistances(prev => prev.map(d => ({
      ...d,
      disabledCategoryIds: d.disabledCategoryIds.filter(id => id !== removedId),
    })));
  };

  const updateSpecialCategory = (catIndex: number, field: keyof SpecialCategory, value: string) => {
    setSpecialCategories(prev => {
      const cats = [...prev];
      cats[catIndex] = { ...cats[catIndex], [field]: value };
      return cats;
    });
  };

  // Validation
  const validateStep1 = (): boolean => {
    if (!name || !date || !registrationDeadline) {
      toast({ title: 'Błąd', description: 'Wypełnij wszystkie wymagane pola', variant: 'destructive' });
      return false;
    }
    if (!isVirtual && (!location || !city)) {
      toast({ title: 'Błąd', description: 'Wypełnij lokalizację i miasto', variant: 'destructive' });
      return false;
    }
    if (isVirtual && (!startDate || !endDate)) {
      toast({ title: 'Błąd', description: 'Wypełnij daty rozpoczęcia i zakończenia okna wirtualnego', variant: 'destructive' });
      return false;
    }
    if (paymentConfigType === 'organizer_bank' && (!bankAccountNumber.trim() || !bankAccountHolder.trim())) {
      toast({ title: 'Błąd', description: 'Podaj numer konta i właściciela dla płatności przelewem bankowym', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (distances.length === 0) {
      toast({ title: 'Błąd', description: 'Dodaj przynajmniej jeden dystans', variant: 'destructive' });
      return false;
    }
    for (const dist of distances) {
      if (!dist.name || !dist.length || !dist.price) {
        toast({ title: 'Błąd', description: 'Wypełnij wszystkie pola dystansów', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    const messages = {
      draft: 'Wydarzenie zostało zapisane jako szkic.',
      awaiting_approval: 'Wydarzenie zostało zgłoszone do akceptacji. Administrator sprawdzi je wkrótce.',
      published: 'Wydarzenie zostało opublikowane i jest widoczne dla uczestników.',
    };
    toast({
      title: isEditing ? 'Wydarzenie zaktualizowane' : 'Wydarzenie utworzone',
      description: messages[status],
    });
    navigate(-1);
  };

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  const generateSlug = (eventName: string) => {
    return eventName.toLowerCase()
      .replace(/[ąáàâä]/g, 'a').replace(/[ęéèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i').replace(/[óòôö]/g, 'o')
      .replace(/[úùûü]/g, 'u').replace(/[ćç]/g, 'c')
      .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n')
      .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const allCategories = [
    ...ageCategories.map(c => ({ id: c.id, name: c.name, type: 'age' as const })),
    ...specialCategories.map(c => ({ id: c.id, name: c.name, type: 'special' as const })),
  ];

  return {
    // Meta
    isEditing,
    step,
    navigate,
    toast,

    // Step 1
    name, setName,
    discipline, setDiscipline,
    date, setDate,
    registrationDeadline, setRegistrationDeadline,
    location, setLocation,
    city, setCity,
    description, setDescription,
    imageUrl, setImageUrl,
    featured, setFeatured,
    isVirtual, setIsVirtual,
    startDate, setStartDate,
    endDate, setEndDate,
    isPrivate, setIsPrivate,
    accessCode, setAccessCode,
    bannerUrl, setBannerUrl,
    bannerCropArea, setBannerCropArea,
    organizerLogoUrl, setOrganizerLogoUrl,
    showBannerCropper, setShowBannerCropper,
    paymentConfigType, setPaymentConfigType,
    bankAccountNumber, setBankAccountNumber,
    bankAccountHolder, setBankAccountHolder,
    transferTitle, setTransferTitle,
    organizersHtml, setOrganizersHtml,
    rulesHtml, setRulesHtml,
    requireFinalAcceptance, setRequireFinalAcceptance,
    finalAcceptanceHtml, setFinalAcceptanceHtml,
    embedEnabled, setEmbedEnabled,
    embedStartDate, setEmbedStartDate,
    embedEndDate, setEmbedEndDate,
    formConfig, setFormConfig,
    displayOptions, setDisplayOptions,

    // Step 2
    ageCategories, addAgeCategory, removeAgeCategory, updateAgeCategory,
    applyStandardTemplate,
    specialCategories, addSpecialCategory, removeSpecialCategory, updateSpecialCategory,
    distances, addDistance, removeDistance, updateDistance,
    addRouteFile, removeRouteFile, updateRouteFile,
    toggleCategoryForDistance,
    allCategories,

    // Step 3
    status, setStatus,

    // Actions
    nextStep, prevStep, handleSubmit,
    generateAccessCode, generateSlug,
  };
};

export type EventFormState = ReturnType<typeof useEventFormState>;
