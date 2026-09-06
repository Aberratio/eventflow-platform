import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

export function resolveApiAssetUrl(url: string): string {
  if (!url || !url.startsWith('/')) return url;
  const apiOrigin = API_BASE_URL
    ? new URL(API_BASE_URL, window.location.origin).origin
    : window.location.origin;
  return `${apiOrigin}${url}`;
}

/**
 * Spec 14 sekcja 2: czas jest przechowywany z dokladnoscia do setnej sekundy
 * (np. "0:41:10.55"), ale domyslnie wyswietlany zaokraglony do pelnej
 * sekundy - organizator nie ma dzis (i ta zmiana tego nie wprowadza) ustawien
 * precyzji, wiec zaokraglamy zawsze przy wyswietlaniu.
 */
export function formatTimeToWholeSeconds(time?: string | null): string {
  if (!time) return '';
  return time.replace(/\.\d+$/, '');
}
