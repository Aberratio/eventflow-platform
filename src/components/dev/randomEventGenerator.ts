/**
 * Random past-event generator for the developer toolbox.
 * Generates realistic-looking Polish running/sports event data.
 */

import type { CreateEventPayload } from '@/api/payloads';
import type {
  Distance,
  AgeCategory,
  EventMerchandise,
  EventLogisticsInfo,
  OrganizerInfo,
  PriceTier,
} from '@/types';

// ─── Seed data pools ────────────────────────────────────────

const CITIES = [
  'Warszawa',
  'Kraków',
  'Wrocław',
  'Poznań',
  'Gdańsk',
  'Łódź',
  'Katowice',
  'Lublin',
  'Białystok',
  'Rzeszów',
  'Toruń',
  'Bydgoszcz',
  'Szczecin',
  'Olsztyn',
  'Kielce',
  'Opole',
  'Gliwice',
  'Zabrze',
  'Częstochowa',
  'Radom',
  'Zakopane',
  'Sopot',
  'Nowy Sącz',
  'Tarnów',
  'Legnica',
];

const LOCATIONS = [
  'Park Miejski',
  'Bulwary Wiślane',
  'Stadion Miejski',
  'Park Łazienkowski',
  'Rynek Główny',
  'Plaża Miejska',
  'Las Kabacki',
  'Puszcza Białowieska',
  'Błonia Krakowskie',
  'Park Narodowy',
  'Centrum Sportowe',
  'Dolina Chochołowska',
  'Morskie Oko',
  'Wisła Środkowa',
  'Wał Miedzeszyński',
];

const EVENT_NAME_PREFIXES = [
  'Bieg',
  'Maraton',
  'Półmaraton',
  'Triathlon',
  'Duathlon',
  'Grand Prix',
  'Mistrzostwa',
  'Puchar',
  'Memoriał',
  'Nocny Bieg',
  'Ultramaraton',
  'Bieg Uliczny',
  'Cross',
  'Wyścig',
  'Rajd',
];

const EVENT_NAME_THEMES = [
  'Lasu',
  'Gór',
  'Rzeki',
  'Miasta',
  'Parku',
  'Wiosny',
  'Lata',
  'Jesieni',
  'Zimy',
  'Słońca',
  'Mazur',
  'Tatr',
  'Pienin',
  'Karpat',
  'Podhala',
  'Warmii',
  'Śląska',
  'Podlasia',
  'Kujaw',
  'Wybrzeża',
  'Świętokrzyski',
  'Krakowski',
  'Warszawski',
  'Wrocławski',
  'Gdański',
  'Poznański',
];

const ORGANIZER_NAMES = [
  'Stowarzyszenie Biegaczy Aktywnych',
  'Klub Sportowy Sprint',
  'RunForFun',
  'Towarzystwo Sportowe Olimpia',
  'Fundacja Aktywne Życie',
  'Sport Events Polska',
  'Agencja Eventowa SportPro',
  'Lokalne Stowarzyszenie Sportowe',
  'Marathon Club PL',
  'Triathloniści Polscy',
  'Stowarzyszenie Biegowe',
  'Active Sport Foundation',
];

const ORGANIZER_CONTACTS = [
  { email: 'biuro@sportevent.pl', phone: '+48 22 123 45 67', website: 'https://sportevent.pl' },
  { email: 'kontakt@biegamy.pl', phone: '+48 12 345 67 89' },
  { email: 'organizator@maraton.pl', phone: '+48 58 234 56 78', website: 'https://maraton.pl' },
  { email: 'info@triathlon.pl', phone: '+48 71 456 78 90' },
  { email: 'biuro@runforfun.pl', phone: '+48 61 567 89 01', website: 'https://runforfun.pl' },
];

const DISTANCE_NAMES = {
  running: ['5 km', '10 km', 'Półmaraton', 'Maraton', '3 km (nordic walking)', 'Mini (2 km)'],
  cycling: ['25 km', '50 km', '100 km', 'MTB 40 km', 'Szosa 80 km'],
  triathlon: ['Sprint (750/20/5)', 'Olimpijski (1500/40/10)', 'Half Ironman', 'Full Ironman'],
  multisport: ['Dystans A (krótki)', 'Dystans B (średni)', 'Dystans C (długi)'],
};

const MERCHANDISE_ITEMS = [
  { name: 'Koszulka techniczna', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], price: 49.99 },
  { name: 'Medal pamiątkowy', sizes: [], price: 0 },
  { name: 'Czapka z daszkiem', sizes: ['Uniwersalny'], price: 39.99 },
  { name: 'Plecak sportowy', sizes: ['Uniwersalny'], price: 89.99 },
  { name: 'Bidon', sizes: ['500ml', '750ml'], price: 29.99 },
  { name: 'Bluza polarowa', sizes: ['S', 'M', 'L', 'XL', 'XXL'], price: 129.99 },
  { name: 'Skarpetki sportowe', sizes: ['36-38', '39-41', '42-44', '45-47'], price: 19.99 },
  { name: 'Opaska na głowę', sizes: ['Uniwersalny'], price: 14.99 },
];

const AGE_CATEGORY_SETS: AgeCategory[][] = [
  [
    { id: 'k1', name: 'K20', gender: 'K', birthYearFrom: 2000, birthYearTo: 2006 },
    { id: 'k2', name: 'K30', gender: 'K', birthYearFrom: 1993, birthYearTo: 1999 },
    { id: 'k3', name: 'K40', gender: 'K', birthYearFrom: 1983, birthYearTo: 1992 },
    { id: 'k4', name: 'K50', gender: 'K', birthYearFrom: 1973, birthYearTo: 1982 },
    { id: 'm1', name: 'M20', gender: 'M', birthYearFrom: 2000, birthYearTo: 2006 },
    { id: 'm2', name: 'M30', gender: 'M', birthYearFrom: 1993, birthYearTo: 1999 },
    { id: 'm3', name: 'M40', gender: 'M', birthYearFrom: 1983, birthYearTo: 1992 },
    { id: 'm4', name: 'M50', gender: 'M', birthYearFrom: 1973, birthYearTo: 1982 },
    { id: 'm5', name: 'M60', gender: 'M', birthYearFrom: 1963, birthYearTo: 1972 },
  ],
  [
    { id: 'open', name: 'Open', gender: null },
    { id: 'k_open', name: 'Kobiety Open', gender: 'K' },
    { id: 'm_open', name: 'Mężczyźni Open', gender: 'M' },
  ],
];

const PARKING_INFO = [
  '<p>Bezpłatny parking przy stadionie miejskim — wjazd od ul. Sportowej. Liczba miejsc ograniczona.</p>',
  '<p>Parking płatny przy centrum — 5 zł/h. Dojście do miejsca startu ok. 5 minut pieszo.</p>',
  '<p>Parking przy parku — bezpłatny w weekendy. Alternatywnie komunikacja miejska.</p>',
];

const RACE_OFFICE_INFO = [
  '<p>Biuro zawodów czynne w dniu startu od godz. 7:00 do 10:00. Namiot przy bramie wejściowej nr 1.</p>',
  '<p>Odbiór numerów startowych w biurze zawodów — sobota 15:00-20:00 oraz w dniu biegu od 6:30.</p>',
];

const RULES_HTML = [
  '<h3>Regulamin</h3><p>Udział w biegu jest dobrowolny. Uczestnik startuje na własną odpowiedzialność. Obowiązkowe jest posiadanie numeru startowego przez cały czas trwania biegu.</p><p>Organizator zastrzega sobie prawo do dyskwalifikacji zawodnika w przypadku naruszenia regulaminu.</p>',
  '<h3>Zasady uczestnictwa</h3><p>W biegu mogą uczestniczyć osoby, które ukończyły 18 lat. Zawodnicy niepełnoletni mogą startować wyłącznie za zgodą rodziców lub opiekunów prawnych.</p><p>Każdy uczestnik zobowiązany jest do zapoznania się z trasą biegu.</p>',
];

const FIRST_NAMES_M = [
  'Andrzej',
  'Bartosz',
  'Cezary',
  'Dawid',
  'Emil',
  'Filip',
  'Grzegorz',
  'Hubert',
  'Igor',
  'Jakub',
  'Kamil',
  'Łukasz',
  'Marek',
  'Norbert',
  'Oskar',
  'Piotr',
  'Rafał',
  'Sławomir',
  'Tomasz',
  'Wojciech',
  'Adam',
  'Krzysztof',
  'Michał',
  'Robert',
  'Paweł',
  'Marcin',
  'Artur',
  'Mariusz',
  'Sebastian',
  'Dariusz',
];

const FIRST_NAMES_F = [
  'Anna',
  'Barbara',
  'Celina',
  'Dorota',
  'Ewa',
  'Franciszka',
  'Grażyna',
  'Halina',
  'Irena',
  'Joanna',
  'Katarzyna',
  'Lidia',
  'Małgorzata',
  'Natalia',
  'Olga',
  'Patrycja',
  'Renata',
  'Sandra',
  'Teresa',
  'Urszula',
  'Agnieszka',
  'Monika',
  'Beata',
  'Alicja',
  'Zofia',
  'Marta',
  'Karolina',
  'Magdalena',
  'Aleksandra',
  'Julia',
];

const LAST_NAMES = [
  'Kowalski',
  'Nowak',
  'Wiśniewski',
  'Wójcik',
  'Kowalczyk',
  'Kamiński',
  'Lewandowski',
  'Zielińska',
  'Szymański',
  'Woźniak',
  'Dąbrowski',
  'Kozłowski',
  'Jankowski',
  'Mazur',
  'Wojciechowski',
  'Kwiatkowski',
  'Krawczyk',
  'Piotrowski',
  'Grabowski',
  'Nowakowski',
  'Pawłowski',
  'Michalski',
  'Adamczyk',
  'Dudek',
  'Zając',
  'Wieczorek',
  'Jabłoński',
  'Król',
  'Majewski',
  'Olszewski',
  'Jaworski',
  'Wróbel',
  'Malinowski',
  'Pawlak',
  'Witkowski',
  'Walczak',
  'Stępień',
  'Górski',
  'Rutkowski',
  'Michalak',
];

const EMAIL_DOMAINS = ['gmail.com', 'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl', 'poczta.fm'];

// ─── Utility functions ───────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pastDate(daysAgoMin: number, daysAgoMax: number): string {
  const daysAgo = rand(daysAgoMin, daysAgoMax);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Public interface for generator options ──────────────────

export interface SeedEventOptions {
  participantCount: number;
  // Field toggles — null = randomize
  forceVirtual: boolean | null;
  forcePrivate: boolean | null;
  discipline: 'running' | 'cycling' | 'triathlon' | 'multisport' | null;
  includeMerchandise: boolean | null;
  includeParking: boolean | null;
  includeRaceOffice: boolean | null;
  includeChangingRooms: boolean | null;
  includeBuffet: boolean | null;
  includeMedical: boolean | null;
  includeShowers: boolean | null;
  includePriceTiers: boolean | null;
  includeAgeCategories: boolean | null;
  includeOrganizersHtml: boolean | null;
  includeRulesHtml: boolean | null;
  includeDiscountCodes: boolean | null;
  includePaymentMethods: boolean | null;
}

export const DEFAULT_SEED_OPTIONS: SeedEventOptions = {
  participantCount: 30,
  forceVirtual: null,
  forcePrivate: null,
  discipline: null,
  includeMerchandise: null,
  includeParking: null,
  includeRaceOffice: null,
  includeChangingRooms: null,
  includeBuffet: null,
  includeMedical: null,
  includeShowers: null,
  includePriceTiers: null,
  includeAgeCategories: null,
  includeOrganizersHtml: null,
  includeRulesHtml: null,
  includeDiscountCodes: null,
  includePaymentMethods: null,
};

function resolveBool(forced: boolean | null, defaultChance = 0.5): boolean {
  if (forced !== null) return forced;
  return Math.random() < defaultChance;
}

// ─── Sub-generators ──────────────────────────────────────────

function generateName(): { firstName: string; lastName: string; gender: 'M' | 'K' } {
  const gender: 'M' | 'K' = Math.random() < 0.42 ? 'K' : 'M';
  const firstName = gender === 'M' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  const base = pick(LAST_NAMES);
  const lastName =
    gender === 'K' && base.endsWith('ski')
      ? base.replace('ski', 'ska')
      : gender === 'K' && base.endsWith('cki')
        ? base.replace('cki', 'cka')
        : base;
  return { firstName, lastName, gender };
}

function generateEmail(firstName: string, lastName: string): string {
  const normalized = slugify(`${firstName} ${lastName}`).replace(/-/g, '.');
  const suffix = Math.random() < 0.4 ? String(rand(70, 99)) : '';
  return `${normalized}${suffix}@${pick(EMAIL_DOMAINS)}`;
}

export interface GeneratedParticipant {
  name: string;
  email: string;
  gender: 'M' | 'K';
  birthYear: number;
  phone?: string;
  club?: string;
}

export function generateParticipants(count: number): GeneratedParticipant[] {
  const participants: GeneratedParticipant[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const { firstName, lastName, gender } = generateName();
    let email = generateEmail(firstName, lastName);
    let attempts = 0;
    while (usedEmails.has(email) && attempts < 10) {
      email = generateEmail(firstName, lastName + String(rand(1, 99)));
      attempts++;
    }
    usedEmails.add(email);

    const p: GeneratedParticipant = {
      name: `${firstName} ${lastName}`,
      email,
      gender,
      birthYear: rand(1965, 2005),
    };
    if (Math.random() < 0.7) p.phone = `+48 ${rand(500, 799)} ${rand(100, 999)} ${rand(100, 999)}`;
    if (Math.random() < 0.4)
      p.club = pick([
        'BiegamBo Lubię',
        'Orlik Team',
        'Run Crew',
        'Wolni Biegacze',
        'Maratonczycy.pl',
        'RunFit',
        'Biegamy Razem',
        'Trail Warriors',
        'City Runners',
      ]);

    participants.push(p);
  }
  return participants;
}

function generateDistances(
  discipline: 'running' | 'cycling' | 'triathlon' | 'multisport',
  opts: SeedEventOptions,
  participantCount: number,
): Distance[] {
  const pool = DISTANCE_NAMES[discipline];
  const count = discipline === 'triathlon' || discipline === 'multisport' ? rand(1, 2) : rand(1, 3);
  const names = pickN(pool, count);

  return names.map((name) => {
    const basePrice = randFloat(30, 150, 0);
    const priceTiers: PriceTier[] | undefined = resolveBool(opts.includePriceTiers, 0.6)
      ? [
          {
            id: uid(),
            name: 'Wczesna rejestracja',
            discountType: 'percent',
            discountValue: 20,
            endDate: pastDate(90, 60),
          },
          {
            id: uid(),
            name: 'Standardowa',
            discountType: 'fixed',
            discountValue: 0,
            endDate: pastDate(30, 15),
          },
        ]
      : undefined;

    const ageCategories: AgeCategory[] | undefined = resolveBool(opts.includeAgeCategories, 0.7)
      ? pick(AGE_CATEGORY_SETS).map((c) => ({ ...c, id: uid() }))
      : undefined;

    const distLen: Record<string, { length: number; unit: 'km' | 'm' }> = {
      '5 km': { length: 5, unit: 'km' },
      '10 km': { length: 10, unit: 'km' },
      Półmaraton: { length: 21.097, unit: 'km' },
      Maraton: { length: 42.195, unit: 'km' },
      '3 km (nordic walking)': { length: 3, unit: 'km' },
      'Mini (2 km)': { length: 2, unit: 'km' },
      '25 km': { length: 25, unit: 'km' },
      '50 km': { length: 50, unit: 'km' },
      '100 km': { length: 100, unit: 'km' },
    };
    const distInfo = distLen[name] ?? { length: null, unit: 'km' as const };

    const limit = rand(50, 500);
    const registeredCount = Math.min(
      rand(Math.floor(participantCount * 0.3), participantCount),
      limit,
    );

    return {
      id: uid(),
      name,
      length: distInfo.length,
      unit: distInfo.unit,
      categories: ['Open'],
      ageCategories,
      limit,
      registeredCount,
      paidCount: Math.floor(registeredCount * randFloat(0.7, 1.0)),
      price: basePrice,
      pricingVariants: [
        {
          id: uid(),
          name: 'Zapis w biurze zawodów',
          price: basePrice + 20,
          officeOnly: true,
          visibleInPublicForm: false,
          sortOrder: 0,
        },
      ],
      priceTiers,
      infoHtml:
        Math.random() < 0.5
          ? `<p>Dystans ${name}. Trasa widokowa, nawierzchnia mieszana. Pomiar czasu chipem.</p>`
          : undefined,
    } satisfies Distance;
  });
}

function generateMerchandise(opts: SeedEventOptions): EventMerchandise[] | undefined {
  if (!resolveBool(opts.includeMerchandise, 0.55)) return undefined;
  const count = rand(1, 3);
  const items = pickN(MERCHANDISE_ITEMS, count);
  return items.map((item) => ({
    id: uid(),
    name: item.name,
    price: item.price,
    sizes: item.sizes,
    colors: [],
    available: true,
    stockCount: rand(50, 300),
    quantityMode: 'one' as const,
    description: `Oficjalny gadżet eventu. Wysokiej jakości produkt sportowy.`,
  }));
}

function generateLogistics(opts: SeedEventOptions): EventLogisticsInfo {
  const logistics: EventLogisticsInfo = {};

  const field = (forced: boolean | null, defaultChance = 0.6, info?: string) => {
    if (!resolveBool(forced, defaultChance)) return undefined;
    return {
      status: 'yes' as const,
      infoHtml: info,
      locations: [],
    };
  };

  const parking = resolveBool(opts.includeParking, 0.7);
  if (parking) {
    logistics.parking = {
      status: 'yes',
      infoHtml: pick(PARKING_INFO),
      locations: [
        {
          id: uid(),
          label: 'Parking główny',
          address: `ul. Sportowa 1, ${pick(CITIES)}`,
          openFrom: '06:00',
          openTo: '16:00',
        },
      ],
    };
  }

  const raceOffice = resolveBool(opts.includeRaceOffice, 0.8);
  if (raceOffice) {
    logistics.raceOffice = {
      status: 'yes',
      infoHtml: pick(RACE_OFFICE_INFO),
      locations: [
        {
          id: uid(),
          label: 'Biuro zawodów',
          date: 'W dniu biegu',
          openFrom: '07:00',
          openTo: '09:30',
        },
      ],
    };
  }

  logistics.changingRooms = field(
    opts.includeChangingRooms,
    0.5,
    '<p>Przebieralnie w namiocie przy strefie startu.</p>',
  );
  logistics.buffet = field(
    opts.includeBuffet,
    0.65,
    '<p>Bufet dla uczestników przy mecie. Napoje, owoce, batony energetyczne.</p>',
  );
  logistics.medicalPoint = field(
    opts.includeMedical,
    0.8,
    '<p>Punkt medyczny przy starcie/mecie. Karetka przez cały czas trwania biegu.</p>',
  );
  logistics.showers = field(
    opts.includeShowers,
    0.45,
    '<p>Prysznice dostępne w pobliskim obiekcie sportowym.</p>',
  );
  logistics.luggage = field(
    null,
    0.6,
    '<p>Depozyty w namiocie A. Szatnia czynna od 7:00 do 14:00.</p>',
  );
  logistics.toilets = field(null, 0.85, '<p>Toalety przenośne przy starcie i na trasie biegu.</p>');
  logistics.timeMeasurement = field(
    null,
    0.9,
    '<p>Profesjonalny pomiar czasu chipem. Chip wbudowany w numer startowy.</p>',
  );
  logistics.awardsClassifications = field(
    null,
    0.7,
    '<p>Dekoracja zwycięzców przy scenie głównej po godzinie od mety ostatniego zawodnika w danej kategorii.</p>',
  );

  return logistics;
}

function generateOrganizerInfo(): OrganizerInfo {
  return {
    contacts: [
      {
        id: uid(),
        name: pick(ORGANIZER_NAMES),
        email: `biuro@${slugify(pick(ORGANIZER_NAMES))}.pl`,
        phone: `+48 ${rand(500, 799)} ${rand(100, 999)} ${rand(100, 999)}`,
      },
    ],
    sponsors:
      Math.random() < 0.6
        ? [
            { id: uid(), name: 'Sport Partner', url: 'https://example.pl' },
            { id: uid(), name: 'Gmina Miejska', url: 'https://example.pl' },
          ]
        : [],
    coOrganizers:
      Math.random() < 0.4
        ? [{ id: uid(), name: pick(ORGANIZER_NAMES), email: 'partner@example.pl' }]
        : [],
  };
}

// ─── Main event generator ────────────────────────────────────

export interface GeneratedEventData {
  eventPayload: CreateEventPayload;
  eventDate: string;
  organizerId: string; // will be replaced by actual organizer after creation
}

export function generateRandomEventPayload(opts: SeedEventOptions): GeneratedEventData {
  const discipline =
    opts.discipline ?? pick(['running', 'cycling', 'triathlon', 'multisport'] as const);
  const city = pick(CITIES);
  const prefix = pick(EVENT_NAME_PREFIXES);
  const theme = pick(EVENT_NAME_THEMES);
  const year = new Date().getFullYear() - rand(0, 1);
  const eventName = `${prefix} ${theme} ${year}`;
  const slug = `${slugify(eventName)}-${uid()}`;

  const eventDate = pastDate(30, 365);
  const regDeadline = (() => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() - rand(3, 14));
    return d.toISOString().split('T')[0];
  })();

  const isVirtual = resolveBool(opts.forceVirtual, 0.15);
  const isPrivate = resolveBool(opts.forcePrivate, 0.1);

  const distances = generateDistances(discipline, opts, opts.participantCount);
  const merchandise = generateMerchandise(opts);
  const logisticsInfo = generateLogistics(opts);
  const organizerInfo = resolveBool(opts.includeOrganizersHtml, 0.6)
    ? generateOrganizerInfo()
    : undefined;

  const organizerContact = pick(ORGANIZER_CONTACTS);
  const organizerName = pick(ORGANIZER_NAMES);

  const paymentMethods = resolveBool(opts.includePaymentMethods, 0.75)
    ? [
        { id: uid(), name: 'Przelew bankowy', enabled: true },
        { id: uid(), name: 'Płatność online', enabled: Math.random() < 0.6 },
      ]
    : undefined;

  const discountCodes = resolveBool(opts.includeDiscountCodes, 0.4)
    ? [
        {
          id: uid(),
          code: `PROMO${rand(10, 99)}`,
          discountType: 'percent' as const,
          discountValue: pick([10, 15, 20]),
          active: true,
          usedCount: rand(0, 20),
          maxUses: rand(30, 100),
        },
      ]
    : undefined;

  const rulesHtml = resolveBool(opts.includeRulesHtml, 0.7) ? pick(RULES_HTML) : undefined;

  const organizersHtml = organizerInfo
    ? `<p><strong>${organizerName}</strong> — organizator główny eventu. Kontakt: ${organizerContact.email}</p>`
    : undefined;

  const payload: GeneratedEventData['eventPayload'] = {
    name: eventName,
    slug,
    discipline,
    date: eventDate,
    startDate: eventDate,
    endDate: eventDate,
    location: `${pick(LOCATIONS)}, ${city}`,
    city,
    description: `${eventName} to jedno z najpopularniejszych wydarzeń sportowych w regionie. Trasa prowadzi malowniczymi ścieżkami przez okolice miasta. Serdecznie zapraszamy wszystkich miłośników aktywności fizycznej!`,
    imageUrl: '',
    distances,
    organizerId: '', // filled after user lookup/creation
    organizerName,
    organizerContact,
    registrationDeadline: regDeadline,
    isVirtual,
    visibility: isPrivate ? 'private' : 'public',
    merchandise,
    paymentMethods,
    discountCodes,
    rulesHtml,
    organizersHtml,
    logisticsInfo,
    organizerInfo,
    featured: Math.random() < 0.2,
    paymentConfig: {
      type: 'organizer_bank',
      bankAccountNumber: `PL${rand(10, 99)} ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)}`,
      bankAccountHolder: organizerName,
      transferTitle: `Wpisowe ${eventName}`,
    },
  };

  return { eventPayload: payload, eventDate, organizerId: '' };
}

// ─── Result generator ────────────────────────────────────────

export interface GeneratedResult {
  userId: string;
  userName: string;
  distanceId: string;
  distanceName: string;
  bibNumber: string;
  category: string;
  gender: 'M' | 'K';
  birthYear: number;
  time: string;
  timeInSeconds: number;
  position: number;
  categoryPosition: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
}

const BASE_PACE_PER_KM: Record<string, number> = {
  '5 km': 300,
  '10 km': 320,
  Półmaraton: 350,
  Maraton: 380,
  '3 km (nordic walking)': 480,
  'Mini (2 km)': 280,
  '25 km': 300,
  '50 km': 330,
  '100 km': 400,
  'Sprint (750/20/5)': 0,
  'Olimpijski (1500/40/10)': 0,
  'Half Ironman': 0,
  'Full Ironman': 0,
};

const TRIATHLON_BASE_SECONDS: Record<string, number> = {
  'Sprint (750/20/5)': 4500,
  'Olimpijski (1500/40/10)': 7200,
  'Half Ironman': 18000,
  'Full Ironman': 36000,
};

function estimateTimeInSeconds(distanceName: string, distanceLength: number | null): number {
  if (TRIATHLON_BASE_SECONDS[distanceName]) {
    return TRIATHLON_BASE_SECONDS[distanceName] + rand(-600, 3600);
  }
  const pace = BASE_PACE_PER_KM[distanceName] ?? 320;
  const km = distanceLength ?? 10;
  const base = pace * km;
  const spread = base * 0.3;
  return Math.max(60, Math.floor(base + (Math.random() - 0.3) * spread));
}

export function generateResults(
  participants: Array<{ userId: string; userName: string; gender: 'M' | 'K'; birthYear: number }>,
  distances: Distance[],
): GeneratedResult[] {
  const results: GeneratedResult[] = [];
  const distanceAssignments = new Map<string, typeof participants>();

  // Distribute participants across distances
  const perDistance = Math.max(1, Math.floor(participants.length / distances.length));
  distances.forEach((dist, i) => {
    const start = i * perDistance;
    const end = i === distances.length - 1 ? participants.length : start + perDistance;
    distanceAssignments.set(dist.id, participants.slice(start, end));
  });

  for (const dist of distances) {
    const assigned = distanceAssignments.get(dist.id) ?? [];
    const timings = assigned.map((p) => ({
      ...p,
      seconds: estimateTimeInSeconds(dist.name, dist.length),
      status: (Math.random() < 0.05
        ? 'dnf'
        : Math.random() < 0.05
          ? 'dns'
          : Math.random() < 0.02
            ? 'dsq'
            : 'finished') as 'finished' | 'dnf' | 'dns' | 'dsq',
    }));

    // Sort by time for position assignment (DNF/DSQ at end)
    timings.sort((a, b) => {
      if (a.status !== 'finished' && b.status === 'finished') return 1;
      if (a.status === 'finished' && b.status !== 'finished') return -1;
      return a.seconds - b.seconds;
    });

    let pos = 1;
    const catPositions = new Map<string, number>();

    timings.forEach((p, idx) => {
      const catKey = `${p.gender}_${Math.floor((new Date().getFullYear() - p.birthYear) / 10) * 10}`;
      const catPos = (catPositions.get(catKey) ?? 0) + 1;
      catPositions.set(catKey, catPos);

      const category =
        p.gender === 'K'
          ? `K${Math.floor((new Date().getFullYear() - p.birthYear) / 10) * 10}`
          : `M${Math.floor((new Date().getFullYear() - p.birthYear) / 10) * 10}`;

      results.push({
        userId: p.userId,
        userName: p.userName,
        distanceId: dist.id,
        distanceName: dist.name,
        bibNumber: String(idx + 1).padStart(3, '0'),
        category,
        gender: p.gender,
        birthYear: p.birthYear,
        time: p.status === 'finished' ? formatTime(p.seconds) : p.status.toUpperCase(),
        timeInSeconds: p.seconds,
        position: p.status === 'finished' ? pos++ : 9999,
        categoryPosition: p.status === 'finished' ? catPos : 9999,
        status: p.status,
      });
    });
  }

  return results;
}
