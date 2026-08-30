import type { SeriesType, ShopCategory, PaymentMethod } from '@/types';

export const seriesTypeLabels: Record<SeriesType, string> = {
  virtual: 'Wirtualna',
  local: 'Ustawka lokalna',
  championship: 'Mistrzostwa',
  cup: 'Cykl / Grand Prix',
};

export const disciplineLabels: Record<string, string> = {
  running: 'Bieganie',
  cycling: 'Kolarstwo',
  triathlon: 'Triathlon',
  multisport: 'Multisport',
};

export const shopCategoryLabels: Record<ShopCategory, string> = {
  apparel: 'Odzież',
  footwear: 'Obuwie',
  accessories: 'Akcesoria',
  nutrition: 'Odżywki',
  electronics: 'Elektronika',
  services: 'Usługi',
};

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm1', name: 'Przelew bankowy', enabled: true },
  { id: 'pm2', name: 'BLIK', enabled: true },
  { id: 'pm3', name: 'Karta płatnicza', enabled: true },
  { id: 'pm4', name: 'PayU', enabled: false },
  { id: 'pm5', name: 'Płatność na miejscu (gotówka)', enabled: false },
];
