import type { EventMerchandise } from '@/types';

export const mockMerchandise: EventMerchandise[] = [
  {
    id: 'merch1',
    name: 'Koszulka pamiatkowa',
    description: 'Oficjalna koszulka techniczna z logo wydarzenia',
    price: 89,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { id: 'c1', name: 'Bialy', hex: '#FFFFFF' },
      { id: 'c2', name: 'Czarny', hex: '#000000' },
      { id: 'c3', name: 'Niebieski', hex: '#2563EB' },
    ],
    imageUrl: 'https://via.placeholder.com/200x200?text=Koszulka',
    available: true,
  },
  {
    id: 'merch2',
    name: 'Medal pamiatkowy',
    description: 'Ekskluzywny medal dla wszystkich finisherow',
    price: 49,
    sizes: [],
    colors: [
      { id: 'c4', name: 'Zloty', hex: '#FFD700' },
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
