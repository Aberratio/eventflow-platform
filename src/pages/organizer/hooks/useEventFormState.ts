import {
  createEvent,
  getEventById,
  getOrganizerEventLimit,
  getOrganizers,
  updateEvent,
  uploadEventDocument,
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
  OrganizerLogoShape,
  PriceTier,
  PriceTierMode,
  ParticipantCountType,
  EventDocument,
  EventDocumentType,
  EventLogisticsInfo,
  LogisticsField,
  LogisticsLocation,
  LogisticsFieldStatus,
} from '@/types';

export interface DistanceFormData {
  id: string;
  name: string;
  length: string;
  unit: 'km' | 'm';
  price: string;
  officePrice: string;
  limit: string;
  infoHtml: string;
  priceTierMode: PriceTierMode;
  participantCountType: ParticipantCountType;
  priceTiers: PriceTier[];
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
  showParticipants: 'paid_only',
};

const getEventYearFromDate = (eventDate: string) =>
  eventDate
    ? parseInt(eventDate.substring(0, 4)) || new Date().getFullYear()
    : new Date().getFullYear();

const generateStandardAgeCategoriesForDate = (eventDate: string): AgeCategory[] => {
  const eventYear = getEventYearFromDate(eventDate);
  const ranges = [
    { label: '18-29', from: eventYear - 29, to: eventYear - 18 },
    { label: '30-39', from: eventYear - 39, to: eventYear - 30 },
    { label: '40-49', from: eventYear - 49, to: eventYear - 40 },
    { label: '50-59', from: eventYear - 59, to: eventYear - 50 },
    { label: '60+', from: eventYear - 100, to: eventYear - 60 },
  ];
  const categories: AgeCategory[] = [];
  for (const gender of ['K', 'M'] as const) {
    for (const range of ranges) {
      categories.push({
        id: `cat-${gender}-${range.label}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${gender}${range.label}`,
        gender,
        birthYearFrom: range.from,
        birthYearTo: range.to,
      });
    }
  }
  return categories;
};

export type SubStep =
  | 'basic'
  | 'media'
  | 'payment'
  | 'content'
  | 'logistics'
  | 'registration'
  | 'categories'
  | 'distances'
  | 'summary';

export interface StepNavItem {
  id: SubStep;
  label: string;
  shortLabel: string;
  mainStep: 1 | 2 | 3;
}

export type SectionValidationErrors = Partial<Record<SubStep, string[]>>;

export const STEP_NAV_ITEMS: StepNavItem[] = [
  { id: 'basic', label: 'Podstawowe informacje', shortLabel: 'Podstawowe', mainStep: 1 },
  { id: 'media', label: 'Zdjęcia i media', shortLabel: 'Media', mainStep: 1 },
  { id: 'payment', label: 'Płatności', shortLabel: 'Płatności', mainStep: 1 },
  { id: 'content', label: 'Treści', shortLabel: 'Treści', mainStep: 1 },
  { id: 'logistics', label: 'Logistyka zawodów', shortLabel: 'Logistyka', mainStep: 1 },
  { id: 'registration', label: 'Rejestracja', shortLabel: 'Rejestracja', mainStep: 1 },
  { id: 'categories', label: 'Kategorie uczestników', shortLabel: 'Kategorie', mainStep: 2 },
  { id: 'distances', label: 'Dystanse', shortLabel: 'Dystanse', mainStep: 2 },
  { id: 'summary', label: 'Podsumowanie', shortLabel: 'Podsumowanie', mainStep: 3 },
];

export const useEventFormState = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  const [existingEvent, setExistingEvent] = useState<Event | null>(null);
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
  const [subStep, setSubStep] = useState<SubStep>('basic');
  const [visitedSubSteps, setVisitedSubSteps] = useState<SubStep[]>(['basic']);
  const [revisitedSubSteps, setRevisitedSubSteps] = useState<SubStep[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSubStep, setPendingSubStep] = useState<SubStep | null>(null);

  // Step 1 - Basic info
  const [name, setName] = useState(existingEvent?.name || '');
  const [disciplines, setDisciplines] = useState<SportDiscipline[]>(
    existingEvent?.discipline ? [existingEvent.discipline] : ['running'],
  );
  const [date, setDate] = useState(existingEvent?.date || '');
  const [registrationDeadline, setRegistrationDeadline] = useState(
    existingEvent?.registrationDeadline || '',
  );
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [city, setCity] = useState(existingEvent?.city || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [imageUrl, setImageUrl] = useState(existingEvent?.imageUrl || '');
  const [originalImageUrl, setOriginalImageUrl] = useState(existingEvent?.originalImageUrl || '');
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
  const [originalBannerUrl, setOriginalBannerUrl] = useState(
    existingEvent?.originalBannerUrl || '',
  );
  const [bannerCropArea, setBannerCropArea] = useState<BannerCropArea | undefined>(
    existingEvent?.bannerCropArea,
  );
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState(existingEvent?.organizerLogoUrl || '');
  const [originalOrganizerLogoUrl, setOriginalOrganizerLogoUrl] = useState(
    existingEvent?.originalOrganizerLogoUrl || '',
  );
  const [organizerLogoShape, setOrganizerLogoShape] = useState<OrganizerLogoShape>(
    existingEvent?.organizerLogoShape || 'square',
  );
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
    existingEvent?.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}',
  );

  // Documents
  const [documents, setDocuments] = useState<EventDocument[]>(existingEvent?.documents || []);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

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
  const [displayOptions, setDisplayOptions] = useState<EventDisplayOptions>(() => {
    const opts = existingEvent?.displayOptions;
    if (!opts) return DEFAULT_DISPLAY_OPTIONS;
    return {
      ...DEFAULT_DISPLAY_OPTIONS,
      ...opts,
      showParticipants: opts.showParticipants ?? (opts.hideUnpaid ? 'paid_only' : 'all'),
    };
  });

  // Logistics
  const [logisticsInfo, setLogisticsInfo] = useState<EventLogisticsInfo>(
    existingEvent?.logisticsInfo || {},
  );

  const updateLogisticsField = (
    key: keyof EventLogisticsInfo,
    updates: Partial<LogisticsField>,
  ) => {
    setLogisticsInfo((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...updates },
    }));
  };

  const updateLogisticsFieldStatus = (
    key: keyof EventLogisticsInfo,
    status: LogisticsFieldStatus,
  ) => {
    setLogisticsInfo((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), status, ...(status !== 'yes' ? { infoHtml: undefined } : {}) },
    }));
  };

  const addLogisticsLocation = (key: keyof EventLogisticsInfo) => {
    setLogisticsInfo((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        status: prev[key]?.status ?? null,
        locations: [
          ...(prev[key]?.locations || []),
          { id: `loc-${Date.now()}`, label: '', mapsUrl: '', address: '' },
        ],
      },
    }));
  };

  const removeLogisticsLocation = (key: keyof EventLogisticsInfo, id: string) => {
    setLogisticsInfo((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        status: prev[key]?.status ?? null,
        locations: (prev[key]?.locations || []).filter((l) => l.id !== id),
      },
    }));
  };

  const updateLogisticsLocation = (
    key: keyof EventLogisticsInfo,
    id: string,
    updates: Partial<LogisticsLocation>,
  ) => {
    setLogisticsInfo((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        status: prev[key]?.status ?? null,
        locations: (prev[key]?.locations || []).map((l) =>
          l.id === id ? { ...l, ...updates } : l,
        ),
      },
    }));
  };

  // Categories
  const getEventYear = () => getEventYearFromDate(date);
  const generateStandardAgeCategories = () => generateStandardAgeCategoriesForDate(date);

  const existingAgeCats = existingEvent?.distances?.[0]?.ageCategories;
  const existingSpecialCats = existingEvent?.distances?.[0]?.specialCategories;

  const [categoriesEnabled, setCategoriesEnabled] = useState<boolean>(
    existingAgeCats === undefined
      ? true
      : Array.isArray(existingAgeCats) && existingAgeCats.length > 0,
  );
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(
    Array.isArray(existingAgeCats) ? existingAgeCats : generateStandardAgeCategories(),
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
      officePrice: d.officePrice?.toString() || '',
      limit: d.limit?.toString() || '',
      infoHtml: d.infoHtml || '',
      priceTierMode: d.priceTierMode || 'date',
      participantCountType: d.participantCountType || 'registered',
      priceTiers: d.priceTiers || [],
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
    setDisciplines(existingEvent.discipline ? [existingEvent.discipline] : ['running']);
    setDate(existingEvent.date || '');
    setRegistrationDeadline(existingEvent.registrationDeadline || '');
    setLocation(existingEvent.location || '');
    setCity(existingEvent.city || '');
    setDescription(existingEvent.description || '');
    setImageUrl(existingEvent.imageUrl || '');
    setOriginalImageUrl(existingEvent.originalImageUrl || '');
    setFeatured(existingEvent.featured || false);
    setIsVirtual(existingEvent.isVirtual || false);
    setStartDate(existingEvent.startDate || '');
    setEndDate(existingEvent.endDate || '');
    setIsPrivate(existingEvent.isPrivate || false);
    setAccessCode(existingEvent.accessCode || '');
    setBannerUrl(existingEvent.bannerUrl || '');
    setOriginalBannerUrl(existingEvent.originalBannerUrl || '');
    setBannerCropArea(existingEvent.bannerCropArea);
    setOrganizerLogoUrl(existingEvent.organizerLogoUrl || '');
    setOriginalOrganizerLogoUrl(existingEvent.originalOrganizerLogoUrl || '');
    setOrganizerLogoShape(existingEvent.organizerLogoShape || 'square');
    setPaymentConfigType(existingEvent.paymentConfig?.type || 'admin_gateway');
    setBankAccountNumber(existingEvent.paymentConfig?.bankAccountNumber || '');
    setBankAccountHolder(existingEvent.paymentConfig?.bankAccountHolder || '');
    setTransferTitle(
      existingEvent.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}',
    );
    setDocuments(existingEvent.documents || []);
    setOrganizersHtml(existingEvent.organizersHtml || '');
    setRulesHtml(existingEvent.rulesHtml || '');
    setRequireFinalAcceptance(existingEvent.requireFinalAcceptance || false);
    setFinalAcceptanceHtml(existingEvent.finalAcceptanceHtml || '');
    setRegistrationMode(existingEvent.registrationEmbed?.mode || 'internal');
    setExternalRegistrationUrl(existingEvent.registrationEmbed?.externalUrl || '');
    setEmbedStartDate(existingEvent.registrationEmbed?.startDate || '');
    setEmbedEndDate(existingEvent.registrationEmbed?.endDate || '');
    setFormConfig(existingEvent.registrationFormConfig || DEFAULT_FORM_CONFIG);
    {
      const opts = existingEvent.displayOptions;
      setDisplayOptions(opts
        ? { ...DEFAULT_DISPLAY_OPTIONS, ...opts, showParticipants: opts.showParticipants ?? (opts.hideUnpaid ? 'paid_only' : 'all') }
        : DEFAULT_DISPLAY_OPTIONS
      );
    }
    setLogisticsInfo(existingEvent.logisticsInfo || {});
    const loadedAgeCats = existingEvent.distances?.[0]?.ageCategories;
    const hasLoadedCats = Array.isArray(loadedAgeCats) && loadedAgeCats.length > 0;
    setCategoriesEnabled(hasLoadedCats);
    setAgeCategories(Array.isArray(loadedAgeCats) ? loadedAgeCats : generateStandardAgeCategoriesForDate(existingEvent.date || ''));
    setSpecialCategories(existingEvent.distances?.[0]?.specialCategories || []);
    setDistances(
      existingEvent.distances.map((d) => ({
        id: d.id,
        name: d.name,
        length: d.length.toString(),
        unit: d.unit,
        price: d.price.toString(),
        officePrice: d.officePrice?.toString() || '',
        limit: d.limit?.toString() || '',
        infoHtml: d.infoHtml || '',
        priceTierMode: d.priceTierMode || 'date',
        participantCountType: d.participantCountType || 'registered',
        priceTiers: d.priceTiers || [],
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
        officePrice: '',
        limit: '',
        infoHtml: '',
        priceTierMode: 'date',
        participantCountType: 'registered',
        priceTiers: [],
        disabledCategoryIds: [],
        routeMapUrl: '',
        routeElevationProfile: '',
        routeGpxUrl: '',
        routeFiles: [],
      },
    ]);
  };

  const addDistanceFromTemplate = (
    template: Pick<DistanceFormData, 'name' | 'length' | 'unit'>,
  ) => {
    setDistances((prev) => [
      ...prev,
      {
        id: `dist-${Date.now()}`,
        name: template.name,
        length: template.length,
        unit: template.unit,
        price: '',
        officePrice: '',
        limit: '',
        infoHtml: '',
        priceTierMode: 'date',
        participantCountType: 'registered',
        priceTiers: [],
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
    value:
      | string
      | string[]
      | DistanceRouteFile[]
      | PriceTier[]
      | PriceTierMode
      | ParticipantCountType,
  ) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPriceTier = (distIndex: number) => {
    setDistances((prev) => {
      const updated = [...prev];
      const dist = updated[distIndex];
      const mode = dist.priceTierMode || 'date';
      updated[distIndex] = {
        ...dist,
        priceTiers: [
          ...dist.priceTiers,
          {
            id: `pt-${Date.now()}`,
            name: mode === 'date' ? 'Cena promocyjna' : 'Próg uczestników',
            discountType: 'fixed',
            discountValue: 0,
            ...(mode === 'date' ? { endDate: '' } : { participantLimit: 100 }),
          },
        ],
      };
      return updated;
    });
  };

  const updatePriceTier = (distIndex: number, tierId: string, updates: Partial<PriceTier>) => {
    setDistances((prev) => {
      const updated = [...prev];
      const dist = updated[distIndex];
      updated[distIndex] = {
        ...dist,
        priceTiers: dist.priceTiers.map((tier) =>
          tier.id === tierId ? { ...tier, ...updates } : tier,
        ),
      };
      return updated;
    });
  };

  const removePriceTier = (distIndex: number, tierId: string) => {
    setDistances((prev) => {
      const updated = [...prev];
      const dist = updated[distIndex];
      updated[distIndex] = {
        ...dist,
        priceTiers: dist.priceTiers.filter((tier) => tier.id !== tierId),
      };
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
    setAgeCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        name: '',
        gender: null,
        birthYearFrom: undefined,
        birthYearTo: undefined,
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
    value: string | number | null,
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

  // Document handlers
  const addDocumentFile = async (file: File, type: EventDocumentType, name: string) => {
    setIsUploadingDocument(true);
    try {
      const response = await uploadEventDocument(file);
      const doc: EventDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || response.data.originalName,
        type,
        fileUrl: response.data.url,
        fileName: response.data.originalName,
        mimeType: response.data.mimeType,
      };
      setDocuments((prev) => [...prev, doc]);
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDocument = (id: string, field: keyof EventDocument, value: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const getSectionValidationErrors = (): SectionValidationErrors => {
    const errors: SectionValidationErrors = {};
    const addError = (section: SubStep, message: string) => {
      errors[section] = [...(errors[section] ?? []), message];
    };

    if (!name || !date || !registrationDeadline) {
      addError('basic', 'Wypełnij wszystkie wymagane pola');
    }
    if (registrationDeadline && date && registrationDeadline > date) {
      addError('basic', 'Termin rejestracji nie moze byc pozniejszy niz data wydarzenia');
    }
    if (!isVirtual && (!location || !city)) {
      addError('basic', 'Wypełnij lokalizację i miasto');
    }
    if (isVirtual && startDate && endDate && startDate > endDate) {
      addError(
        'basic',
        'Data rozpoczecia okna wirtualnego nie moze byc pozniejsza niz data zakonczenia',
      );
    }
    if (isPrivate && !accessCode.trim()) {
      addError('basic', 'Podaj kod dostepu dla wydarzenia prywatnego');
    }
    if (isVirtual && (!startDate || !endDate)) {
      addError('basic', 'Wypełnij daty rozpoczęcia i zakończenia okna wirtualnego');
    }
    if (registrationMode === 'external_embed') {
      const trimmedUrl = externalRegistrationUrl.trim();
      if (!trimmedUrl) {
        addError('registration', 'Podaj link do zewnetrznego formularza zapisow.');
      } else {
        try {
          const parsedUrl = new URL(trimmedUrl);
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Unsupported protocol');
          }
        } catch {
          addError(
            'registration',
            'Link do zewnetrznego formularza musi byc pelnym adresem http lub https.',
          );
        }
      }
    }
    if (
      registrationMode !== 'external_embed' &&
      paymentConfigType === 'organizer_bank' &&
      (!bankAccountNumber.trim() || !bankAccountHolder.trim())
    ) {
      addError('payment', 'Podaj numer konta i właściciela dla płatności przelewem bankowym');
    }

    const skipSystemPaymentConfig = registrationMode === 'external_embed';

    if (distances.length === 0) {
      addError('distances', 'Dodaj przynajmniej jeden dystans');
    }
    for (const dist of distances) {
      if (!dist.name || !dist.length || !dist.price) {
        addError('distances', 'Wypełnij wszystkie pola dystansów');
      }
      if (Number(dist.length) <= 0 || Number(dist.price) < 0) {
        addError('distances', 'Dlugosc dystansu musi byc dodatnia, a cena nie moze byc ujemna');
      }
      if (dist.limit && Number(dist.limit) <= 0) {
        addError('distances', 'Limit uczestnikow musi byc dodatni albo pusty');
      }
      if (dist.officePrice && Number(dist.officePrice) < 0) {
        addError('distances', 'Cena w biurze zawodow nie moze byc ujemna');
      }
      if (skipSystemPaymentConfig) continue;

      for (const tier of dist.priceTiers) {
        const tierPrice = Number(tier.price ?? 0);
        const hasExplicitPrice = tier.price !== undefined && tier.price !== null;
        if (!tier.name.trim()) {
          addError('distances', 'Kazdy prog cenowy musi miec nazwe');
        }
        if (hasExplicitPrice && tierPrice < 0) {
          addError('distances', 'Cena w progu nie moze byc ujemna');
        }
        if (dist.priceTierMode === 'date' && !tier.endDate) {
          addError('distances', 'Podaj date koncowa dla kazdego progu cenowego');
        }
        if (dist.priceTierMode === 'date' && tier.endDate) {
          if (Number.isNaN(new Date(tier.endDate).getTime())) {
            addError('distances', 'Data koncowa progu cenowego jest nieprawidlowa');
          }
          if (registrationDeadline && tier.endDate > registrationDeadline) {
            addError(
              'distances',
              'Data koncowa progu cenowego nie moze byc pozniejsza niz termin rejestracji',
            );
          }
        }
        if (
          dist.priceTierMode === 'participants' &&
          (!tier.participantLimit || Number(tier.participantLimit) <= 0)
        ) {
          addError('distances', 'Podaj dodatni limit uczestnikow dla kazdego progu cenowego');
        }
        if (dist.priceTierMode === 'participants') {
          const participantLimit = Number(tier.participantLimit);
          if (!Number.isInteger(participantLimit)) {
            addError('distances', 'Limit uczestnikow w progu musi byc liczba calkowita');
          }
          if (dist.limit && participantLimit > Number(dist.limit)) {
            addError(
              'distances',
              'Limit uczestnikow w progu nie moze byc wyzszy niz limit dystansu',
            );
          }
        }
      }
      if (dist.priceTierMode === 'date') {
        const dates = dist.priceTiers.map((tier) => tier.endDate).filter(Boolean);
        if (new Set(dates).size !== dates.length) {
          addError('distances', 'Daty koncowe progow cenowych nie moga sie powtarzac');
        }
      }
      if (dist.priceTierMode === 'participants') {
        const participantLimits = dist.priceTiers.map((tier) => Number(tier.participantLimit));
        if (new Set(participantLimits).size !== participantLimits.length) {
          addError('distances', 'Limity uczestnikow w progach cenowych nie moga sie powtarzac');
        }
      }
    }

    return errors;
  };

  const sectionValidationErrors = getSectionValidationErrors();
  const getFirstValidationError = () =>
    STEP_NAV_ITEMS.flatMap((item) => sectionValidationErrors[item.id] ?? [])[0];

  // Validation
  const validateStep1 = (): boolean => {
    const message = getFirstValidationError();
    if (message) {
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const message = getFirstValidationError();
    if (message) {
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const currentNavItems = STEP_NAV_ITEMS.filter((item) => item.mainStep === step);
  const currentSubStepIndex = currentNavItems.findIndex((item) => item.id === subStep);
  const visitSubStep = (item: SubStep) => {
    if (visitedSubSteps.includes(item)) {
      setRevisitedSubSteps((current) => Array.from(new Set([...current, item])));
    }

    setVisitedSubSteps((prev) => {
      return prev.includes(item) ? prev : [...prev, item];
    });
  };

  const navigateToSubStep = (target: SubStep) => {
    const targetItem = STEP_NAV_ITEMS.find((item) => item.id === target);
    if (!targetItem) return;
    if (target === subStep) return;

    if (hasUnsavedChanges) {
      setPendingSubStep(target);
      return;
    }

    if (targetItem.mainStep !== step) {
      setStep(targetItem.mainStep);
    }
    visitSubStep(target);
    setSubStep(target);
    setHasUnsavedChanges(false);
  };

  const confirmNavigatePendingSubStep = () => {
    if (!pendingSubStep) return;
    const targetItem = STEP_NAV_ITEMS.find((item) => item.id === pendingSubStep);
    if (targetItem && targetItem.mainStep !== step) {
      setStep(targetItem.mainStep);
    }
    visitSubStep(pendingSubStep);
    setSubStep(pendingSubStep);
    setHasUnsavedChanges(false);
    setPendingSubStep(null);
  };

  const cancelNavigatePendingSubStep = () => {
    setPendingSubStep(null);
  };

  const nextStep = () => {
    if (step === 1 && currentSubStepIndex < currentNavItems.length - 1) {
      const next = currentNavItems[currentSubStepIndex + 1];
      visitSubStep(next.id);
      setSubStep(next.id);
      setHasUnsavedChanges(false);
      return;
    }
    if (step === 2 && currentSubStepIndex < currentNavItems.length - 1) {
      const next = currentNavItems[currentSubStepIndex + 1];
      visitSubStep(next.id);
      setSubStep(next.id);
      setHasUnsavedChanges(false);
      return;
    }
    setStep((prev) => {
      const next = prev + 1;
      const firstInNext = STEP_NAV_ITEMS.find((item) => item.mainStep === next);
      if (firstInNext) {
        visitSubStep(firstInNext.id);
        setSubStep(firstInNext.id);
      }
      return next;
    });
    setHasUnsavedChanges(false);
  };

  const prevStep = () => {
    if (currentSubStepIndex > 0) {
      const prev = currentNavItems[currentSubStepIndex - 1];
      visitSubStep(prev.id);
      setSubStep(prev.id);
      setHasUnsavedChanges(false);
      return;
    }
    setStep((prev) => {
      const next = prev - 1;
      if (next >= 1) {
        const itemsInPrev = STEP_NAV_ITEMS.filter((item) => item.mainStep === next);
        const last = itemsInPrev[itemsInPrev.length - 1];
        if (last) {
          visitSubStep(last.id);
          setSubStep(last.id);
        }
      }
      return next;
    });
    setHasUnsavedChanges(false);
  };

  const buildPayload = () => {
    const organizer = organizers.find((o) => o.id === selectedOrganizerId) || user;
    const payload = {
      name,
      slug: generateSlug(name),
      discipline: (disciplines[0] ?? 'running') as SportDiscipline,
      date,
      location,
      city,
      description,
      imageUrl,
      originalImageUrl: originalImageUrl || undefined,
      distances: distances.map((dist) => ({
        id: dist.id,
        name: dist.name,
        length: Number(dist.length),
        unit: dist.unit,
        price: Number(dist.price),
        officePrice: dist.officePrice ? Number(dist.officePrice) : undefined,
        infoHtml: dist.infoHtml || undefined,
        limit: dist.limit ? Number(dist.limit) : undefined,
        priceTierMode: dist.priceTierMode,
        participantCountType: dist.participantCountType,
        priceTiers: dist.priceTiers.map((tier) => ({
          ...tier,
          price: tier.price != null ? Number(tier.price) : undefined,
          discountValue: Number(tier.discountValue),
          participantLimit:
            dist.priceTierMode === 'participants' ? Number(tier.participantLimit) : undefined,
          endDate: dist.priceTierMode === 'date' ? tier.endDate : undefined,
        })),
        registeredCount:
          existingEvent?.distances.find((d) => d.id === dist.id)?.registeredCount || 0,
        categories: categoriesEnabled
          ? allCategories
              .filter((cat) => !dist.disabledCategoryIds.includes(cat.id))
              .map((cat) => cat.name)
          : [],
        ageCategories: categoriesEnabled ? ageCategories : [],
        specialCategories: categoriesEnabled ? specialCategories : [],
        routeMapUrl: dist.routeMapUrl || undefined,
        routeElevationProfile: dist.routeElevationProfile || undefined,
        routeGpxUrl: dist.routeGpxUrl || undefined,
        routeFiles: dist.routeFiles,
      })),
      organizerId: selectedOrganizerId,
      organizerName: organizer?.companyName || organizer?.name || '',
      registrationDeadline,
      bannerUrl: bannerUrl || undefined,
      originalBannerUrl: originalBannerUrl || undefined,
      bannerCropArea,
      organizerLogoUrl: organizerLogoUrl || undefined,
      originalOrganizerLogoUrl: originalOrganizerLogoUrl || undefined,
      organizerLogoShape,
      isVirtual,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentConfig: {
        type: paymentConfigType,
        bankAccountNumber: bankAccountNumber || undefined,
        bankAccountHolder: bankAccountHolder || undefined,
        transferTitle: transferTitle || undefined,
      },
      documents,
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
      logisticsInfo,
    };
    return canManageFeatured ? { ...payload, featured } : payload;
  };

  const selectedEventLimit = eventLimit;

  const handleSubmit = async () => {
    if (!selectedOrganizerId) {
      toast({
        title: 'Błąd',
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
    if (!validateStep1() || !validateStep2()) return;

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
        title: 'Nie udało się zapisać wydarzenia',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
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
    disciplines,
    setDisciplines,
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
    originalImageUrl,
    setOriginalImageUrl,
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
    originalBannerUrl,
    setOriginalBannerUrl,
    bannerCropArea,
    setBannerCropArea,
    organizerLogoUrl,
    setOrganizerLogoUrl,
    originalOrganizerLogoUrl,
    setOriginalOrganizerLogoUrl,
    organizerLogoShape,
    setOrganizerLogoShape,
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
    documents,
    isUploadingDocument,
    addDocumentFile,
    removeDocument,
    updateDocument,
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
    logisticsInfo,
    setLogisticsInfo,
    updateLogisticsField,
    updateLogisticsFieldStatus,
    addLogisticsLocation,
    removeLogisticsLocation,
    updateLogisticsLocation,

    // Step 2
    categoriesEnabled,
    setCategoriesEnabled,
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
    addDistanceFromTemplate,
    removeDistance,
    updateDistance,
    addPriceTier,
    updatePriceTier,
    removePriceTier,
    addRouteFile,
    removeRouteFile,
    updateRouteFile,
    toggleCategoryForDistance,
    allCategories,

    // Step 3
    // Sub-step navigation
    subStep,
    setSubStep,
    visitedSubSteps,
    revisitedSubSteps,
    sectionValidationErrors,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    pendingSubStep,
    navigateToSubStep,
    confirmNavigatePendingSubStep,
    cancelNavigatePendingSubStep,
    // Actions
    nextStep,
    prevStep,
    handleSubmit,
    generateAccessCode,
    generateSlug,
  };
};

export type EventFormState = ReturnType<typeof useEventFormState>;
