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
 * Time is stored with hundredth-of-a-second precision
 * (e.g. "0:41:10.55") but displayed rounded to a whole
 * second by default - organizers have no precision setting today
 * (and this change does not add one), so we always round when displaying.
 */
export function formatTimeToWholeSeconds(time?: string | null): string {
  if (!time) return '';
  return time.replace(/\.\d+$/, '');
}
