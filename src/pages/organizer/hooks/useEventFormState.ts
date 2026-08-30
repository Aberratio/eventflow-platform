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
  DistanceDocument,
  RegistrationFormConfig,
  EventDisplayOptions,
  OrganizerEventLimit,
  OrganizerLogoShape,
  PriceTier,
  EventDocument,
  EventDocumentType,
  EventLogisticsInfo,
  LogisticsField,
  LogisticsLocation,
  LogisticsFieldStatus,
  OrganizerContactEntry,
  EventSponsor,
  CoOrganizer,
  MerchandiseColor,
  GadgetDocument,
  GadgetQuantityMode,
  GadgetImage,
  DistanceStartType,
} from '@/types';

export interface DistanceFormData {
  id: string;
  name: string;
  noName: boolean;
  noLength: boolean;
  length: string;
  unit: 'km' | 'm';
  startType: DistanceStartType;
  relayMinTeamSize: string;
  relayMaxTeamSize: string;
  relayTeamCompletionDeadline: string;
  price: string;
  /** Office-only price (event_distance_pricing_variants entry, hidden from the public form). */
  officePrice: string;
  limit: string;
  infoHtml: string;
  priceTiers: PriceTier[];
  disabledCategoryIds: string[];
  routeMapUrl: string;
  routeElevationProfile: string;
  routeGpxUrl: string;
  routeFiles: DistanceRouteFile[];
  distanceDocuments: DistanceDocument[];
}

export interface GadgetFormData {
  id: string;
  name: string;
  descriptionHtml: string;
  documents: GadgetDocument[];
  brand: string;
  price: string;
  originalPrice: string;
  sizes: string[];
  colors: MerchandiseColor[];
  imageUrl: string;
  images: GadgetImage[];
  available: boolean;
  stockCount: string;
  quantityMode: GadgetQuantityMode;
  quantityMax: string;
  saleFrom: string;
  saleTo: string;
  distanceIds: string[];
}

export const emptyGadget = (): GadgetFormData => ({
  id: crypto.randomUUID(),
  name: '',
  descriptionHtml: '',
  documents: [],
  brand: '',
  price: '',
  originalPrice: '',
  sizes: [],
  colors: [],
  imageUrl: '',
  images: [],
  available: true,
  stockCount: '',
  quantityMode: 'any',
  quantityMax: '',
  saleFrom: '',
  saleTo: '',
  distanceIds: [],
});

export const OFFICE_PRICING_VARIANT_NAME = 'Zapis w biurze zawodów';

/** The office-only pricing variant (event_distance_pricing_variants), if the distance has one. */
const officeVariantOf = (d: { pricingVariants?: { officeOnly?: boolean; price: number }[] }) =>
  d.pricingVariants?.find((v) => v.officeOnly);

export const formatDistanceName = (length: string, unit: 'km' | 'm'): string => {
  const num = parseFloat(length);
  if (!isFinite(num) || num <= 0) return '';
  if (unit === 'km') {
    const formatted = num % 1 === 0 ? num.toString() : num.toString().replace('.', ',');
    return `${formatted} km`;
  }
  return `${num} m`;
};

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

const isBlank = (value: unknown): boolean => String(value ?? '').trim() === '';

const parseNumberInput = (value: unknown): number | null => {
  if (isBlank(value)) return null;
  const parsed = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

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
  | 'organizer'
  | 'categories'
  | 'distances'
  | 'gadgets'
  | 'summary';

export interface StepNavItem {
  id: SubStep;
  label: string;
  shortLabel: string;
  mainStep: 1 | 2 | 3 | 4;
}

export type SectionValidationErrors = Partial<Record<SubStep, string[]>>;

export const STEP_NAV_ITEMS: StepNavItem[] = [
  { id: 'basic', label: 'Podstawowe informacje', shortLabel: 'Podstawowe', mainStep: 1 },
  { id: 'media', label: 'Zdjęcia i media', shortLabel: 'Media', mainStep: 1 },
  { id: 'payment', label: 'Płatności', shortLabel: 'Płatności', mainStep: 1 },
  { id: 'content', label: 'Treści', shortLabel: 'Treści', mainStep: 1 },
  { id: 'logistics', label: 'Logistyka zawodów', shortLabel: 'Logistyka', mainStep: 1 },
  { id: 'registration', label: 'Rejestracja', shortLabel: 'Rejestracja', mainStep: 1 },
  { id: 'organizer', label: 'Organizator i sponsorzy', shortLabel: 'Organizator', mainStep: 1 },
  { id: 'categories', label: 'Kategorie uczestników', shortLabel: 'Kategorie', mainStep: 2 },
  { id: 'distances', label: 'Dystanse', shortLabel: 'Dystanse', mainStep: 2 },
  { id: 'gadgets', label: 'Gadżety do kupienia', shortLabel: 'Gadżety', mainStep: 3 },
  { id: 'summary', label: 'Podsumowanie', shortLabel: 'Podsumowanie', mainStep: 4 },
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
  const [eventLimitError, setEventLimitError] = useState('');
  const [eventLoadError, setEventLoadError] = useState('');
  const [organizersLoadError, setOrganizersLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState<SubStep>('basic');
  const [visitedSubSteps, setVisitedSubSteps] = useState<SubStep[]>(['basic']);
  const [revisitedSubSteps, setRevisitedSubSteps] = useState<SubStep[]>([]);
  const [shownValidationSubSteps, setShownValidationSubSteps] = useState<SubStep[]>([]);
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
  const [registrationOpenDate, setRegistrationOpenDate] = useState(
    existingEvent?.registrationOpenDate || '',
  );
  const [registrationUntilEventStart, setRegistrationUntilEventStart] = useState(
    existingEvent?.registrationUntilEventStart || false,
  );
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [locationMapsUrl, setLocationMapsUrl] = useState(existingEvent?.locationMapsUrl || '');
  const [city, setCity] = useState(existingEvent?.city || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [imageUrl, setImageUrl] = useState(existingEvent?.imageUrl || '');
  const [originalImageUrl, setOriginalImageUrl] = useState(existingEvent?.originalImageUrl || '');
  const [featured, setFeatured] = useState(existingEvent?.featured || false);

  // Virtual event
  const [isVirtual, setIsVirtual] = useState(existingEvent?.isVirtual || false);
  const [startDate, setStartDate] = useState(existingEvent?.startDate || '');
  const [endDate, setEndDate] = useState(existingEvent?.endDate || '');

  // Private event (visibility; only takes effect once the event is published — E1.1)
  const [isPrivate, setIsPrivate] = useState(existingEvent?.visibility === 'private');
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
  const [backgroundId, setBackgroundId] = useState(existingEvent?.backgroundId || '');

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

  // Organizer contacts — pre-filled from profile for new events
  const [organizerContacts, setOrganizerContacts] = useState<OrganizerContactEntry[]>(() => {
    if (existingEvent?.organizerInfo?.contacts) return existingEvent.organizerInfo.contacts;
    if (!isEditing && (user?.email || user?.phone)) {
      return [
        { id: `contact-${Date.now()}`, email: user.email || '', phone: user.phone || undefined },
      ];
    }
    return [];
  });

  // Sponsors
  const [sponsors, setSponsors] = useState<EventSponsor[]>(
    existingEvent?.organizerInfo?.sponsors || [],
  );

  // Co-organizers
  const [coOrganizers, setCoOrganizers] = useState<CoOrganizer[]>(
    existingEvent?.organizerInfo?.coOrganizers || [],
  );

  // Step 3 - Gadgets / Shop
  const [gadgets, setGadgets] = useState<GadgetFormData[]>(() => {
    if (!existingEvent?.merchandise) return [];
    return existingEvent.merchandise.map((m) => ({
      id: m.id,
      name: m.name,
      descriptionHtml: m.descriptionHtml || '',
      documents: m.documents || [],
      brand: m.brand || '',
      price: String(m.price),
      originalPrice: m.originalPrice != null ? String(m.originalPrice) : '',
      sizes: m.sizes,
      colors: m.colors,
      imageUrl: m.imageUrl || '',
      images: (m.images || []).map((img) =>
        typeof img === 'string' ? { id: `img-${Date.now()}-${Math.random()}`, url: img } : img,
      ),
      available: m.available,
      stockCount: m.stockCount != null ? String(m.stockCount) : '',
      quantityMode: m.quantityMode || 'any',
      quantityMax: m.quantityMax != null ? String(m.quantityMax) : '',
      saleFrom: m.saleFrom || '',
      saleTo: m.saleTo || '',
      distanceIds: m.distanceIds || [],
    }));
  });

  const addGadget = () => setGadgets((prev) => [...prev, emptyGadget()]);

  const removeGadget = (id: string) => setGadgets((prev) => prev.filter((g) => g.id !== id));

  const updateGadget = (id: string, patch: Partial<GadgetFormData>) =>
    setGadgets((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

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

  // Organizer contacts handlers
  const addOrganizerContact = () => {
    setOrganizerContacts((prev) => [
      ...prev,
      { id: `contact-${Date.now()}`, email: '', phone: '' },
    ]);
  };

  const removeOrganizerContact = (id: string) => {
    setOrganizerContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const updateOrganizerContact = (id: string, updates: Partial<OrganizerContactEntry>) => {
    setOrganizerContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Sponsor handlers
  const addSponsor = () => {
    setSponsors((prev) => [
      ...prev,
      { id: `sponsor-${Date.now()}`, name: '', url: '', logoUrl: '' },
    ]);
  };

  const removeSponsor = (id: string) => {
    setSponsors((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSponsor = (id: string, updates: Partial<EventSponsor>) => {
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Co-organizer handlers
  const addCoOrganizer = () => {
    setCoOrganizers((prev) => [...prev, { id: `coorg-${Date.now()}`, name: '' }]);
  };

  const removeCoOrganizer = (id: string) => {
    setCoOrganizers((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCoOrganizer = (id: string, updates: Partial<CoOrganizer>) => {
    setCoOrganizers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Categories
  const generateStandardAgeCategories = () => generateStandardAgeCategoriesForDate(date);

  const existingAgeCats = existingEvent?.distances?.[0]?.ageCategories;
  const existingSpecialCats = existingEvent?.distances?.[0]?.specialCategories;

  const [categoriesEnabled, setCategoriesEnabled] = useState<boolean>(
    existingAgeCats === undefined
      ? true
      : Array.isArray(existingAgeCats) && existingAgeCats.length > 0,
  );
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(
    Array.isArray(existingAgeCats) ? existingAgeCats : [],
  );
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>(
    existingSpecialCats || [],
  );

  // Distances
  const initGlobalAgeCatIds = (existingEvent?.distances?.[0]?.ageCategories || []).map((c) => c.id);
  const initGlobalSpecialCatIds = (existingEvent?.distances?.[0]?.specialCategories || []).map(
    (c) => c.id,
  );
  const initAllGlobalCatIds = [...initGlobalAgeCatIds, ...initGlobalSpecialCatIds];
  const [distances, setDistances] = useState<DistanceFormData[]>(
    existingEvent?.distances.map((d) => ({
      id: d.id,
      noLength: !d.length,
      length: d.length?.toString() ?? '',
      unit: d.unit,
      noName: !!d.length && d.name === formatDistanceName(d.length.toString(), d.unit),
      name: !!d.length && d.name === formatDistanceName(d.length.toString(), d.unit) ? '' : d.name,
      startType: d.startType || (d.relayMinTeamSize || d.relayMaxTeamSize ? 'relay' : 'individual'),
      relayMinTeamSize: d.relayMinTeamSize?.toString() || '',
      relayMaxTeamSize: d.relayMaxTeamSize?.toString() || '',
      relayTeamCompletionDeadline: d.relayTeamCompletionDeadline || '',
      price: d.price.toString(),
      officePrice: officeVariantOf(d)?.price?.toString() || '',
      limit: d.limit?.toString() || '',
      infoHtml: d.infoHtml || '',
      priceTiers: d.priceTiers || [],
      disabledCategoryIds: initAllGlobalCatIds.filter(
        (id) =>
          !(d.ageCategories || []).some((c) => c.id === id) &&
          !(d.specialCategories || []).some((c) => c.id === id),
      ),
      routeMapUrl: d.routeMapUrl || '',
      routeElevationProfile: d.routeElevationProfile || '',
      routeGpxUrl: d.routeGpxUrl || '',
      routeFiles: d.routeFiles || [],
      distanceDocuments: d.documents || [],
    })) || [],
  );

  useEffect(() => {
    if (!isEditing || !id) return;
    setEventLoadError('');
    getEventById(id)
      .then((response) => {
        if (response.data) setExistingEvent(response.data);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Nie udało się wczytać danych wydarzenia do edycji.';
        setEventLoadError(message);
        toast({
          title: 'Nie udało się wczytać wydarzenia',
          description: message,
          variant: 'destructive',
        });
      });
  }, [id, isEditing, toast]);

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
    setIsPrivate(existingEvent.visibility === 'private');
    setAccessCode(existingEvent.accessCode || '');
    setBannerUrl(existingEvent.bannerUrl || '');
    setOriginalBannerUrl(existingEvent.originalBannerUrl || '');
    setBannerCropArea(existingEvent.bannerCropArea);
    setOrganizerLogoUrl(existingEvent.organizerLogoUrl || '');
    setOriginalOrganizerLogoUrl(existingEvent.originalOrganizerLogoUrl || '');
    setOrganizerLogoShape(existingEvent.organizerLogoShape || 'square');
    setBackgroundId(existingEvent.backgroundId || '');
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
      setDisplayOptions(
        opts
          ? {
              ...DEFAULT_DISPLAY_OPTIONS,
              ...opts,
              showParticipants: opts.showParticipants ?? (opts.hideUnpaid ? 'paid_only' : 'all'),
            }
          : DEFAULT_DISPLAY_OPTIONS,
      );
    }
    setLogisticsInfo(existingEvent.logisticsInfo || {});
    setOrganizerContacts(existingEvent.organizerInfo?.contacts || []);
    setSponsors(existingEvent.organizerInfo?.sponsors || []);
    setCoOrganizers(existingEvent.organizerInfo?.coOrganizers || []);
    const loadedAgeCats = existingEvent.distances?.[0]?.ageCategories;
    const hasLoadedCats = Array.isArray(loadedAgeCats) && loadedAgeCats.length > 0;
    setCategoriesEnabled(hasLoadedCats);
    setAgeCategories(
      Array.isArray(loadedAgeCats)
        ? loadedAgeCats
        : generateStandardAgeCategoriesForDate(existingEvent.date || ''),
    );
    setSpecialCategories(existingEvent.distances?.[0]?.specialCategories || []);
    const globalAgeCatIds = (existingEvent.distances?.[0]?.ageCategories || []).map((c) => c.id);
    const globalSpecialCatIds = (existingEvent.distances?.[0]?.specialCategories || []).map(
      (c) => c.id,
    );
    const allGlobalCatIds = [...globalAgeCatIds, ...globalSpecialCatIds];
    setDistances(
      existingEvent.distances.map((d) => ({
        id: d.id,
        noLength: !d.length,
        length: d.length?.toString() ?? '',
        unit: d.unit,
        noName: !!d.length && d.name === formatDistanceName(d.length.toString(), d.unit),
        name:
          !!d.length && d.name === formatDistanceName(d.length.toString(), d.unit) ? '' : d.name,
        startType:
          d.startType || (d.relayMinTeamSize || d.relayMaxTeamSize ? 'relay' : 'individual'),
        relayMinTeamSize: d.relayMinTeamSize?.toString() || '',
        relayMaxTeamSize: d.relayMaxTeamSize?.toString() || '',
        relayTeamCompletionDeadline: d.relayTeamCompletionDeadline || '',
        price: d.price.toString(),
        officePrice: officeVariantOf(d)?.price?.toString() || '',
        limit: d.limit?.toString() || '',
        infoHtml: d.infoHtml || '',
        priceTiers: d.priceTiers || [],
        disabledCategoryIds: allGlobalCatIds.filter(
          (id) =>
            !(d.ageCategories || []).some((c) => c.id === id) &&
            !(d.specialCategories || []).some((c) => c.id === id),
        ),
        routeMapUrl: d.routeMapUrl || '',
        routeElevationProfile: d.routeElevationProfile || '',
        routeGpxUrl: d.routeGpxUrl || '',
        routeFiles: d.routeFiles || [],
        distanceDocuments: d.documents || [],
      })),
    );
  }, [existingEvent]);

  useEffect(() => {
    if (!canChooseOrganizer) return;
    setOrganizersLoadError('');
    getOrganizers()
      .then((response) => {
        setOrganizers(response.data);
        if (!selectedOrganizerId && response.data[0]) {
          setSelectedOrganizerId(response.data[0].id);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Nie udało się pobrać listy organizatorów.';
        setOrganizersLoadError(message);
        toast({
          title: 'Nie udało się pobrać organizatorów',
          description: message,
          variant: 'destructive',
        });
      });
  }, [canChooseOrganizer, selectedOrganizerId, toast]);

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
      setEventLimitError('');
      return;
    }
    setEventLimitError('');
    getOrganizerEventLimit(selectedOrganizerId)
      .then((response) => setEventLimit(response.data))
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Nie udało się pobrać limitu wydarzeń.';
        setEventLimit(null);
        setEventLimitError(message);
        toast({
          title: 'Nie udało się pobrać limitu wydarzeń',
          description: message,
          variant: 'destructive',
        });
      });
  }, [selectedOrganizerId, toast]);

  // Distance handlers
  const addDistance = () => {
    setDistances((prev) => [
      ...prev,
      {
        id: `dist-${Date.now()}`,
        name: '',
        noName: false,
        noLength: false,
        length: '',
        unit: 'km',
        startType: 'individual',
        relayMinTeamSize: '',
        relayMaxTeamSize: '',
        relayTeamCompletionDeadline: '',
        price: '',
        officePrice: '',
        limit: '',
        infoHtml: '',
        priceTiers: [],
        disabledCategoryIds: [],
        routeMapUrl: '',
        routeElevationProfile: '',
        routeGpxUrl: '',
        routeFiles: [],
        distanceDocuments: [],
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
        name: '',
        noName: true,
        noLength: false,
        length: template.length,
        unit: template.unit,
        startType: 'individual',
        relayMinTeamSize: '',
        relayMaxTeamSize: '',
        relayTeamCompletionDeadline: '',
        price: '',
        officePrice: '',
        limit: '',
        infoHtml: '',
        priceTiers: [],
        disabledCategoryIds: [],
        routeMapUrl: '',
        routeElevationProfile: '',
        routeGpxUrl: '',
        routeFiles: [],
        distanceDocuments: [],
      },
    ]);
  };

  const removeDistance = (index: number) => {
    setDistances((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDistance = (
    index: number,
    field: keyof DistanceFormData,
    value: string | boolean | string[] | DistanceRouteFile[] | PriceTier[] | DistanceStartType,
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
      updated[distIndex] = {
        ...dist,
        priceTiers: [
          ...dist.priceTiers,
          {
            id: `pt-${Date.now()}`,
            name: 'Cena promocyjna',
            discountType: 'fixed',
            discountValue: 0,
            endDate: '',
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

  const addDistanceDocument = (distIndex: number, doc: Omit<DistanceDocument, 'id'>) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        distanceDocuments: [
          ...updated[distIndex].distanceDocuments,
          { ...doc, id: `dd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
        ],
      };
      return updated;
    });
  };

  const removeDistanceDocument = (distIndex: number, docId: string) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        distanceDocuments: updated[distIndex].distanceDocuments.filter((d) => d.id !== docId),
      };
      return updated;
    });
  };

  const updateDistanceDocument = (
    distIndex: number,
    docId: string,
    field: keyof Omit<DistanceDocument, 'id'>,
    value: string,
  ) => {
    setDistances((prev) => {
      const updated = [...prev];
      updated[distIndex] = {
        ...updated[distIndex],
        distanceDocuments: updated[distIndex].distanceDocuments.map((d) =>
          d.id === docId ? { ...d, [field]: value } : d,
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
      const lengthValue = parseNumberInput(dist.length);
      const priceValue = parseNumberInput(dist.price);
      const limitValue = parseNumberInput(dist.limit);
      const officePriceValue = parseNumberInput(dist.officePrice);
      const relayMinTeamSize = parseNumberInput(dist.relayMinTeamSize);
      const relayMaxTeamSize = parseNumberInput(dist.relayMaxTeamSize);

      if (
        (!dist.noName && !dist.name.trim()) ||
        (!dist.noLength && isBlank(dist.length)) ||
        isBlank(dist.price)
      ) {
        addError('distances', 'Wypełnij wszystkie pola dystansów');
      }
      if (!dist.noLength && !isBlank(dist.length) && (lengthValue === null || lengthValue <= 0)) {
        addError('distances', 'Dlugosc dystansu musi byc poprawna liczba wieksza od 0');
      }
      if (!isBlank(dist.price) && (priceValue === null || priceValue < 0)) {
        addError('distances', 'Cena dystansu musi byc poprawna liczba i nie moze byc ujemna');
      }
      if (!isBlank(dist.limit) && (limitValue === null || !isPositiveInteger(limitValue))) {
        addError('distances', 'Limit uczestnikow musi byc dodatnia liczba calkowita albo pusty');
      }
      if (!isBlank(dist.officePrice) && (officePriceValue === null || officePriceValue < 0)) {
        addError(
          'distances',
          'Cena w biurze zawodow musi byc poprawna liczba i nie moze byc ujemna',
        );
      }
      if (dist.startType === 'relay') {
        if (
          isBlank(dist.relayMinTeamSize) ||
          relayMinTeamSize === null ||
          !isPositiveInteger(relayMinTeamSize)
        ) {
          addError('distances', 'Podaj minimalna liczbe zawodnikow w sztafecie');
        }
        if (
          isBlank(dist.relayMaxTeamSize) ||
          relayMaxTeamSize === null ||
          !isPositiveInteger(relayMaxTeamSize)
        ) {
          addError('distances', 'Podaj maksymalna liczbe zawodnikow w sztafecie');
        }
        if (
          relayMinTeamSize !== null &&
          relayMaxTeamSize !== null &&
          relayMaxTeamSize < relayMinTeamSize
        ) {
          addError(
            'distances',
            'Maksymalna liczba zawodnikow w sztafecie nie moze byc mniejsza niz minimalna',
          );
        }
        if (isBlank(dist.relayTeamCompletionDeadline)) {
          addError('distances', 'Podaj deadline kompletowania skladu sztafety');
        }
        if (dist.relayTeamCompletionDeadline && date && dist.relayTeamCompletionDeadline > date) {
          addError(
            'distances',
            'Deadline kompletowania skladu sztafety nie moze byc pozniejszy niz data wydarzenia',
          );
        }
      }
      if (skipSystemPaymentConfig) continue;

      for (const tier of dist.priceTiers) {
        const tierPrice = parseNumberInput(tier.price);
        const hasExplicitPrice = tier.price !== undefined && tier.price !== null;
        if (!tier.name.trim()) {
          addError('distances', 'Kazdy prog cenowy musi miec nazwe');
        }
        if (hasExplicitPrice && (tierPrice === null || tierPrice < 0)) {
          addError('distances', 'Cena w progu musi byc poprawna liczba i nie moze byc ujemna');
        }
        if (tier.endDate) {
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
        if (!isBlank(tier.participantLimit)) {
          const participantLimit = parseNumberInput(tier.participantLimit);
          if (participantLimit === null || participantLimit <= 0) {
            addError('distances', 'Limit uczestnikow w progu musi byc dodatnia liczba');
          } else if (!Number.isInteger(participantLimit)) {
            addError('distances', 'Limit uczestnikow w progu musi byc liczba calkowita');
          } else if (limitValue !== null && participantLimit > limitValue) {
            addError(
              'distances',
              'Limit uczestnikow w progu nie moze byc wyzszy niz limit dystansu',
            );
          }
        }
      }
      const tierDates = dist.priceTiers.map((tier) => tier.endDate).filter(Boolean);
      if (new Set(tierDates).size !== tierDates.length) {
        addError('distances', 'Daty koncowe progow cenowych nie moga sie powtarzac');
      }
      const tierParticipantLimits = dist.priceTiers
        .map((tier) => parseNumberInput(tier.participantLimit))
        .filter((value): value is number => value !== null);
      if (new Set(tierParticipantLimits).size !== tierParticipantLimits.length) {
        addError('distances', 'Limity uczestnikow w progach cenowych nie moga sie powtarzac');
      }
    }

    for (const gadget of gadgets) {
      if (!gadget.name.trim()) continue;
      const price = parseNumberInput(gadget.price);
      const originalPrice = parseNumberInput(gadget.originalPrice);
      const stockCount = parseNumberInput(gadget.stockCount);
      const quantityMax = parseNumberInput(gadget.quantityMax);
      if (price === null || price < 0) {
        addError('gadgets', 'Cena gadzetu musi byc poprawna liczba i nie moze byc ujemna');
      }
      if (!isBlank(gadget.originalPrice) && (originalPrice === null || originalPrice < 0)) {
        addError(
          'gadgets',
          'Cena regularna gadzetu musi byc poprawna liczba i nie moze byc ujemna',
        );
      }
      if (!isBlank(gadget.stockCount) && (stockCount === null || !isPositiveInteger(stockCount))) {
        addError(
          'gadgets',
          'Stan magazynowy gadzetu musi byc dodatnia liczba calkowita albo pusty',
        );
      }
      if (
        gadget.quantityMode === 'max' &&
        (quantityMax === null || !isPositiveInteger(quantityMax))
      ) {
        addError('gadgets', 'Maksymalna liczba sztuk gadzetu musi byc dodatnia liczba calkowita');
      }
      if (gadget.saleFrom && gadget.saleTo && gadget.saleFrom > gadget.saleTo) {
        addError(
          'gadgets',
          'Data poczatku sprzedazy gadzetu nie moze byc pozniejsza niz data konca',
        );
      }
    }

    return errors;
  };

  const getFieldValidationErrors = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!name) errors['name'] = 'Nazwa wydarzenia jest wymagana';
    if (!date) errors['date'] = 'Data wydarzenia jest wymagana';
    if (!registrationDeadline)
      errors['registrationDeadline'] = 'Termin zamknięcia zapisów jest wymagany';
    if (registrationDeadline && date && registrationDeadline > date) {
      errors['registrationDeadline'] =
        'Termin rejestracji nie może być późniejszy niż data wydarzenia';
    }
    if (!isVirtual && !location) errors['location'] = 'Lokalizacja jest wymagana';
    if (!isVirtual && !city) errors['city'] = 'Miasto jest wymagane';
    if (isVirtual && !startDate) errors['startDate'] = 'Data rozpoczęcia okna jest wymagana';
    if (isVirtual && !endDate) errors['endDate'] = 'Data zakończenia okna jest wymagana';
    if (isVirtual && startDate && endDate && startDate > endDate) {
      errors['startDate'] = 'Data rozpoczęcia nie może być późniejsza niż data zakończenia';
    }
    if (isPrivate && !accessCode.trim()) errors['accessCode'] = 'Kod dostępu jest wymagany';

    if (registrationMode === 'external_embed') {
      const trimmedUrl = externalRegistrationUrl.trim();
      if (!trimmedUrl) {
        errors['externalRegistrationUrl'] = 'Podaj link do zewnętrznego formularza zapisów';
      } else {
        try {
          const parsedUrl = new URL(trimmedUrl);
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
        } catch {
          errors['externalRegistrationUrl'] = 'Link musi być pełnym adresem http lub https';
        }
      }
    }

    if (registrationMode !== 'external_embed' && paymentConfigType === 'organizer_bank') {
      if (!bankAccountNumber.trim()) errors['bankAccountNumber'] = 'Numer konta jest wymagany';
      if (!bankAccountHolder.trim()) errors['bankAccountHolder'] = 'Właściciel konta jest wymagany';
    }

    for (const [i, dist] of distances.entries()) {
      const lengthValue = parseNumberInput(dist.length);
      const priceValue = parseNumberInput(dist.price);
      const limitValue = parseNumberInput(dist.limit);
      const officePriceValue = parseNumberInput(dist.officePrice);
      const relayMinTeamSize = parseNumberInput(dist.relayMinTeamSize);
      const relayMaxTeamSize = parseNumberInput(dist.relayMaxTeamSize);

      if (!dist.noName && !dist.name.trim())
        errors[`distance_${i}_name`] = 'Nazwa dystansu jest wymagana';
      if (!dist.noLength && isBlank(dist.length))
        errors[`distance_${i}_length`] = 'Długość dystansu jest wymagana';
      else if (!dist.noLength && (lengthValue === null || lengthValue <= 0))
        errors[`distance_${i}_length`] = 'Długość musi być poprawną liczbą większą od 0';
      if (isBlank(dist.price)) errors[`distance_${i}_price`] = 'Cena jest wymagana';
      else if (priceValue === null || priceValue < 0)
        errors[`distance_${i}_price`] = 'Cena musi być poprawną liczbą i nie może być ujemna';
      if (!isBlank(dist.limit) && (limitValue === null || !isPositiveInteger(limitValue))) {
        errors[`distance_${i}_limit`] =
          'Limit uczestników musi być dodatnią liczbą całkowitą albo pusty';
      }
      if (!isBlank(dist.officePrice) && (officePriceValue === null || officePriceValue < 0)) {
        errors[`distance_${i}_officePrice`] =
          'Cena biurowa musi być poprawną liczbą i nie może być ujemna';
      }
      if (dist.startType === 'relay') {
        if (
          isBlank(dist.relayMinTeamSize) ||
          relayMinTeamSize === null ||
          !isPositiveInteger(relayMinTeamSize)
        ) {
          errors[`distance_${i}_relayMinTeamSize`] =
            'Podaj minimalną liczbę zawodników w sztafecie';
        }
        if (
          isBlank(dist.relayMaxTeamSize) ||
          relayMaxTeamSize === null ||
          !isPositiveInteger(relayMaxTeamSize)
        ) {
          errors[`distance_${i}_relayMaxTeamSize`] =
            'Podaj maksymalną liczbę zawodników w sztafecie';
        } else if (relayMinTeamSize !== null && relayMaxTeamSize < relayMinTeamSize) {
          errors[`distance_${i}_relayMaxTeamSize`] = 'Maksimum nie może być mniejsze niż minimum';
        }
        if (isBlank(dist.relayTeamCompletionDeadline)) {
          errors[`distance_${i}_relayTeamCompletionDeadline`] =
            'Deadline kompletowania składu jest wymagany';
        } else if (date && dist.relayTeamCompletionDeadline > date) {
          errors[`distance_${i}_relayTeamCompletionDeadline`] =
            'Deadline nie może być późniejszy niż data wydarzenia';
        }
      }
      if (registrationMode !== 'external_embed') {
        for (const [j, tier] of dist.priceTiers.entries()) {
          if (!tier.name.trim())
            errors[`distance_${i}_tier_${j}_name`] = 'Nazwa progu jest wymagana';
          if (tier.endDate && Number.isNaN(new Date(tier.endDate).getTime())) {
            errors[`distance_${i}_tier_${j}_endDate`] = 'Data końcowa progu jest nieprawidłowa';
          }
          if (
            !isBlank(tier.participantLimit) &&
            (parseNumberInput(tier.participantLimit) === null ||
              parseNumberInput(tier.participantLimit)! <= 0)
          ) {
            errors[`distance_${i}_tier_${j}_participantLimit`] = 'Podaj dodatni limit uczestników';
          }
        }
      }
    }

    return errors;
  };

  const sectionValidationErrors = getSectionValidationErrors();
  const fieldValidationErrors = getFieldValidationErrors();
  const getFirstValidationError = () =>
    STEP_NAV_ITEMS.flatMap((item) => sectionValidationErrors[item.id] ?? [])[0];
  const getFirstCurrentSectionError = () => sectionValidationErrors[subStep]?.[0];

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

  const markValidationShown = (s: SubStep) => {
    setShownValidationSubSteps((prev) => (prev.includes(s) ? prev : [...prev, s]));
  };

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

    markValidationShown(subStep);
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
    markValidationShown(subStep);
    const sectionError = getFirstCurrentSectionError();
    if (sectionError) {
      toast({
        title: 'Uzupełnij tę sekcję',
        description: sectionError,
        variant: 'destructive',
      });
      return;
    }
    if (subStep === 'distances') {
      // Tiers are evaluated in this order by the server (first non-expired one wins), so
      // push any tier with neither limit set to the end — it never expires and would
      // otherwise shadow every tier configured after it.
      setDistances((prev) =>
        prev.map((dist) => ({
          ...dist,
          priceTiers: [...dist.priceTiers].sort((a, b) => {
            const aNeverExpires = !a.endDate && a.participantLimit == null;
            const bNeverExpires = !b.endDate && b.participantLimit == null;
            return Number(aNeverExpires) - Number(bNeverExpires);
          }),
        })),
      );
    }
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
    markValidationShown(subStep);
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
      locationMapsUrl: locationMapsUrl || undefined,
      city,
      description,
      imageUrl,
      originalImageUrl: originalImageUrl || undefined,
      distances: distances.map((dist) => ({
        id: dist.id,
        name: dist.noName ? formatDistanceName(dist.length, dist.unit) : dist.name,
        length: dist.noLength ? undefined : (parseNumberInput(dist.length) ?? undefined),
        unit: dist.unit,
        startType: dist.startType,
        relayMinTeamSize:
          dist.startType === 'relay'
            ? (parseNumberInput(dist.relayMinTeamSize) ?? undefined)
            : undefined,
        relayMaxTeamSize:
          dist.startType === 'relay'
            ? (parseNumberInput(dist.relayMaxTeamSize) ?? undefined)
            : undefined,
        relayTeamCompletionDeadline:
          dist.startType === 'relay' ? dist.relayTeamCompletionDeadline || undefined : undefined,
        price: parseNumberInput(dist.price) ?? 0,
        pricingVariants: (() => {
          const officePrice = parseNumberInput(dist.officePrice);
          return officePrice == null
            ? []
            : [
                {
                  id: `pv-office-${dist.id}`,
                  name: OFFICE_PRICING_VARIANT_NAME,
                  price: officePrice,
                  officeOnly: true,
                  visibleInPublicForm: false,
                  sortOrder: 0,
                },
              ];
        })(),
        infoHtml: dist.infoHtml || undefined,
        limit: parseNumberInput(dist.limit) ?? undefined,
        priceTiers: dist.priceTiers.map((tier) => ({
          ...tier,
          price: tier.price != null ? (parseNumberInput(tier.price) ?? undefined) : undefined,
          discountValue: parseNumberInput(tier.discountValue) ?? 0,
          participantLimit: parseNumberInput(tier.participantLimit) ?? undefined,
          endDate: tier.endDate || undefined,
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
        documents: dist.distanceDocuments.length > 0 ? dist.distanceDocuments : undefined,
      })),
      organizerId: selectedOrganizerId,
      organizerName: organizer?.companyName || organizer?.name || '',
      registrationDeadline,
      registrationOpenDate: registrationOpenDate || undefined,
      registrationUntilEventStart,
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
      rulesHtml,
      finalAcceptanceHtml,
      requireFinalAcceptance,
      visibility: isPrivate ? ('private' as const) : ('public' as const),
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
      backgroundId: backgroundId || undefined,
      organizerInfo: {
        contacts: organizerContacts.filter((c) => c.email?.trim() || c.phone?.trim()),
        sponsors: sponsors.filter((s) => s.name.trim()),
        coOrganizers: coOrganizers.filter((c) => c.name.trim()),
      },
      merchandise: gadgets
        .filter((g) => g.name.trim())
        .map((g) => ({
          id: g.id,
          name: g.name.trim(),
          descriptionHtml: g.descriptionHtml || undefined,
          documents: g.documents.length > 0 ? g.documents : undefined,
          brand: g.brand || undefined,
          price: parseNumberInput(g.price) ?? 0,
          originalPrice: parseNumberInput(g.originalPrice) ?? undefined,
          sizes: g.sizes,
          colors: g.colors,
          imageUrl: g.imageUrl || undefined,
          images: g.images.length > 0 ? g.images : undefined,
          available: g.available,
          stockCount: parseNumberInput(g.stockCount) ?? undefined,
          quantityMode: g.quantityMode,
          quantityMax:
            g.quantityMode === 'max' ? (parseNumberInput(g.quantityMax) ?? undefined) : undefined,
          saleFrom: g.saleFrom || undefined,
          saleTo: g.saleTo || undefined,
          distanceIds: g.distanceIds.length > 0 ? g.distanceIds : undefined,
        })),
    };
    return canManageFeatured ? { ...payload, featured } : payload;
  };

  const selectedEventLimit = eventLimit;

  const handleSubmit = async () => {
    setShownValidationSubSteps(STEP_NAV_ITEMS.map((item) => item.id));
    if (!selectedOrganizerId) {
      toast({
        title: 'Błąd',
        description: 'Wybierz organizatora wydarzenia',
        variant: 'destructive',
      });
      return;
    }
    if (!isEditing && eventLimitError) {
      toast({
        title: 'Nie można potwierdzić limitu wydarzeń',
        description: eventLimitError,
        variant: 'destructive',
      });
      return;
    }
    if (!isEditing && !selectedEventLimit) {
      toast({
        title: 'Limit wydarzeń jest jeszcze sprawdzany',
        description: 'Poczekaj na pobranie limitu organizatora i spróbuj ponownie.',
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
    originalIsPrivate: existingEvent?.visibility === 'private',
    privacyChanged: isEditing && (existingEvent?.visibility === 'private') !== isPrivate,
    step,
    navigate,
    toast,
    user,
    canChooseOrganizer,
    canManageFeatured,
    organizers,
    organizersLoadError,
    selectedOrganizerId,
    setSelectedOrganizerId,
    eventLimit,
    eventLimitError,
    eventLoadError,
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
    registrationOpenDate,
    setRegistrationOpenDate,
    registrationUntilEventStart,
    setRegistrationUntilEventStart,
    location,
    setLocation,
    locationMapsUrl,
    setLocationMapsUrl,
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
    backgroundId,
    setBackgroundId,
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
    organizerContacts,
    setOrganizerContacts,
    addOrganizerContact,
    removeOrganizerContact,
    updateOrganizerContact,
    sponsors,
    setSponsors,
    addSponsor,
    removeSponsor,
    updateSponsor,
    coOrganizers,
    setCoOrganizers,
    addCoOrganizer,
    removeCoOrganizer,
    updateCoOrganizer,

    // Step 2
    categoriesEnabled,
    setCategoriesEnabled,
    ageCategories,
    setAgeCategories,
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
    addDistanceDocument,
    removeDistanceDocument,
    updateDistanceDocument,
    toggleCategoryForDistance,
    allCategories,

    // Step 3 - Gadgets
    gadgets,
    setGadgets,
    addGadget,
    removeGadget,
    updateGadget,

    // Step 4
    // Sub-step navigation
    subStep,
    setSubStep,
    visitedSubSteps,
    revisitedSubSteps,
    shownValidationSubSteps,
    sectionValidationErrors,
    fieldValidationErrors,
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
