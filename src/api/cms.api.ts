import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockInfoPages } from './mock/cms.mock';
import type { InfoPage } from '@/types';

export async function getInfoPages(): Promise<ApiResponse<InfoPage[]>> {
  await simulateDelay();
  return { data: [...mockInfoPages], success: true };
}

export async function getInfoPageBySlug(slug: string): Promise<ApiResponse<InfoPage | null>> {
  await simulateDelay();
  const page = mockInfoPages.find((p) => p.slug === slug) ?? null;
  return { data: page, success: !!page };
}

export async function createInfoPage(data: Partial<InfoPage>): Promise<ApiResponse<InfoPage>> {
  await simulateDelay();
  const page: InfoPage = {
    id: `page-${Date.now()}`,
    title: '',
    slug: '',
    icon: 'FileText',
    description: '',
    content: [],
    published: false,
    showInFooter: false,
    showInHeader: false,
    order: 99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as InfoPage;
  return { data: page, success: true };
}

export async function updateInfoPage(
  id: string,
  data: Partial<InfoPage>,
): Promise<ApiResponse<InfoPage>> {
  await simulateDelay();
  const page = mockInfoPages.find((p) => p.id === id);
  if (!page)
    return { data: null as unknown as InfoPage, success: false, message: 'Page not found' };
  return { data: { ...page, ...data, updatedAt: new Date().toISOString() }, success: true };
}

export async function deleteInfoPage(id: string): Promise<ApiResponse<void>> {
  await simulateDelay();
  return { data: undefined as unknown as void, success: mockInfoPages.some((p) => p.id === id) };
}

export async function reorderInfoPages(ids: string[]): Promise<ApiResponse<void>> {
  await simulateDelay();
  void ids;
  return { data: undefined as unknown as void, success: true };
}
