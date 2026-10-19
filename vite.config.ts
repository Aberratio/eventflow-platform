import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { securityHeadersPlugin } from './build/securityHeadersPlugin';
import { splitList } from './build/securityHeaders';
import { indexingPlugin } from './build/indexingPlugin';
import { isIndexingAllowed } from './build/indexing';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // process env (CI) wins over .env.<mode>
  return {
    server: {
      host: '::',
      port: 8080,
    },
    plugins: [
      react(),
      // D-09: indexing only when VITE_ALLOW_INDEXING=true (production build); noindex + Disallow otherwise
      indexingPlugin({ allowIndexing: isIndexingAllowed(env.VITE_ALLOW_INDEXING) }),
      securityHeadersPlugin({
        mode,
        apiUrl: env.VITE_API_URL || 'http://localhost:8081/api/v1', // same fallback as src/api/client.ts:3
        googleCalendarApiUrl: env.VITE_GOOGLE_CALENDAR_API_URL || undefined,
        extraConnectSrc: splitList(env.CSP_CONNECT_SRC_EXTRA),
        reportOnly: env.CSP_REPORT_ONLY === 'true',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
