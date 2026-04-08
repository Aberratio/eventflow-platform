import type { Registration } from '@/types';

// ============================================
// Generator for large start lists (bib number assignment feature)
// Must be defined BEFORE mockRegistrations array
// ============================================
const firstNamesMale = ['Adam', 'Bartosz', 'Cezary', 'Damian', 'Emil', 'Filip', 'Grzegorz', 'Henryk', 'Igor', 'Jakub', 'Kamil', 'Łukasz', 'Marcin', 'Norbert', 'Oskar', 'Paweł', 'Rafał', 'Szymon', 'Tomasz', 'Wojciech', 'Zbigniew', 'Artur', 'Błażej', 'Dominik', 'Edward'];
const firstNamesFemale = ['Anna', 'Beata', 'Celina', 'Dorota', 'Ewa', 'Felicja', 'Grażyna', 'Halina', 'Iwona', 'Joanna', 'Karolina', 'Lidia', 'Monika', 'Natalia', 'Oliwia', 'Paulina', 'Renata', 'Sylwia', 'Teresa', 'Urszula', 'Weronika', 'Zofia', 'Agata', 'Barbara', 'Danuta'];
const lastNames = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski', 'Michalski', 'Adamczyk', 'Dudek', 'Zając', 'Wieczorek'];

function generateLargeStartList(): Registration[] {
  const registrations: Registration[] = [];
  
  // e9: Nocny Bieg Wrocławski - 100 registrations, 65 with bib, 35 without
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.45;
    const firstName = isMale 
      ? firstNamesMale[i % firstNamesMale.length] 
      : firstNamesFemale[i % firstNamesFemale.length];
    const lastName = lastNames[(i * 7 + 3) % lastNames.length];
    const status = i < 70 ? 'confirmed' : i < 95 ? 'pending' : 'cancelled';
    const hasBib = i < 65 && status === 'confirmed';
    
    registrations.push({
      id: `r-e9-gen-${String(i + 1).padStart(3, '0')}`,
      eventId: 'e9',
      eventName: 'Nocny Bieg Wrocławski',
      userId: `p-e9-gen-${i}`,
      userName: `${firstName} ${lastName}`,
      userEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      distanceId: 'd17',
      distanceName: '10km',
      category: isMale ? 'M' : 'K',
      registeredAt: new Date(2025, 0, 5 + Math.floor(i / 5), 8 + (i % 12), (i * 17) % 60).toISOString(),
      status: status as 'confirmed' | 'pending' | 'cancelled',
      bibNumber: hasBib ? String(100 + i).padStart(3, '0') : undefined,
      pricePaid: 60,
    });
  }

  // e11: Tatry Ultra - 100 registrations across 3 distances, 70 with bib, 30 without
  const e11Distances = [
    { id: 'd20', name: 'Ultra 80K', price: 450 },
    { id: 'd21', name: 'Maraton 42K', price: 300 },
    { id: 'd22', name: 'Półmaraton 21K', price: 180 },
  ];
  const e11Categories = {
    M: ['M18-24', 'M25-29', 'M30-34', 'M35-39', 'M40-44', 'M45-49', 'M50-54', 'M55-59', 'M60+'],
    K: ['K18-24', 'K25-29', 'K30-34', 'K35-39', 'K40-44', 'K45-49', 'K50+'],
  };
  
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.4;
    const firstName = isMale 
      ? firstNamesMale[(i + 5) % firstNamesMale.length] 
      : firstNamesFemale[(i + 3) % firstNamesFemale.length];
    const lastName = lastNames[(i * 11 + 7) % lastNames.length];
    const distance = e11Distances[i % 3];
    const categories = isMale ? e11Categories.M : e11Categories.K;
    const category = categories[i % categories.length];
    const status = i < 75 ? 'confirmed' : i < 95 ? 'pending' : 'cancelled';
    const hasBib = i < 70 && status === 'confirmed';
    
    registrations.push({
      id: `r-e11-gen-${String(i + 100).padStart(3, '0')}`,
      eventId: 'e11',
      eventName: 'Bieg Górski Tatry Ultra 2026',
      userId: `p-e11-gen-${i}`,
      userName: `${firstName} ${lastName}`,
      userEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@tatryultra.pl`,
      distanceId: distance.id,
      distanceName: distance.name,
      category: category,
      registeredAt: new Date(2026, 0, 10 + Math.floor(i / 4), 7 + (i % 14), (i * 23) % 60).toISOString(),
      status: status as 'confirmed' | 'pending' | 'cancelled',
      bibNumber: hasBib ? String(300 + i).padStart(3, '0') : undefined,
      pricePaid: distance.price,
    });
  }

  // e15: Bieg Wiosenny - 80 registrations, 40 with bib, 40 without
  const e15Distances = [
    { id: 'd30', name: '10 km', price: 60, categories: ['M18-29', 'M30-39', 'M40-49', 'M50+', 'K18-29', 'K30-39', 'K40-49', 'K50+'] },
    { id: 'd31', name: '5 km', price: 40, categories: ['Open'] },
  ];
  
  for (let i = 0; i < 80; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale 
      ? firstNamesMale[(i + 10) % firstNamesMale.length] 
      : firstNamesFemale[(i + 8) % firstNamesFemale.length];
    const lastName = lastNames[(i * 13 + 11) % lastNames.length];
    const distance = e15Distances[i % 2];
    const category = distance.categories[i % distance.categories.length];
    const status = i < 60 ? 'confirmed' : i < 77 ? 'pending' : 'cancelled';
    const hasBib = i < 40 && status === 'confirmed';
    
    registrations.push({
      id: `r-e15-gen-${String(i + 1).padStart(3, '0')}`,
      eventId: 'e15',
      eventName: 'Bieg Wiosenny 2025',
      userId: `p-e15-gen-${i}`,
      userName: `${firstName} ${lastName}`,
      userEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@biegwiosenny.pl`,
      distanceId: distance.id,
      distanceName: distance.name,
      category: category,
      registeredAt: new Date(2025, 2, 1 + Math.floor(i / 3), 9 + (i % 10), (i * 19) % 60).toISOString(),
      status: status as 'confirmed' | 'pending' | 'cancelled',
      bibNumber: hasBib ? String(500 + i).padStart(3, '0') : undefined,
      pricePaid: distance.price,
    });
  }

  return registrations;
}


export const mockRegistrations: Registration[] = [
  { id: 'r1', eventId: 'e1', eventName: 'Maraton Warszawski 2025', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd1', distanceName: 'Maraton', category: 'M30-39', registeredAt: '2025-01-15T10:30:00Z', status: 'confirmed', bibNumber: '1542', pricePaid: 150 },
  { id: 'r2', eventId: 'e3', eventName: 'Gdynia Triathlon 2025', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd5', distanceName: 'Olimpijski', category: 'M30-34', registeredAt: '2025-02-20T14:15:00Z', status: 'confirmed', bibNumber: '234', pricePaid: 350 },
  { id: 'r3', eventId: 'e5', eventName: 'Półmaraton Krakowski', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd9', distanceName: 'Półmaraton', category: 'M30-39', registeredAt: '2025-03-01T09:00:00Z', status: 'pending', pricePaid: 100 },
  { id: 'r4', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p1', userName: 'Jan Kowalski', userEmail: 'jan@example.com', distanceId: 'd17', distanceName: '10km', category: 'M', registeredAt: '2025-01-10T18:45:00Z', status: 'confirmed', bibNumber: '1001', pricePaid: 60, teamName: 'Biegacze Wrocław' },
  { id: 'r5', eventId: 'e2', eventName: 'Tour de Pologne Amatorów', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd4', distanceName: 'Medio Fondo', category: 'K35-49', registeredAt: '2025-02-28T11:20:00Z', status: 'confirmed', bibNumber: '567', pricePaid: 150 },
  { id: 'r6', eventId: 'e1', eventName: 'Maraton Warszawski 2025', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd2', distanceName: 'Bieg na 10km', category: 'K30-39', registeredAt: '2025-01-20T16:00:00Z', status: 'confirmed', bibNumber: '3456', pricePaid: 70 },
  { id: 'r7', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p2', userName: 'Anna Nowak', userEmail: 'anna@example.com', distanceId: 'd17', distanceName: '10km', category: 'K', registeredAt: '2025-01-12T20:30:00Z', status: 'confirmed', bibNumber: '2345', pricePaid: 60, teamName: 'Biegacze Wrocław' },
  { id: 'r4b', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p3', userName: 'Piotr Wiśniewski', userEmail: 'piotr@example.com', distanceId: 'd17', distanceName: '10km', category: 'M', registeredAt: '2025-01-11T10:00:00Z', status: 'confirmed', bibNumber: '1002', pricePaid: 60, teamName: 'Biegacze Wrocław' },
  { id: 'r4c', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p4', userName: 'Maria Zielińska', userEmail: 'maria@example.com', distanceId: 'd17', distanceName: '10km', category: 'K', registeredAt: '2025-01-11T12:00:00Z', status: 'confirmed', bibNumber: '1003', pricePaid: 60, teamName: 'Nocni Biegacze' },
  { id: 'r4d', eventId: 'e9', eventName: 'Nocny Bieg Wrocławski', userId: 'p5', userName: 'Tomasz Nowicki', userEmail: 'tomasz@example.com', distanceId: 'd17', distanceName: '10km', category: 'M', registeredAt: '2025-01-11T14:00:00Z', status: 'confirmed', bibNumber: '1004', pricePaid: 60, teamName: 'Nocni Biegacze' },
  { id: 'r-team-e11-1', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p-team1', userName: 'Marcin Górski', userEmail: 'marcin.gorski@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M30-34', registeredAt: '2026-01-20T09:00:00Z', status: 'confirmed', bibNumber: '801', pricePaid: 450, teamName: 'KB Górskie Wilki' },
  { id: 'r-team-e11-2', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p-team2', userName: 'Katarzyna Szczypiór', userEmail: 'kasia.szcz@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'K25-29', registeredAt: '2026-01-20T10:00:00Z', status: 'confirmed', bibNumber: '802', pricePaid: 450, teamName: 'KB Górskie Wilki' },
  { id: 'r-team-e11-3', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p-team3', userName: 'Andrzej Kowal', userEmail: 'andrzej.kowal@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'M40-44', registeredAt: '2026-01-21T08:00:00Z', status: 'confirmed', bibNumber: '401', pricePaid: 300, teamName: 'Ultra Team PL' },
  { id: 'r-team-e11-4', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p-team4', userName: 'Ewa Malinowska', userEmail: 'ewa.mal@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'K35-39', registeredAt: '2026-01-21T09:00:00Z', status: 'confirmed', bibNumber: '402', pricePaid: 300, teamName: 'Ultra Team PL' },
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
  // Registration for virtual event - p1
  { 
    id: 'r-virtual-1', 
    eventId: 'virtual-1', 
    eventName: 'Bieg Sylwestrowy Wirtualny 2026', 
    userId: 'p1', 
    userName: 'Jan Kowalski', 
    userEmail: 'jan@example.com', 
    distanceId: 'vd-10k', 
    distanceName: '10 km', 
    category: 'Open', 
    registeredAt: '2025-12-28T10:00:00Z', 
    status: 'confirmed', 
    pricePaid: 40 
  },
  // Registration for virtual event - p2
  { 
    id: 'r-virtual-2', 
    eventId: 'virtual-1', 
    eventName: 'Bieg Sylwestrowy Wirtualny 2026', 
    userId: 'p2', 
    userName: 'Anna Nowak', 
    userEmail: 'anna@example.com', 
    distanceId: 'vd-5k', 
    distanceName: '5 km', 
    category: 'Open', 
    registeredAt: '2025-12-29T14:00:00Z', 
    status: 'confirmed', 
    pricePaid: 30 
  },
  // Registration for virtual event - p3 (no submission yet)
  { 
    id: 'r-virtual-3', 
    eventId: 'virtual-1', 
    eventName: 'Bieg Sylwestrowy Wirtualny 2026', 
    userId: 'p3', 
    userName: 'Piotr Wiśniewski', 
    userEmail: 'piotr@example.com', 
    distanceId: 'vd-21k', 
    distanceName: 'Półmaraton', 
    category: 'Open', 
    registeredAt: '2025-12-30T09:00:00Z', 
    status: 'confirmed', 
    pricePaid: 60 
  },
  // ============================================
  // NEW: Registrations for bank transfer event (e-bank-transfer)
  // ============================================
  // Fully paid - all items
  {
    id: 'r-bank-1',
    eventId: 'e-bank-transfer',
    eventName: 'Bieg Lokalny z Przelewem 2026',
    userId: 'p1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'dbt-10k',
    distanceName: '10 km',
    category: 'M30-39',
    registeredAt: '2026-01-10T10:00:00Z',
    status: 'confirmed',
    bibNumber: '042',
    pricePaid: 80,
    insurancePaid: 11,
    merchandiseOrders: [
      { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', size: 'L', color: 'Biały', colorHex: '#FFFFFF', quantity: 1, price: 69 },
      { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', color: 'Niebieski', colorHex: '#3B82F6', quantity: 1, price: 39 },
    ],
    paymentDetails: {
      startFeePaid: true,
      startFeePaidAt: '2026-01-10T14:30:00Z',
      startFeeAmount: 80,
      insurancePaid: true,
      insurancePaidAt: '2026-01-10T14:30:00Z',
      insuranceAmount: 11,
      merchandisePayments: [
        { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', paid: true, paidAt: '2026-01-10T14:30:00Z', amount: 69 },
        { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', paid: true, paidAt: '2026-01-10T14:30:00Z', amount: 39 },
      ],
    },
  },
  // Partially paid - start fee only, merchandise not paid
  {
    id: 'r-bank-2',
    eventId: 'e-bank-transfer',
    eventName: 'Bieg Lokalny z Przelewem 2026',
    userId: 'p2',
    userName: 'Anna Nowak',
    userEmail: 'anna@example.com',
    distanceId: 'dbt-10k',
    distanceName: '10 km',
    category: 'K30-39',
    registeredAt: '2026-01-12T09:00:00Z',
    status: 'pending',
    pricePaid: 80,
    insurancePaid: 10,
    merchandiseOrders: [
      { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', size: 'M', color: 'Czarny', colorHex: '#000000', quantity: 1, price: 69 },
      { merchandiseId: 'merch-bt3', merchandiseName: 'Kubek termiczny', color: 'Srebrny', colorHex: '#C0C0C0', quantity: 2, price: 98 },
    ],
    paymentDetails: {
      startFeePaid: true,
      startFeePaidAt: '2026-01-12T11:00:00Z',
      startFeeAmount: 80,
      insurancePaid: false,
      insuranceAmount: 10,
      merchandisePayments: [
        { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', paid: false, amount: 69 },
        { merchandiseId: 'merch-bt3', merchandiseName: 'Kubek termiczny', paid: true, paidAt: '2026-01-12T11:00:00Z', amount: 98 },
      ],
    },
  },
  // Nothing paid
  {
    id: 'r-bank-3',
    eventId: 'e-bank-transfer',
    eventName: 'Bieg Lokalny z Przelewem 2026',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    userEmail: 'piotr@example.com',
    distanceId: 'dbt-5k',
    distanceName: '5 km',
    category: 'Open',
    registeredAt: '2026-01-15T16:00:00Z',
    status: 'pending',
    pricePaid: 50,
    merchandiseOrders: [
      { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', color: 'Niebieski', colorHex: '#3B82F6', quantity: 1, price: 39 },
    ],
    paymentDetails: {
      startFeePaid: false,
      startFeeAmount: 50,
      insurancePaid: false,
      merchandisePayments: [
        { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', paid: false, amount: 39 },
      ],
    },
  },
  // Insurance paid, start fee paid, no merchandise
  {
    id: 'r-bank-4',
    eventId: 'e-bank-transfer',
    eventName: 'Bieg Lokalny z Przelewem 2026',
    userId: 'p4',
    userName: 'Katarzyna Biegacz',
    userEmail: 'kasia@example.com',
    distanceId: 'dbt-10k',
    distanceName: '10 km',
    category: 'K18-29',
    registeredAt: '2026-01-18T12:00:00Z',
    status: 'confirmed',
    bibNumber: '156',
    pricePaid: 80,
    insurancePaid: 9,
    paymentDetails: {
      startFeePaid: true,
      startFeePaidAt: '2026-01-18T15:00:00Z',
      startFeeAmount: 80,
      insurancePaid: true,
      insurancePaidAt: '2026-01-18T15:00:00Z',
      insuranceAmount: 9,
      merchandisePayments: [],
    },
  },
  // Start fee not paid, but merchandise partially paid
  {
    id: 'r-bank-5',
    eventId: 'e-bank-transfer',
    eventName: 'Bieg Lokalny z Przelewem 2026',
    userId: 'p5',
    userName: 'Tomasz Kolarz',
    userEmail: 'tomek@example.com',
    distanceId: 'dbt-5k',
    distanceName: '5 km',
    category: 'Open',
    registeredAt: '2026-01-20T08:00:00Z',
    status: 'pending',
    pricePaid: 50,
    merchandiseOrders: [
      { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', size: 'XL', color: 'Biały', colorHex: '#FFFFFF', quantity: 1, price: 69 },
      { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', color: 'Niebieski', colorHex: '#3B82F6', quantity: 2, price: 78 },
    ],
    paymentDetails: {
      startFeePaid: false,
      startFeeAmount: 50,
      insurancePaid: false,
      merchandisePayments: [
        { merchandiseId: 'merch-bt1', merchandiseName: 'Koszulka biegowa', paid: true, paidAt: '2026-01-21T10:00:00Z', amount: 69 },
        { merchandiseId: 'merch-bt2', merchandiseName: 'Buff multifunkcyjny', paid: false, amount: 78 },
      ],
    },
  },
  // ============================================
  // NEW: Registrations for hybrid event (e-mixed) - bank transfer + virtual
  // ============================================
  {
    id: 'r-mixed-1',
    eventId: 'e-mixed',
    eventName: 'Hybrid Challenge 2026',
    userId: 'p1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'dmx-10k',
    distanceName: '10 km',
    category: 'Open',
    registeredAt: '2026-03-05T10:00:00Z',
    status: 'confirmed',
    pricePaid: 55,
    insurancePaid: 12,
    merchandiseOrders: [
      { merchandiseId: 'merch-mx1', merchandiseName: 'Koszulka Hybrid', size: 'L', color: 'Pomarańczowy', colorHex: '#F97316', quantity: 1, price: 79 },
    ],
    paymentDetails: {
      startFeePaid: true,
      startFeePaidAt: '2026-03-05T12:00:00Z',
      startFeeAmount: 55,
      insurancePaid: true,
      insurancePaidAt: '2026-03-05T12:00:00Z',
      insuranceAmount: 12,
      merchandisePayments: [
        { merchandiseId: 'merch-mx1', merchandiseName: 'Koszulka Hybrid', paid: true, paidAt: '2026-03-05T12:00:00Z', amount: 79 },
      ],
    },
  },
  {
    id: 'r-mixed-2',
    eventId: 'e-mixed',
    eventName: 'Hybrid Challenge 2026',
    userId: 'p2',
    userName: 'Anna Nowak',
    userEmail: 'anna@example.com',
    distanceId: 'dmx-21k',
    distanceName: 'Półmaraton',
    category: 'Open',
    registeredAt: '2026-03-08T14:00:00Z',
    status: 'pending',
    pricePaid: 75,
    merchandiseOrders: [
      { merchandiseId: 'merch-mx2', merchandiseName: 'Opaska na rękę', color: 'Pomarańczowy', colorHex: '#F97316', quantity: 2, price: 38 },
    ],
    paymentDetails: {
      startFeePaid: true,
      startFeePaidAt: '2026-03-09T10:00:00Z',
      startFeeAmount: 75,
      insurancePaid: false,
      merchandisePayments: [
        { merchandiseId: 'merch-mx2', merchandiseName: 'Opaska na rękę', paid: false, amount: 38 },
      ],
    },
  },
  // ============================================
  // NEW: Registrations for virtual-2 event
  // ============================================
  {
    id: 'r-v2-1',
    eventId: 'virtual-2',
    eventName: 'Wirtualny Maraton Wiosenny 2026',
    userId: 'p1',
    userName: 'Jan Kowalski',
    userEmail: 'jan@example.com',
    distanceId: 'v2-10k',
    distanceName: '10 km',
    category: 'Open',
    registeredAt: '2026-02-20T10:00:00Z',
    status: 'confirmed',
    pricePaid: 45,
  },
  {
    id: 'r-v2-2',
    eventId: 'virtual-2',
    eventName: 'Wirtualny Maraton Wiosenny 2026',
    userId: 'p2',
    userName: 'Anna Nowak',
    userEmail: 'anna@example.com',
    distanceId: 'v2-5k',
    distanceName: '5 km',
    category: 'Open',
    registeredAt: '2026-02-22T14:00:00Z',
    status: 'confirmed',
    pricePaid: 35,
  },
  {
    id: 'r-v2-3',
    eventId: 'virtual-2',
    eventName: 'Wirtualny Maraton Wiosenny 2026',
    userId: 'p3',
    userName: 'Piotr Wiśniewski',
    userEmail: 'piotr@example.com',
    distanceId: 'v2-21k',
    distanceName: 'Półmaraton',
    category: 'Open',
    registeredAt: '2026-02-25T09:00:00Z',
    status: 'confirmed',
    pricePaid: 65,
  },
  // ============================================
  // EXPANDED: More registrations for e11 (Tatry Ultra) - start list edge case
  // ============================================
  { id: 'r-e11-001', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p6', userName: 'Magdalena Szybka', userEmail: 'magda@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'K25-29', registeredAt: '2026-01-10T08:00:00Z', status: 'confirmed', bibNumber: '001', pricePaid: 315 },
  { id: 'r-e11-002', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p7', userName: 'Adam Biegacz', userEmail: 'adam.b@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M30-34', registeredAt: '2026-01-11T09:00:00Z', status: 'confirmed', bibNumber: '002', pricePaid: 315 },
  { id: 'r-e11-003', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p8', userName: 'Beata Górska', userEmail: 'beata.g@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'K45-49', registeredAt: '2026-01-12T10:00:00Z', status: 'confirmed', bibNumber: '003', pricePaid: 450 },
  { id: 'r-e11-004', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p9', userName: 'Cezary Ultra', userEmail: 'cezary@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M50-54', registeredAt: '2026-01-13T11:00:00Z', status: 'confirmed', bibNumber: '004', pricePaid: 450 },
  { id: 'r-e11-005', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p10', userName: 'Dorota Maratonka', userEmail: 'dorota@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'K55-59', registeredAt: '2026-01-14T12:00:00Z', status: 'confirmed', bibNumber: '100', pricePaid: 210 },
  { id: 'r-e11-006', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p11', userName: 'Emil Sprinter', userEmail: 'emil@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'M18-24', registeredAt: '2026-01-15T13:00:00Z', status: 'confirmed', bibNumber: '200', pricePaid: 126 },
  { id: 'r-e11-007', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p12', userName: 'Felicja Rowerowa', userEmail: 'felicja@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'K18-24', registeredAt: '2026-01-16T14:00:00Z', status: 'pending', pricePaid: 180 },
  { id: 'r-e11-008', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p13', userName: 'Grzegorz Trail', userEmail: 'grzegorz@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M35-39', registeredAt: '2026-01-17T15:00:00Z', status: 'confirmed', bibNumber: '005', pricePaid: 315, discountCode: 'ULTRA2026', discountAmount: 67 },
  { id: 'r-e11-009', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p14', userName: 'Halina Pływaczka', userEmail: 'halina@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'K40-44', registeredAt: '2026-01-18T16:00:00Z', status: 'confirmed', bibNumber: '101', pricePaid: 300 },
  { id: 'r-e11-010', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p15', userName: 'Igor Triatlonista', userEmail: 'igor@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'M30-34', registeredAt: '2026-01-19T17:00:00Z', status: 'confirmed', bibNumber: '102', pricePaid: 300 },
  { id: 'r-e11-011', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p16', userName: 'Justyna Półmaraton', userEmail: 'justyna@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'K25-29', registeredAt: '2026-01-20T08:00:00Z', status: 'confirmed', bibNumber: '201', pricePaid: 180 },
  { id: 'r-e11-012', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p17', userName: 'Kamil Endurance', userEmail: 'kamil@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M35-39', registeredAt: '2026-01-21T09:00:00Z', status: 'confirmed', bibNumber: '006', pricePaid: 450 },
  { id: 'r-e11-013', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p18', userName: 'Laura Fitness', userEmail: 'laura@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'K18-24', registeredAt: '2026-01-22T10:00:00Z', status: 'pending', pricePaid: 180 },
  { id: 'r-e11-014', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p19', userName: 'Marek Górski', userEmail: 'marek.g@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'M55-59', registeredAt: '2026-01-23T11:00:00Z', status: 'confirmed', bibNumber: '103', pricePaid: 300 },
  { id: 'r-e11-015', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p20', userName: 'Natalia Szosa', userEmail: 'natalia@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'K25-29', registeredAt: '2026-01-24T12:00:00Z', status: 'confirmed', bibNumber: '202', pricePaid: 180 },
  { id: 'r-e11-016', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p21', userName: 'Oskar Multisport', userEmail: 'oskar@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'M30-34', registeredAt: '2026-01-25T13:00:00Z', status: 'confirmed', bibNumber: '007', pricePaid: 450 },
  { id: 'r-e11-017', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p22', userName: 'Patrycja Cross', userEmail: 'patrycja@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'K25-29', registeredAt: '2026-01-26T14:00:00Z', status: 'confirmed', bibNumber: '104', pricePaid: 300 },
  { id: 'r-e11-018', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p23', userName: 'Robert Weteran', userEmail: 'robert@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'M60+', registeredAt: '2026-01-27T15:00:00Z', status: 'confirmed', bibNumber: '105', pricePaid: 300 },
  { id: 'r-e11-019', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p24', userName: 'Sandra Nowa', userEmail: 'sandra@example.com', distanceId: 'd22', distanceName: 'Półmaraton 21K', category: 'K18-24', registeredAt: '2026-01-28T16:00:00Z', status: 'confirmed', bibNumber: '203', pricePaid: 180 },
  { id: 'r-e11-020', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p25', userName: 'Tadeusz Klasyk', userEmail: 'tadeusz@example.com', distanceId: 'd21', distanceName: 'Maraton 42K', category: 'M60+', registeredAt: '2026-01-29T17:00:00Z', status: 'confirmed', bibNumber: '106', pricePaid: 300 },
  // Cancelled registration
  { id: 'r-e11-021', eventId: 'e11', eventName: 'Bieg Górski Tatry Ultra 2026', userId: 'p26', userName: 'Urszula Pionierka', userEmail: 'urszula@example.com', distanceId: 'd20', distanceName: 'Ultra 80K', category: 'K45-49', registeredAt: '2026-01-30T08:00:00Z', status: 'cancelled', pricePaid: 0 },
  // ============================================
  // EXPANDED: More registrations for e22 (Maraton Gdański) - open registration
  // ============================================
  { id: 'r-e22-001', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p6', userName: 'Magdalena Szybka', userEmail: 'magda@example.com', distanceId: 'd44', distanceName: 'Maraton 42 km', category: 'K25-29', registeredAt: '2026-02-01T08:00:00Z', status: 'confirmed', bibNumber: '1001', pricePaid: 180 },
  { id: 'r-e22-002', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p7', userName: 'Adam Biegacz', userEmail: 'adam.b@example.com', distanceId: 'd44', distanceName: 'Maraton 42 km', category: 'M30-39', registeredAt: '2026-02-02T09:00:00Z', status: 'confirmed', bibNumber: '1002', pricePaid: 180 },
  { id: 'r-e22-003', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p9', userName: 'Cezary Ultra', userEmail: 'cezary@example.com', distanceId: 'd44', distanceName: 'Maraton 42 km', category: 'M50+', registeredAt: '2026-02-03T10:00:00Z', status: 'confirmed', bibNumber: '1003', pricePaid: 180 },
  { id: 'r-e22-004', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p11', userName: 'Emil Sprinter', userEmail: 'emil@example.com', distanceId: 'd45', distanceName: 'Półmaraton 21 km', category: 'M18-29', registeredAt: '2026-02-04T11:00:00Z', status: 'confirmed', bibNumber: '2001', pricePaid: 110 },
  { id: 'r-e22-005', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p16', userName: 'Justyna Półmaraton', userEmail: 'justyna@example.com', distanceId: 'd45', distanceName: 'Półmaraton 21 km', category: 'K18-29', registeredAt: '2026-02-05T12:00:00Z', status: 'confirmed', bibNumber: '2002', pricePaid: 110 },
  { id: 'r-e22-006', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p27', userName: 'Wojciech Sprint', userEmail: 'wojciech@example.com', distanceId: 'd45', distanceName: 'Półmaraton 21 km', category: 'M18-29', registeredAt: '2026-02-06T13:00:00Z', status: 'pending', pricePaid: 110 },
  { id: 'r-e22-007', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p28', userName: 'Zofia Junior', userEmail: 'zofia@example.com', distanceId: 'd45', distanceName: 'Półmaraton 21 km', category: 'K18-29', registeredAt: '2026-02-07T14:00:00Z', status: 'confirmed', bibNumber: '2003', pricePaid: 110 },
  { id: 'r-e22-008', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p29', userName: 'Artur Wyczynowy', userEmail: 'artur@example.com', distanceId: 'd44', distanceName: 'Maraton 42 km', category: 'M30-39', registeredAt: '2026-02-08T15:00:00Z', status: 'confirmed', bibNumber: '1004', pricePaid: 180 },
  { id: 'r-e22-009', eventId: 'e22', eventName: 'Maraton Gdański 2026', userId: 'p30', userName: 'Barbara Amatorka', userEmail: 'barbara@example.com', distanceId: 'd45', distanceName: 'Półmaraton 21 km', category: 'K18-29', registeredAt: '2026-02-09T16:00:00Z', status: 'confirmed', bibNumber: '2004', pricePaid: 110 },
  // ============================================
  // GENERATED: Large start lists for e9, e11, e15 (bib number assignment testing)
  // ============================================
  ...generateLargeStartList(),
];


