import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setApiAdapter } from './api/provider';
import { httpAdapter } from './api/adapters/http.adapter';

if (import.meta.env.VITE_API_URL) {
  setApiAdapter(httpAdapter);
}

createRoot(document.getElementById('root')!).render(<App />);
