import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const openerRef = useRef<HTMLElement | null>(null);
  // WCAG 2.4.3: po zamknięciu ustawień fokus wraca do elementu, który je otworzył.
  const restoreFocus = () => {
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener) setTimeout(() => opener.focus(), 0);
  };

  useEffect(() => {
    const handleOpen = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          setAnalytics(prefs.analytics ?? false);
          setMarketing(prefs.marketing ?? false);
          setFunctional(prefs.functional ?? false);
        } catch (_e) {
          /* ignore malformed JSON */
        }
      }
      openerRef.current = document.activeElement as HTMLElement | null;
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener('open-cookie-settings', handleOpen);
    return () => window.removeEventListener('open-cookie-settings', handleOpen);
  }, []);

  if (!visible) return null;

  const saveConsent = (prefs: Omit<CookiePreferences, 'timestamp'>) => {
    const data: CookiePreferences = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setVisible(false);
    restoreFocus();
  };

  const acceptAll = () =>
    saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
  const rejectOptional = () =>
    saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
  const saveCustom = () => saveConsent({ necessary: true, analytics, marketing, functional });

  const switchValues: Record<string, { value: boolean; set: (v: boolean) => void }> = {
    analytics: { value: analytics, set: setAnalytics },
    marketing: { value: marketing, set: setMarketing },
    functional: { value: functional, set: setFunctional },
  };

  const policyLink = (
    <a
      href="/info/polityka-prywatnosci"
      className="text-primary underline transition-colors hover:text-primary/80"
    >
      polityce prywatności
    </a>
  );

  // Ustawienia szczegółowe: dialog modalny (pułapka fokusu, Escape, powrót fokusu do wywołującego).
  if (showDetails) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (open) return;
          restoreFocus();
          setShowDetails(false);
          // Zgoda już zapisana (otwarte z linku w stopce) -> zamknij całość; inaczej wróć do paska.
          if (localStorage.getItem(STORAGE_KEY)) setVisible(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ustawienia cookies</DialogTitle>
            <DialogDescription>
              Wybierz, na jakie rodzaje plików cookies się zgadzasz. Więcej informacji w naszej{' '}
              {policyLink}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p id={`cookie-cat-${cat.id}`} className="text-sm font-medium">
                    {cat.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <Switch
                  aria-labelledby={`cookie-cat-${cat.id}`}
                  checked={cat.locked ? true : (switchValues[cat.id]?.value ?? false)}
                  onCheckedChange={cat.locked ? undefined : switchValues[cat.id]?.set}
                  disabled={cat.locked}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button size="sm" onClick={saveCustom}>
              Zapisz preferencje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      role="region"
      aria-label="Zgoda na pliki cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-lg border bg-card text-card-foreground shadow-lg">
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. Możesz
              dostosować swoje preferencje lub zaakceptować wszystkie. Więcej informacji znajdziesz
              w naszej {policyLink}.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="justify-start"
            >
              <ChevronDown className="h-4 w-4" />
              Dostosuj
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={rejectOptional}>
              Tylko niezbędne
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Akceptuj wszystkie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
