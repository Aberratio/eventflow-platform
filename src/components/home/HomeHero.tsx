import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar } from 'lucide-react';

export const HomeHero = () => {
  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/30" />
      
      {/* Decorative blurred circles */}
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 md:w-96 md:h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-5%] w-48 h-48 md:w-72 md:h-72 rounded-full bg-accent/40 blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 md:mb-4">
            Twoje sportowe{' '}
            <span className="text-primary">wydarzenia</span>
            {' '}w jednym miejscu
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            Odkrywaj zawody biegowe, rowerowe i triathlonowe. Rejestruj się, śledź wyniki na żywo i zdobywaj nowe rekordy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/events">
                <Calendar className="h-4 w-4" />
                Przeglądaj wydarzenia
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/results">
                <Trophy className="h-4 w-4" />
                Sprawdź wyniki
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  );
};
