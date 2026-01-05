import { Event, User, Registration, Result, Certificate, Message, PersonalRecord, Partner, PaymentMethod, EventMerchandise, DiscountCode, PriceTier, InsuranceOption, EventSeries, SeriesType } from '@/types';

export const seriesTypeLabels: Record<SeriesType, string> = {
  virtual: 'Wirtualna',
  local: 'Ustawka lokalna',
  championship: 'Mistrzostwa',
  cup: 'Cykl / Grand Prix',
};

export const seriesTypeIcons: Record<SeriesType, string> = {
  virtual: '🌐',
  local: '📍',
  championship: '🏆',
  cup: '🎯',
};

export const mockSeries: EventSeries[] = [
  {
    id: 'series1',
    name: 'Wirtualne Biegi Polska 2026',
    slug: 'wirtualne-biegi-polska-2026',
    type: 'virtual',
    description: 'Seria 12 wirtualnych biegów - jeden w każdym miesiącu. Biegnij gdziekolwiek jesteś! Zbieraj punkty i walcz o nagrody. Każdy uczestnik otrzymuje medal finishera po ukończeniu minimum 6 biegów.',
    organizerId: 'o3',
    organizerName: 'RunPoland',
    eventIds: ['e12', 'e13'],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
  },
  {
    id: 'series2',
    name: 'Grand Prix Biegowe Mazowsze',
    slug: 'grand-prix-biegowe-mazowsze',
    type: 'cup',
    description: 'Cykl 6 biegów na Mazowszu. Zbieraj punkty i walcz o nagrody w klasyfikacji generalnej! Punktacja: 1. miejsce - 100 pkt, 2. miejsce - 80 pkt, 3. miejsce - 60 pkt, itd.',
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    eventIds: ['e11', 'e15'],
    rules: 'Punktacja: 1. miejsce - 100 pkt, 2. miejsce - 80 pkt, 3. miejsce - 60 pkt, 4. miejsce - 50 pkt, 5. miejsce - 45 pkt. Pozostali uczestnicy otrzymują punkty wg wzoru: 40 - (pozycja - 5).',
    startDate: '2026-03-01',
    endDate: '2026-10-31',
    status: 'active',
  },
  {
    id: 'series3',
    name: 'Parkrun Warszawa',
    slug: 'parkrun-warszawa',
    type: 'local',
    description: 'Cotygodniowe ustawki biegowe w parkach Warszawy. Każda sobota o 9:00. Darmowe! Dołącz do społeczności biegaczy i trenuj razem z nami. Nie wymagamy zapisów - po prostu przyjdź!',
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    eventIds: [],
    status: 'active',
  },
  {
    id: 'series4',
    name: 'Mistrzostwa Polski w Triathlonie 2026',
    slug: 'mistrzostwa-polski-triathlon-2026',
    type: 'championship',
    description: 'Oficjalna seria mistrzostw Polski w triathlonie. Zawody kwalifikacyjne odbywają się w całej Polsce, a finał w Gdyni. Zwycięzcy otrzymują tytuł Mistrza Polski.',
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    eventIds: ['e14'],
    startDate: '2026-05-01',
    endDate: '2026-09-30',
    status: 'upcoming',
  },
];

export const mockUsers: User[] = [
  { id: 'p1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
  { id: 'p2', name: 'Anna Nowak', email: 'anna@example.com', role: 'participant' },
  { id: 'p3', name: 'Piotr Wiśniewski', email: 'piotr@example.com', role: 'participant' },
  { id: 'p4', name: 'Katarzyna Biegacz', email: 'kasia@example.com', role: 'participant' },
  { id: 'p5', name: 'Tomasz Kolarz', email: 'tomek@example.com', role: 'participant' },
  { id: 'o1', name: 'Marek Organizator', email: 'marek@timing.pl', role: 'organizer' },
  { id: 'o2', name: 'Sportowe Wydarzenia Sp. z o.o.', email: 'info@sportevents.pl', role: 'organizer' },
  { id: 'o3', name: 'RunPoland', email: 'kontakt@runpoland.pl', role: 'organizer' },
  { id: 'a1', name: 'Admin Platformy', email: 'admin@sporttime.pl', role: 'admin' },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm1', name: 'Przelew bankowy', enabled: true },
  { id: 'pm2', name: 'BLIK', enabled: true },
  { id: 'pm3', name: 'Karta płatnicza', enabled: true },
  { id: 'pm4', name: 'PayU', enabled: false },
  { id: 'pm5', name: 'Płatność na miejscu (gotówka)', enabled: false },
];

export const mockMerchandise: EventMerchandise[] = [
  {
    id: 'merch1',
    name: 'Koszulka pamiątkowa',
    description: 'Oficjalna koszulka techniczna z logo wydarzenia',
    price: 89,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { id: 'c1', name: 'Biały', hex: '#FFFFFF' },
      { id: 'c2', name: 'Czarny', hex: '#000000' },
      { id: 'c3', name: 'Niebieski', hex: '#2563EB' },
    ],
    imageUrl: 'https://via.placeholder.com/200x200?text=Koszulka',
    available: true,
  },
  {
    id: 'merch2',
    name: 'Medal pamiątkowy',
    description: 'Ekskluzywny medal dla wszystkich finisherów',
    price: 49,
    sizes: [],
    colors: [
      { id: 'c4', name: 'Złoty', hex: '#FFD700' },
      { id: 'c5', name: 'Srebrny', hex: '#C0C0C0' },
    ],
    imageUrl: 'https://via.placeholder.com/200x200?text=Medal',
    available: true,
  },
  {
    id: 'merch3',
    name: 'Bidon sportowy',
    description: 'Bidon 750ml z logo wydarzenia',
    price: 35,
    sizes: [],
    colors: [
      { id: 'c6', name: 'Przezroczysty', hex: '#E5E7EB' },
      { id: 'c7', name: 'Zielony', hex: '#10B981' },
    ],
    imageUrl: 'https://via.placeholder.com/200x200?text=Bidon',
    available: true,
  },
];

export const mockPartners: Partner[] = [
  { id: 'partner1', name: 'Polski Związek Lekkiej Atletyki', logoUrl: 'https://via.placeholder.com/200x80?text=PZLA', websiteUrl: 'https://pzla.pl', featured: true },
  { id: 'partner2', name: 'Salomon', logoUrl: 'https://via.placeholder.com/200x80?text=Salomon', websiteUrl: 'https://salomon.com', featured: true },
  { id: 'partner3', name: 'Garmin', logoUrl: 'https://via.placeholder.com/200x80?text=Garmin', websiteUrl: 'https://garmin.com', featured: true },
  { id: 'partner4', name: 'Compressport', logoUrl: 'https://via.placeholder.com/200x80?text=Compressport', websiteUrl: 'https://compressport.com', featured: true },
  { id: 'partner5', name: '4F', logoUrl: 'https://via.placeholder.com/200x80?text=4F', websiteUrl: 'https://4f.com.pl', featured: true },
  { id: 'partner6', name: 'Endomondo', logoUrl: 'https://via.placeholder.com/200x80?text=Endomondo', websiteUrl: 'https://endomondo.com', featured: true },
];

// Helper for creating price tiers relative to current date
const createPriceTiers = (eventDate: string, basePrice: number): PriceTier[] => {
  const event = new Date(eventDate);
  const earlyBirdEnd = new Date(event);
  earlyBirdEnd.setDate(event.getDate() - 60);
  const regularEnd = new Date(event);
  regularEnd.setDate(event.getDate() - 14);
  
  return [
    {
      id: 'pt1',
      name: 'Early Bird',
      price: Math.round(basePrice * 0.7),
      endDate: earlyBirdEnd.toISOString().split('T')[0],
      description: 'Zapisz się wcześniej i zaoszczędź 30%!'
    },
    {
      id: 'pt2',
      name: 'Cena regularna',
      price: basePrice,
      endDate: regularEnd.toISOString().split('T')[0],
      description: 'Standardowa cena startowa'
    },
    {
      id: 'pt3',
      name: 'Last Minute',
      price: Math.round(basePrice * 1.2),
      endDate: eventDate,
      description: 'Ostatnia szansa na zapis!'
    }
  ];
};

export const mockEvents: Event[] = [
  // Event with full registration options - Bieg Górski Tatry Ultra
  {
    id: 'e11',
    name: 'Bieg Górski Tatry Ultra 2026',
    slug: 'bieg-gorski-tatry-ultra-2026',
    discipline: 'running',
    date: '2026-06-15',
    location: 'Kuźnice',
    city: 'Zakopane',
    description: 'Najtrudniejszy górski ultramaraton w Polsce! Trasa prowadzi przez najwyższe partie Tatr Zachodnich. Przewyższenie +4500m. Limit czasu 24h.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    distances: [
      { 
        id: 'd20', 
        name: 'Ultra 80K', 
        length: 80, 
        unit: 'km', 
        categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55-59', 'M60+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], 
        limit: 300, 
        registeredCount: 187, 
        price: 450,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 315, endDate: '2026-02-28', description: 'Zaoszczędź 135 zł!' },
          { id: 'pt2', name: 'Cena regularna', price: 450, endDate: '2026-05-31', description: 'Standardowa cena' },
          { id: 'pt3', name: 'Last Minute', price: 540, endDate: '2026-06-10', description: 'Ostatnie miejsca!' }
        ]
      },
      { 
        id: 'd21', 
        name: 'Maraton 42K', 
        length: 42, 
        unit: 'km', 
        categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55-59', 'M60+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], 
        limit: 500, 
        registeredCount: 312, 
        price: 300,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 210, endDate: '2026-02-28', description: 'Zaoszczędź 90 zł!' },
          { id: 'pt2', name: 'Cena regularna', price: 300, endDate: '2026-05-31', description: 'Standardowa cena' },
          { id: 'pt3', name: 'Last Minute', price: 360, endDate: '2026-06-10', description: 'Ostatnie miejsca!' }
        ]
      },
      { 
        id: 'd22', 
        name: 'Półmaraton 21K', 
        length: 21, 
        unit: 'km', 
        categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55-59', 'M60+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], 
        limit: 800, 
        registeredCount: 543, 
        price: 180,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 126, endDate: '2026-02-28', description: 'Zaoszczędź 54 zł!' },
          { id: 'pt2', name: 'Cena regularna', price: 180, endDate: '2026-05-31', description: 'Standardowa cena' },
          { id: 'pt3', name: 'Last Minute', price: 216, endDate: '2026-06-10', description: 'Ostatnie miejsca!' }
        ]
      },
    ],
    organizerId: 'o3',
    organizerName: 'RunPoland',
    organizerContact: { email: 'ultra@runpoland.pl', phone: '+48 600 123 456', website: 'https://runpoland.pl' },
    status: 'completed',
    seriesId: 'series2',
    registrationDeadline: '2026-06-10',
    featured: true,
    paymentMethods: [
      { id: 'pm1', name: 'Przelew bankowy', enabled: true },
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm3', name: 'Karta płatnicza', enabled: true },
    ],
    merchandise: [
      {
        id: 'merch-ultra1',
        name: 'Koszulka techniczna Tatry Ultra',
        description: 'Wysokiej jakości koszulka do biegania z logo wydarzenia',
        price: 119,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          { id: 'c1', name: 'Granatowy', hex: '#1E3A5F' },
          { id: 'c2', name: 'Pomarańczowy', hex: '#F97316' },
        ],
        available: true,
      },
      {
        id: 'merch-ultra2',
        name: 'Buff górski',
        description: 'Wielofunkcyjny komin z motywem Tatr',
        price: 59,
        sizes: [],
        colors: [
          { id: 'c3', name: 'Szary', hex: '#6B7280' },
          { id: 'c4', name: 'Zielony', hex: '#059669' },
        ],
        available: true,
      },
      {
        id: 'merch-ultra3',
        name: 'Plecak biegowy 12L',
        description: 'Lekki plecak z systemem nawadniania',
        price: 249,
        sizes: ['S/M', 'L/XL'],
        colors: [
          { id: 'c5', name: 'Czarny', hex: '#000000' },
        ],
        available: true,
      },
      {
        id: 'merch-ultra4',
        name: 'Kubek termiczny 350ml',
        description: 'Stalowy kubek z logo Tatry Ultra',
        price: 49,
        sizes: [],
        colors: [
          { id: 'c6', name: 'Srebrny', hex: '#C0C0C0' },
          { id: 'c7', name: 'Czarny', hex: '#1F2937' },
        ],
        available: true,
      },
    ],
    discountCodes: [
      { id: 'dc1', code: 'ULTRA2026', discountType: 'percent', discountValue: 15, validFrom: '2026-01-01', validTo: '2026-03-31', maxUses: 100, usedCount: 23, active: true },
      { id: 'dc2', code: 'KLUB50', discountType: 'fixed', discountValue: 50, validFrom: '2026-01-01', validTo: '2026-06-01', maxUses: 200, usedCount: 87, active: true },
      { id: 'dc3', code: 'VIP100', discountType: 'fixed', discountValue: 100, validFrom: '2026-01-01', validTo: '2026-06-10', maxUses: 10, usedCount: 5, active: true },
    ],
    enableMerchandiseInRegistration: true,
    insuranceOption: {
      id: 'ins1',
      name: 'Ubezpieczenie NNW Zawodnika',
      description: 'Ubezpieczenie od następstw nieszczęśliwych wypadków podczas zawodów. Obejmuje koszty leczenia, rehabilitacji oraz świadczenie za trwały uszczerbek na zdrowiu.',
      baseFee: 9,
      ageMultiplier: 0.5,
      maxAge: 70,
      enabled: true,
    },
  },
  // City Trail Łódź - medium options
  {
    id: 'e12',
    name: 'City Trail Łódź 2026',
    slug: 'city-trail-lodz-2026',
    discipline: 'running',
    date: '2026-04-12',
    location: 'Park im. Poniatowskiego',
    city: 'Łódź',
    description: 'Bieg przełajowy w sercu Łodzi. Trasa prowadzi przez najpiękniejsze parki miasta. Idealne wydarzenie na wiosnę!',
    imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
    distances: [
      { 
        id: 'd23', 
        name: 'Trail 15K', 
        length: 15, 
        unit: 'km', 
        categories: ['M18-29', 'M30-39', 'M40-49', 'M50-59', 'M60+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], 
        limit: 600, 
        registeredCount: 234, 
        price: 90,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 65, endDate: '2026-02-15', description: 'Najlepsza cena!' },
          { id: 'pt2', name: 'Cena regularna', price: 90, endDate: '2026-04-05', description: 'Standardowa cena' }
        ]
      },
      { 
        id: 'd24', 
        name: 'Trail 7K', 
        length: 7, 
        unit: 'km', 
        categories: ['M18-29', 'M30-39', 'M40-49', 'M50-59', 'M60+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], 
        limit: 800, 
        registeredCount: 456, 
        price: 60,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 45, endDate: '2026-02-15', description: 'Najlepsza cena!' },
          { id: 'pt2', name: 'Cena regularna', price: 60, endDate: '2026-04-05', description: 'Standardowa cena' }
        ]
      },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2026-04-05',
    featured: false,
    paymentMethods: [
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm3', name: 'Karta płatnicza', enabled: true },
    ],
    merchandise: [
      {
        id: 'merch-trail1',
        name: 'Koszulka City Trail',
        description: 'Bawełniana koszulka z logo biegu',
        price: 69,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
          { id: 'c1', name: 'Zielony', hex: '#22C55E' },
          { id: 'c2', name: 'Biały', hex: '#FFFFFF' },
        ],
        available: true,
      },
    ],
    discountCodes: [
      { id: 'dc4', code: 'LODZ10', discountType: 'percent', discountValue: 10, validTo: '2026-03-01', maxUses: 50, usedCount: 12, active: true },
    ],
    enableMerchandiseInRegistration: true,
  },
  // Maraton Rowerowy Mazury - cycling with merchandise
  {
    id: 'e13',
    name: 'Maraton Rowerowy Mazury 2026',
    slug: 'maraton-rowerowy-mazury-2026',
    discipline: 'cycling',
    date: '2026-07-11',
    location: 'Centrum Żeglarstwa Mikołajki',
    city: 'Mikołajki',
    description: 'Malownicza trasa wśród jezior mazurskich. Idealne połączenie sportu i natury. Trasy dla każdego poziomu zaawansowania!',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    distances: [
      { 
        id: 'd25', 
        name: 'Gran Fondo 150K', 
        length: 150, 
        unit: 'km', 
        categories: ['M18-29', 'M30-39', 'M40-49', 'M50-59', 'M60+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], 
        limit: 400, 
        registeredCount: 156, 
        price: 220,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 160, endDate: '2026-04-30', description: 'Zaoszczędź 60 zł!' },
          { id: 'pt2', name: 'Cena regularna', price: 220, endDate: '2026-06-30', description: 'Standardowa cena' },
          { id: 'pt3', name: 'Last Minute', price: 270, endDate: '2026-07-08', description: 'Ostatnia szansa!' }
        ]
      },
      { 
        id: 'd26', 
        name: 'Medio 80K', 
        length: 80, 
        unit: 'km', 
        categories: ['M18-29', 'M30-39', 'M40-49', 'M50-59', 'M60+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], 
        limit: 600, 
        registeredCount: 287, 
        price: 150,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 110, endDate: '2026-04-30', description: 'Zaoszczędź 40 zł!' },
          { id: 'pt2', name: 'Cena regularna', price: 150, endDate: '2026-06-30', description: 'Standardowa cena' },
          { id: 'pt3', name: 'Last Minute', price: 180, endDate: '2026-07-08', description: 'Ostatnia szansa!' }
        ]
      },
      { 
        id: 'd27', 
        name: 'Mini 40K', 
        length: 40, 
        unit: 'km', 
        categories: ['Open'], 
        limit: 800, 
        registeredCount: 432, 
        price: 80,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 60, endDate: '2026-04-30', description: 'Najlepsza cena!' },
          { id: 'pt2', name: 'Cena regularna', price: 80, endDate: '2026-07-08', description: 'Standardowa cena' }
        ]
      },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'published',
    registrationDeadline: '2026-07-08',
    featured: true,
    paymentMethods: [
      { id: 'pm1', name: 'Przelew bankowy', enabled: true },
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm3', name: 'Karta płatnicza', enabled: true },
      { id: 'pm4', name: 'PayU', enabled: true },
    ],
    merchandise: [
      {
        id: 'merch-bike1',
        name: 'Koszulka kolarska Mazury',
        description: 'Profesjonalna koszulka kolarska z pełnym zamkiem',
        price: 189,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          { id: 'c1', name: 'Niebieski', hex: '#3B82F6' },
          { id: 'c2', name: 'Biały', hex: '#FFFFFF' },
        ],
        available: true,
      },
      {
        id: 'merch-bike2',
        name: 'Bidon 750ml',
        description: 'Lekki bidon z logo wydarzenia',
        price: 35,
        sizes: [],
        colors: [
          { id: 'c3', name: 'Niebieski', hex: '#3B82F6' },
          { id: 'c4', name: 'Biały', hex: '#FFFFFF' },
        ],
        available: true,
      },
      {
        id: 'merch-bike3',
        name: 'Rękawiczki kolarskie',
        description: 'Letnie rękawiczki z wkładką żelową',
        price: 79,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
          { id: 'c5', name: 'Czarny', hex: '#000000' },
        ],
        available: true,
      },
    ],
    discountCodes: [
      { id: 'dc5', code: 'MAZURY15', discountType: 'percent', discountValue: 15, validTo: '2026-05-31', maxUses: 100, usedCount: 34, active: true },
      { id: 'dc6', code: 'TEAM25', discountType: 'fixed', discountValue: 25, validTo: '2026-07-01', usedCount: 0, active: true },
    ],
    enableMerchandiseInRegistration: true,
  },
  // Sprint Triathlon Wrocław - with merchandise and insurance
  {
    id: 'e14',
    name: 'Sprint Triathlon Wrocław 2026',
    slug: 'sprint-triathlon-wroclaw-2026',
    discipline: 'triathlon',
    date: '2026-05-24',
    location: 'Stadion Olimpijski',
    city: 'Wrocław',
    description: 'Szybki triathlon w centrum Wrocławia. Pływanie w Odrze, rower po bulwarach, bieg wokół stadionu. Idealne wprowadzenie do triathlonu!',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
    distances: [
      { 
        id: 'd28', 
        name: 'Sprint', 
        length: 25.75, 
        unit: 'km', 
        categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45+'], 
        limit: 500, 
        registeredCount: 234, 
        price: 200,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 150, endDate: '2026-03-15', description: 'Zapisz się wcześniej!' },
          { id: 'pt2', name: 'Cena regularna', price: 200, endDate: '2026-05-17', description: 'Standardowa cena' }
        ]
      },
      { 
        id: 'd29', 
        name: 'Super Sprint', 
        length: 13, 
        unit: 'km', 
        categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45+'], 
        limit: 300, 
        registeredCount: 178, 
        price: 140,
        priceTiers: [
          { id: 'pt1', name: 'Early Bird', price: 100, endDate: '2026-03-15', description: 'Zapisz się wcześniej!' },
          { id: 'pt2', name: 'Cena regularna', price: 140, endDate: '2026-05-17', description: 'Standardowa cena' }
        ]
      },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'published',
    registrationDeadline: '2026-05-17',
    featured: false,
    paymentMethods: [
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm3', name: 'Karta płatnicza', enabled: true },
    ],
    merchandise: [
      {
        id: 'merch-tri1',
        name: 'Koszulka triatlonowa Wrocław',
        description: 'Szybkoschnąca koszulka z logo wydarzenia',
        price: 99,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          { id: 'c1', name: 'Niebieski', hex: '#2563EB' },
          { id: 'c2', name: 'Biały', hex: '#FFFFFF' },
        ],
        available: true,
      },
      {
        id: 'merch-tri2',
        name: 'Czepek pływacki',
        description: 'Silikonowy czepek z logo Triathlon Wrocław',
        price: 35,
        sizes: [],
        colors: [
          { id: 'c3', name: 'Niebieski', hex: '#2563EB' },
          { id: 'c4', name: 'Czarny', hex: '#000000' },
        ],
        available: true,
      },
      {
        id: 'merch-tri3',
        name: 'Kubek pamiątkowy',
        description: 'Ceramiczny kubek 330ml',
        price: 29,
        sizes: [],
        colors: [
          { id: 'c5', name: 'Biały', hex: '#FFFFFF' },
        ],
        available: true,
      },
      {
        id: 'merch-tri4',
        name: 'Opaska na nadgarstek',
        description: 'Silikonowa opaska z logo wydarzenia',
        price: 15,
        sizes: [],
        colors: [
          { id: 'c6', name: 'Niebieski', hex: '#2563EB' },
          { id: 'c7', name: 'Pomarańczowy', hex: '#F97316' },
          { id: 'c8', name: 'Zielony', hex: '#22C55E' },
        ],
        available: true,
      },
    ],
    discountCodes: [
      { id: 'dc7', code: 'TRI20', discountType: 'percent', discountValue: 20, validTo: '2026-02-28', maxUses: 30, usedCount: 18, active: true },
    ],
    enableMerchandiseInRegistration: true,
    insuranceOption: {
      id: 'ins2',
      name: 'Ubezpieczenie NNW Triatlonisty',
      description: 'Kompleksowe ubezpieczenie obejmujące wszystkie dyscypliny triathlonu: pływanie, rower i bieg.',
      baseFee: 9,
      ageMultiplier: 0.5,
      maxAge: 70,
      enabled: true,
    },
  },
  // Original events below (keeping existing ones)
  {
    id: 'e1',
    name: 'Maraton Warszawski 2025',
    slug: 'maraton-warszawski-2025',
    discipline: 'running',
    date: '2025-04-13',
    location: 'Stadion Narodowy',
    city: 'Warszawa',
    description: 'Największy maraton w Polsce. Trasa prowadzi przez najpiękniejsze miejsca stolicy. Limit czasu 6 godzin.',
    imageUrl: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800',
    distances: [
      { id: 'd1', name: 'Maraton', length: 42.195, unit: 'km', categories: ['M18-29', 'M30-39', 'M40-49', 'M50+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], limit: 10000, registeredCount: 8543, price: 150 },
      { id: 'd2', name: 'Bieg na 10km', length: 10, unit: 'km', categories: ['M18-29', 'M30-39', 'M40-49', 'M50+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], limit: 5000, registeredCount: 4231, price: 70 },
    ],
    organizerId: 'o1',
    organizerName: 'Fundacja Maraton Warszawski',
    organizerContact: { email: 'kontakt@maratonwarszawski.pl', phone: '+48 22 123 45 67', website: 'https://maratonwarszawski.pl' },
    status: 'published',
    registrationDeadline: '2025-04-10',
    featured: true,
    liveResultsUrl: 'https://example.com/live-results/maraton-warszawski',
    paymentMethods: [
      { id: 'pm1', name: 'Przelew bankowy', enabled: true },
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm3', name: 'Karta płatnicza', enabled: true },
    ],
    merchandise: [
      {
        id: 'merch1',
        name: 'Koszulka Maraton Warszawski',
        description: 'Oficjalna koszulka techniczna',
        price: 99,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          { id: 'c1', name: 'Biały', hex: '#FFFFFF' },
          { id: 'c2', name: 'Czerwony', hex: '#DC2626' },
        ],
        imageUrl: 'https://via.placeholder.com/200x200?text=Koszulka',
        available: true,
      },
    ],
  },
  {
    id: 'e2',
    name: 'Tour de Pologne Amatorów',
    slug: 'tour-de-pologne-amatorow-2025',
    discipline: 'cycling',
    date: '2025-07-20',
    location: 'Katowice',
    city: 'Katowice',
    description: 'Amatorska edycja legendarnego wyścigu. Przejedź tą samą trasą co zawodowcy!',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    distances: [
      { id: 'd3', name: 'Gran Fondo', length: 140, unit: 'km', categories: ['M18-34', 'M35-49', 'M50+', 'K18-34', 'K35-49', 'K50+'], limit: 2000, registeredCount: 1456, price: 200 },
      { id: 'd4', name: 'Medio Fondo', length: 80, unit: 'km', categories: ['M18-34', 'M35-49', 'M50+', 'K18-34', 'K35-49', 'K50+'], limit: 2000, registeredCount: 1832, price: 150 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2025-07-15',
    featured: true,
    paymentMethods: [
      { id: 'pm1', name: 'Przelew bankowy', enabled: true },
      { id: 'pm2', name: 'BLIK', enabled: true },
      { id: 'pm4', name: 'PayU', enabled: true },
    ],
  },
  {
    id: 'e3',
    name: 'Gdynia Triathlon 2025',
    slug: 'gdynia-triathlon-2025',
    discipline: 'triathlon',
    date: '2025-08-17',
    location: 'Plaża Gdynia Śródmieście',
    city: 'Gdynia',
    description: 'Kultowy triathlon z pływaniem w Zatoce Gdańskiej. Dystans olimpijski i sprint.',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
    distances: [
      { id: 'd5', name: 'Olimpijski', length: 51.5, unit: 'km', categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], limit: 1500, registeredCount: 1234, price: 350 },
      { id: 'd6', name: 'Sprint', length: 25.75, unit: 'km', categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], limit: 1000, registeredCount: 876, price: 250 },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'published',
    registrationDeadline: '2025-08-10',
    featured: false,
    liveResultsUrl: 'https://example.com/live-results/gdynia-triathlon',
  },
  {
    id: 'e4',
    name: 'Bieg Piastów - Polana Jakuszycka',
    slug: 'bieg-piastow-2025',
    discipline: 'running',
    date: '2025-03-01',
    location: 'Polana Jakuszycka',
    city: 'Szklarska Poręba',
    description: 'Legendarny bieg narciarski w sercu Karkonoszy. Zimowa edycja dla miłośników aktywności outdoor.',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    distances: [
      { id: 'd7', name: '50km', length: 50, unit: 'km', categories: ['M', 'K'], limit: 3000, registeredCount: 2100, price: 180 },
      { id: 'd8', name: '25km', length: 25, unit: 'km', categories: ['M', 'K'], limit: 2000, registeredCount: 1500, price: 120 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2025-02-25',
    featured: true,
  },
  {
    id: 'e5',
    name: 'Półmaraton Krakowski',
    slug: 'polmaraton-krakowski-2025',
    discipline: 'running',
    date: '2025-05-18',
    location: 'Rynek Główny',
    city: 'Kraków',
    description: 'Biegnij ulicami historycznego Krakowa. Start i meta na Rynku Głównym.',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    distances: [
      { id: 'd9', name: 'Półmaraton', length: 21.097, unit: 'km', categories: ['M18-29', 'M30-39', 'M40-49', 'M50+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], limit: 8000, registeredCount: 6234, price: 100 },
      { id: 'd10', name: 'Bieg 5km', length: 5, unit: 'km', categories: ['Open'], limit: 3000, registeredCount: 2100, price: 40 },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'published',
    registrationDeadline: '2025-05-15',
    featured: false,
  },
  {
    id: 'e6',
    name: 'Maraton Rowerowy Szlak Orlich Gniazd',
    slug: 'szlak-orlich-gniazd-2025',
    discipline: 'cycling',
    date: '2025-06-14',
    location: 'Zamek Ogrodzieniec',
    city: 'Ogrodzieniec',
    description: 'Przepiękna trasa MTB wzdłuż jurajskich zamków. Dystanse dla każdego poziomu zaawansowania.',
    imageUrl: 'https://images.unsplash.com/photo-1544191696-15693072e0b5?w=800',
    distances: [
      { id: 'd11', name: 'Mega', length: 90, unit: 'km', categories: ['M', 'K', 'Masters'], limit: 500, registeredCount: 320, price: 150 },
      { id: 'd12', name: 'Midi', length: 50, unit: 'km', categories: ['M', 'K', 'Masters'], limit: 800, registeredCount: 654, price: 100 },
      { id: 'd13', name: 'Mini', length: 25, unit: 'km', categories: ['Open'], limit: 1000, registeredCount: 876, price: 60 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2025-06-10',
    featured: false,
  },
  {
    id: 'e7',
    name: 'Ironman 70.3 Gdańsk',
    slug: 'ironman-703-gdansk-2025',
    discipline: 'triathlon',
    date: '2025-09-07',
    location: 'Stocznia Gdańska',
    city: 'Gdańsk',
    description: 'Oficjalny Ironman 70.3 w Polsce. Pływanie w Motławie, rower po Żuławach, bieg przez Stare Miasto.',
    imageUrl: 'https://images.unsplash.com/photo-1559311648-d7e85ef3a7b6?w=800',
    distances: [
      { id: 'd14', name: 'Ironman 70.3', length: 113, unit: 'km', categories: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55-59', 'M60+', 'K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'], limit: 2500, registeredCount: 2100, price: 750 },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'published',
    registrationDeadline: '2025-08-31',
    featured: true,
    liveResultsUrl: 'https://example.com/live-results/ironman-gdansk',
  },
  {
    id: 'e8',
    name: 'Cross Duathlon Poznań',
    slug: 'cross-duathlon-poznan-2025',
    discipline: 'multisport',
    date: '2025-10-05',
    location: 'Malta Lake',
    city: 'Poznań',
    description: 'Bieg-Rower-Bieg nad Jeziorem Malta. Tereny zielone i ścieżki rowerowe.',
    imageUrl: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=800',
    distances: [
      { id: 'd15', name: 'Długi', length: 45, unit: 'km', categories: ['M', 'K'], limit: 400, registeredCount: 234, price: 180 },
      { id: 'd16', name: 'Krótki', length: 22, unit: 'km', categories: ['M', 'K'], limit: 600, registeredCount: 456, price: 120 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2025-09-30',
    featured: false,
  },
  {
    id: 'e9',
    name: 'Nocny Bieg Wrocławski',
    slug: 'nocny-bieg-wroclawski-2025',
    discipline: 'running',
    date: '2025-02-15',
    location: 'Hala Stulecia',
    city: 'Wrocław',
    description: 'Magiczny bieg nocą przez oświetlone ulice Wrocławia. Start o 21:00!',
    imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
    distances: [
      { id: 'd17', name: '10km', length: 10, unit: 'km', categories: ['M', 'K'], limit: 5000, registeredCount: 4200, price: 60 },
    ],
    organizerId: 'o1',
    organizerName: 'Marek Organizator',
    organizerContact: { email: 'marek@timing.pl', phone: '+48 501 234 567' },
    status: 'completed',
    registrationDeadline: '2025-02-10',
    featured: false,
  },
  {
    id: 'e10',
    name: 'Ultramaraton Bieszczadzki',
    slug: 'ultramaraton-bieszczadzki-2025',
    discipline: 'running',
    date: '2025-07-05',
    location: 'Ustrzyki Górne',
    city: 'Ustrzyki Górne',
    description: 'Najtrudniejszy ultramaraton w Polsce. 100km po dzikich Bieszczadach.',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    distances: [
      { id: 'd18', name: '100km', length: 100, unit: 'km', categories: ['M', 'K'], limit: 300, registeredCount: 287, price: 400 },
      { id: 'd19', name: '50km', length: 50, unit: 'km', categories: ['M', 'K'], limit: 500, registeredCount: 432, price: 250 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'published',
    registrationDeadline: '2025-06-30',
    featured: false,
  },
  // Bieg Wiosenny - zakończone wydarzenie z serii Grand Prix
  {
    id: 'e15',
    name: 'Bieg Wiosenny 2025',
    slug: 'bieg-wiosenny-2025',
    discipline: 'running',
    date: '2025-04-10',
    location: 'Park Skaryszewski',
    city: 'Warszawa',
    description: 'Wiosenny bieg w pięknym warszawskim parku. Idealne wydarzenie na rozpoczęcie sezonu biegowego!',
    imageUrl: '',
    distances: [
      { id: 'd30', name: '10 km', length: 10, unit: 'km', categories: ['M18-29', 'M30-39', 'M40-49', 'M50+', 'K18-29', 'K30-39', 'K40-49', 'K50+'], limit: 1000, registeredCount: 876, price: 60 },
      { id: 'd31', name: '5 km', length: 5, unit: 'km', categories: ['Open'], limit: 500, registeredCount: 432, price: 40 },
    ],
    organizerId: 'o2',
    organizerName: 'Sportowe Wydarzenia Sp. z o.o.',
    organizerContact: { email: 'info@sportevents.pl', phone: '+48 32 987 65 43', website: 'https://sportevents.pl' },
    status: 'completed',
    seriesId: 'series2',
    registrationDeadline: '2025-04-07',
    featured: false,
  },
];

export const mockRegistrations: Registration[] = [
  { id: 'r1', eventId: 'e1', eventName: 'Maraton Warszawski 2025', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd1', distanceName: 'Maraton', category: 'M30-39', registeredAt: '2025-01-15T10:30:00Z', status: 'confirmed', bibNumber: '1542', pricePaid: 150 },
  { id: 'r2', eventId: 'e3', eventName: 'Gdynia Triathlon 2025', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd5', distanceName: 'Olimpijski', category: 'M30-34', registeredAt: '2025-02-20T14:15:00Z', status: 'confirmed', bibNumber: '234', pricePaid: 350 },
  { id: 'r3', eventId: 'e5', eventName: 'Półmaraton Krakowski', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd9', distanceName: 'Półmaraton', category: 'M30-39', registeredAt: '2025-03-01T09:00:00Z', status: 'pending', pricePaid: 100 },
  { id: 'r4', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd17', distanceName: '10km', category: 'M', registeredAt: '2025-01-10T18:45:00Z', status: 'confirmed', bibNumber: '1001', pricePaid: 60 },
  { id: 'r5', eventId: 'e2', eventName: 'Tour de Pologne Amatorów', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd4', distanceName: 'Medio Fondo', category: 'K35-49', registeredAt: '2025-02-28T11:20:00Z', status: 'confirmed', bibNumber: '567', pricePaid: 150 },
  { id: 'r6', eventId: 'e1', eventName: 'Maraton Warszawski 2025', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd2', distanceName: 'Bieg na 10km', category: 'K30-39', registeredAt: '2025-01-20T16:00:00Z', status: 'confirmed', bibNumber: '3456', pricePaid: 70 },
  { id: 'r7', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd17', distanceName: '10km', category: 'K', registeredAt: '2025-01-12T20:30:00Z', status: 'confirmed', bibNumber: '2345', pricePaid: 60 },
  { id: 'r8', eventId: 'e4', eventName: 'Bieg Piastów - Polana Jakuszycka', userId: 'p3', userName: 'Piotr Wiśniewski', userEmail: 'piotr@example.com', distanceId: 'd8', distanceName: '25km', category: 'M', registeredAt: '2025-01-05T08:00:00Z', status: 'confirmed', bibNumber: '789', pricePaid: 120 },
  // Registration with merchandise
  { 
    id: 'r9', 
    eventId: 'e11', 
    eventName: 'Bieg Górski Tatry Ultra 2026', 
    userId: 'p1', 
    userName: 'Jan Kowalski', 
    userEmail: 'jan@example.com', 
    distanceId: 'd21', 
    distanceName: 'Maraton 42K', 
    category: 'M30-34', 
    registeredAt: '2026-01-05T10:00:00Z', 
    status: 'confirmed', 
    bibNumber: '042',
    pricePaid: 210, // Early Bird
    discountCode: 'KLUB50',
    discountAmount: 50,
    merchandiseOrders: [
      { merchandiseId: 'merch-ultra1', merchandiseName: 'Koszulka techniczna Tatry Ultra', size: 'L', color: 'Granatowy', colorHex: '#1E3A5F', quantity: 1, price: 119 },
      { merchandiseId: 'merch-ultra2', merchandiseName: 'Buff górski', color: 'Zielony', colorHex: '#059669', quantity: 2, price: 118 },
    ]
  },
];

export const mockResults: Result[] = [
  // Wyniki dla wydarzenia e1 (Półmaraton Warszawski)
  {
    id: 'r1',
    eventId: 'e1',
    eventName: 'Półmaraton Warszawski 2026',
    distanceId: 'd-e1-1',
    distanceName: '21 km',
    userId: 'p1',
    userName: 'Jan Kowalski',
    bibNumber: '101',
    category: 'M30-39',
    position: 1,
    categoryPosition: 1,
    time: '1:32:45',
    timeInSeconds: 5565,
    status: 'finished',
  },
  {
    id: 'r2',
    eventId: 'e1',
    eventName: 'Półmaraton Warszawski 2026',
    distanceId: 'd-e1-1',
    distanceName: '21 km',
    userId: 'p2',
    userName: 'Anna Nowak',
    bibNumber: '102',
    category: 'K30-39',
    position: 15,
    categoryPosition: 1,
    time: '1:48:22',
    timeInSeconds: 6502,
    status: 'finished',
  },
  {
    id: 'r3',
    eventId: 'e1',
    eventName: 'Półmaraton Warszawski 2026',
    distanceId: 'd-e1-1',
    distanceName: '21 km',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    bibNumber: '103',
    category: 'M40-49',
    position: 2,
    categoryPosition: 1,
    time: '1:35:10',
    timeInSeconds: 5710,
    status: 'finished',
  },

  // Wyniki dla e12 (Wirtualny Bieg Noworoczny - seria wirtualna)
  {
    id: 'r4',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    distanceId: 'd-e12-1',
    distanceName: '5 km',
    userId: 'p1',
    userName: 'Jan Kowalski',
    bibNumber: '201',
    category: 'M30-39',
    position: 1,
    categoryPosition: 1,
    time: '0:22:15',
    timeInSeconds: 1335,
    status: 'finished',
  },
  {
    id: 'r5',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    distanceId: 'd-e12-1',
    distanceName: '5 km',
    userId: 'p2',
    userName: 'Anna Nowak',
    bibNumber: '202',
    category: 'K30-39',
    position: 3,
    categoryPosition: 1,
    time: '0:26:30',
    timeInSeconds: 1590,
    status: 'finished',
  },
  {
    id: 'r6',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    distanceId: 'd-e12-1',
    distanceName: '5 km',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    bibNumber: '203',
    category: 'M40-49',
    position: 2,
    categoryPosition: 1,
    time: '0:24:00',
    timeInSeconds: 1440,
    status: 'finished',
  },
  {
    id: 'r7',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    distanceId: 'd-e12-1',
    distanceName: '5 km',
    userId: 'p4',
    userName: 'Katarzyna Lewandowska',
    bibNumber: '204',
    category: 'K40-49',
    position: 4,
    categoryPosition: 2,
    time: '0:28:45',
    timeInSeconds: 1725,
    status: 'finished',
  },
  {
    id: 'r8',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    distanceId: 'd-e12-1',
    distanceName: '5 km',
    userId: 'p5',
    userName: 'Michał Zieliński',
    bibNumber: '205',
    category: 'M20-29',
    position: 5,
    categoryPosition: 1,
    time: '0:29:30',
    timeInSeconds: 1770,
    status: 'finished',
  },

  // Wyniki dla e13 (Walentynkowy Bieg Wirtualny - seria wirtualna)
  {
    id: 'r9',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    distanceId: 'd-e13-1',
    distanceName: '5 km',
    userId: 'p1',
    userName: 'Jan Kowalski',
    bibNumber: '301',
    category: 'M30-39',
    position: 2,
    categoryPosition: 2,
    time: '0:23:00',
    timeInSeconds: 1380,
    status: 'finished',
  },
  {
    id: 'r10',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    distanceId: 'd-e13-1',
    distanceName: '5 km',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    bibNumber: '302',
    category: 'M40-49',
    position: 1,
    categoryPosition: 1,
    time: '0:22:30',
    timeInSeconds: 1350,
    status: 'finished',
  },
  {
    id: 'r11',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    distanceId: 'd-e13-1',
    distanceName: '5 km',
    userId: 'p2',
    userName: 'Anna Nowak',
    bibNumber: '303',
    category: 'K30-39',
    position: 4,
    categoryPosition: 1,
    time: '0:27:15',
    timeInSeconds: 1635,
    status: 'finished',
  },
  {
    id: 'r12',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    distanceId: 'd-e13-1',
    distanceName: '5 km',
    userId: 'p5',
    userName: 'Michał Zieliński',
    bibNumber: '304',
    category: 'M20-29',
    position: 3,
    categoryPosition: 1,
    time: '0:25:00',
    timeInSeconds: 1500,
    status: 'finished',
  },
  {
    id: 'r13',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    distanceId: 'd-e13-1',
    distanceName: '5 km',
    userId: 'p6',
    userName: 'Ewa Kamińska',
    bibNumber: '305',
    category: 'K20-29',
    position: 5,
    categoryPosition: 1,
    time: '0:30:00',
    timeInSeconds: 1800,
    status: 'finished',
  },

  // Wyniki dla e11 (Tatry Ultra Trail - seria Grand Prix)
  {
    id: 'r14',
    eventId: 'e11',
    eventName: 'Tatry Ultra Trail',
    distanceId: 'd-e11-1',
    distanceName: '60 km',
    userId: 'p1',
    userName: 'Jan Kowalski',
    bibNumber: '401',
    category: 'M30-39',
    position: 1,
    categoryPosition: 1,
    time: '8:45:30',
    timeInSeconds: 31530,
    status: 'finished',
  },
  {
    id: 'r15',
    eventId: 'e11',
    eventName: 'Tatry Ultra Trail',
    distanceId: 'd-e11-1',
    distanceName: '60 km',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    bibNumber: '402',
    category: 'M40-49',
    position: 2,
    categoryPosition: 1,
    time: '9:15:00',
    timeInSeconds: 33300,
    status: 'finished',
  },
  {
    id: 'r16',
    eventId: 'e11',
    eventName: 'Tatry Ultra Trail',
    distanceId: 'd-e11-1',
    distanceName: '60 km',
    userId: 'p2',
    userName: 'Anna Nowak',
    bibNumber: '403',
    category: 'K30-39',
    position: 3,
    categoryPosition: 1,
    time: '10:30:00',
    timeInSeconds: 37800,
    status: 'finished',
  },
  {
    id: 'r17',
    eventId: 'e11',
    eventName: 'Tatry Ultra Trail',
    distanceId: 'd-e11-1',
    distanceName: '60 km',
    userId: 'p7',
    userName: 'Tomasz Malinowski',
    bibNumber: '404',
    category: 'M30-39',
    position: 4,
    categoryPosition: 2,
    time: '11:00:00',
    timeInSeconds: 39600,
    status: 'finished',
  },

  // Wyniki dla e15 (Bieg Wiosenny - seria Grand Prix)
  {
    id: 'r18',
    eventId: 'e15',
    eventName: 'Bieg Wiosenny',
    distanceId: 'd-e15-1',
    distanceName: '10 km',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    bibNumber: '501',
    category: 'M40-49',
    position: 1,
    categoryPosition: 1,
    time: '0:42:30',
    timeInSeconds: 2550,
    status: 'finished',
  },
  {
    id: 'r19',
    eventId: 'e15',
    eventName: 'Bieg Wiosenny',
    distanceId: 'd-e15-1',
    distanceName: '10 km',
    userId: 'p1',
    userName: 'Jan Kowalski',
    bibNumber: '502',
    category: 'M30-39',
    position: 2,
    categoryPosition: 1,
    time: '0:43:15',
    timeInSeconds: 2595,
    status: 'finished',
  },
  {
    id: 'r20',
    eventId: 'e15',
    eventName: 'Bieg Wiosenny',
    distanceId: 'd-e15-1',
    distanceName: '10 km',
    userId: 'p2',
    userName: 'Anna Nowak',
    bibNumber: '503',
    category: 'K30-39',
    position: 3,
    categoryPosition: 1,
    time: '0:48:00',
    timeInSeconds: 2880,
    status: 'finished',
  },
  {
    id: 'r21',
    eventId: 'e15',
    eventName: 'Bieg Wiosenny',
    distanceId: 'd-e15-1',
    distanceName: '10 km',
    userId: 'p7',
    userName: 'Tomasz Malinowski',
    bibNumber: '504',
    category: 'M30-39',
    position: 4,
    categoryPosition: 2,
    time: '0:50:30',
    timeInSeconds: 3030,
    status: 'finished',
  },
  {
    id: 'r22',
    eventId: 'e15',
    eventName: 'Bieg Wiosenny',
    distanceId: 'd-e15-1',
    distanceName: '10 km',
    userId: 'p6',
    userName: 'Ewa Kamińska',
    bibNumber: '505',
    category: 'K20-29',
    position: 5,
    categoryPosition: 1,
    time: '0:52:00',
    timeInSeconds: 3120,
    status: 'finished',
  },
];

export const mockPersonalRecords: PersonalRecord[] = [
  { distance: '5 km', time: '22:15', eventName: 'Wirtualny Bieg Noworoczny', date: '2026-01-01' },
  { distance: '10 km', time: '43:15', eventName: 'Bieg Wiosenny', date: '2025-04-10' },
  { distance: '21 km', time: '1:32:45', eventName: 'Półmaraton Warszawski 2026', date: '2026-03-15' },
];

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    fromId: 'o1',
    fromName: 'Marek Organizator',
    toId: 'p1',
    subject: 'Potwierdzenie rejestracji',
    content: 'Dziękujemy za rejestrację na Półmaraton Warszawski 2026!',
    sentAt: '2026-01-05T10:00:00',
    read: true,
    eventId: 'e1',
  },
  {
    id: 'msg2',
    fromId: 'o2',
    fromName: 'Sportowe Wydarzenia Sp. z o.o.',
    toId: 'p1',
    subject: 'Przypomnienie o starcie',
    content: 'Już za tydzień startuje Bieg Wiosenny. Do zobaczenia!',
    sentAt: '2026-01-03T14:30:00',
    read: false,
    eventId: 'e15',
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert1',
    eventId: 'e12',
    eventName: 'Wirtualny Bieg Noworoczny',
    date: '2026-01-01',
    distance: '5 km',
    time: '22:15',
    position: 1,
    downloadUrl: '/certificates/cert1.pdf',
  },
  {
    id: 'cert2',
    eventId: 'e13',
    eventName: 'Walentynkowy Bieg Wirtualny',
    date: '2026-02-14',
    distance: '5 km',
    time: '23:00',
    position: 2,
    downloadUrl: '/certificates/cert2.pdf',
  },
];

export const disciplineLabels: Record<string, string> = {
  running: 'Bieganie',
  cycling: 'Kolarstwo',
  triathlon: 'Triathlon',
  multisport: 'Multisport'
};

export const disciplineIcons: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  triathlon: '🏊',
  multisport: '🏅'
};

// Helper function to get current price for a distance
export const getCurrentPrice = (distance: { price: number; priceTiers?: PriceTier[] }): { price: number; tierName: string; nextTier?: PriceTier } => {
  if (!distance.priceTiers || distance.priceTiers.length === 0) {
    return { price: distance.price, tierName: 'Cena standardowa' };
  }
  
  const now = new Date();
  const sortedTiers = [...distance.priceTiers].sort((a, b) => 
    new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    if (new Date(tier.endDate) >= now) {
      return { 
        price: tier.price, 
        tierName: tier.name,
        nextTier: sortedTiers[i + 1]
      };
    }
  }
  
  // Fallback to last tier or base price
  const lastTier = sortedTiers[sortedTiers.length - 1];
  return { price: lastTier?.price || distance.price, tierName: lastTier?.name || 'Cena standardowa' };
};

// Helper to validate discount code
export const validateDiscountCode = (
  code: string, 
  event: Event, 
  distanceId?: string
): { valid: boolean; discount?: { type: 'percent' | 'fixed'; value: number }; message: string } => {
  if (!event.discountCodes) {
    return { valid: false, message: 'Kod rabatowy nie istnieje' };
  }
  
  const discountCode = event.discountCodes.find(dc => dc.code.toUpperCase() === code.toUpperCase());
  
  if (!discountCode) {
    return { valid: false, message: 'Nieprawidłowy kod rabatowy' };
  }
  
  if (!discountCode.active) {
    return { valid: false, message: 'Kod rabatowy jest nieaktywny' };
  }
  
  const now = new Date();
  if (discountCode.validFrom && new Date(discountCode.validFrom) > now) {
    return { valid: false, message: 'Kod rabatowy jeszcze nie jest aktywny' };
  }
  
  if (discountCode.validTo && new Date(discountCode.validTo) < now) {
    return { valid: false, message: 'Kod rabatowy wygasł' };
  }
  
  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    return { valid: false, message: 'Kod rabatowy został wykorzystany maksymalną liczbę razy' };
  }
  
  if (distanceId && discountCode.distanceIds && discountCode.distanceIds.length > 0) {
    if (!discountCode.distanceIds.includes(distanceId)) {
      return { valid: false, message: 'Kod rabatowy nie dotyczy wybranego dystansu' };
    }
  }
  
  return { 
    valid: true, 
    discount: { type: discountCode.discountType, value: discountCode.discountValue },
    message: discountCode.discountType === 'percent' 
      ? `Zniżka ${discountCode.discountValue}%`
      : `Zniżka ${discountCode.discountValue} zł`
  };
};
