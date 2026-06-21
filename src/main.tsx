import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function bootstrap() {
  createRoot(document.getElementById('root')!).render(<App />);
}

void bootstrap();
