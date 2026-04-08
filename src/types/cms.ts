export type InfoPageSectionType = 'hero' | 'text' | 'cards' | 'faq' | 'cta' | 'stats' | 'team' | 'pricing';

export interface InfoPageSectionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  link?: string;
  image?: string;
  price?: number;
  features?: string[];
}

export interface InfoPageSection {
  id: string;
  type: InfoPageSectionType;
  title?: string;
  content?: string;
  items?: InfoPageSectionItem[];
}

export interface InfoPage {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  content: InfoPageSection[];
  published: boolean;
  showInFooter: boolean;
  showInHeader: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
