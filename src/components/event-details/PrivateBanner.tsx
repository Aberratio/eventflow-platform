import { Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const PrivateBanner = () => (
  <div className="container pt-4">
    <Alert className="border-primary/30 bg-primary/5">
      <Lock className="h-4 w-4" />
      <AlertTitle>Wydarzenie prywatne</AlertTitle>
      <AlertDescription>
        To wydarzenie jest dostępne tylko przez zaproszenie i nie jest widoczne publicznie.
      </AlertDescription>
    </Alert>
  </div>
);
