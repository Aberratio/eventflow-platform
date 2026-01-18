import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuthSafe } from '@/contexts/AuthContext';
import { Calendar, Trophy, ShoppingBag, Users, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const participantSteps: OnboardingStep[] = [
  {
    icon: <Calendar className="h-8 w-8 text-primary" />,
    title: 'Zapisz się na zawody',
    description: 'Przeglądaj wydarzenia sportowe i zapisuj się na biegi, wyścigi rowerowe czy triathlony jednym kliknięciem.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-amber-500" />,
    title: 'Śledź swoje wyniki',
    description: 'Wszystkie Twoje wyniki i rekordy życiowe w jednym miejscu. Porównuj się z innymi zawodnikami.',
  },
  {
    icon: <ShoppingBag className="h-8 w-8 text-green-500" />,
    title: 'Kupuj sprzęt sportowy',
    description: 'Sprawdzony sprzęt i gadżety w naszym sklepie. Specjalne oferty dla uczestników wydarzeń.',
  },
];

const organizerSteps: OnboardingStep[] = [
  {
    icon: <Calendar className="h-8 w-8 text-primary" />,
    title: 'Twórz wydarzenia',
    description: 'Łatwo stwórz i opublikuj swoje wydarzenie sportowe. Dodaj dystanse, kategorie i ceny.',
  },
  {
    icon: <Users className="h-8 w-8 text-blue-500" />,
    title: 'Zarządzaj uczestnikami',
    description: 'Pełna kontrola nad listą startową, statusami płatności i komunikacją z zawodnikami.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-amber-500" />,
    title: 'Publikuj wyniki',
    description: 'Wprowadzaj wyniki ręcznie lub importuj z pliku. Uczestnicy zobaczą je natychmiast.',
  },
];

export const OnboardingDialog = () => {
  const authContext = useAuthSafe();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const user = authContext?.user ?? null;
  const steps = user?.role === 'organizer' ? organizerSteps : participantSteps;

  useEffect(() => {
    if (!user) return;
    
    const storageKey = `sporttime_onboarding_${user.id}`;
    const hasSeenOnboarding = localStorage.getItem(storageKey);
    
    // Show dialog for new users or users who haven't completed onboarding
    if (!hasSeenOnboarding && user.isNewUser) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    if (dontShowAgain && user) {
      localStorage.setItem(`sporttime_onboarding_${user.id}`, 'true');
    }
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
      // Navigate to appropriate dashboard
      if (user?.role === 'organizer') {
        navigate('/organizer');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/events');
      }
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Krok {currentStep + 1} z {steps.length}
            </span>
          </div>
          <DialogTitle className="text-2xl">
            Witaj w SportTime, {user.name.split(' ')[0]}!
          </DialogTitle>
          <DialogDescription>
            {user.role === 'organizer' 
              ? 'Oto co możesz zrobić jako organizator wydarzeń:'
              : 'Oto co możesz zrobić na platformie:'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              {steps[currentStep].icon}
            </div>
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-4 sm:flex-col">
          <Button onClick={handleNext} className="w-full">
            {currentStep < steps.length - 1 ? (
              <>
                Dalej
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Rozpocznij'
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
              Nie pokazuj ponownie
            </Label>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
