import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, ChevronDown, ChevronUp } from 'lucide-react';

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'cookie-consent';

const categories = [
  {
    id: 'necessary' as const,
    label: 'Niezbędne',
    description: 'Działanie strony, sesja, koszyk',
    locked: true,
  },
  {
    id: 'analytics' as const,
    label: 'Analityczne',
    description: 'Statystyki odwiedzin, Google Analytics',
    locked: false,
  },
  {
    id: 'marketing' as const,
    label: 'Marketingowe',
    description: 'Reklamy, remarketing',
    locked: false,
  },
  {
    id: 'functional' as const,
    label: 'Funkcjonalne',
    description: 'Personalizacja, preferencje wyświetlania',
    locked: false,
  },
];

export const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          setAnalytics(prefs.analytics ?? false);
          setMarketing(prefs.marketing ?? false);
          setFunctional(prefs.functional ?? false);
        } catch {}
      }
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener('open-cookie-settings', handleOpen);
    return () => window.removeEventListener('open-cookie-settings', handleOpen);
  }, []);

  if (!visible) return null;

  const saveConsent = (prefs: Omit<CookiePreferences, 'timestamp'>) => {
    const data: CookiePreferences = { ...prefs, necessary: true, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setVisible(false);
  };

  const acceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
  const rejectOptional = () => saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
  const saveCustom = () => saveConsent({ necessary: true, analytics, marketing, functional });

  const switchValues: Record<string, { value: boolean; set: (v: boolean) => void }> = {
    analytics: { value: analytics, set: setAnalytics },
    marketing: { value: marketing, set: setMarketing },
    functional: { value: functional, set: setFunctional },
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-card text-card-foreground shadow-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. 
              Możesz dostosować swoje preferencje lub zaakceptować wszystkie. 
              Więcej informacji znajdziesz w naszej{' '}
              <a href="/polityka-prywatnosci" className="underline text-primary hover:text-primary/80 transition-colors">
                polityce prywatności
              </a>.
            </p>
          </div>

          {showDetails && (
            <div className="mb-4 space-y-3 border-t pt-4">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <Switch
                    checked={cat.locked ? true : switchValues[cat.id]?.value ?? false}
                    onCheckedChange={cat.locked ? undefined : switchValues[cat.id]?.set}
                    disabled={cat.locked}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="justify-start"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Ukryj opcje' : 'Dostosuj'}
            </Button>
            <div className="flex-1" />
            {showDetails ? (
              <Button size="sm" onClick={saveCustom}>
                Zapisz preferencje
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={rejectOptional}>
                  Tylko niezbędne
                </Button>
                <Button size="sm" onClick={acceptAll}>
                  Akceptuj wszystkie
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
