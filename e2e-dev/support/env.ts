// Targets of the dev suite. Override with DEV_BASE_URL / DEV_API_URL.
export const FRONT = process.env.DEV_BASE_URL || 'https://portal-dev.zmierzymyczas.kokot.it';
export const API = process.env.DEV_API_URL || 'https://portal-api-dev.zmierzymyczas.kokot.it/api/v1';

/** YYYY-MM-DD in local time, the format the API uses for event dates. */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Prefix for every record a test creates on the shared dev database. */
export const QA_PREFIX = 'e2e-';
export const qaName = (label: string): string => `${QA_PREFIX}${label}-${Date.now().toString(36)}`;
