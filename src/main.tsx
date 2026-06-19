import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const [{ setApiAdapter }, { mockAdapter }] = await Promise.all([
      import('@/api/provider'),
      import('@/api/adapters/mock.adapter'),
    ]);
    setApiAdapter(mockAdapter);
  }

  createRoot(document.getElementById('root')!).render(<App />);
}

void bootstrap();
