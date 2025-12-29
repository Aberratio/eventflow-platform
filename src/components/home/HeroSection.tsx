import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Twoje sportowe <span className="text-primary">wydarzenia</span> w jednym miejscu
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Odkrywaj zawody biegowe, rowerowe i triathlonowe. Rejestruj się, śledź wyniki i zdobywaj nowe rekordy życiowe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/events">
                <Calendar className="h-5 w-5" />
                Przeglądaj wydarzenia
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/results">
                <Trophy className="h-5 w-5" />
                Sprawdź wyniki
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
