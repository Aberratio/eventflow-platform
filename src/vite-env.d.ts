/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_APP_NAME: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_LOG_LEVEL: 'debug' | 'warn' | 'error';
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
